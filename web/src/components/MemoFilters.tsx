import { isEqual } from "lodash-es";
import { FilterFactor, getMemoFilterKey, MemoFilter, useMemoFilterStore } from "@/store/v1";
import Icon from "./Icon";
import { useTranslate } from "@/utils/i18n";

  
const MemoFilters = () => {
  const t = useTranslate();
  const memoFilterStore = useMemoFilterStore();
  const filters = memoFilterStore.filters;
  const getFilterDisplayText = (filter: MemoFilter) => {
    if (filter.value) {
      return filter.value;
    }
    if (filter.factor.startsWith("property.")) {
      return filter.factor.replace("property.", "");
    }
    return filter.factor;
  };

  if (filters.length === 0) {
    return undefined;
  }

  return (
    <div className="w-full mb-2 flex flex-row justify-start items-start gap-2">
      <span className={`flex flex-row items-center gap-0.5 text-sm leading-6 border border-transparent ${
        memoFilterStore.enableORSearch ? 'text-green-500' : 'text-gray-500'}`}>
        <Icon.Filter className="w-4 h-auto opacity-60 inline" />
        {t("common.filter") }
      </span>
      <div className="flex flex-row justify-start items-center flex-wrap gap-2 leading-6 h-6">
        {filters.map((filter) => {
          const filterText = getFilterDisplayText(filter);
          const isNotSearch = memoFilterStore.enableNOTSearch && (filterText.charAt(0) === '!' || filterText.charAt(0) === '！');
          const displayText = isNotSearch ? filterText.substring(1) : filterText;
          return (
          <div
            key={getMemoFilterKey(filter)}
            className="flex flex-row items-center gap-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 pl-1.5 pr-1 rounded-md hover:line-through cursor-pointer"
            onClick={() => memoFilterStore.removeFilter((f) => isEqual(f, filter))}
          >
            <FactorIcon className="w-4 h-auto text-gray-500 dark:text-gray-400 opacity-60" factor={filter.factor} />
            <span className={`text-sm max-w-32 truncate text-gray-500 dark:text-gray-400 ${isNotSearch ? 'line-through' : ''}`}>{displayText}</span>
            <button className="text-gray-500 dark:text-gray-300 opacity-60 hover:opacity-100">
              <Icon.X className="w-4 h-auto" />
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
};

const FactorIcon = ({ factor, className }: { factor: FilterFactor; className?: string }) => {
  const iconMap = {
    tagSearch: <Icon.Tag className={className} />,
    visibility: <Icon.Eye className={className} />,
    contentSearch: <Icon.Search className={className} />,
    displayTime: <Icon.Calendar className={className} />,
    "property.hasLink": <Icon.Link className={className} />,
    "property.hasTaskList": <Icon.CheckCircle className={className} />,
    "property.hasCode": <Icon.Code className={className} />,
    "property.hasNoTag": <Icon.Code className={className} />,
    
  };
  return iconMap[factor as keyof typeof iconMap] || <></>;
};

export default MemoFilters;
