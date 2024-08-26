import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CSSProperties } from "react";

interface Props {
  id: string;
  className: string;
  children: React.ReactNode;
  activeId: string | null;
}

const SortableItem: React.FC<Props> = ({ id, className, children,activeId }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition,isDragging  } = useSortable({ id });

  const style: CSSProperties  = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 0.08s ease",
    zIndex: isDragging ? 999 : "auto",
    visibility: activeId === id ? "hidden" : "visible",

  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
      {children}
    </div>
  );
};

export default SortableItem;
