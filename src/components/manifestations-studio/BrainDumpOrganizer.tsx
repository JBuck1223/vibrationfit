'use client'

import { useState } from 'react'
import { Button, Checkbox } from '@/lib/design-system'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Check, ListChecks, RefreshCw, Sparkles, X } from 'lucide-react'

interface OrganizedGroup {
  title: string
  tasks: string[]
}

interface MergeIntoExisting {
  existing_project_id: string
  existing_project_title?: string
  tasks_to_add: string[]
}

interface OrganizedResult {
  groups: OrganizedGroup[]
  merge_into_existing: MergeIntoExisting[]
  unassigned: string[]
}

interface BrainDumpOrganizerProps {
  manifestationId: string
  onApplied: () => void
  onClose: () => void
}

/**
 * Brain dump → inspired action. The member dumps everything in their head
 * about this manifestation; VIVA organizes it into action groups with steps.
 */
export function BrainDumpOrganizer({ manifestationId, onApplied, onClose }: BrainDumpOrganizerProps) {
  const [brainDump, setBrainDump] = useState('')
  const [organizing, setOrganizing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<OrganizedResult | null>(null)
  const [enabledGroups, setEnabledGroups] = useState<Set<number>>(new Set())
  const [enabledMerges, setEnabledMerges] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const organize = async () => {
    if (!brainDump.trim() || organizing) return
    setOrganizing(true)
    setError(null)
    try {
      const res = await fetch(`/api/manifestations/${manifestationId}/organize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainDump }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'VIVA could not organize that yet.')
      const organized: OrganizedResult = data.organized
      setResult(organized)
      setEnabledGroups(new Set(organized.groups.map((_, i) => i)))
      setEnabledMerges(new Set(organized.merge_into_existing.map((_, i) => i)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VIVA could not organize that yet.')
    } finally {
      setOrganizing(false)
    }
  }

  const apply = async () => {
    if (!result || applying) return
    setApplying(true)
    setError(null)
    try {
      const res = await fetch(`/api/manifestations/${manifestationId}/organize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          groups: result.groups.filter((_, i) => enabledGroups.has(i)),
          merge_into_existing: result.merge_into_existing.filter((_, i) => enabledMerges.has(i)),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add the action steps.')
      }
      onApplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add the action steps.')
    } finally {
      setApplying(false)
    }
  }

  const toggleGroup = (index: number) => {
    setEnabledGroups(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleMerge = (index: number) => {
    setEnabledMerges(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectedCount = enabledGroups.size + enabledMerges.size

  return (
    <div className="rounded-2xl border border-[#BF00FF]/25 bg-[#BF00FF]/[0.05] p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Brain dump</p>
          <p className="text-xs text-neutral-400">Dump everything in your head about this manifestation — type or speak it. VIVA organizes it into action groups with steps.</p>
        </div>
        <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!result ? (
        <>
          <RecordingTextarea
            value={brainDump}
            onChange={setBrainDump}
            placeholder="e.g. need to price out the studio build, call Marcus about the loan, clear the garage, look up permits, book that Nashville trip to see the setup Dave has…"
            rows={5}
            storageFolder="visionBoard"
            recordingPurpose="quick"
            category="manifestation-brain-dump"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={organize}
              disabled={organizing || !brainDump.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#BF00FF] px-5 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {organizing
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              {organizing ? 'Organizing…' : 'Organize with VIVA'}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {result.groups.length === 0 && result.merge_into_existing.length === 0 ? (
            <p className="text-sm text-neutral-400">VIVA could not find actionable steps in that dump. Try adding more specifics.</p>
          ) : (
            <>
              {result.groups.map((group, index) => (
                <div
                  key={`group-${index}`}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    enabledGroups.has(index) ? 'border-[#39FF14]/40 bg-[#161616]' : 'border-[#282828] bg-[#141414] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={enabledGroups.has(index)}
                      onChange={() => toggleGroup(index)}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <ListChecks className="w-4 h-4 text-[#39FF14] shrink-0" />
                      <p className="text-sm font-medium text-white truncate">{group.title}</p>
                      <span className="text-[11px] text-neutral-500 shrink-0">New group</span>
                    </div>
                  </div>
                  <ul className="mt-2 ml-9 space-y-1">
                    {group.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {result.merge_into_existing.map((merge, index) => (
                <div
                  key={`merge-${index}`}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    enabledMerges.has(index) ? 'border-[#00FFFF]/40 bg-[#161616]' : 'border-[#282828] bg-[#141414] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={enabledMerges.has(index)}
                      onChange={() => toggleMerge(index)}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <ListChecks className="w-4 h-4 text-[#00FFFF] shrink-0" />
                      <p className="text-sm font-medium text-white truncate">{merge.existing_project_title || 'Existing group'}</p>
                      <span className="text-[11px] text-neutral-500 shrink-0">Add to existing</span>
                    </div>
                  </div>
                  <ul className="mt-2 ml-9 space-y-1">
                    {merge.tasks_to_add.map((task, taskIndex) => (
                      <li key={taskIndex} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}

          {result.unassigned.length > 0 && (
            <div className="rounded-xl border border-[#282828] bg-[#141414] p-3.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1.5">Left aside (too vague to act on yet)</p>
              <ul className="space-y-1">
                {result.unassigned.map((item, index) => (
                  <li key={index} className="text-sm text-neutral-500">{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setResult(null)} disabled={applying}>
              Back to dump
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={apply}
              loading={applying}
              disabled={applying || selectedCount === 0}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Add {selectedCount > 0 ? `${selectedCount} ` : ''}to Inspired Action
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[#FF0040]">{error}</p>}
    </div>
  )
}
