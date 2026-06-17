'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Card, Button, Input, Stack, Spinner, Modal } from '@/lib/design-system/components'
import { CategoryGrid, DatePicker } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ProjectsAreaBar } from '@/components/projects-studio'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  Search, Plus, Calendar, CheckCircle2,
  Filter, X, FolderKanban, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  IdeaProjectWithRelations,
  IdeaCategory,
  IdeaTag,
  IdeaPriority,
  IdeaItemType,
} from '@/lib/ideas/types'
import {
  IDEA_STATUSES, IDEA_PRIORITIES, LIFE_CATEGORY_OPTIONS,
  getStatusInfo, getPriorityInfo, getLifeCategoryInfo,
} from '@/lib/ideas/types'

type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date' | 'updated'
type TypeTab = 'all' | 'project' | 'list'

const TYPE_TABS: { value: TypeTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'project', label: 'Projects' },
  { value: 'list', label: 'Lists' },
]

// Life categories for the CategoryGrid (excludes the forward/conclusion meta categories)
const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  category => category.key !== 'forward' && category.key !== 'conclusion'
)

function ProjectsListContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as TypeTab) || 'all'

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<IdeaProjectWithRelations[]>([])
  const [categories, setCategories] = useState<IdeaCategory[]>([])
  const [, setTags] = useState<IdeaTag[]>([])

  const [typeTab, setTypeTab] = useState<TypeTab>(['all', 'project', 'list'].includes(initialType) ? initialType : 'all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [lifeCategoryFilter, setLifeCategoryFilter] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const [showNewModal, setShowNewModal] = useState(false)
  const [newType, setNewType] = useState<IdeaItemType>('project')
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newPriority, setNewPriority] = useState<IdeaPriority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newLifeCategories, setNewLifeCategories] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (lifeCategoryFilter) params.set('life_category', lifeCategoryFilter)
      if (typeTab !== 'all') params.set('type', typeTab)
      if (search) params.set('search', search)
      params.set('sort', sort)

      const res = await fetch(`/api/admin/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, priorityFilter, lifeCategoryFilter, typeTab, search, sort])

  const fetchMeta = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([
      fetch('/api/admin/projects/categories'),
      fetch('/api/admin/projects/tags'),
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

  const openNewModal = (type: IdeaItemType) => {
    setNewType(type)
    setShowNewModal(true)
  }

  const toggleNewLifeCategory = (key: string) => {
    setNewLifeCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const resetNewForm = () => {
    setNewTitle('')
    setNewDescription('')
    setNewCategoryId('')
    setNewPriority('medium')
    setNewDueDate('')
    setNewLifeCategories([])
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          description: newType === 'project' ? (newDescription || null) : null,
          category_id: newType === 'project' ? (newCategoryId || null) : null,
          priority: newType === 'project' ? newPriority : 'medium',
          due_date: newDueDate || null,
          life_categories: newLifeCategories,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(newType === 'list' ? 'List created' : 'Project created')
        setShowNewModal(false)
        resetNewForm()
        router.push(`/admin/projects/${data.project.id}`)
      } else {
        toast.error('Failed to create')
      }
    } catch {
      toast.error('Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const activeFilterCount = [
    statusFilter !== 'all',
    !!categoryFilter,
    !!priorityFilter,
    !!lifeCategoryFilter,
  ].filter(Boolean).length

  const isListsView = typeTab === 'list'

  return (
    <Container size="xl">
      <Stack gap="lg">
        <ProjectsAreaBar contextText="Plan and track projects, and keep simple checklists organized by life category" />

        {/* Type Tabs */}
        <div className="flex items-center gap-1 border-b border-neutral-800">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setTypeTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                typeTab === tab.value
                  ? 'text-white border-primary-500'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isListsView ? 'Search lists...' : 'Search projects...'}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex-1 sm:flex-none"
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
              onClick={() => openNewModal('list')}
              className="flex-1 sm:flex-none"
            >
              <ListChecks className="w-4 h-4 mr-1" />
              New List
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openNewModal('project')}
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Project
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
                <label className="text-xs text-neutral-400 block mb-1">Life Category</label>
                <select
                  value={lifeCategoryFilter}
                  onChange={(e) => setLifeCategoryFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Life Categories</option>
                  {LIFE_CATEGORY_OPTIONS.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
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
                    setLifeCategoryFilter('')
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
            {isListsView ? (
              <ListChecks className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            ) : (
              <FolderKanban className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-white mb-2">
              {isListsView ? 'No lists yet' : 'Nothing here yet'}
            </h3>
            <p className="text-neutral-400 mb-6">
              {isListsView
                ? 'Create a simple checklist and tag it with life categories.'
                : 'Start planning projects and keep simple checklists, all tagged by life category.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" onClick={() => openNewModal('list')}>
                <ListChecks className="w-4 h-4 mr-1" />
                New List
              </Button>
              <Button variant="primary" onClick={() => openNewModal('project')}>
                <Plus className="w-4 h-4 mr-1" />
                New Project
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map(project => {
              const statusInfo = getStatusInfo(project.status)
              const priorityInfo = getPriorityInfo(project.priority)
              const category = project.category
              const isList = project.type === 'list'

              return (
                <Card
                  key={project.id}
                  className="p-4 cursor-pointer hover:border-neutral-600 transition-colors"
                  onClick={() => router.push(`/admin/projects/${project.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className="mt-0.5 flex-shrink-0" title={isList ? 'List' : 'Project'}>
                      {isList ? (
                        <ListChecks className="w-4 h-4 text-secondary-400" />
                      ) : (
                        <FolderKanban className="w-4 h-4 text-primary-400" />
                      )}
                    </div>

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
                        {!isList && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: statusInfo.color + '20',
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        )}
                      </div>

                      {project.description && (
                        <p className="text-xs text-neutral-400 truncate mb-1.5">
                          {project.description}
                        </p>
                      )}

                      {/* Life category chips */}
                      {project.life_categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {project.life_categories.map(key => {
                            const lc = getLifeCategoryInfo(key)
                            return (
                              <span
                                key={key}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: lc.color + '20',
                                  color: lc.color,
                                  border: `1px solid ${lc.color}40`,
                                }}
                              >
                                {lc.label}
                              </span>
                            )
                          })}
                        </div>
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

      {/* New Item Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={newType === 'list' ? 'New List' : 'New Project'}
        size="md"
      >
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewType('project')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors ${
                newType === 'project'
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Project
            </button>
            <button
              type="button"
              onClick={() => setNewType('list')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors ${
                newType === 'list'
                  ? 'border-secondary-500 bg-secondary-500/10 text-white'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              List
            </button>
          </div>

          <div>
            <label className="text-sm text-neutral-300 block mb-1">Title *</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={newType === 'list' ? 'Name your list...' : "What's the project?"}
              autoFocus
            />
          </div>

          {newType === 'project' && (
            <>
              <div>
                <label className="text-sm text-neutral-300 block mb-1">Description</label>
                <RecordingTextarea
                  value={newDescription}
                  onChange={(val) => setNewDescription(val)}
                  placeholder="Describe the project..."
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
            </>
          )}

          {/* Life Categories (both types) */}
          <CategoryGrid
            title="Life Categories"
            categories={LIFE_CATEGORIES}
            selectedCategories={newLifeCategories}
            onCategoryClick={toggleNewLifeCategory}
            pillLabel="Life Categories"
            lifeVisionCategoryStrip
            desktopColumnCount={6}
          />

          <div>
            <label className="text-sm text-neutral-300 block mb-1">Due Date</label>
            <DatePicker
              value={newDueDate}
              onChange={setNewDueDate}
              popoverAlign="end"
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
              {newType === 'list' ? 'Create List' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default function ProjectsPage() {
  return (
    <AdminWrapper>
      <ProjectsListContent />
    </AdminWrapper>
  )
}
