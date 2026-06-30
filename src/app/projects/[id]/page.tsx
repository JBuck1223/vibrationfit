'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Container, Card, Button, Input, Textarea, Stack, Spinner } from '@/lib/design-system/components'
import {
  Plus, Trash2, ChevronRight, CheckCircle2, Calendar,
  Check, Archive, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaTask, IdeaStatus } from '@/lib/projects/types'
import { getLifeCategoryInfo } from '@/lib/projects/types'

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

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        {/* Title + categories — outside description card */}
        <div className="px-1">
          {project.status === 'done' && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#39FF14]/20 bg-[#39FF14]/[0.06] px-3 py-1.5 w-fit">
              <Check className="h-3.5 w-3.5 text-[#39FF14]" />
              <span className="text-xs font-medium text-[#39FF14]">Complete</span>
            </div>
          )}
          {project.status === 'archived' && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 w-fit">
              <Archive className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-400">Archived</span>
            </div>
          )}
          <input
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            onBlur={() => updateProject({ title: project.title })}
            className="min-w-0 w-full bg-transparent text-lg font-bold text-white outline-none sm:text-xl"
          />
          {project.life_categories?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.life_categories.map(key => {
                const lc = getLifeCategoryInfo(key)
                return (
                  <span
                    key={key}
                    className="rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-[10px] font-medium text-neutral-400"
                  >
                    {lc.label}
                  </span>
                )
              })}
            </div>
          )}
          {project.due_date && (
            <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
              <Calendar className="h-3 w-3" />
              Due {new Date(project.due_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Description */}
        <Card
          variant="glass"
          className="relative overflow-hidden border border-white/[0.06] p-3 shadow-none sm:p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/[0.02] via-transparent to-[#00FFFF]/[0.02] pointer-events-none" />
          <div className="relative">
            <Textarea
              value={project.description || ''}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              onBlur={() => updateProject({ description: project.description })}
              placeholder="Add a description..."
              rows={2}
              className="!border-neutral-800 !bg-neutral-900/50 text-sm"
            />
          </div>
        </Card>

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
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) =>
                        setProject(prev =>
                          prev ? { ...prev, tasks: patchTaskInTree(prev.tasks, task.id, { title: e.target.value }) } : prev
                        )
                      }
                      onFocus={(e) => {
                        e.currentTarget.dataset.originalTitle = e.currentTarget.value
                      }}
                      onBlur={(e) => {
                        const original = e.currentTarget.dataset.originalTitle ?? e.currentTarget.value
                        handleTaskTitleBlur(task.id, e.currentTarget.value, original)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                      className={`min-w-0 flex-1 bg-transparent text-sm outline-none focus:rounded-lg focus:bg-white/[0.04] focus:px-1 ${
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
                      <input
                        type="text"
                        value={sub.title}
                        onChange={(e) =>
                          setProject(prev =>
                            prev ? { ...prev, tasks: patchTaskInTree(prev.tasks, sub.id, { title: e.target.value }) } : prev
                          )
                        }
                        onFocus={(e) => {
                          e.currentTarget.dataset.originalTitle = e.currentTarget.value
                        }}
                        onBlur={(e) => {
                          const original = e.currentTarget.dataset.originalTitle ?? e.currentTarget.value
                          handleTaskTitleBlur(sub.id, e.currentTarget.value, original)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur()
                        }}
                        className={`min-w-0 flex-1 bg-transparent text-sm outline-none focus:rounded-lg focus:bg-white/[0.04] focus:px-1 ${
                          sub.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-300'
                        }`}
                      />
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

        <div className="flex items-center justify-center gap-3 pt-2">
          {project.status === 'active' && (
            <>
              <Button size="sm" variant="ghost" onClick={handleArchive} className="text-neutral-400 hover:text-neutral-200">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button size="sm" variant="primary" onClick={handleMarkComplete}>
                <Check className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            </>
          )}
          {project.status === 'done' && (
            <>
              <Button size="sm" variant="ghost" onClick={handleArchive} className="text-neutral-400 hover:text-neutral-200">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRestore} className="text-neutral-400 hover:text-neutral-200">
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            </>
          )}
          {project.status === 'archived' && (
            <Button size="sm" variant="ghost" onClick={handleRestore} className="text-neutral-400 hover:text-neutral-200">
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore
            </Button>
          )}
        </div>
      </Stack>
    </Container>
  )
}
