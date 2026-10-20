'use client'

import { PointerSensor, type DraggableAttributes } from '@dnd-kit/core'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle, CheckSquare, Grid3X3, GripVertical, Square } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

type DragBindings = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function isBoardPointer(event: ReactPointerEvent['nativeEvent'], pointerType: 'mouse' | 'touch') {
  if (!event.isPrimary || event.button !== 0) return false
  if (pointerType === 'touch') return event.pointerType === 'touch'
  return event.pointerType !== 'touch'
}

/** Mouse drags listen on the document so a moving tile cannot swallow the drop. */
export class BoardMouseSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: ReactPointerEvent) => isBoardPointer(nativeEvent, 'mouse'),
    },
  ]
}

/** Touch drags listen on the document. The default touch sensor loses the drop once the tile moves. */
export class BoardTouchSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: ReactPointerEvent) => isBoardPointer(nativeEvent, 'touch'),
    },
  ]
}

export function SortableBoardItem({
  id,
  disabled,
  className,
  children,
}: {
  id: string
  disabled?: boolean
  className?: string
  children: (drag: DragBindings) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    position: isDragging ? 'relative' : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners: disabled ? undefined : listeners })}
    </div>
  )
}

export function BoardDragHandle({
  attributes,
  listeners,
}: DragBindings) {
  return (
    <button
      type="button"
      className="absolute top-3 left-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm cursor-grab active:cursor-grabbing"
      aria-label="Drag to reorder"
      onClick={(event) => event.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}

export function BoardPhotoTile({
  name,
  imageUrl,
  afterImageUrl,
  status,
  selected,
  bulkMode,
  canReorder,
  attributes,
  listeners,
  onPress,
}: {
  name: string
  imageUrl: string | null
  afterImageUrl?: string | null
  status: string
  selected: boolean
  bulkMode: boolean
  canReorder: boolean
  attributes: DraggableAttributes
  listeners: DragBindings['listeners']
  onPress: () => void
}) {
  const showSplit = Boolean(imageUrl && afterImageUrl)

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-neutral-900 ${
        selected ? 'ring-2 ring-[#39FF14] ring-inset' : ''
      } ${canReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={onPress}
      {...(canReorder ? attributes : {})}
      {...(canReorder ? listeners : {})}
    >
      {showSplit ? (
        <div className="pointer-events-none absolute inset-0 flex">
          <img
            src={imageUrl!}
            alt=""
            draggable={false}
            className="h-full w-1/2 select-none object-cover"
            style={{ imageOrientation: 'from-image' }}
          />
          <img
            src={afterImageUrl!}
            alt={name}
            draggable={false}
            className="h-full w-1/2 select-none object-cover"
            style={{ imageOrientation: 'from-image' }}
          />
        </div>
      ) : imageUrl || afterImageUrl ? (
        <img
          src={(imageUrl || afterImageUrl)!}
          alt={name}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{ imageOrientation: 'from-image' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Grid3X3 className="h-6 w-6 text-neutral-600" />
        </div>
      )}
      {status === 'inactive' && <div className="pointer-events-none absolute inset-0 bg-black/45" />}
      {status === 'actualized' && (
        <span className="pointer-events-none absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#BF00FF] text-white">
          <CheckCircle className="h-3 w-3" />
        </span>
      )}
      {bulkMode && (
        <span className="pointer-events-none absolute left-1 top-1">
          {selected ? (
            <CheckSquare className="h-5 w-5 text-[#39FF14] drop-shadow" />
          ) : (
            <Square className="h-5 w-5 text-white/70 drop-shadow" />
          )}
        </span>
      )}
    </div>
  )
}
