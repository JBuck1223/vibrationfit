'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  ArrowLeft, Save, Trash2, Plus, CheckCircle2, Circle, X,
  MessageSquare, Paperclip, Link2, Calendar, Tag, ChevronDown, ChevronRight,
  FileText, Image, File, ExternalLink, Clock,
  ArrowRight, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  IdeaProject, IdeaCategory, IdeaTag, IdeaTask, IdeaComment,
  IdeaAttachment, IdeaCustomFieldDef, IdeaCustomFieldValue,
  IdeaProjectLink, IdeaStatus, IdeaPriority, LinkType,
} from '@/lib/ideas/types'
import {
  IDEA_STATUSES, IDEA_PRIORITIES, LINK_TYPES,
  getStatusInfo, getPriorityInfo,
} from '@/lib/ideas/types'

type Tab = 'overview' | 'tasks' | 'files' | 'activity'

function countAllTasks(tasks: IdeaTask[]): { total: number; done: number } {
  let total = 0
  let done = 0
  for (const t of tasks) {
    total++
    if (t.is_complete) done++
    if (t.subtasks) {
      for (const st of t.subtasks) {
        total++
        if (st.is_complete) done++
      }
    }
  }
  return { total, done }
}

function IdeaDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<IdeaProject | null>(null)
  const [category, setCategory] = useState<IdeaCategory | null>(null)
  const [projectTags, setProjectTags] = useState<IdeaTag[]>([])
  const [tasks, setTasks] = useState<IdeaTask[]>([])
  const [comments, setComments] = useState<IdeaComment[]>([])
  const [attachments, setAttachments] = useState<IdeaAttachment[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<(IdeaCustomFieldValue & { field: IdeaCustomFieldDef })[]>([])
  const [linksOut, setLinksOut] = useState<(IdeaProjectLink & { target: IdeaProject })[]>([])
  const [linksIn, setLinksIn] = useState<(IdeaProjectLink & { source: IdeaProject })[]>([])

  const [categories, setCategories] = useState<IdeaCategory[]>([])
  const [allTags, setAllTags] = useState<IdeaTag[]>([])
  const [allFields, setAllFields] = useState<IdeaCustomFieldDef[]>([])

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<IdeaStatus>('idea')
  const [editPriority, setEditPriority] = useState<IdeaPriority>('medium')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [dirty, setDirty] = useState(false)

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  const [linkResults, setLinkResults] = useState<IdeaProject[]>([])
  const [linkType, setLinkType] = useState<LinkType>('related')

  const [showTagDropdown, setShowTagDropdown] = useState(false)

  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)
  const [editingDescriptionValue, setEditingDescriptionValue] = useState('')
  const [newSubtaskParentId, setNewSubtaskParentId] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/ideas/${id}`)
      if (!res.ok) {
        toast.error('Project not found')
        router.push('/admin/ideas')
        return
      }
      const data = await res.json()
      const p = data.project
      setProject(p)
      setCategory(p.category || null)
      setProjectTags(p.tags || [])
      setTasks(p.tasks || [])
      setComments(p.comments || [])
      setAttachments(p.attachments || [])
      setCustomFieldValues(p.custom_field_values || [])
      setLinksOut(p.links_out || [])
      setLinksIn(p.links_in || [])

      setEditTitle(p.title)
      setEditDescription(p.description || '')
      setEditStatus(p.status)
      setEditPriority(p.priority)
      setEditCategoryId(p.category_id || '')
      setEditDueDate(p.due_date || '')
      setDirty(false)
    } catch {
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const fetchMeta = useCallback(async () => {
    const [catRes, tagRes, fieldRes] = await Promise.all([
      fetch('/api/admin/ideas/categories'),
      fetch('/api/admin/ideas/tags'),
      fetch('/api/admin/ideas/custom-fields'),
    ])
    if (catRes.ok) setCategories((await catRes.json()).categories || [])
    if (tagRes.ok) setAllTags((await tagRes.json()).tags || [])
    if (fieldRes.ok) setAllFields((await fieldRes.json()).fields || [])
  }, [])

  useEffect(() => { fetchProject(); fetchMeta() }, [fetchProject, fetchMeta])

  const markDirty = () => setDirty(true)

  const handleSave = async () => {
    if (!dirty) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          priority: editPriority,
          category_id: editCategoryId || null,
          due_date: editDueDate || null,
          tag_ids: projectTags.map(t => t.id),
        }),
      })
      if (res.ok) {
        toast.success('Saved')
        setDirty(false)
        fetchProject()
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/ideas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Idea deleted')
        router.push('/admin/ideas')
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // Tasks
  const addTask = async (parentTaskId?: string) => {
    const title = parentTaskId ? newSubtaskTitle : newTaskTitle
    if (!title.trim()) return
    const res = await fetch(`/api/admin/ideas/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        ...(parentTaskId ? { parent_task_id: parentTaskId } : {}),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (parentTaskId) {
        setTasks(prev => prev.map(t => {
          if (t.id === parentTaskId) {
            return { ...t, subtasks: [...(t.subtasks || []), data.task] }
          }
          return t
        }))
        setNewSubtaskTitle('')
        setNewSubtaskParentId(null)
      } else {
        setTasks(prev => [...prev, { ...data.task, subtasks: [] }])
        setNewTaskTitle('')
      }
    }
  }

  const toggleTask = async (task: IdeaTask, parentId?: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, is_complete: !task.is_complete }),
    })
    if (res.ok) {
      if (parentId) {
        setTasks(prev => prev.map(t => {
          if (t.id === parentId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(st =>
                st.id === task.id ? { ...st, is_complete: !st.is_complete } : st
              ),
            }
          }
          return t
        }))
      } else {
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, is_complete: !t.is_complete } : t
        ))
      }
    }
  }

  const deleteTask = async (taskId: string, parentId?: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/tasks?task_id=${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      if (parentId) {
        setTasks(prev => prev.map(t => {
          if (t.id === parentId) {
            return { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== taskId) }
          }
          return t
        }))
      } else {
        setTasks(prev => prev.filter(t => t.id !== taskId))
      }
    }
  }

  const saveTaskDescription = async (taskId: string, description: string, parentId?: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, description: description || null }),
    })
    if (res.ok) {
      if (parentId) {
        setTasks(prev => prev.map(t => {
          if (t.id === parentId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(st =>
                st.id === taskId ? { ...st, description: description || null } : st
              ),
            }
          }
          return t
        }))
      } else {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, description: description || null } : t
        ))
      }
      setEditingDescriptionId(null)
      toast.success('Description saved')
    }
  }

  const toggleDescriptionExpanded = (taskId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const startEditDescription = (task: IdeaTask) => {
    setEditingDescriptionId(task.id)
    setEditingDescriptionValue(task.description || '')
  }

  // Comments
  const addComment = async () => {
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      const res = await fetch(`/api/admin/ideas/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
      }
    } finally {
      setPostingComment(false)
    }
  }

  // Attachments
  const addAttachment = async (file_name: string, file_url: string, file_type?: string, file_size?: number) => {
    const res = await fetch(`/api/admin/ideas/${id}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name, file_url, file_type, file_size }),
    })
    if (res.ok) {
      const data = await res.json()
      setAttachments(prev => [data.attachment, ...prev])
      toast.success('Attachment added')
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/attachments?attachment_id=${attachmentId}`, { method: 'DELETE' })
    if (res.ok) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    }
  }

  // Links
  const searchForLink = async (term: string) => {
    setLinkSearch(term)
    if (!term.trim()) { setLinkResults([]); return }
    const res = await fetch(`/api/admin/ideas?search=${encodeURIComponent(term)}`)
    if (res.ok) {
      const data = await res.json()
      setLinkResults((data.projects || []).filter((p: IdeaProject) => p.id !== id))
    }
  }

  const addLink = async (targetId: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_project_id: targetId, link_type: linkType }),
    })
    if (res.ok) {
      const data = await res.json()
      setLinksOut(prev => [...prev, data.link])
      setShowLinkModal(false)
      setLinkSearch('')
      setLinkResults([])
      toast.success('Link added')
    }
  }

  const deleteLink = async (linkId: string) => {
    const res = await fetch(`/api/admin/ideas/${id}/links?link_id=${linkId}`, { method: 'DELETE' })
    if (res.ok) {
      setLinksOut(prev => prev.filter(l => l.id !== linkId))
      setLinksIn(prev => prev.filter(l => l.id !== linkId))
    }
  }

  // Tags
  const toggleTag = (tag: IdeaTag) => {
    const exists = projectTags.some(t => t.id === tag.id)
    if (exists) {
      setProjectTags(prev => prev.filter(t => t.id !== tag.id))
    } else {
      setProjectTags(prev => [...prev, tag])
    }
    markDirty()
  }

  // Custom fields
  const saveCustomFieldValues = async (values: { field_id: string; value: string | null }[]) => {
    const res = await fetch('/api/admin/ideas/custom-fields/values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: id, values }),
    })
    if (res.ok) {
      const data = await res.json()
      setCustomFieldValues(data.values || [])
      toast.success('Custom fields saved')
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!project) return null

  const statusInfo = getStatusInfo(editStatus)
  const { total: tasksTotal, done: tasksDone } = countAllTasks(tasks)

  const relevantFields = allFields.filter(
    f => !f.category_id || f.category_id === editCategoryId
  )

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: 'Tasks', count: tasksTotal },
    { key: 'files', label: 'Files', count: attachments.length },
    { key: 'activity', label: 'Activity', count: comments.length },
  ]

  const renderTaskItem = (task: IdeaTask, parentId?: string, isSubtask = false) => {
    const isDescExpanded = expandedDescriptions.has(task.id)
    const isEditingDesc = editingDescriptionId === task.id
    const hasDescription = !!task.description
    const subtaskCount = task.subtasks?.length || 0
    const subtaskDone = task.subtasks?.filter(st => st.is_complete).length || 0

    return (
      <div key={task.id} className={isSubtask ? 'ml-7' : ''}>
        <div className="flex items-start gap-2 group py-1.5">
          <button onClick={() => toggleTask(task, parentId)} className="mt-0.5">
            {task.is_complete ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {(hasDescription || !isSubtask) && (
                <button
                  onClick={() => toggleDescriptionExpanded(task.id)}
                  className="text-neutral-500 hover:text-neutral-300 flex-shrink-0"
                >
                  {isDescExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <span className={`text-sm ${task.is_complete ? 'text-neutral-500 line-through' : 'text-white'}`}>
                {task.title}
              </span>
              {!isSubtask && subtaskCount > 0 && (
                <span className="text-xs text-neutral-500">
                  {subtaskDone}/{subtaskCount}
                </span>
              )}
            </div>

            {isDescExpanded && (
              <div className="mt-2 ml-5">
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <RecordingTextarea
                      value={editingDescriptionValue}
                      onChange={(val) => setEditingDescriptionValue(val)}
                      placeholder="Add details, instructions, or acceptance criteria..."
                      rows={3}
                      recordingPurpose="quick"
                      storageFolder="journal"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveTaskDescription(task.id, editingDescriptionValue, parentId)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDescriptionId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditDescription(task)}
                    className="w-full text-left"
                  >
                    {task.description ? (
                      <p className="text-xs text-neutral-400 whitespace-pre-wrap hover:text-neutral-300 transition-colors">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-600 italic hover:text-neutral-400 transition-colors">
                        Click to add description...
                      </p>
                    )}
                  </button>
                )}

                {!isSubtask && (
                  <div className="mt-2">
                    {newSubtaskParentId === task.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') addTask(task.id); if (e.key === 'Escape') { setNewSubtaskParentId(null); setNewSubtaskTitle('') } }}
                          placeholder="Subtask title..."
                          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-primary-500/50"
                          autoFocus
                        />
                        <Button variant="ghost" size="sm" onClick={() => addTask(task.id)}>Add</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setNewSubtaskParentId(null); setNewSubtaskTitle('') }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewSubtaskParentId(task.id)}
                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add subtask
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => deleteTask(task.id, parentId)}
            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-0">
            {task.subtasks.map(subtask => renderTaskItem(subtask, task.id, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/ideas')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Ideas
          </Button>
          <div className="flex items-center gap-2">
            {dirty && (
              <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <input
            value={editTitle}
            onChange={(e) => { setEditTitle(e.target.value); markDirty() }}
            className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full placeholder:text-neutral-600"
            placeholder="Idea title..."
          />

          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <select
              value={editStatus}
              onChange={(e) => { setEditStatus(e.target.value as IdeaStatus); markDirty() }}
              className="bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs font-medium text-white"
              style={{ borderColor: statusInfo.color + '60' }}
            >
              {IDEA_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={editPriority}
              onChange={(e) => { setEditPriority(e.target.value as IdeaPriority); markDirty() }}
              className="bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs font-medium text-white"
            >
              {IDEA_PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={editCategoryId}
              onChange={(e) => { setEditCategoryId(e.target.value); markDirty() }}
              className="bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs font-medium text-white"
            >
              <option value="">No Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Due Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => { setEditDueDate(e.target.value); markDirty() }}
                className="bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1 text-xs text-white"
              />
            </div>

            {/* Tags */}
            <div className="relative">
              <button
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600"
              >
                <Tag className="w-3 h-3" />
                Tags ({projectTags.length})
                <ChevronDown className="w-3 h-3" />
              </button>
              {showTagDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-xl p-2 min-w-[200px] z-20 shadow-xl">
                  {allTags.length === 0 ? (
                    <p className="text-xs text-neutral-500 p-2">No tags created yet</p>
                  ) : (
                    allTags.map(tag => {
                      const isSelected = projectTags.some(t => t.id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected ? 'bg-neutral-700' : 'hover:bg-neutral-700/50'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-white">{tag.name}</span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-green-400 ml-auto" />}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tag pills */}
          {projectTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {projectTags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                  <button onClick={() => { toggleTag(tag) }} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-800">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-white border-primary-500'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <Card className="p-4 md:p-6">
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Description</h3>
              <RecordingTextarea
                value={editDescription}
                onChange={(val) => { setEditDescription(val); markDirty() }}
                placeholder="Describe this idea in detail..."
                rows={6}
                recordingPurpose="quick"
                storageFolder="journal"
              />
            </Card>

            {/* Custom Fields */}
            {relevantFields.length > 0 && (
              <Card className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-neutral-300 mb-3">Custom Fields</h3>
                <div className="space-y-3">
                  {relevantFields.map(field => {
                    const existing = customFieldValues.find(v => v.field_id === field.id)
                    const currentValue = existing?.value || ''

                    return (
                      <div key={field.id} className="flex items-center gap-3">
                        <label className="text-xs text-neutral-400 w-32 flex-shrink-0">{field.name}</label>
                        {field.field_type === 'select' ? (
                          <select
                            value={currentValue}
                            onChange={(e) => {
                              saveCustomFieldValues([{ field_id: field.id, value: e.target.value || null }])
                            }}
                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                          >
                            <option value="">--</option>
                            {(field.options || []).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.field_type === 'boolean' ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentValue === 'true'}
                              onChange={(e) => {
                                saveCustomFieldValues([{ field_id: field.id, value: String(e.target.checked) }])
                              }}
                              className="w-4 h-4 rounded bg-neutral-800 border-neutral-700"
                            />
                            <span className="text-sm text-neutral-300">{currentValue === 'true' ? 'Yes' : 'No'}</span>
                          </label>
                        ) : (
                          <input
                            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                            value={currentValue}
                            onChange={(e) => {
                              const newValues = customFieldValues.map(v =>
                                v.field_id === field.id ? { ...v, value: e.target.value } : v
                              )
                              if (!existing) {
                                newValues.push({ id: '', project_id: id, field_id: field.id, value: e.target.value, field } as any)
                              }
                              setCustomFieldValues(newValues)
                            }}
                            onBlur={() => {
                              const val = customFieldValues.find(v => v.field_id === field.id)
                              saveCustomFieldValues([{ field_id: field.id, value: val?.value || null }])
                            }}
                            placeholder={field.field_type === 'url' ? 'https://...' : ''}
                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-neutral-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Linked Projects */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-300">Linked Projects</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowLinkModal(true)}>
                  <Link2 className="w-3 h-3 mr-1" />
                  Add Link
                </Button>
              </div>
              {linksOut.length === 0 && linksIn.length === 0 ? (
                <p className="text-xs text-neutral-500">No linked projects</p>
              ) : (
                <div className="space-y-2">
                  {linksOut.map(link => (
                    <div key={link.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 uppercase">
                          {LINK_TYPES.find(lt => lt.value === link.link_type)?.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-neutral-500" />
                        <button
                          onClick={() => router.push(`/admin/ideas/${(link as any).target?.id}`)}
                          className="text-sm text-white hover:text-primary-400"
                        >
                          {(link as any).target?.title || 'Unknown'}
                        </button>
                      </div>
                      <button onClick={() => deleteLink(link.id)} className="text-neutral-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {linksIn.map(link => (
                    <div key={link.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/ideas/${(link as any).source?.id}`)}
                          className="text-sm text-white hover:text-primary-400"
                        >
                          {(link as any).source?.title || 'Unknown'}
                        </button>
                        <ArrowRight className="w-3 h-3 text-neutral-500" />
                        <span className="text-[10px] text-neutral-500 uppercase">
                          {LINK_TYPES.find(lt => lt.value === link.link_type)?.label}
                        </span>
                      </div>
                      <button onClick={() => deleteLink(link.id)} className="text-neutral-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card className="p-4 md:p-6">
            {/* Progress */}
            {tasksTotal > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>{tasksDone} of {tasksTotal} complete</span>
                  <span>{Math.round((tasksDone / tasksTotal) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(tasksDone / tasksTotal) * 100}%`,
                      backgroundColor: '#39FF14',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-0 mb-4">
              {tasks.map(task => renderTaskItem(task))}
            </div>

            {/* Add Task */}
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-500" />
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
                placeholder="Add a task..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
              />
              {newTaskTitle.trim() && (
                <Button variant="ghost" size="sm" onClick={() => addTask()}>Add</Button>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'files' && (
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-300">Attachments</h3>
              <div>
                <label className="cursor-pointer">
                  <Button variant="ghost" size="sm" onClick={() => {
                    const url = prompt('Enter file URL:')
                    if (url) {
                      const name = prompt('File name:', url.split('/').pop() || 'file') || 'file'
                      addAttachment(name, url)
                    }
                  }}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add URL
                  </Button>
                </label>
              </div>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-8">
                <Paperclip className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No attachments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => {
                  const isImage = att.file_type?.startsWith('image/')
                  const IconComp = isImage ? Image : att.file_type?.includes('pdf') ? FileText : File

                  return (
                    <div key={att.id} className="flex items-center gap-3 bg-neutral-800 rounded-lg px-3 py-2.5">
                      <IconComp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{att.file_name}</p>
                        <p className="text-[10px] text-neutral-500">
                          {att.file_size ? `${Math.round(att.file_size / 1024)}KB` : ''}
                          {att.file_size ? ' \u00B7 ' : ''}
                          {new Date(att.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => deleteAttachment(att.id)} className="text-neutral-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {/* New Comment */}
            <Card className="p-4">
              <RecordingTextarea
                value={newComment}
                onChange={(val) => setNewComment(val)}
                placeholder="Add a comment..."
                rows={3}
                recordingPurpose="quick"
                storageFolder="journal"
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addComment}
                  loading={postingComment}
                  disabled={!newComment.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </Card>

            {/* Comments List */}
            {comments.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No activity yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {comments.map(comment => (
                  <Card key={comment.id} className="p-4">
                    {comment.type === 'status_change' ? (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="font-medium text-neutral-300">
                          {comment.user_name || comment.user_email || 'System'}
                        </span>
                        changed status from
                        <span className="font-medium" style={{ color: getStatusInfo((comment.metadata as any)?.old_status)?.color }}>
                          {getStatusInfo((comment.metadata as any)?.old_status)?.label}
                        </span>
                        to
                        <span className="font-medium" style={{ color: getStatusInfo((comment.metadata as any)?.new_status)?.color }}>
                          {getStatusInfo((comment.metadata as any)?.new_status)?.label}
                        </span>
                        <span className="ml-auto">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-300">
                            {comment.user_name || comment.user_email || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-200 whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Stack>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Idea?" size="sm">
        <p className="text-sm text-neutral-400 mb-4">
          This will permanently delete this idea and all its tasks, comments, and attachments. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Delete</Button>
        </div>
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={showLinkModal} onClose={() => { setShowLinkModal(false); setLinkSearch(''); setLinkResults([]) }} title="Link to Project" size="md">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Link Type</label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as LinkType)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
            >
              {LINK_TYPES.map(lt => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Search Projects</label>
            <Input
              value={linkSearch}
              onChange={(e) => searchForLink(e.target.value)}
              placeholder="Search by title..."
            />
          </div>
          {linkResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {linkResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => addLink(p.id)}
                  className="w-full flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm text-white transition-colors"
                >
                  <span>{p.title}</span>
                  <span className="text-[10px] text-neutral-500">{getStatusInfo(p.status).label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </Container>
  )
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <AdminWrapper>
      <IdeaDetailContent id={id} />
    </AdminWrapper>
  )
}
