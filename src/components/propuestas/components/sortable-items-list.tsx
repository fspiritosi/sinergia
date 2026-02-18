"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  name: string;
  description?: string | null;
}

interface SortableItemsListProps {
  items: Item[];
  selectedItemIds: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (itemId: string) => void;
}

function SortableItem({ item, onRemove }: { item: Item; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border rounded-md bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SortableItemsList({
  items,
  selectedItemIds,
  onReorder,
  onRemove,
}: SortableItemsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Map selectedItemIds to items in the correct order
  const selectedItems = selectedItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is Item => item !== undefined);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedItemIds.indexOf(active.id as string);
    const newIndex = selectedItemIds.indexOf(over.id as string);
    const newOrder = arrayMove(selectedItemIds, oldIndex, newIndex);
    onReorder(newOrder);
  }

  if (selectedItems.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay items seleccionados</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={selectedItemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {selectedItems.map((item) => (
            <SortableItem key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
