'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Container, Card, Button, Input, Stack, Spinner, Modal, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { scrollSafeAutoResize } from '@/lib/design-system/components/forms/auto-resize-utils'
import {
  Plus, Trash2, ChevronRight, CheckCircle2, Calendar,
  Check, Archive, RotateCcw, Home, FolderInput, FolderKanban,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaTask, IdeaStatus } from '@/lib/projects/types'
import { getLifeCategoryInfo } from '@/lib/projects/types'

// Single-line-style text field that wraps and grows with its content so long
// titles are never clipped. Enter commits (blurs) instead of inserting a newline.
function GrowingTextInput({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onFocus?: (el: HTMLTextAreaElement) => void
  onBlur?: (el: HTMLTextAreaElement) => void
  className?: string
}) {
  return (
    <textarea
      rows={1}
      value={value}
      ref={(el) => { if (el) scrollSafeAutoResize(el) }}
      onChange={(e) => {
        onChange(e.target.value)
        scrollSafeAutoResize(e.target)
      }}
      onFocus={(e) => onFocus?.(e.currentTarget)}
      onBlur={(e) => onBlur?.(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={`block resize-none overflow-hidden bg-transparent outline-none ${className || ''}`}
    />
  )
}

interface ProjectDetail {
  id: string
  title: string
  description: string | null
  life_categories: string[]
  status: IdeaStatus
  due_date: string | null
  tasks: IdeaTask[]
  task_count: number
  task_done_count: number
  household_id?: string | null
  isMine?: boolean
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [householdInfo, setHouseholdInfo] = useState<{ name: string; isMultiMember: boolean } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [movingTask, setMovingTask] = useState<IdeaTask | null>(null)
  const [moveTargets, setMoveTargets] = useState<{ id: string; title: string }[] | null>(null)
  const [movingTo, setMovingTo] = useState<string | null>(null)

  // Latest description text, so we can persist right after a voice transcript
  // lands (state updates haven't flushed yet at that point)
  const descriptionRef = useRef('')
  useEffect(() => {
    descriptionRef.current = project?.description || ''
  }, [project?.description])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/household?includeMembers=true')
        if (!res.ok) return
        const json = await res.json()
        if (active && json.household) {
          setHouseholdInfo({
            name: json.household.name,
            isMultiMember: (json.members?.length || 0) > 1,
          })
        }
      } catch {
        // household lens is optional
      }
    })()
    return () => { active = false }
  }, [])

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
      } else if (res.status === 404) {
        toast.error('Project not found')
        router.push('/projects')
      }
    } catch {
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchProject() }, [fetchProject])

  const updateProject = async (updates: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      fetchProject()
    } else {
      toast.error('Failed to update')
    }
  }

  const handleMarkComplete = async () => {
    await updateProject({ status: 'done' })
    toast.success('Project marked complete')
  }

  const handleArchive = async () => {
    await updateProject({ status: 'archived' })
    toast.success('Project archived')
  }

  const handleRestore = async () => {
    await updateProject({ status: 'active' })
    toast.success('Project restored')
  }

  const addTask = async (parentTaskId?: string) => {
    const title = parentTaskId ? newSubtaskTitle : newTaskTitle
    if (!title.trim()) return
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...(parentTaskId ? { parent_task_id: parentTaskId } : {}) }),
    })
    if (res.ok) {
      if (parentTaskId) {
        setNewSubtaskTitle('')
        setAddingSubtaskTo(null)
        setExpanded(prev => ({ ...prev, [parentTaskId]: true }))
      } else {
        setNewTaskTitle('')
      }
      fetchProject()
    } else {
      toast.error('Failed to add task')
    }
  }

  const toggleTask = async (task: IdeaTask) => {
    await fetch(`/api/projects/${id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, is_complete: !task.is_complete }),
    })
    fetchProject()
  }

  const patchTaskInTree = (tasks: IdeaTask[], taskId: string, patch: Partial<IdeaTask>): IdeaTask[] =>
    tasks.map(task => {
      if (task.id === taskId) return { ...task, ...patch }
      if (task.subtasks) {
        return {
          ...task,
          subtasks: task.subtasks.map(s => (s.id === taskId ? { ...s, ...patch } : s)),
        }
      }
      return task
    })

  const updateTaskField = async (taskId: string, updates: { title?: string; description?: string }) => {
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, ...updates }),
    })
    if (res.ok) {
      fetchProject()
    } else {
      toast.error('Failed to update task')
      fetchProject()
    }
  }

  const handleTaskTitleBlur = (taskId: string, value: string, originalTitle: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      toast.error('Task title cannot be empty')
      fetchProject()
      return
    }
    if (trimmed !== originalTitle.trim()) {
      updateTaskField(taskId, { title: trimmed })
    }
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/projects/${id}/tasks?task_id=${taskId}`, { method: 'DELETE' })
    fetchProject()
  }

  const handleDeleteProject = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Project deleted')
        router.push('/projects')
      } else {
        toast.error('Failed to delete project')
        setDeleting(false)
      }
    } catch {
      toast.error('Failed to delete project')
      setDeleting(false)
    }
  }

  const openMoveTask = async (task: IdeaTask) => {
    setMovingTask(task)
    setMoveTargets(null)
    try {
      const res = await fetch('/api/projects?sort=updated')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMoveTargets(
        (data.projects || [])
          .filter((p: { id: string }) => p.id !== id)
          .map((p: { id: string; title: string }) => ({ id: p.id, title: p.title }))
      )
    } catch {
      toast.error('Failed to load projects')
      setMovingTask(null)
    }
  }

  const moveTaskToProject = async (targetProjectId: string) => {
    if (!movingTask) return
    setMovingTo(targetProjectId)
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: movingTask.id, target_project_id: targetProjectId }),
      })
      if (res.ok) {
        const target = moveTargets?.find(p => p.id === targetProjectId)
        toast.success(target ? `Task moved to "${target.title}"` : 'Task moved')
        setMovingTask(null)
        fetchProject()
      } else {
        toast.error('Failed to move task')
      }
    } catch {
      toast.error('Failed to move task')
    } finally {
      setMovingTo(null)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!project) return null

  const taskPercent = project.task_count > 0
    ? Math.round((project.task_done_count / project.task_count) * 100)
    : 0

  const hasMetaRow =
    project.status === 'done' ||
    project.status === 'archived' ||
    (project.life_categories?.length ?? 0) > 0 ||
    !!project.due_date ||
    !!householdInfo?.isMultiMember

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        {/* Title + categories — outside description card */}
        <div className="px-1">
          <GrowingTextInput
            value={project.title}
            onChange={(value) => setProject({ ...project, title: value })}
            onBlur={() => updateProject({ title: project.title })}
            className="min-w-0 w-full text-xl font-bold text-white sm:text-2xl"
          />
          {hasMetaRow && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {project.status === 'done' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39FF14]/25 bg-[#39FF14]/[0.08] px-2.5 py-1 text-xs font-medium text-[#39FF14]">
                <Check className="h-3.5 w-3.5" />
                Complete
              </span>
            )}
            {project.status === 'archived' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-xs font-medium text-neutral-400">
                <Archive className="h-3.5 w-3.5" />
                Archived
              </span>
            )}
            {project.life_categories?.map(key => {
              const lc = getLifeCategoryInfo(key)
              return (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full border border-neutral-700/80 bg-neutral-800/40 px-2.5 py-1 text-xs font-medium text-neutral-300"
                >
                  {lc.label}
                </span>
              )
            })}
            {project.due_date && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700/80 bg-neutral-800/40 px-2.5 py-1 text-xs font-medium text-neutral-400">
                <Calendar className="h-3.5 w-3.5" />
                Due {new Date(project.due_date).toLocaleDateString()}
              </span>
            )}
            {householdInfo?.isMultiMember && (project.isMine ?? true) && (
              <button
                type="button"
                onClick={async () => {
                  const next = !project.household_id
                  await updateProject({ shareWithHousehold: next })
                  toast.success(next ? `Shared with ${householdInfo.name}` : 'No longer shared')
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  project.household_id
                    ? 'border-[#00FFFF]/30 bg-[#00FFFF]/[0.08] text-[#00FFFF] hover:border-[#00FFFF]/50'
                    : 'border-neutral-700 bg-neutral-800/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                {project.household_id ? `Shared with ${householdInfo.name}` : `Share with ${householdInfo.name}`}
              </button>
            )}
            {householdInfo?.isMultiMember && project.isMine === false && project.household_id && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00FFFF]/30 bg-[#00FFFF]/[0.08] px-2.5 py-1 text-xs font-medium text-[#00FFFF]">
                <Home className="h-3.5 w-3.5" />
                Shared household project
              </span>
            )}
          </div>
          )}
        </div>

        {/* Description */}
        <div
          onBlur={(e) => {
            // Only persist when focus leaves the description area entirely
            // (not when tapping the mic/record controls inside it)
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              updateProject({ description: descriptionRef.current })
            }
          }}
        >
          <RecordingTextarea
            value={project.description || ''}
            onChange={(value) => {
              descriptionRef.current = value
              setProject({ ...project, description: value })
            }}
            placeholder="Add a description... or tap the mic to record."
            rows={2}
            recordingPurpose="quick"
            storageFolder="journal"
            category="project-description"
            instanceId={`project-description-${id}`}
            hideClear
            className="!bg-[#1A1A1A] !border-[#282828] text-sm"
            onAudioSaved={() => updateProject({ description: descriptionRef.current })}
          />
        </div>

        {/* Tasks */}
        <Card
          variant="glass"
          className="border border-white/[0.06] p-3 shadow-none sm:p-4"
        >
          <div className="mb-2 flex items-center gap-2 px-1 sm:mb-3">
            <h2 className="shrink-0 text-sm font-semibold text-white">Tasks</h2>
            {project.tasks.length === 0 && (
              <p className="min-w-0 flex-1 text-center text-sm text-neutral-500">
                No tasks yet. Add one below to get started.
              </p>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              {project.task_count > 0 && (
                <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800/80 sm:block">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#39FF14] to-[#00FFFF] transition-all duration-500"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
              )}
              <span className="text-xs text-neutral-500">
                {project.task_done_count}/{project.task_count}
              </span>
            </div>
          </div>

          {project.tasks.length > 0 && (
            <div className="flex flex-col">
              {project.tasks.map(task => (
                <div key={task.id}>
                  <div className="group flex items-center gap-2.5 rounded-xl py-2.5 transition-colors hover:bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        task.is_complete
                          ? 'border-[#39FF14] bg-[#39FF14]/15'
                          : 'border-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {task.is_complete && <CheckCircle2 className="h-4 w-4 text-[#39FF14]" />}
                    </button>
                    {task.subtasks && task.subtasks.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(p => ({ ...p, [task.id]: !p[task.id] }))}
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-neutral-500"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${expanded[task.id] ? 'rotate-90' : ''}`}
                        />
                      </button>
                    ) : null}
                    <GrowingTextInput
                      value={task.title}
                      onChange={(value) =>
                        setProject(prev =>
                          prev ? { ...prev, tasks: patchTaskInTree(prev.tasks, task.id, { title: value }) } : prev
                        )
                      }
                      onFocus={(el) => {
                        el.dataset.originalTitle = el.value
                      }}
                      onBlur={(el) => {
                        const original = el.dataset.originalTitle ?? el.value
                        handleTaskTitleBlur(task.id, el.value, original)
                      }}
                      className={`min-w-0 flex-1 text-sm focus:rounded-lg focus:bg-white/[0.04] focus:px-1 ${
                        task.is_complete
                          ? 'text-neutral-500 line-through decoration-neutral-600'
                          : 'text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                      className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-white/[0.06] hover:text-[#39FF14] sm:opacity-0 sm:group-hover:opacity-100"
                      title="Add subtask"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMoveTask(task)}
                      className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-white/[0.06] hover:text-[#00FFFF] sm:opacity-0 sm:group-hover:opacity-100"
                      title="Move to another project"
                    >
                      <FolderInput className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {expanded[task.id] && task.subtasks?.map(sub => (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-2.5 rounded-xl py-2 pl-10 pr-0 transition-colors hover:bg-white/[0.03]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(sub)}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          sub.is_complete
                            ? 'border-[#39FF14] bg-[#39FF14]/15'
                            : 'border-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {sub.is_complete && <CheckCircle2 className="h-3.5 w-3.5 text-[#39FF14]" />}
                      </button>
                      <GrowingTextInput
                        value={sub.title}
                        onChange={(value) =>
                          setProject(prev =>
                            prev ? { ...prev, tasks: patchTaskInTree(prev.tasks, sub.id, { title: value }) } : prev
                          )
                        }
                        onFocus={(el) => {
                          el.dataset.originalTitle = el.value
                        }}
                        onBlur={(el) => {
                          const original = el.dataset.originalTitle ?? el.value
                          handleTaskTitleBlur(sub.id, el.value, original)
                        }}
                        className={`min-w-0 flex-1 text-sm focus:rounded-lg focus:bg-white/[0.04] focus:px-1 ${
                          sub.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => openMoveTask(sub)}
                        className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-white/[0.06] hover:text-[#00FFFF] sm:opacity-0 sm:group-hover:opacity-100"
                        title="Move to another project"
                      >
                        <FolderInput className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(sub.id)}
                        className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {addingSubtaskTo === task.id && (
                    <div className="flex items-center gap-2 py-2 pl-10 pr-0">
                      <Input
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(task.id)}
                        placeholder="Subtask title..."
                        autoFocus
                        className="!border !border-neutral-800 bg-neutral-900/50 text-sm focus:!border-[#39FF14]/40"
                      />
                      <Button size="sm" variant="primary" onClick={() => addTask(task.id)}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task..."
              className="!border !border-neutral-800 bg-neutral-900/50 focus:!border-[#39FF14]/40"
            />
            <Button variant="primary" onClick={() => addTask()} disabled={!newTaskTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-neutral-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            {(project.status === 'active' || project.status === 'done') && (
              <Button size="sm" variant="ghost" onClick={handleArchive} className="text-neutral-400 hover:text-neutral-200">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
            {(project.status === 'done' || project.status === 'archived') && (
              <Button size="sm" variant="ghost" onClick={handleRestore} className="text-neutral-400 hover:text-neutral-200">
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            )}
          </div>
          {project.status === 'active' && (
            <Button size="sm" variant="primary" onClick={handleMarkComplete} className="w-full sm:w-auto">
              <Check className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          )}
        </div>
      </Stack>

      {/* Move task to another project */}
      <Modal
        isOpen={!!movingTask}
        onClose={() => setMovingTask(null)}
        title="Move Task"
        size="md"
        className="!border !border-white/[0.06] bg-[#1F1F1F]/95 backdrop-blur-xl shadow-2xl"
      >
        <p className="mb-4 text-sm text-neutral-400">
          Move <span className="font-medium text-white">&ldquo;{movingTask?.title}&rdquo;</span> to another project.
          {movingTask?.subtasks && movingTask.subtasks.length > 0 && ' Its subtasks will move with it.'}
        </p>
        {moveTargets === null ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : moveTargets.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No other active projects. Create another project first.
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {moveTargets.map(target => (
              <button
                key={target.id}
                type="button"
                disabled={movingTo !== null}
                onClick={() => moveTaskToProject(target.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-[#00FFFF]/40 hover:bg-[#00FFFF]/[0.06] disabled:opacity-50"
              >
                <FolderKanban className="h-4 w-4 shrink-0 text-[#00FFFF]" />
                <span className="min-w-0 flex-1 text-sm text-white">{target.title}</span>
                {movingTo === target.id ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete project confirmation */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="This permanently deletes the project and all of its tasks. This action cannot be undone."
        itemName={project.title}
        isDeleting={deleting}
      />
    </Container>
  )
}
