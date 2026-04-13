'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  Search, Plus, Kanban, Settings, Calendar, CheckCircle2,
  Filter, X, Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  IdeaProjectWithRelations,
  IdeaCategory,
  IdeaTag,
  IdeaStatus,
  IdeaPriority,
} from '@/lib/ideas/types'
import { IDEA_STATUSES, IDEA_PRIORITIES, getStatusInfo, getPriorityInfo } from '@/lib/ideas/types'

type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date' | 'updated'

function IdeasListContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<IdeaProjectWithRelations[]>([])
  const [categories, setCategories] = useState<IdeaCategory[]>([])
  const [tags, setTags] = useState<IdeaTag[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newPriority, setNewPriority] = useState<IdeaPriority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (search) params.set('search', search)
      params.set('sort', sort)

      const res = await fetch(`/api/admin/ideas?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, priorityFilter, search, sort])

  const fetchMeta = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([
      fetch('/api/admin/ideas/categories'),
      fetch('/api/admin/ideas/tags'),
    ])
    if (catRes.ok) {
      const d = await catRes.json()
      setCategories(d.categories || [])
    }
    if (tagRes.ok) {
      const d = await tagRes.json()
      setTags(d.tags || [])
    }
  }, [])

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects()
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchProjects, search])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          category_id: newCategoryId || null,
          priority: newPriority,
          due_date: newDueDate || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Idea created')
        setShowNewModal(false)
        setNewTitle('')
        setNewDescription('')
        setNewCategoryId('')
        setNewPriority('medium')
        setNewDueDate('')
        router.push(`/admin/ideas/${data.project.id}`)
      } else {
        toast.error('Failed to create idea')
      }
    } catch {
      toast.error('Failed to create idea')
    } finally {
      setCreating(false)
    }
  }

  const activeFilterCount = [
    statusFilter !== 'all',
    !!categoryFilter,
    !!priorityFilter,
  ].filter(Boolean).length

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="IDEA HUB"
          title="Idea Hub"
          subtitle="Capture, plan, and track all your ideas in one place"
        />

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary-500 text-black text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/ideas/board')}
            >
              <Kanban className="w-4 h-4 mr-1" />
              Board
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/ideas/settings')}
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Idea
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="all">All Active</option>
                  {IDEA_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Priorities</option>
                  {IDEA_PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority</option>
                  <option value="due_date">Due Date</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setCategoryFilter('')
                    setPriorityFilter('')
                  }}
                  className="mt-4"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Spinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No ideas yet</h3>
            <p className="text-neutral-400 mb-6">
              Start capturing your ideas, features, courses, and marketing plans.
            </p>
            <Button variant="primary" onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Idea
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map(project => {
              const statusInfo = getStatusInfo(project.status)
              const priorityInfo = getPriorityInfo(project.priority)
              const category = project.category

              return (
                <Card
                  key={project.id}
                  className="p-4 cursor-pointer hover:border-neutral-600 transition-colors"
                  onClick={() => router.push(`/admin/ideas/${project.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: priorityInfo.color }}
                      title={priorityInfo.label}
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {project.title}
                        </h3>
                        {category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: category.color + '20',
                              color: category.color,
                              border: `1px solid ${category.color}40`,
                            }}
                          >
                            {category.name}
                          </span>
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: statusInfo.color + '20',
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {project.description && (
                        <p className="text-xs text-neutral-400 truncate mb-1.5">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        {project.task_count > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {project.task_done_count}/{project.task_count}
                          </span>
                        )}
                        {project.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {project.tags?.map(tag => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Stack>

      {/* New Idea Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Idea"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Title *</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What's the idea?"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Description</label>
            <RecordingTextarea
              value={newDescription}
              onChange={(val) => setNewDescription(val)}
              placeholder="Describe the idea..."
              rows={3}
              recordingPurpose="quick"
              storageFolder="journal"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-300 block mb-1">Category</label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-300 block mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as IdeaPriority)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {IDEA_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Due Date</label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowNewModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
              disabled={!newTitle.trim()}
              className="flex-1"
            >
              Create Idea
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default function IdeasPage() {
  return (
    <AdminWrapper>
      <IdeasListContent />
    </AdminWrapper>
  )
}
