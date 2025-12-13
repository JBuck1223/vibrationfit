// /src/components/crm/Kanban.tsx
// Flexible Kanban board component

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for quicker activation
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    
    if (!over) {
      setOverId(null)
      return
    }

    // Determine which column we're over
    let columnId = over.id as string
    
    // If hovering over an item, get its column
    const overItem = items.find((i) => i.id === over.id)
    if (overItem) {
      columnId = overItem.columnId
    }

    setOverId(columnId)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const itemId = active.id as string
    
    // If over.id is a column ID, use it directly
    // Otherwise, find the column that contains the item we're hovering over
    let newColumnId = over.id as string
    
    // Check if over.id is an item ID (not a column ID)
    const overItem = items.find((i) => i.id === over.id)
    if (overItem) {
      // We're hovering over an item, use its column
      newColumnId = overItem.columnId
    }

    // Find current item
    const item = items.find((i) => i.id === itemId)

    if (item && item.columnId !== newColumnId) {
      // Clear drag state immediately
      setActiveId(null)
      setOverId(null)
      
      // Parent will handle optimistic update
      await onItemMove(itemId, newColumnId)
    } else {
      // No move needed, just clear drag state
      setActiveId(null)
      setOverId(null)
    }
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
            isOver={overId === column.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 scale-105 shadow-2xl">
            {renderItem(activeItem)}
          </div>
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
  isOver: boolean
}

function KanbanColumnComponent({
  column,
  items,
  onItemClick,
  renderItem,
  isOver,
}: KanbanColumnComponentProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

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
          ref={setNodeRef}
          className={`bg-[#1F1F1F] rounded-xl p-4 min-h-[500px] border-2 transition-all duration-200 ${
            isOver 
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02] shadow-[0_0_20px_rgba(25,157,103,0.3)]' 
              : 'border-[#333]'
          }`}
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
  } = useSortable({ 
    id: item.id,
    animateLayoutChanges: () => false, // Disable all layout animations
  })

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: 'none', // No transitions at all
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      {renderItem(item)}
    </div>
  )
}









