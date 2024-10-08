import { Tooltip, IconButton} from "@mui/joy";
import clsx from "clsx";
import dayjs from "dayjs";
import { useTranslate } from "@/utils/i18n";
import { WorkspaceMemoRelatedSetting } from "@/types/proto/api/v1/workspace_setting_service";
import { useWorkspaceSettingStore } from "@/store/v1";
import { WorkspaceSettingKey } from "@/types/proto/store/workspace_setting";
import { useMemoFilterStore } from "@/store/v1";

interface Props {
  // Format: 2021-1
  month: string;
  data: Record<string, number>;
  onClick?: (date: string) => void;
}

const getCellAdditionalStyles = (count: number, maxCount: number) => {
  if (count === 0) {
    return "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500";
  }

  const ratio = count / maxCount;
  if (ratio > 0.7) {
    return "bg-blue-700 text-gray-100 dark:opacity-80";
  } else if (ratio > 0.4) {
    return "bg-blue-600 text-gray-100 dark:opacity-80";
  } else {
    return "bg-blue-500 text-gray-100 dark:opacity-70";
  }
};

const ActivityCalendar = (props: Props) => {
  const t = useTranslate();
  const { month: monthStr, data, onClick } = props;

  const year = dayjs(monthStr).toDate().getFullYear();
  const month = dayjs(monthStr).toDate().getMonth() + 1;
  const dayInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDay = new Date(year, month - 1, dayInMonth).getDay();
  const maxCount = Math.max(...Object.values(data));
  const days = [];
  const memoFilterStore = useMemoFilterStore();
  const timeFilters = memoFilterStore.getFiltersByFactor("displayTime");

  const workspaceSettingStore = useWorkspaceSettingStore();
  const workspaceMemoRelatedSetting =
    workspaceSettingStore.getWorkspaceSettingByKey(WorkspaceSettingKey.MEMO_RELATED).memoRelatedSetting ||
    WorkspaceMemoRelatedSetting.fromPartial({});



  if (workspaceMemoRelatedSetting.enableMondayFirstDay){
    const offset = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < offset; i++) {
      days.push(0);
    }
    for (let i = 1; i <= dayInMonth; i++) {
      days.push(i);
    }
    for (let i = 0; i < (6 - lastDay + (lastDay === 0 ? 6 : 0)); i++) {
      days.push(0);
    }
  }else{
    for (let i = 0; i < firstDay; i++) {
      days.push(0);
    }
    for (let i = 1; i <= dayInMonth; i++) {
      days.push(i);
    }
    for (let i = 0; i < 6 - lastDay; i++) {
      days.push(0);
    }
  };

  return (
    <div className={clsx("w-full h-auto shrink-0 grid grid-cols-7 grid-flow-row gap-1")}>
      {workspaceMemoRelatedSetting.enableMondayFirstDay ? (
        <>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Mo</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Tu</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>We</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Th</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Fr</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Sa</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Su</div>
        </>
      ) : (
        <>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Su</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Mo</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Tu</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>We</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Th</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Fr</div>
          <div className={clsx("w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60")}>Sa</div>
        </>
      )}
      {days.map((day, index) => {
        const date = dayjs(`${year}-${month}-${day}`).format("YYYY-MM-DD");
        const count = data[date] || 0;
        const isToday = dayjs().format("YYYY-MM-DD") === date;
        const tooltipText = count ? t("memo.count-memos-in-date", { count: count, date: date }) : date;
        const isActive = timeFilters.some((f) => f.value === date);
    
        return day ? (
          count > 0 ? (
            <Tooltip className="shrink-0" key={`${date}-${index}`} title={tooltipText} placement="top" arrow>
              <div
                className={clsx(
                  "w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default",
                  getCellAdditionalStyles(count, maxCount),
                  isToday && "border-zinc-400 dark:border-zinc-300",
                  isActive && "bg-green-500 font-bold border-green-600 dark:border-green-300",
                  !isToday && !isActive && "border-transparent",
                )}
                onClick={() => count && onClick && onClick(date) }
              >
                {day}
              </div>
            </Tooltip>
          ) : (
            <div
              key={`${date}-${index}`}
              className={clsx(
                "w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default",
                "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500",
                isToday && "border-zinc-400 dark:border-zinc-500",
                !isToday && !isActive && "border-transparent",
              )}
            >
              {day}
            </div>
          )
        ) : (
          <div key={`${date}-${index}`} className="shrink-0 w-6 h-6 opacity-0"></div>
        );
      })}
    </div>
  );
};

export default ActivityCalendar;
