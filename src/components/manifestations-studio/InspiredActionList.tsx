'use client'

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle, ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/lib/design-system'

export interface ActionTask {
  id: string
  title: string
  description: string | null
  is_complete: boolean
  parent_task_id: string | null
  sort_order: number
}

export interface ActionGroup {
  id: string
  title: string
  description: string | null
  status: string
  sort_order: number
  project_tasks: ActionTask[]
}

interface InspiredActionListProps {
  groups: ActionGroup[]
  onAddStep: (groupId: string, title: string) => Promise<boolean>
  onToggleStep: (groupId: string, task: ActionTask) => void
  onDeleteStep: (groupId: string, taskId: string) => void
  onDeleteGroup: (groupId: string) => void
  onRenameGroup: (groupId: string, title: string) => void
  onRenameStep: (groupId: string, taskId: string, title: string) => void
  onReorderGroups: (orderedIds: string[]) => void
  onReorderSteps: (groupId: string, orderedIds: string[]) => void
}

function reorderIds(ids: string[], activeId: string, overId: string): string[] | null {
  if (activeId === overId) return null
  const oldIndex = ids.indexOf(activeId)
  const newIndex = ids.indexOf(overId)
  if (oldIndex < 0 || newIndex < 0) return null
  return arrayMove(ids, oldIndex, newIndex)
}

function taskTree(tasks: ActionTask[]) {
  const byOrder = (a: ActionTask, b: ActionTask) => a.sort_order - b.sort_order
  const top = tasks.filter(task => !task.parent_task_id).sort(byOrder)
  const children = (parentId: string) =>
    tasks.filter(task => task.parent_task_id === parentId).sort(byOrder)
  return { top, children }
}

function useInlineEdit(value: string, onSave: (next: string) => void) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const ignoreBlur = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (!editing) return
    ignoreBlur.current = false
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const finish = (save: boolean) => {
    ignoreBlur.current = true
    const next = draft.trim()
    setEditing(false)
    if (save && next && next !== value) onSave(next)
    else setDraft(value)
  }

  return {
    editing,
    start: () => setEditing(true),
    inputProps: {
      ref: inputRef,
      value: draft,
      onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
      onBlur: () => {
        if (ignoreBlur.current) {
          ignoreBlur.current = false
          return
        }
        finish(true)
      },
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          finish(true)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          finish(false)
        }
      },
    },
  }
}

function DragHandle({
  label,
  buttonRef,
  attributes,
  listeners,
}: {
  label: string
  buttonRef: ReturnType<typeof useSortable>['setActivatorNodeRef']
  attributes: ReturnType<typeof useSortable>['attributes']
  listeners: ReturnType<typeof useSortable>['listeners']
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="p-1 -ml-1 text-neutral-600 hover:text-neutral-300 cursor-grab active:cursor-grabbing touch-none shrink-0"
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  )
}

function SubtaskRow({
  task,
  onToggle,
  onDelete,
  onRename,
}: {
  task: ActionTask
  onToggle: () => void
  onDelete: () => void
  onRename: (title: string) => void
}) {
  const edit = useInlineEdit(task.title, onRename)

  return (
    <div className="flex items-center gap-2.5 py-1 pl-7">
      <button type="button" onClick={onToggle} className="shrink-0" aria-label={task.is_complete ? 'Mark step open' : 'Mark step done'}>
        {task.is_complete
          ? <CheckCircle className="w-4 h-4 text-[#39FF14]" />
          : <div className="w-4 h-4 rounded-full border-2 border-neutral-600 hover:border-neutral-400" />}
      </button>
      {edit.editing ? (
        <input
          {...edit.inputProps}
          aria-label="Step title"
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent border-b border-neutral-500 outline-none text-sm text-white py-0.5"
        />
      ) : (
        <span className={`flex-1 min-w-0 text-sm truncate ${task.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
          {task.title}
        </span>
      )}
      {!edit.editing && (
        <button
          type="button"
          onClick={edit.start}
          className="text-neutral-600 hover:text-white shrink-0"
          aria-label="Edit step"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="text-neutral-600 hover:text-red-400 shrink-0"
        aria-label="Delete step"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function SortableStep({
  task,
  subtasks,
  onToggle,
  onDelete,
  onRename,
}: {
  task: ActionTask
  subtasks: ActionTask[]
  onToggle: (task: ActionTask) => void
  onDelete: (taskId: string) => void
  onRename: (taskId: string, title: string) => void
}) {
  const edit = useInlineEdit(task.title, title => onRename(task.id, title))
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2.5 py-1">
        <DragHandle
          label="Reorder step"
          buttonRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
        <button type="button" onClick={() => onToggle(task)} className="shrink-0" aria-label={task.is_complete ? 'Mark step open' : 'Mark step done'}>
          {task.is_complete
            ? <CheckCircle className="w-4 h-4 text-[#39FF14]" />
            : <div className="w-4 h-4 rounded-full border-2 border-neutral-600 hover:border-neutral-400" />}
        </button>
        {edit.editing ? (
          <input
            {...edit.inputProps}
            aria-label="Step title"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-b border-neutral-500 outline-none text-sm text-white py-0.5"
          />
        ) : (
          <span className={`flex-1 min-w-0 text-sm truncate ${task.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
            {task.title}
          </span>
        )}
        {!edit.editing && (
          <button
            type="button"
            onClick={edit.start}
            className="text-neutral-600 hover:text-white shrink-0"
            aria-label="Edit step"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="text-neutral-600 hover:text-red-400 shrink-0"
          aria-label="Delete step"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {subtasks.map(sub => (
        <SubtaskRow
          key={sub.id}
          task={sub}
          onToggle={() => onToggle(sub)}
          onDelete={() => onDelete(sub.id)}
          onRename={title => onRename(sub.id, title)}
        />
      ))}
    </div>
  )
}

function SortableGroup({
  group,
  collapsed,
  onToggleCollapsed,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onDeleteGroup,
  onRenameGroup,
  onRenameStep,
  onReorderSteps,
}: {
  group: ActionGroup
  collapsed: boolean
  onToggleCollapsed: () => void
  onAddStep: (groupId: string, title: string) => Promise<boolean>
  onToggleStep: (task: ActionTask) => void
  onDeleteStep: (taskId: string) => void
  onDeleteGroup: () => void
  onRenameGroup: (title: string) => void
  onRenameStep: (taskId: string, title: string) => void
  onReorderSteps: (orderedIds: string[]) => void
}) {
  const edit = useInlineEdit(group.title, onRenameGroup)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: group.id })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const { top, children } = taskTree(group.project_tasks || [])
  const done = (group.project_tasks || []).filter(task => task.is_complete).length
  const total = (group.project_tasks || []).length
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  const submitStep = async () => {
    const title = draft.trim()
    if (!title || adding) return
    setAdding(true)
    const ok = await onAddStep(group.id, title)
    setAdding(false)
    if (ok) setDraft('')
  }

  const handleStepDragEnd = (event: DragEndEvent) => {
    const overId = event.over ? String(event.over.id) : ''
    const next = reorderIds(top.map(task => task.id), String(event.active.id), overId)
    if (next) onReorderSteps(next)
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-[#282828] bg-[#161616]">
      <div className="flex items-center gap-2 px-4 py-3">
        <DragHandle
          label="Reorder group"
          buttonRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-neutral-400 hover:text-white shrink-0"
          aria-label={collapsed ? 'Expand group' : 'Collapse group'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          {edit.editing ? (
            <input
              {...edit.inputProps}
              aria-label="Group title"
              autoComplete="off"
              className="w-full bg-transparent border-b border-neutral-500 outline-none text-sm font-medium text-white py-0.5"
            />
          ) : (
            <>
              <p className="text-sm font-medium text-white truncate">{group.title}</p>
              {group.description && <p className="text-xs text-neutral-500 line-clamp-1">{group.description}</p>}
            </>
          )}
        </div>
        {total > 0 && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 shrink-0">{done}/{total}</span>
        )}
        {!edit.editing && (
          <button
            type="button"
            onClick={edit.start}
            className="text-neutral-500 hover:text-white shrink-0"
            aria-label="Edit group"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteGroup}
          className="text-neutral-500 hover:text-red-400 shrink-0"
          aria-label="Remove action group"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-1.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStepDragEnd}>
            <SortableContext items={top.map(task => task.id)} strategy={verticalListSortingStrategy}>
              {top.map(task => (
                <SortableStep
                  key={task.id}
                  task={task}
                  subtasks={children(task.id)}
                  onToggle={onToggleStep}
                  onDelete={onDeleteStep}
                  onRename={onRenameStep}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex gap-2 items-center pt-1.5">
            <input
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); submitStep() } }}
              placeholder="Add a step…"
              className="flex-1 bg-transparent border-b border-[#2A2A2A] focus:border-neutral-500 outline-none text-sm text-white py-1.5 placeholder:text-neutral-600"
            />
            <Button variant="ghost" size="sm" onClick={submitStep} disabled={adding || !draft.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function InspiredActionList({
  groups,
  onAddStep,
  onToggleStep,
  onDeleteStep,
  onDeleteGroup,
  onRenameGroup,
  onRenameStep,
  onReorderGroups,
  onReorderSteps,
}: InspiredActionListProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const ordered = [...groups].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))

  if (ordered.length === 0) return null

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const overId = event.over ? String(event.over.id) : ''
    const next = reorderIds(ordered.map(group => group.id), String(event.active.id), overId)
    if (next) onReorderGroups(next)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
      <SortableContext items={ordered.map(group => group.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {ordered.map(group => (
            <SortableGroup
              key={group.id}
              group={group}
              collapsed={collapsedIds.has(group.id)}
              onToggleCollapsed={() => setCollapsedIds(prev => {
                const next = new Set(prev)
                if (next.has(group.id)) next.delete(group.id)
                else next.add(group.id)
                return next
              })}
              onAddStep={onAddStep}
              onToggleStep={task => onToggleStep(group.id, task)}
              onDeleteStep={taskId => onDeleteStep(group.id, taskId)}
              onDeleteGroup={() => onDeleteGroup(group.id)}
              onRenameGroup={title => onRenameGroup(group.id, title)}
              onRenameStep={(taskId, title) => onRenameStep(group.id, taskId, title)}
              onReorderSteps={orderedIds => onReorderSteps(group.id, orderedIds)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
