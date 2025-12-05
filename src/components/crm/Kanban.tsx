// /src/components/crm/Kanban.tsx
// Flexible Kanban board component

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Badge } from '@/lib/design-system/components'

export interface KanbanColumn {
  id: string
  title: string
  color?: string
}

export interface KanbanItem {
  id: string
  columnId: string
  [key: string]: any
}

interface KanbanProps {
  columns: KanbanColumn[]
  items: KanbanItem[]
  onItemMove: (itemId: string, newColumnId: string) => Promise<void>
  onItemClick: (item: KanbanItem) => void
  renderItem: (item: KanbanItem) => React.ReactNode
}

export function Kanban({
  columns,
  items,
  onItemMove,
  onItemClick,
  renderItem,
}: KanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const itemId = active.id as string
    const newColumnId = over.id as string

    // Find current item
    const item = items.find((i) => i.id === itemId)

    if (item && item.columnId !== newColumnId) {
      await onItemMove(itemId, newColumnId)
    }

    setActiveId(null)
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            items={items.filter((item) => item.columnId === column.id)}
            onItemClick={onItemClick}
            renderItem={renderItem}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80">{renderItem(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnComponentProps {
  column: KanbanColumn
  items: KanbanItem[]
  onItemClick: (item: KanbanItem) => void
  renderItem: (item: KanbanItem) => React.ReactNode
}

function KanbanColumnComponent({
  column,
  items,
  onItemClick,
  renderItem,
}: KanbanColumnComponentProps) {
  return (
    <SortableContext
      id={column.id}
      items={items.map((i) => i.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="flex-shrink-0 w-80">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <Badge className={`${column.color || 'bg-[#404040]'} text-white px-3 py-1`}>
            {items.length}
          </Badge>
        </div>

        <div
          className="bg-[#1F1F1F] rounded-xl p-4 min-h-[500px] border-2 border-[#333]"
          style={{
            minHeight: '500px',
          }}
        >
          <div className="space-y-3">
            {items.map((item) => (
              <SortableKanbanCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                renderItem={renderItem}
              />
            ))}

            {items.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-8">
                No items
              </p>
            )}
          </div>
        </div>
      </div>
    </SortableContext>
  )
}

interface SortableKanbanCardProps {
  item: KanbanItem
  onClick: () => void
  renderItem: (item: KanbanItem) => React.ReactNode
}

function SortableKanbanCard({ item, onClick, renderItem }: SortableKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-pointer"
    >
      {renderItem(item)}
    </div>
  )
}





