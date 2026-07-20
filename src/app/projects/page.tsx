'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Textarea, Stack, Spinner, Modal, HouseholdScopeToggle, type HouseholdScope } from '@/lib/design-system/components'
import { CategoryGrid, DatePicker } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  Search, Plus, Calendar, CheckCircle2, FolderKanban, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { getVisualColumn, getLifeCategoryInfo, type IdeaStatus } from '@/lib/projects/types'

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all_active', label: 'All Active' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_motion', label: 'In Motion' },
  { value: 'actualized', label: 'Complete' },
  { value: 'archived', label: 'Archived' },
]

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  category => category.key !== 'forward' && category.key !== 'conclusion'
)

function formatDueDateLabel(iso: string): string {
  if (!iso) return 'Pick a due date (optional)'
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatDateBlock(iso: string) {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
    monthStr: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

interface MemberProject {
  id: string
  title: string
  description: string | null
  life_categories: string[]
  status: string
  due_date: string | null
  created_at: string
  task_count: number
  task_done_count: number
  household_id?: string | null
  isMine?: boolean
  member?: { userId: string; displayName: string; avatarUrl: string | null; isSelf: boolean } | null
}

interface ProjectsHousehold {
  id: string
  name: string
  isMultiMember: boolean
  members: { userId: string; firstName?: string | null; displayName: string; avatarUrl: string | null; isSelf: boolean }[]
}

function ProjectsListContent() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [projects, setProjects] = useState<MemberProject[]>([])
  const [household, setHousehold] = useState<ProjectsHousehold | null>(null)
  const [scope, setScope] = useState<HouseholdScope>('me')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all_active')

  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newLifeCategories, setNewLifeCategories] = useState<string[]>([])
  const [newShareWithHousehold, setNewShareWithHousehold] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchStatus = filter === 'actualized' ? 'done' : filter === 'archived' ? 'archived' : 'active'

  const fetchProjects = useCallback(async () => {
    setLoadError(false)
    try {
      const params = new URLSearchParams()
      params.set('status', fetchStatus)
      if (search) params.set('search', search)
      if (scope !== 'me') params.set('scope', 'all')
      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
        setHousehold(data.household || null)
      } else {
        setLoadError(true)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus, search, scope])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => { fetchProjects() }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchProjects, search])

  const filteredProjects = projects.filter(project => {
    // Specific-member lens narrows the combined fetch client-side
    if (scope !== 'me' && scope !== 'all' && project.member?.userId !== scope) return false
    if (filter === 'all_active' || filter === 'actualized' || filter === 'archived') return true
    const col = getVisualColumn(project.status as any, project.task_done_count)
    return col === filter
  })

  const toggleNewLifeCategory = (key: string) => {
    setNewLifeCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const resetNewForm = () => {
    setNewTitle('')
    setNewDescription('')
    setNewDueDate('')
    setNewLifeCategories([])
    setNewShareWithHousehold(false)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          due_date: newDueDate || null,
          life_categories: newLifeCategories,
          shareWithHousehold: newShareWithHousehold,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Project created')
        setShowNewModal(false)
        resetNewForm()
        router.push(`/projects/${data.project.id}`)
      } else {
        toast.error('Failed to create')
      }
    } catch {
      toast.error('Failed to create')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="border-neutral-800 bg-neutral-900/50 pl-10"
            />
          </div>
          <div className="-order-1 flex shrink-0 items-center md:order-none md:justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowNewModal(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </div>
        </div>

        {/* Household lens */}
        {household?.isMultiMember && (
          <div className="flex items-center justify-center">
            <HouseholdScopeToggle
              members={(household.members || []).map((m) => ({
                userId: m.userId,
                displayName: m.firstName || m.displayName,
                avatarUrl: m.avatarUrl,
                isSelf: m.isSelf,
              }))}
              value={scope}
              onChange={setScope}
            />
          </div>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30'
                  : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:border-neutral-600 hover:text-neutral-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : loadError ? (
          <Card variant="glass" className="border border-white/[0.06] p-10 text-center shadow-none sm:p-12">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">We couldn&apos;t load your projects</h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-neutral-500">
              Something went wrong. Please try again.
            </p>
            <Button variant="primary" onClick={() => { setLoading(true); fetchProjects() }}>
              Try Again
            </Button>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card variant="glass" className="border border-white/[0.06] p-10 text-center shadow-none sm:p-12">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              Nothing here yet
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-neutral-500">
              Start a project to actualize the life you envision, organized by life category.
            </p>
            <Button variant="primary" onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] divide-y divide-white/[0.06]">
            {filteredProjects.map(project => {
              const taskPercent = project.task_count > 0
                ? Math.round((project.task_done_count / project.task_count) * 100)
                : 0
              const visualCol = getVisualColumn(project.status as IdeaStatus, project.task_done_count)
              const dateBlock = project.due_date ? formatDateBlock(project.due_date) : null
              const isComplete = project.status === 'done'
              const isArchived = project.status === 'archived'

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group block w-full touch-manipulation text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4">
                    {/* Due date block or icon placeholder */}
                    <div className="w-11 shrink-0 text-center">
                      {dateBlock ? (
                        <>
                          <p className="text-[10px] uppercase leading-none tracking-wider text-neutral-500">{dateBlock.weekday}</p>
                          <p className="text-xl font-semibold leading-tight text-white">{dateBlock.dayNum}</p>
                          <p className="text-[10px] uppercase leading-none tracking-wider text-neutral-500">{dateBlock.monthStr}</p>
                        </>
                      ) : (
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#39FF14]/10">
                          <FolderKanban className="h-5 w-5 text-[#39FF14]" aria-hidden />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-2">
                        <p className="min-w-0 break-words text-sm font-medium text-white">
                          {project.title}
                        </p>
                        {isComplete && (
                          <span className="shrink-0 rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00FF88]">
                            Complete
                          </span>
                        )}
                        {isArchived && (
                          <span className="shrink-0 rounded-full border border-neutral-600/50 bg-neutral-800/50 px-2 py-0.5 text-[11px] font-semibold text-neutral-400">
                            Archived
                          </span>
                        )}
                        {scope !== 'me' && project.member && !project.member.isSelf && (
                          <span className="shrink-0 rounded-full border border-[#00FFFF]/30 bg-[#00FFFF]/10 px-2 py-0.5 text-[11px] font-medium text-[#00FFFF]">
                            {project.member.displayName}
                          </span>
                        )}
                        {project.life_categories.slice(0, 2).map(key => {
                          const lc = getLifeCategoryInfo(key)
                          return (
                            <span
                              key={key}
                              className="shrink-0 rounded-full border border-neutral-600/50 bg-neutral-800/50 px-2 py-0.5 text-[11px] font-medium text-neutral-300"
                            >
                              {lc.label}
                            </span>
                          )
                        })}
                        {project.life_categories.length > 2 && (
                          <span className="shrink-0 text-[11px] text-neutral-500">
                            +{project.life_categories.length - 2}
                          </span>
                        )}
                      </div>

                      {project.description && (
                        <p className="mb-1.5 hidden line-clamp-1 text-[13px] leading-relaxed text-neutral-400 md:block">
                          {project.description}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {project.task_count > 0 ? (
                          <>
                            <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                              <CheckCircle2 className="h-3 w-3" />
                              {project.task_done_count} of {project.task_count} tasks
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-12 overflow-hidden rounded-full bg-neutral-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#39FF14] to-[#00FFFF] transition-all"
                                  style={{ width: `${taskPercent}%` }}
                                />
                              </div>
                              <span className="text-[11px] tabular-nums text-neutral-500">{taskPercent}%</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-neutral-500">No tasks yet</span>
                        )}
                        {!dateBlock && project.due_date === null && visualCol === 'not_started' && (
                          <span className="text-[11px] text-neutral-600">Not started</span>
                        )}
                        {visualCol === 'in_motion' && !isComplete && !isArchived && (
                          <span className="text-[11px] text-[#39FF14]">In motion</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-neutral-600 transition-colors group-hover:text-neutral-400"
                      aria-hidden
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Stack>

      {/* New Project Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Project"
        size="xl"
        className="!border !border-white/[0.06] bg-[#1F1F1F]/95 backdrop-blur-xl shadow-2xl"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowNewModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
              disabled={!newTitle.trim()}
              className="flex-1"
            >
              Create Project
            </Button>
          </div>
        }
      >
        <div className="max-h-[min(60vh,32rem)] space-y-5 overflow-y-auto pr-1 -mr-1">
          {/* Details */}
          <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What's the project?"
                className="border-neutral-800 bg-neutral-900/50"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Description
              </label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the project..."
                rows={3}
                className="!bg-neutral-900/50 !border-neutral-800 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Due Date
              </label>
              <DatePicker
                value={newDueDate}
                onChange={setNewDueDate}
                popoverAlign="end"
                customTrigger={
                  <div className="group flex w-full items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2.5 transition-colors hover:border-neutral-600">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                      <Calendar className="h-4 w-4 text-neutral-400" aria-hidden />
                    </div>
                    <span className={`min-w-0 flex-1 truncate text-left text-sm ${newDueDate ? 'text-white' : 'text-neutral-500'}`}>
                      {formatDueDateLabel(newDueDate)}
                    </span>
                    {newDueDate ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewDueDate('')
                        }}
                        className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-300"
                      >
                        Clear
                      </button>
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                        aria-hidden
                      />
                    )}
                  </div>
                }
              />
            </div>
          </div>

          {/* Household sharing */}
          {household?.isMultiMember && (
            <button
              type="button"
              onClick={() => setNewShareWithHousehold(prev => !prev)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                newShareWithHousehold
                  ? 'border-[#00FFFF]/40 bg-[#00FFFF]/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-neutral-600'
              }`}
            >
              <span className="text-sm font-medium text-white">Share with {household.name}</span>
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  newShareWithHousehold ? 'bg-[#00FFFF]' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    newShareWithHousehold ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          )}

          {/* Life categories */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <CategoryGrid
              title="Life Categories"
              categories={LIFE_CATEGORIES}
              selectedCategories={newLifeCategories}
              onCategoryClick={toggleNewLifeCategory}
              pillLabel="Life Categories"
              lifeVisionCategoryStrip
              desktopColumnCount={6}
              bleedClassName="max-md:-mx-4"
            />
            <p className="mt-2 text-center text-xs text-neutral-500">
              Optional — tag this project with life areas
            </p>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <Container size="xl">
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      }
    >
      <ProjectsListContent />
    </Suspense>
  )
}
