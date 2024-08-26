import { uniqBy } from "lodash-es";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export type FilterFactor =
  | "tagSearch"
  | "visibility"
  | "contentSearch"
  | "displayTime"
  | "property.hasLink"
  | "property.hasTaskList"
  | "property.hasCode"
  | "property.hasNoTag";

export interface MemoFilter {
  factor: FilterFactor;
  value: string;
}

export const getMemoFilterKey = (filter: MemoFilter) => `${filter.factor}:${filter.value}`;

interface State {
  filters: MemoFilter[];
  orderByTimeAsc: boolean;
  enableORSearch: boolean;
  enableTagMultiSelect: boolean;
  enableNOTSearch: boolean;
  activeSelectDay: string|undefined;
  makeCalendarFiltered: boolean;
}

export const useMemoFilterStore = create(
  combine(((): State => ({ filters: [], orderByTimeAsc: false ,enableORSearch:false, enableTagMultiSelect: false, enableNOTSearch:true, activeSelectDay: undefined, makeCalendarFiltered:false }))(), (set, get) => ({
    setState: (state: State) => set(state),
    getState: () => get(),
    getFiltersByFactor: (factor: FilterFactor) => get().filters.filter((f) => f.factor === factor),
    addFilter: (filter: MemoFilter) => set((state) => ({ filters: uniqBy([...state.filters, filter], getMemoFilterKey) })),
    removeFilter: (filterFn: (f: MemoFilter) => boolean) => 
      set((state) => ({
        filters: state.filters.filter((f) => {
          if (filterFn(f)) {
            return false;
          }
          return true;
        })
      })),
    
    
    removeFiltersByFactor: (factor: FilterFactor) => set((state) => ({
      filters: state.filters.filter((f) => f.factor !== factor)
    })),
    setOrderByTimeAsc: (orderByTimeAsc: boolean) => set({ orderByTimeAsc }),
    clearFilters: () => set({ filters: [] }), 
    setenableORSearch: (enableORSearch: boolean) => set({ enableORSearch }),
    setenableTagMultiSelect: (enableTagMultiSelect: boolean) => set({enableTagMultiSelect}),
    setenableNOTSearch: (enableNOTSearch: boolean) => set({enableNOTSearch}),
    setactiveSelectDay: (activeSelectDay: string|undefined) => set({activeSelectDay}),
    setmakeCalendarFiltered: (makeCalendarFiltered: boolean)=> set({makeCalendarFiltered}),
  })),
);
