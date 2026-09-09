'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, Container, Stack, Text } from '@/lib/design-system/components'
import type {
  AdminWalkthroughItem,
  WalkthroughGroup,
  WalkthroughOverrides,
} from '@/lib/life-activation/walkthroughs'

type DraftStep = { title: string; body: string; snapshot: string }
type Draft = Record<string, Record<string, DraftStep>>

const GROUP_LABEL: Record<WalkthroughGroup, string> = {
  studio: 'Studios',
  other: 'Other',
  vision: 'Life Vision',
}

const GROUP_ORDER: WalkthroughGroup[] = ['studio', 'other', 'vision']

const inputClass =
  'w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14] transition-colors'
const textareaClass = `${inputClass} min-h-[96px] resize-y leading-relaxed`

function toDraft(items: AdminWalkthroughItem[]): Draft {
  const draft: Draft = {}
  for (const item of items) {
    draft[item.id] = {}
    for (const step of item.steps) {
      draft[item.id][step.id] = { title: step.title, body: step.body, snapshot: step.snapshot ?? '' }
    }
  }
  return draft
}

function toOverrides(items: AdminWalkthroughItem[], draft: Draft): WalkthroughOverrides {
  const overrides: WalkthroughOverrides = {}
  for (const item of items) {
    for (const step of item.steps) {
      const next = draft[item.id]?.[step.id]
      if (!next) continue
      const titleChanged = next.title !== step.defaultTitle
      const bodyChanged = next.body !== step.defaultBody
      const snapshotChanged = next.snapshot !== step.defaultSnapshot
      if (!titleChanged && !bodyChanged && !snapshotChanged) continue
      const bucket = overrides[item.id] ?? {}
      bucket[step.id] = {
        ...(titleChanged ? { title: next.title } : {}),
        ...(bodyChanged ? { body: next.body } : {}),
        ...(snapshotChanged ? { snapshot: next.snapshot } : {}),
      }
      overrides[item.id] = bucket
    }
  }
  return overrides
}

export default function AdminWalkthroughsPage() {
  const [items, setItems] = useState<AdminWalkthroughItem[]>([])
  const [draft, setDraft] = useState<Draft>({})
  const [sourceFile, setSourceFile] = useState('src/lib/life-activation/walkthroughs.ts')
  const [overridesFile, setOverridesFile] = useState('src/lib/life-activation/walkthrough-overrides.json')
  const [persistNote, setPersistNote] = useState('')
  const [inbox, setInbox] = useState<string[]>([])
  const [inboxDir, setInboxDir] = useState('public/walkthroughs/inbox')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<WalkthroughGroup | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/walkthroughs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load walk-throughs')
      setItems(data.walkthroughs || [])
      setDraft(toDraft(data.walkthroughs || []))
      setSourceFile(data.sourceFile || sourceFile)
      setOverridesFile(data.overridesFile || overridesFile)
      setPersistNote(data.persistNote || '')
      setInbox(data.inbox || [])
      setInboxDir(data.snapshotsInboxDir || inboxDir)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load walk-throughs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const dirty = useMemo(() => {
    if (items.length === 0) return false
    return JSON.stringify(toOverrides(items, draft)) !== JSON.stringify(toOverrides(items, toDraft(items)))
  }, [draft, items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (group !== 'all' && item.group !== group) return false
      if (!q) return true
      return (
        item.label.toLowerCase().includes(q) ||
        item.route.toLowerCase().includes(q) ||
        item.tabLabel.toLowerCase().includes(q) ||
        item.steps.some(
          (step) =>
            step.title.toLowerCase().includes(q) ||
            step.body.toLowerCase().includes(q) ||
            step.id.toLowerCase().includes(q),
        )
      )
    })
  }, [group, items, query])

  const updateStep = (walkthroughId: string, stepId: string, patch: Partial<DraftStep>) => {
    setDraft((prev) => ({
      ...prev,
      [walkthroughId]: {
        ...prev[walkthroughId],
        [stepId]: { ...prev[walkthroughId][stepId], ...patch },
      },
    }))
  }

  const uploadSnapshot = async (file: File, walkthroughId?: string, stepId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (walkthroughId && stepId) {
      form.append('walkthroughId', walkthroughId)
      form.append('stepId', stepId)
    }
    const res = await fetch('/api/admin/walkthroughs/snapshots', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to upload snapshot')
    if (walkthroughId && stepId && data.url) {
      updateStep(walkthroughId, stepId, { snapshot: data.url })
    }
    await load()
    toast.success(walkthroughId ? 'Snapshot attached to this step' : 'Snapshot saved to the inbox')
  }

  const resetTour = (item: AdminWalkthroughItem) => {
    setDraft((prev) => ({
      ...prev,
      [item.id]: Object.fromEntries(
        item.steps.map((step) => [step.id, { title: step.defaultTitle, body: step.defaultBody, snapshot: step.defaultSnapshot }]),
      ),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/walkthroughs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: toOverrides(items, draft) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setItems(data.walkthroughs || [])
      setDraft(toDraft(data.walkthroughs || []))
      toast.success('Walk-through copy saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Text className="text-xs uppercase tracking-wide text-neutral-500">Admin</Text>
            <h1 className="mt-1 text-2xl font-semibold text-white">Walkthroughs</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              One walk-through per studio, tab by tab. Edit title and body. Defaults live in{' '}
              <code className="text-neutral-200">{sourceFile}</code>. Your edits write{' '}
              <code className="text-neutral-200">{overridesFile}</code>.
            </p>
            {persistNote ? <p className="mt-2 max-w-2xl text-sm text-neutral-500">{persistNote}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading || !dirty}
            className="rounded-xl bg-[#39FF14] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-white">Snapshot inbox</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Versioning screens (and any state that is not always on the page) can be a picture.
            Drop files in <code className="text-neutral-200">{inboxDir}</code> or upload here.
            They stay unassigned until you attach them to a step below, or tell me the step id
            (for example <code className="text-neutral-200">studio-versions</code>).
          </p>
          <label className="mt-3 inline-flex cursor-pointer rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:border-[#39FF14]">
            Upload to inbox
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void uploadSnapshot(file).catch((error) => toast.error(error.message))
              }}
            />
          </label>
          {inbox.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {inbox.map((url) => (
                <div key={url} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin snapshot preview */}
                  <img src={url} alt="" className="h-24 w-full rounded-lg border border-neutral-800 object-cover" />
                  <p className="truncate text-[11px] text-neutral-500">{url}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">No unassigned snapshots yet.</p>
          )}
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, route, or step copy"
            className={`${inputClass} sm:max-w-sm`}
          />
          <div className="flex flex-wrap gap-2">
            {(['all', ...GROUP_ORDER] as const).map((id) => {
              const active = group === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGroup(id)}
                  className={
                    active
                      ? 'rounded-xl border-2 border-[#39FF14] bg-[#39FF14]/10 px-3 py-1.5 text-sm text-white'
                      : 'rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-3 py-1.5 text-sm text-neutral-300 hover:border-[#333]'
                  }
                >
                  {id === 'all' ? 'All' : GROUP_LABEL[id]}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading walk-throughs...</p>
        ) : (
          GROUP_ORDER.filter((id) => filtered.some((item) => item.group === id)).map((groupId) => (
            <Stack key={groupId} gap="md">
              <h2 className="text-lg font-semibold text-white">{GROUP_LABEL[groupId]}</h2>
              {filtered
                .filter((item) => item.group === groupId)
                .map((item) => {
                  const open = openId === item.id
                  const changed = item.steps.some((step) => {
                    const next = draft[item.id]?.[step.id]
                    return next && (next.title !== step.defaultTitle || next.body !== step.defaultBody || next.snapshot !== step.defaultSnapshot)
                  })
                  return (
                    <Card key={item.id} className="p-5">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : item.id)}
                        className="flex w-full items-start justify-between gap-4 text-left"
                      >
                        <div>
                          <h3 className="text-base font-semibold text-white">{item.label}</h3>
                          <p className="mt-1 text-sm text-neutral-400">{item.description}</p>
                          <p className="mt-2 text-xs text-neutral-500">
                            Route{' '}
                            <Link href={item.route} className="text-[#00FFFF] hover:underline">
                              {item.route}
                            </Link>
                            {' · '}
                            Tab {item.tabLabel}
                            {' · '}
                            {item.steps.length} steps
                            {changed ? ' · edited' : ''}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600">Source: {item.sourceFile}</p>
                        </div>
                        <span className="text-sm text-neutral-500">{open ? 'Hide' : 'Edit'}</span>
                      </button>

                      {open ? (
                        <div className="mt-5 space-y-5 border-t border-neutral-800 pt-5">
                          {item.steps.map((step, index) => {
                            const next = draft[item.id]?.[step.id] ?? { title: step.title, body: step.body, snapshot: step.snapshot ?? '' }
                            return (
                              <div key={step.id} className="space-y-2">
                                <div className="flex items-baseline justify-between gap-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Step {index + 1} · {step.id}
                                    {step.room ? ` · ${step.room}` : ''}
                                    {step.href ? ` · ${step.href}` : ''}
                                  </p>
                                  {next.title !== step.defaultTitle || next.body !== step.defaultBody || next.snapshot !== step.defaultSnapshot ? (
                                    <span className="text-[11px] text-[#00FFFF]">Override</span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-neutral-600">{step.target}</p>
                                <input
                                  value={next.title}
                                  onChange={(event) => updateStep(item.id, step.id, { title: event.target.value })}
                                  className={inputClass}
                                  aria-label={`${item.label} step ${index + 1} title`}
                                />
                                <textarea
                                  value={next.body}
                                  onChange={(event) => updateStep(item.id, step.id, { body: event.target.value })}
                                  className={textareaClass}
                                  aria-label={`${item.label} step ${index + 1} body`}
                                />
                                <div className="flex flex-wrap items-center gap-3">
                                  {next.snapshot ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- admin snapshot preview
                                    <img src={next.snapshot} alt="" className="h-16 w-24 rounded-lg border border-neutral-800 object-cover" />
                                  ) : (
                                    <span className="text-xs text-neutral-600">No snapshot yet</span>
                                  )}
                                  <label className="cursor-pointer text-sm text-[#00FFFF] hover:underline">
                                    Attach snapshot
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp,image/gif"
                                      className="sr-only"
                                      onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        event.target.value = ''
                                        if (file) {
                                          void uploadSnapshot(file, item.id, step.id).catch((error) =>
                                            toast.error(error.message),
                                          )
                                        }
                                      }}
                                    />
                                  </label>
                                  {next.snapshot ? (
                                    <button
                                      type="button"
                                      onClick={() => updateStep(item.id, step.id, { snapshot: '' })}
                                      className="text-sm text-neutral-400 hover:text-white"
                                    >
                                      Remove snapshot
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() => resetTour(item)}
                            className="text-sm text-neutral-400 underline-offset-2 hover:text-white hover:underline"
                          >
                            Reset this tour to defaults
                          </button>
                        </div>
                      ) : null}
                    </Card>
                  )
                })}
            </Stack>
          ))
        )}
      </Stack>
    </Container>
  )
}
