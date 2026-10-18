'use client'

import { useCallback, type ComponentType } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { DashboardWidgetPlacement } from '@/lib/dashboard/layout'
import type { WidgetId, WidgetSize } from '@/lib/dashboard/widgets/registry'
import type { WidgetChromeProps } from './WidgetFrame'

export type WidgetComponent = ComponentType<WidgetChromeProps>

interface DashboardGridProps {
  placements: DashboardWidgetPlacement[]
  components: Record<WidgetId, WidgetComponent>
  customizing: boolean
  onReorder: (activeId: WidgetId, overId: WidgetId) => void
  onHide: (id: WidgetId) => void
  onResize: (id: WidgetId, next: WidgetSize) => void
  onTogglePin: (id: WidgetId, pinned: boolean) => void
}

/**
 * 12-column grid. Mobile is always one column; tablets collapse to halves /
 * fulls; the chosen fraction applies from `lg` up.
 */
const SPAN_CLASS: Record<WidgetSize, string> = {
  quarter: 'md:col-span-6 lg:col-span-3',
  third: 'md:col-span-6 lg:col-span-4',
  half: 'md:col-span-6 lg:col-span-6',
  'two-thirds': 'md:col-span-12 lg:col-span-8',
  'three-quarters': 'md:col-span-12 lg:col-span-9',
  full: 'md:col-span-12 lg:col-span-12',
}

function spanClass(size: WidgetSize) {
  return SPAN_CLASS[size]
}

function SortableCell({
  placement,
  Component,
  customizing,
  onHide,
  onResize,
  onTogglePin,
}: {
  placement: DashboardWidgetPlacement
  Component: WidgetComponent
  customizing: boolean
  onHide: () => void
  onResize: (next: WidgetSize) => void
  onTogglePin: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: placement.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('col-span-1', spanClass(placement.size), isDragging && 'z-10 opacity-70')}
    >
      <Component
        size={placement.size}
        customizing={customizing}
        pinned={placement.pinned}
        onHide={onHide}
        onResize={onResize}
        onTogglePin={onTogglePin}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export function DashboardGrid({
  placements,
  components,
  customizing,
  onReorder,
  onHide,
  onResize,
  onTogglePin,
}: DashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      onReorder(active.id as WidgetId, over.id as WidgetId)
    },
    [onReorder],
  )

  const gridClass = 'grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5'

  if (!customizing) {
    return (
      <div className={gridClass}>
        {placements.map((placement) => {
          const Component = components[placement.id]
          return (
            <div key={placement.id} className={cn('col-span-1', spanClass(placement.size))}>
              <Component size={placement.size} customizing={false} pinned={placement.pinned} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={placements.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className={gridClass}>
          {placements.map((placement) => (
            <SortableCell
              key={placement.id}
              placement={placement}
              Component={components[placement.id]}
              customizing
              onHide={() => onHide(placement.id)}
              onResize={(next) => onResize(placement.id, next)}
              onTogglePin={() => onTogglePin(placement.id, !placement.pinned)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
