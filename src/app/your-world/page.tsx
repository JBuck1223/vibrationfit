'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, GitCompare, History, Pencil, X } from 'lucide-react'
import { Badge, Button, Container, Input, PageHero, Select, Spinner, Stack } from '@/lib/design-system/components'
import { YourWorldEditor } from '@/components/your-world/YourWorldEditor'
import { useYourWorld } from '@/hooks/useYourWorld'
import { changedFieldPaths, diffSnapshots, normalizeSnapshot } from '@/lib/your-world/snapshot'
import type { WorldVersion, YourWorldSnapshot } from '@/lib/your-world/types'

function versionLabel(v: WorldVersion) {
  const date = new Date(v.committed_at || v.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `Version ${v.version_number} · ${date}${v.is_active ? ' · Active' : ''}`
}

export default function YourWorldPage() {
  const { data, isLoading, startDraft, saveDraft, discardDraft, commitDraft, activate } = useYourWorld()
  const [draftValue, setDraftValue] = useState<YourWorldSnapshot | null>(null)
  const [notes, setNotes] = useState('')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [compare, setCompare] = useState<{ a: string; b: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)

  const draft = data?.draft ?? null
  const active = data?.active ?? null
  const saved = useMemo(() => (data?.versions || []).filter((v) => !v.is_draft), [data?.versions])

  useEffect(() => {
    if (draft && !draftValue) setDraftValue(normalizeSnapshot(draft.snapshot))
    if (!draft) setDraftValue(null)
  }, [draft, draftValue])

  const changed = useMemo(() => {
    if (!draftValue) return new Set<string>()
    return changedFieldPaths(active?.snapshot ?? null, draftValue)
  }, [active?.snapshot, draftValue])

  if (isLoading || !data) {
    return (
      <Container size="xl">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const onDraftChange = (next: YourWorldSnapshot) => {
    setDraftValue(next)
    if (!draft) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveDraft.mutate({ id: draft.id, snapshot: next })
    }, 800)
  }

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const onCommit = () =>
    run(async () => {
      if (!draft || !draftValue) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      await saveDraft.mutateAsync({ id: draft.id, snapshot: draftValue })
      await commitDraft.mutateAsync({ id: draft.id, notes })
      setNotes('')
      setDraftValue(null)
    })

  const onDiscard = () =>
    run(async () => {
      if (!draft) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      await discardDraft.mutateAsync(draft.id)
      setDraftValue(null)
    })

  const viewing = saved.find((v) => v.id === viewingId) ?? active
  const shownSnapshot = normalizeSnapshot(viewing?.snapshot ?? data.seed)
  const compareA = compare ? saved.find((v) => v.id === compare.a) : null
  const compareB = compare ? saved.find((v) => v.id === compare.b) : null
  const compareChanges = compareA && compareB ? diffSnapshots(compareA.snapshot, compareB.snapshot) : []
  const versionOptions = saved.map((v) => ({ value: v.id, label: versionLabel(v) }))

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Your World"
          subtitle="Your people, home, work, and money. VIVA uses these details everywhere."
        >
          {!draft && (
            <Button size="sm" variant="primary" onClick={() => run(() => startDraft.mutateAsync())} disabled={startDraft.isPending}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Update
            </Button>
          )}
        </PageHero>

        {error && <p className="text-sm text-contrast-400">{error}</p>}

        {draft && draftValue ? (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#FFFF00]/30 bg-[#FFFF00]/5 p-4">
              <Badge variant="warning">Draft</Badge>
              <p className="text-sm text-neutral-300">
                {changed.size === 0
                  ? 'No changes yet. Edit anything below.'
                  : `${changed.size} change${changed.size === 1 ? '' : 's'}, highlighted below.`}
                {saveDraft.isPending ? ' Saving...' : ''}
              </p>
            </div>
            <YourWorldEditor value={draftValue} onChange={onDraftChange} firstName={data.firstName} changed={changed} />
            <div className="space-y-3 rounded-2xl border border-white/[0.06] p-4">
              <Input
                label="What changed? (optional)"
                value={notes}
                placeholder="Moved to Denver, new job"
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="ghost" onClick={onDiscard} disabled={discardDraft.isPending}>
                  <X className="mr-1.5 h-4 w-4" />
                  Discard draft
                </Button>
                <Button variant="primary" onClick={onCommit} disabled={commitDraft.isPending || changed.size === 0}>
                  <Check className="mr-1.5 h-4 w-4" />
                  Commit as new version
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {saved.length > 0 && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[260px] flex-1">
                  <Select
                    label="Version"
                    options={versionOptions}
                    value={viewing?.id || ''}
                    onChange={(id: string) => setViewingId(id)}
                  />
                </div>
                {viewing && !viewing.is_active && (
                  <Button variant="secondary" onClick={() => run(() => activate.mutateAsync(viewing.id))} disabled={activate.isPending}>
                    <History className="mr-1.5 h-4 w-4" />
                    Make this active
                  </Button>
                )}
                {saved.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCompare(compare ? null : { a: saved[1].id, b: saved[0].id })
                    }
                  >
                    <GitCompare className="mr-1.5 h-4 w-4" />
                    {compare ? 'Close compare' : 'Compare'}
                  </Button>
                )}
              </div>
            )}
            {viewing?.version_notes && <p className="text-sm text-neutral-400">{viewing.version_notes}</p>}

            {compare && (
              <div className="space-y-4 rounded-2xl border border-white/[0.06] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="From" options={versionOptions} value={compare.a} onChange={(a: string) => setCompare({ ...compare, a })} />
                  <Select label="To" options={versionOptions} value={compare.b} onChange={(b: string) => setCompare({ ...compare, b })} />
                </div>
                {compareChanges.length === 0 ? (
                  <p className="text-sm text-neutral-400">These versions are the same.</p>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {compareChanges.map((c) => (
                      <div key={c.path} className="grid gap-1 py-2 text-sm md:grid-cols-[200px_1fr_1fr] md:gap-4">
                        <span className="font-medium text-white">{c.label}</span>
                        <span className="text-neutral-500 line-through">{c.before || 'Not set'}</span>
                        <span className="text-[#39FF14]">{c.after || 'Not set'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!active && saved.length === 0 && (
              <p className="text-sm text-neutral-400">Nothing saved yet. Click Update to add your details.</p>
            )}
            <YourWorldEditor value={shownSnapshot} onChange={() => {}} firstName={data.firstName} readOnly />
          </>
        )}
      </Stack>
    </Container>
  )
}
