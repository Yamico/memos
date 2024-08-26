import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Resource } from "@/types/proto/api/v1/resource_service";
import Icon from "../Icon";
import ResourceIcon from "../ResourceIcon";
import SortableItem from "./SortableItem";
import { useState } from "react";

interface Props {
  resourceList: Resource[];
  setResourceList: (resourceList: Resource[]) => void;
}

const ResourceListView = (props: Props) => {
  const { resourceList, setResourceList } = props;
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDeleteResource = async (name: string) => {
    setResourceList(resourceList.filter((resource) => resource.name !== name));
  };

  const handleDragStart = ({ active }: { active: any }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = resourceList.findIndex((resource) => resource.name === active.id);
      const newIndex = resourceList.findIndex((resource) => resource.name === over.id);
      
      setResourceList(arrayMove(resourceList, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={resourceList.map((resource) => resource.name)} strategy={verticalListSortingStrategy}>
        {resourceList.length > 0 && (
          <div className="w-full flex flex-row justify-start flex-wrap gap-2 mt-2">
            {resourceList.map((resource) => {
              return (
                <div
                  key={resource.name}
                  className="max-w-full w-auto flex flex-row justify-start items-center flex-nowrap gap-x-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded hover:shadow-sm text-gray-500 dark:text-gray-400"
                >
                  <ResourceIcon resource={resource} className="!w-4 !h-4 !opacity-100 cursor-pointer" />
                  <SortableItem id={resource.name} className="flex flex-row justify-start items-center gap-x-1" activeId={activeId}>
                    <span className="text-sm max-w-[8rem] truncate">{resource.filename}</span>
                  </SortableItem>
                  <button className="shrink-0" onClick={() => handleDeleteResource(resource.name)}>
                    <Icon.X className="w-4 h-auto cursor-pointer opacity-60 hover:opacity-100" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="sortable-item flex flex-row justify-start items-center gap-x-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded shadow-sm text-gray-500 dark:text-gray-400">
            <ResourceIcon resource={resourceList.find((resource) => resource.name === activeId)!} className="!w-4 !h-4 !opacity-100" />
            <span className="text-sm max-w-[8rem] truncate">
              {resourceList.find((resource) => resource.name === activeId)!.filename}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ResourceListView;
