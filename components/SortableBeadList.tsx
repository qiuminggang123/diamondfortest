'use client'

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/lib/uiStore';
import type { BeadType } from '@/lib/types';

interface SortableBeadItemProps {
  bead: BeadType;
  onDelete: (id: string) => void;
}

function SortableBeadItem({ bead, onDelete }: SortableBeadItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 调试信息
  console.log('Bead data:', bead);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{bead.name}</div>
        <div className="text-sm text-gray-500">
          {bead.size}mm • £{bead.price} • {typeof bead.type === 'object' ? bead.type.name : bead.type}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(bead.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface SortableBeadListProps {
  beads: BeadType[];
  onUpdateSort: (beadIds: string[]) => void;
  onDeleteBead: (id: string) => void;
}

export function SortableBeadList({ beads, onUpdateSort, onDeleteBead }: SortableBeadListProps) {
  const [items, setItems] = useState(beads);
  const { showToast } = useUIStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 当外部beads更新时，同步内部状态
  React.useEffect(() => {
    setItems(beads);
  }, [beads]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // 更新排序到服务器
      try {
        const beadIds = newItems.map(item => item.id);
        await onUpdateSort(beadIds);
        showToast('排序已更新', 'success');
      } catch (error) {
        // 如果更新失败，回滚到原来的状态
        setItems(items);
        showToast('排序更新失败', 'error');
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无珠子数据
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((bead) => (
            <SortableBeadItem
              key={bead.id}
              bead={bead}
              onDelete={onDeleteBead}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}