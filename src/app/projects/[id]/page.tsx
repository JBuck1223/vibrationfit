'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Container, Card, Button, Input, Spinner } from '@/lib/design-system/components'
import {
  ArrowLeft, Plus, Trash2, FolderKanban, ListChecks, ChevronRight, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaTask, IdeaStatus } from '@/lib/projects/types'
import { IDEA_STATUSES, getStatusInfo, getLifeCategoryInfo } from '@/lib/projects/types'

interface ProjectDetail {
  id: string
  title: string
  description: string | null
  type: 'project' | 'list'
  life_categories: string[]
  status: IdeaStatus
  priority: string
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

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/projects/${id}/tasks?task_id=${taskId}`, { method: 'DELETE' })
    fetchProject()
  }

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!project) return null

  const isList = project.type === 'list'
  const statusInfo = getStatusInfo(project.status)

  return (
    <Container size="lg" className="py-8">
      <Button variant="ghost" size="sm" onClick={() => router.push('/projects')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Projects
      </Button>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-1 flex-shrink-0">
            {isList ? (
              <ListChecks className="w-5 h-5 text-secondary-400" />
            ) : (
              <FolderKanban className="w-5 h-5 text-primary-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
              onBlur={() => updateProject({ title: project.title })}
              className="w-full bg-transparent text-2xl font-bold text-white outline-none border-b border-transparent focus:border-neutral-700"
            />
            {project.life_categories?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.life_categories.map(key => {
                  const lc = getLifeCategoryInfo(key)
                  return (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: lc.color + '20', color: lc.color, border: `1px solid ${lc.color}40` }}
                    >
                      {lc.label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          {!isList && (
            <select
              value={project.status}
              onChange={(e) => updateProject({ status: e.target.value })}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm"
              style={{ color: statusInfo.color }}
            >
              {IDEA_STATUSES.map(s => (
                <option key={s.value} value={s.value} style={{ color: '#fff' }}>{s.label}</option>
              ))}
            </select>
          )}
        </div>

        {!isList && (
          <textarea
            value={project.description || ''}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            onBlur={() => updateProject({ description: project.description })}
            placeholder="Add a description..."
            rows={3}
            className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-200"
          />
        )}
      </Card>

      {/* Tasks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <span className="text-sm text-neutral-400">
            {project.task_done_count}/{project.task_count} done
          </span>
        </div>

        <div className="space-y-1">
          {project.tasks.map(task => (
            <div key={task.id}>
              <div className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-800/50">
                {task.subtasks && task.subtasks.length > 0 ? (
                  <button onClick={() => setExpanded(p => ({ ...p, [task.id]: !p[task.id] }))} className="text-neutral-500">
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded[task.id] ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <button
                  onClick={() => toggleTask(task)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.is_complete ? 'bg-primary-500 border-primary-500' : 'border-neutral-600 hover:border-primary-500'
                  }`}
                >
                  {task.is_complete && <Check className="w-3.5 h-3.5 text-black" />}
                </button>
                <span className={`flex-1 text-sm ${task.is_complete ? 'text-neutral-500 line-through' : 'text-white'}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-primary-400"
                  title="Add subtask"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtasks */}
              {expanded[task.id] && task.subtasks?.map(sub => (
                <div key={sub.id} className="group flex items-center gap-2 py-1.5 px-2 pl-10 rounded-lg hover:bg-neutral-800/50">
                  <button
                    onClick={() => toggleTask(sub)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      sub.is_complete ? 'bg-primary-500 border-primary-500' : 'border-neutral-600 hover:border-primary-500'
                    }`}
                  >
                    {sub.is_complete && <Check className="w-3 h-3 text-black" />}
                  </button>
                  <span className={`flex-1 text-sm ${sub.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteTask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add subtask input */}
              {addingSubtaskTo === task.id && (
                <div className="flex items-center gap-2 py-1.5 px-2 pl-10">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask(task.id)}
                    placeholder="Subtask title..."
                    autoFocus
                    className="text-sm"
                  />
                  <Button size="sm" variant="primary" onClick={() => addTask(task.id)}>Add</Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add task */}
        <div className="flex items-center gap-2 mt-3">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task..."
          />
          <Button variant="primary" onClick={() => addTask()} disabled={!newTaskTitle.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </Card>
    </Container>
  )
}
