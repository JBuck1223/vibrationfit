'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Stack, Spinner } from '@/lib/design-system/components'
import { VIVALoadingOverlay } from '@/lib/design-system/components/overlays'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, Check, ChevronDown, ChevronRight, FolderKanban, Plus, ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { getLifeCategoryInfo } from '@/lib/projects/types'

interface OrganizedProject {
  title: string
  life_categories: string[]
  tasks: string[]
}

interface MergeIntoExisting {
  existing_project_id: string
  existing_project_title: string
  tasks_to_add: string[]
}

interface OrganizeResult {
  projects: OrganizedProject[]
  merge_into_existing: MergeIntoExisting[]
  unassigned: string[]
}

export default function ProjectOrganizePage() {
  const router = useRouter()
  const [brainDump, setBrainDump] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<OrganizeResult | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set())
  const [selectedMerges, setSelectedMerges] = useState<Set<number>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())
  const [applying, setApplying] = useState(false)

  const handleOrganize = async () => {
    if (!brainDump.trim()) {
      toast.error('Write or speak something first')
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/projects/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainDump }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to organize')
      }

      const data = await res.json()
      const organized = data.organized as OrganizeResult

      setResult(organized)
      // Select all by default
      setSelectedProjects(new Set(organized.projects.map((_, i) => i)))
      setSelectedMerges(new Set(organized.merge_into_existing.map((_, i) => i)))
      setExpandedProjects(new Set(organized.projects.map((_, i) => i)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to organize')
    } finally {
      setGenerating(false)
    }
  }

  const handleApply = async () => {
    if (!result) return

    const projectsToCreate = result.projects.filter((_, i) => selectedProjects.has(i))
    const mergesToApply = result.merge_into_existing.filter(
      (m, i) => selectedMerges.has(i) && m.tasks_to_add.length > 0
    )

    if (projectsToCreate.length === 0 && mergesToApply.length === 0) {
      toast.error('Select at least one project or merge to apply')
      return
    }

    setApplying(true)
    try {
      const res = await fetch('/api/projects/organize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projectsToCreate,
          merge_into_existing: mergesToApply.map(m => ({
            existing_project_id: m.existing_project_id,
            tasks_to_add: m.tasks_to_add,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create projects')
      }

      const data = await res.json()
      const total = (data.totalProjectsCreated || 0) + (data.totalTasksMerged > 0 ? 1 : 0)
      toast.success(`Created ${data.totalProjectsCreated} project${data.totalProjectsCreated !== 1 ? 's' : ''}${data.totalTasksMerged > 0 ? ` and merged ${data.totalTasksMerged} tasks` : ''}`)
      router.push('/projects')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const toggleProject = (idx: number) => {
    setSelectedProjects(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleMerge = (idx: number) => {
    setSelectedMerges(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleExpanded = (idx: number) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const removeProjectTask = (projIdx: number, taskIdx: number) => {
    setResult(prev => {
      if (!prev) return prev
      const projects = prev.projects.map((p, i) =>
        i === projIdx ? { ...p, tasks: p.tasks.filter((_, ti) => ti !== taskIdx) } : p
      )
      return { ...prev, projects }
    })
  }

  const removeMergeTask = (mergeIdx: number, taskIdx: number) => {
    setResult(prev => {
      if (!prev) return prev
      const merges = prev.merge_into_existing.map((m, i) =>
        i === mergeIdx ? { ...m, tasks_to_add: m.tasks_to_add.filter((_, ti) => ti !== taskIdx) } : m
      )
      return { ...prev, merge_into_existing: merges }
    })
  }

  const totalSelected = selectedProjects.size + selectedMerges.size

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      {generating && (
        <VIVALoadingOverlay isVisible={generating} messages={["VIVA is organizing your thoughts..."]} />
      )}

      <Stack gap="lg">
        {/* Brain dump input */}
        {!result && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-white">Brain Dump</h2>
              <p className="w-full text-sm text-neutral-400">
                Dump everything on your mind — tasks, ideas, obligations, random thoughts, what&apos;s keeping you up at night. VIVA uses all context she has to help you organize everything into meaningful projects.
              </p>
            </div>

            <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828] [&_textarea]:!min-h-[200px]">
              <RecordingTextarea
                value={brainDump}
                onChange={setBrainDump}
                placeholder="Dump everything on your mind... or tap the mic to speak it out."
                rows={8}
                recordingPurpose="quick"
                instanceId="project-organize-braindump"
              />
            </div>

            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOrganize}
                disabled={!brainDump.trim() || generating}
                loading={generating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Organize with VIVA
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  VIVA suggests {result.projects.length} project{result.projects.length !== 1 ? 's' : ''}
                  {result.merge_into_existing.length > 0 && ` + ${result.merge_into_existing.length} merge${result.merge_into_existing.length !== 1 ? 's' : ''}`}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Select which to create, then apply.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResult(null)
                    setSelectedProjects(new Set())
                    setSelectedMerges(new Set())
                  }}
                >
                  Start Over
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  disabled={totalSelected === 0 || applying}
                  loading={applying}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create {totalSelected} Selected
                </Button>
              </div>
            </div>

            {/* New projects */}
            {result.projects.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  New Projects
                </p>
                {result.projects.map((proj, idx) => {
                  const isSelected = selectedProjects.has(idx)
                  const isExpanded = expandedProjects.has(idx)
                  return (
                    <Card
                      key={idx}
                      variant="glass"
                      className={`border p-0 shadow-none transition-colors ${
                        isSelected ? 'border-[#39FF14]/30' : 'border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleProject(idx)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? 'border-[#39FF14] bg-[#39FF14]/20'
                              : 'border-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-[#39FF14]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(idx)}
                            className="flex w-full items-center gap-2 text-left"
                          >
                            <FolderKanban className="h-4 w-4 shrink-0 text-[#39FF14]" />
                            <span className="text-sm font-semibold text-white truncate">
                              {proj.title}
                            </span>
                            <span className="text-xs text-neutral-500 shrink-0">
                              {proj.tasks.length} task{proj.tasks.length !== 1 ? 's' : ''}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 ml-auto shrink-0 text-neutral-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-auto shrink-0 text-neutral-500" />
                            )}
                          </button>

                          {proj.life_categories.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {proj.life_categories.map(key => {
                                const lc = getLifeCategoryInfo(key)
                                return (
                                  <span
                                    key={key}
                                    className="rounded-full border border-neutral-700 bg-neutral-800/50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400"
                                  >
                                    {lc.label}
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          {isExpanded && (
                            <ul className="mt-3 space-y-1.5 border-t border-white/[0.04] pt-3">
                              {proj.tasks.map((task, ti) => (
                                <li key={ti} className="group flex items-start gap-2 text-sm text-neutral-300">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
                                  <span className="min-w-0 flex-1">{task}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeProjectTask(idx, ti)}
                                    className="shrink-0 rounded p-0.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                                    title="Remove task"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Merge into existing */}
            {result.merge_into_existing.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Merge Into Existing Projects
                </p>
                {result.merge_into_existing.map((merge, idx) => {
                  const isSelected = selectedMerges.has(idx)
                  return (
                    <Card
                      key={idx}
                      variant="glass"
                      className={`border p-3.5 shadow-none transition-colors ${
                        isSelected ? 'border-[#00FFFF]/30' : 'border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleMerge(idx)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? 'border-[#00FFFF] bg-[#00FFFF]/20'
                              : 'border-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-[#00FFFF]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3.5 w-3.5 text-[#00FFFF]" />
                            <span className="text-sm font-medium text-white">
                              {merge.existing_project_title}
                            </span>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {merge.tasks_to_add.map((task, ti) => (
                              <li key={ti} className="group flex items-start gap-2 text-sm text-neutral-400">
                                <Plus className="mt-0.5 h-3 w-3 shrink-0 text-[#00FFFF]/60" />
                                <span className="min-w-0 flex-1">{task}</span>
                                <button
                                  type="button"
                                  onClick={() => removeMergeTask(idx, ti)}
                                  className="shrink-0 rounded p-0.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                                  title="Remove task"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Unassigned */}
            {result.unassigned.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Unassigned Items
                </p>
                <Card variant="glass" className="border border-white/[0.06] p-3.5 shadow-none">
                  <p className="text-xs text-neutral-500 mb-2">
                    These items didn't fit into a clear project. You can add them manually later.
                  </p>
                  <ul className="space-y-1.5">
                    {result.unassigned.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* Bottom action bar */}
            <div className="sticky bottom-4 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleApply}
                disabled={totalSelected === 0 || applying}
                loading={applying}
                className="shadow-lg shadow-[#39FF14]/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create {totalSelected} Selected
              </Button>
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}
