import { Divider, Tooltip, IconButton } from "@mui/joy";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import { countBy } from "lodash-es";
import { useState } from "react";
import toast from "react-hot-toast";
import { memoServiceClient } from "@/grpcweb";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useCurrentUser from "@/hooks/useCurrentUser";
import i18n from "@/i18n";
import { useMemoFilterStore, useMemoStore } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import ActivityCalendar from "./ActivityCalendar";
import Icon from "./Icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { WorkspaceMemoRelatedSetting } from "@/types/proto/api/v1/workspace_setting_service";
import { useWorkspaceSettingStore } from "@/store/v1";
import { WorkspaceSettingKey } from "@/types/proto/store/workspace_setting";

interface UserMemoStats {
  link: number;
  taskList: number;
  code: number;
  incompleteTasks: number;
  noTags: number;
}

const UserStatisticsView = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const memoStore = useMemoStore();
  const memoFilterStore = useMemoFilterStore();
  const [memoAmount, setMemoAmount] = useState(0);
  const [memoStats, setMemoStats] = useState<UserMemoStats>({ link: 0, taskList: 0, code: 0, incompleteTasks: 0,noTags: 0 });
  const [activityStats, setActivityStats] = useState<Record<string, number>>({});
  const [monthString, setMonthString] = useState(dayjs(new Date().toDateString()).format("YYYY-MM"));
  const days = Math.ceil((Date.now() - currentUser.createTime!.getTime()) / 86400000);
  const firstDayOfMemos = Object.keys(activityStats).reduce((min, current) => {
    return dayjs(current).isBefore(dayjs(min)) ? current : min;
  }, Object.keys(activityStats)[0]);
  
  const newestDayOfMemos = Object.keys(activityStats).reduce((max, current) => {
    return dayjs(current).isAfter(dayjs(max)) ? current : max;
  }, Object.keys(activityStats)[0]);
  
  const workspaceSettingStore = useWorkspaceSettingStore();
  const workspaceMemoRelatedSetting =
    workspaceSettingStore.getWorkspaceSettingByKey(WorkspaceSettingKey.MEMO_RELATED).memoRelatedSetting ||
    WorkspaceMemoRelatedSetting.fromPartial({});

  const timeFilters = memoFilterStore.getFiltersByFactor("displayTime");
  const [isActive, setIsActive] = useState(false);
  const update_normal_search_filter = (filters: string[])=>{
    const contentSearch: string[] = [];
    const tagSearch: string[] = [];

    for (const filter of memoFilterStore.filters) {
      if (filter.factor === "contentSearch") {
        contentSearch.push(`"${filter.value}"`);
      } else if (filter.factor === "tagSearch") {
        tagSearch.push(`"${filter.value}"`);
      } else if (filter.factor === "property.hasLink") {
        filters.push(`has_link == true`);
      } else if (filter.factor === "property.hasNoTag") {
        filters.push(`has_no_tag == true`);
      } else if (filter.factor === "property.hasTaskList") {
        filters.push(`has_task_list == true`);
      } else if (filter.factor === "property.hasCode") {
        filters.push(`has_code == true`);
      }
    }
    if (memoFilterStore.orderByTimeAsc) {
      filters.push(`order_by_time_asc == true`);
    }
    if (contentSearch.length > 0) {
        filters.push(`content_search == [${contentSearch.join(", ")}]`);
    }
    if (tagSearch.length > 0) {
      filters.push(`tag_search == [${tagSearch.join(", ")}]`);
    }
    return filters

  };
  const [maxDisplayTime, setMaxDisplayTime] = useState<string | undefined>(undefined);

  useAsyncEffect(async () => {
    const filters = [`creator == "${currentUser.name}"`, `row_status == "NORMAL"`, `order_by_pinned == true`];
    update_normal_search_filter(filters);
    const { entities } = await memoServiceClient.listMemoProperties({
      name: `memos/-`,
      filter: memoFilterStore.makeCalendarFiltered ? filters.join(" && ") : undefined,
      enableOr: memoFilterStore.enableORSearch,
      enableNot: memoFilterStore.enableNOTSearch,
    });
    const memoStats: UserMemoStats = { link: 0, taskList: 0, code: 0, incompleteTasks: 0 ,noTags: 0 };
    entities.forEach((entity) => {
      const { property } = entity;
      if (property?.hasLink) {
        memoStats.link += 1;
      }
      if (property?.hasNoTag) {
        memoStats.noTags += 1;
      }
      if (property?.hasTaskList) {
        memoStats.taskList += 1;
      }
      if (property?.hasCode) {
        memoStats.code += 1;
      }
      if (property?.hasIncompleteTasks) {
        memoStats.incompleteTasks += 1;
      }
    });
    setMemoStats(memoStats);
    setMemoAmount(entities.length);
    setActivityStats(countBy(entities.map((entity) => dayjs(entity.displayTime).format("YYYY-MM-DD"))));
    const active = timeFilters.some((f) => f.value === memoFilterStore.activeSelectDay);
    setIsActive(active);
    if (!active){
      memoFilterStore.setactiveSelectDay(undefined);
    }
    const maxDisplayTime = entities.reduce((max, entity) => {
      const currentDisplayTime = dayjs(entity.displayTime);
      return currentDisplayTime.isAfter(max) ? currentDisplayTime : max;
    }, dayjs(0));
    setMaxDisplayTime(maxDisplayTime.format("YYYY-MM-DD"));
  }, [memoStore.stateId]);

  const rebuildMemoTags = async () => {
    await memoServiceClient.rebuildMemoProperty({
      name: "memos/-",
    });
    toast.success("Refresh successfully");
    window.location.reload();
  };

  const onCalendarClick = (date: string) => {
    if (date == memoFilterStore.activeSelectDay){
      memoFilterStore.setactiveSelectDay(undefined);
      memoFilterStore.removeFilter((f) => f.factor === "displayTime");
    }else{
      memoFilterStore.setactiveSelectDay(date);
      memoFilterStore.removeFilter((f) => f.factor === "displayTime");
      memoFilterStore.addFilter({ factor: "displayTime", value: date });
      setIsActive(true);
    }
  };

  const handlePrevMonth = () => {
    const currentMonth = dayjs(monthString, "YYYY-MM");
    const prevMonth = currentMonth.subtract(1, 'month');
    setMonthString(prevMonth.format("YYYY-MM"));
  };

  const handleNextMonth = () => {
    const currentMonth = dayjs(monthString, "YYYY-MM");
    const prevMonth = currentMonth.add(1, 'month');
    setMonthString(prevMonth.format("YYYY-MM"));
  };

  const handlePrevDay = () => {
    if (memoFilterStore.activeSelectDay == undefined) return;
    const currentDay = dayjs(memoFilterStore.activeSelectDay, "YYYY-MM-DD");
    let prevDay = currentDay.subtract(1,'day');

    let found = false;

    while (prevDay >= dayjs(firstDayOfMemos)) {
      const checkDateStr = prevDay.format("YYYY-MM-DD");
      if (activityStats[checkDateStr] && activityStats[checkDateStr] > 0) {
        onCalendarClick(checkDateStr);
        found = true;
        break;
      }
      prevDay = prevDay.subtract(1,'day');
    }
    if (!found) {
      toast.error(t("message.no-more-memos"));
    }else{
      calibreMonthString(prevDay);
    }
  };
  const handleNextDay = () => {
    if (memoFilterStore.activeSelectDay == undefined) return;
    const currentDay = dayjs(memoFilterStore.activeSelectDay, "YYYY-MM-DD");
    let nextDay = currentDay.add(1,'day');

    let found =false;

    while (nextDay <= dayjs(newestDayOfMemos)){
      const checkDateStr = nextDay.format("YYYY-MM-DD");
      if (activityStats[checkDateStr] && activityStats[checkDateStr] > 0) {
        onCalendarClick(checkDateStr);
        found = true;
        break;
      }
      nextDay = nextDay.add(1,'day');
    }
    if (!found) {
      toast.error(t("message.no-more-memos"));
    }else{
      calibreMonthString(nextDay);
    }
  };

  const calibreMonthString = (date: Dayjs) =>{
    setMonthString(date.format("YYYY-MM"));

  }
  const locateToLastNewDay = ()=>{
    memoFilterStore.setactiveSelectDay(maxDisplayTime);
    maxDisplayTime===undefined?"":onCalendarClick(maxDisplayTime);
    calibreMonthString(dayjs(maxDisplayTime));
  }

  const handlePrevMonthSpec = () => {
    if (memoFilterStore.activeSelectDay === undefined) return;
  
    const currentMonth = dayjs(memoFilterStore.activeSelectDay, "YYYY-MM-DD").startOf('month');
    let prevMonth = currentMonth.subtract(1, 'month');
    const startOfPrevMonth = prevMonth.startOf('month');
    let lastDayWithData: Dayjs | null = null;
    let firstDayWithData: Dayjs | null = null;
  
    while (prevMonth.isAfter(dayjs(firstDayOfMemos).startOf('month'))) {
      let lastDayOfMonth = prevMonth.endOf('month');
      let found = false;
  
      while (lastDayOfMonth.isSame(prevMonth, 'month')) {
        const checkDateStr = lastDayOfMonth.format("YYYY-MM-DD");
        if (activityStats[checkDateStr] && activityStats[checkDateStr] > 0) {
          lastDayWithData = lastDayOfMonth;
          found = true;
          break;
        }
        lastDayOfMonth = lastDayOfMonth.subtract(1, 'day');
      }
  
      if (found) {
        break;
      }

      prevMonth = prevMonth.subtract(1, 'month');
    }
  
    if (lastDayWithData) {
      onCalendarClick(lastDayWithData.format("YYYY-MM-DD"));
      calibreMonthString(lastDayWithData);
    } else {
      firstDayWithData = dayjs(firstDayOfMemos);
      const firstDayWithDataStr = firstDayWithData.format("YYYY-MM-DD");

      if (memoFilterStore.activeSelectDay === firstDayWithDataStr) {
        toast.error(t("message.no-more-memos"));
      } else {
        onCalendarClick(firstDayWithDataStr);
        calibreMonthString(firstDayWithData);
      }
    }
  };
  
  const handleNextMonthSpec = () => {
    if (memoFilterStore.activeSelectDay === undefined) return;
  
    const currentMonth = dayjs(memoFilterStore.activeSelectDay, "YYYY-MM-DD").startOf('month');
    let nextMonth = currentMonth.add(1, 'month');
    const endOfNextMonth = nextMonth.endOf('month');
    let firstDayWithData: Dayjs | null = null;
    let newestDayWithData: Dayjs | null = null;
  
    while (nextMonth.isBefore(dayjs(newestDayOfMemos).endOf('month'))) {
      let firstDayOfMonth = nextMonth.startOf('month');
      let found = false;

      while (firstDayOfMonth.isSame(nextMonth, 'month')) {
        const checkDateStr = firstDayOfMonth.format("YYYY-MM-DD");
        if (activityStats[checkDateStr] && activityStats[checkDateStr] > 0) {
          firstDayWithData = firstDayOfMonth;
          found = true;
          break;
        }
        firstDayOfMonth = firstDayOfMonth.add(1, 'day');
      }
  
      if (found) {
        break;
      }

      nextMonth = nextMonth.add(1, 'month');
    }
  
    if (firstDayWithData) {
      onCalendarClick(firstDayWithData.format("YYYY-MM-DD"));
      calibreMonthString(firstDayWithData);
    } else {
      newestDayWithData = dayjs(newestDayOfMemos);
      const newestDayWithDataStr = newestDayWithData.format("YYYY-MM-DD");

      if (memoFilterStore.activeSelectDay === newestDayWithDataStr) {
        toast.error(t("message.no-more-memos"));
      } else {
        onCalendarClick(newestDayWithDataStr);
        calibreMonthString(newestDayWithData);
      }
    }
  };
  



  return (
    <div className="group w-full border mt-2 py-2 px-3 rounded-lg space-y-0.5 text-gray-500 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="w-full mb-1 flex flex-row justify-between items-center">
        <div className="relative text-base font-medium leading-6 flex flex-row items-center dark:text-gray-400">
          <Icon.CalendarDays className="w-5 h-auto mr-1 opacity-60" strokeWidth={1.5} />
          <span>{dayjs(monthString).toDate().toLocaleString(i18n.language, { year: "numeric", month: "long" })}</span>
          <input
            className="inset-0 absolute z-1 opacity-0"
            type="month"
            value={monthString}
            onFocus={(e: any) => e.target.showPicker()}
            onChange={(e) => setMonthString(e.target.value || dayjs().format("YYYY-MM"))}
          />
        </div>
        <div className="invisible group-hover:visible flex justify-end items-center">
          <Popover>
            <PopoverTrigger>
              <Icon.MoreVertical className="w-4 h-auto shrink-0 opacity-60" />
            </PopoverTrigger>
            <PopoverContent align="end" alignOffset={-12}>
              <button className="w-auto flex flex-row justify-between items-center gap-2 hover:opacity-80" onClick={rebuildMemoTags}>
                <Icon.RefreshCcw className="text-gray-400 w-4 h-auto cursor-pointer opacity-60" />
                <span className="text-sm shrink-0 text-gray-500 dark:text-gray-400">Refresh</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="w-full">
      <div className="flex justify-between items-center gap-0">
          <IconButton variant="outlined" size="sm" onClick={() => memoFilterStore.activeSelectDay? handlePrevMonthSpec():handlePrevMonth()}>
            <Icon.ChevronsLeft className="w-5 h-auto" />
          </IconButton>

          {isActive && (
          <div className="flex gap-3">
          <IconButton variant="outlined" size="sm" onClick={() => handlePrevDay()}>
            <Icon.ChevronLeft className="w-5 h-auto" />
          </IconButton>
          </div>)}
        <div className="text-gray-400 opacity-90">
              <IconButton variant="outlined" size="sm" onClick={() => { 
                locateToLastNewDay()
                }}>
                <LocationOnIcon />
              </IconButton>
          </div>
          {isActive &&(<div className="flex gap-3">
          <IconButton variant="outlined" size="sm" onClick={() => handleNextDay()}>
            <Icon.ChevronRight className="w-5 h-auto" />
          </IconButton>
          </div>
          )}

          <IconButton variant="outlined" size="sm" onClick={() => memoFilterStore.activeSelectDay? handleNextMonthSpec():handleNextMonth()}>
            <Icon.ChevronsRight className="w-5 h-auto" />
          </IconButton>
        </div>
        <ActivityCalendar month={monthString} data={activityStats} onClick={onCalendarClick} />
        

        
        {memoAmount > 0 && (
          <p className="mt-1 w-full text-xs opacity-80">
            <span>{memoAmount}</span> memos in <span>{days}</span> {days > 1 ? "days" : "day"}

          </p>
        )}
      </div>
      {workspaceMemoRelatedSetting.enableExtensionStatics && 
      <div>
      <Divider className="!my-2 opacity-50" /> 
      <div className="w-full flex flex-row justify-start items-center gap-x-2 gap-y-1 flex-wrap">
        <div
          className={clsx("w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center")}
          onClick={() => memoFilterStore.addFilter({ factor: "property.hasLink", value: "" })}
        >
          <div className="w-auto flex justify-start items-center mr-1">
            <Icon.Link className="w-4 h-auto mr-1" />
            <span className="block text-sm">{t("memo.links")}</span>
          </div>
          <span className="text-sm truncate">{memoStats.link}</span>
        </div>
        <div
          className={clsx("w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center")}
          onClick={() => memoFilterStore.addFilter({ factor: "property.hasNoTag", value: "" })}
        >
          <div className="w-auto flex justify-start items-center mr-1">
            <Icon.TagIcon className="w-4 h-auto mr-1" />
            <span className="block text-sm">{t("memo.no-tags")}</span>
          </div>
          <span className="text-sm truncate">{memoStats.noTags}</span>
        </div>

        <div
          className={clsx("w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center")}
          onClick={() => memoFilterStore.addFilter({ factor: "property.hasTaskList", value: "" })}
        >
          <div className="w-auto flex justify-start items-center mr-1">
            {memoStats.incompleteTasks > 0 ? (
              <Icon.ListTodo className="w-4 h-auto mr-1" />
            ) : (
              <Icon.CheckCircle className="w-4 h-auto mr-1" />
            )}
            <span className="block text-sm">{t("memo.to-do")}</span>
          </div>
          {memoStats.incompleteTasks > 0 ? (
            <Tooltip title={"Done / Total"} placement="top" arrow>
              <div className="text-sm flex flex-row items-start justify-center">
                <span className="truncate">{memoStats.taskList - memoStats.incompleteTasks}</span>
                <span className="font-mono opacity-50">/</span>
                <span className="truncate">{memoStats.taskList}</span>
              </div>
            </Tooltip>
          ) : (
            <span className="text-sm truncate">{memoStats.taskList}</span>
          )}
        </div>
        <div
          className={clsx("w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center")}
          onClick={() => memoFilterStore.addFilter({ factor: "property.hasCode", value: "" })}
        >
          <div className="w-auto flex justify-start items-center mr-1">
            <Icon.Code2 className="w-4 h-auto mr-1" />
            <span className="block text-sm">{t("memo.code")}</span>
          </div>
          <span className="text-sm truncate">{memoStats.code}</span>
        </div>
      </div>
      </div>}
    </div>
  );
};

export default UserStatisticsView;
