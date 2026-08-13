'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { ensureJpegCompatible, fileToDataUrl } from '@/lib/life-explorer/ensure-jpeg'
import type { LeWonderItem, WonderKind } from '@/lib/life-explorer/types'

interface ProposedSticky {
  statement: string
  kind: WonderKind
  confidence: 'high' | 'medium' | 'low'
  cleaned?: string | null
  /** client-side review state */
  include: boolean
}

interface WallSnapshot {
  id: string
  photo_url: string | null
  captured_on: string | null
  created_at: string
}

const BOARDS: Array<{
  kind: WonderKind
  title: string
  hint: string
  note: string
  accent: string
}> = [
  {
    kind: 'know',
    title: 'What I Know',
    hint: 'Exact words — even if wrong. That’s how we measure discovery.',
    note: 'bg-[#d9f7c5] text-[#173312]',
    accent: 'text-[#39FF14]',
  },
  {
    kind: 'wonder',
    title: 'What I Wonder',
    hint: 'Questions with energy behind them become tomorrow’s lessons.',
    note: 'bg-[#fdf3b4] text-[#3a3208]',
    accent: 'text-amber-300',
  },
  {
    kind: 'learned',
    title: 'What I Learned',
    hint: 'Wonders that got answered migrate here.',
    note: 'bg-[#c5f0f7] text-[#0d2b31]',
    accent: 'text-[#00FFFF]',
  },
]

export default function WonderWallPage() {
  const [expeditionId, setExpeditionId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [wall, setWall] = useState<{
    know: LeWonderItem[]
    wonder: LeWonderItem[]
    learned: LeWonderItem[]
  }>({ know: [], wonder: [], learned: [] })
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<WonderKind, string>>({
    know: '',
    wonder: '',
    learned: '',
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [dragging, setDragging] = useState<{ id: string; kind: WonderKind } | null>(null)

  // Snap-the-wall state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [snapBusy, setSnapBusy] = useState<'converting' | 'uploading' | 'reading' | 'saving' | null>(
    null
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [proposals, setProposals] = useState<ProposedSticky[] | null>(null)
  const [snapshots, setSnapshots] = useState<WallSnapshot[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const load = useCallback(async () => {
    try {
      const today = await fetch('/api/life-explorer/lessons/today').then((r) => r.json())
      if (!today.expedition?.id) {
        setExpeditionId(null)
        setWall({ know: [], wonder: [], learned: [] })
        return
      }
      setExpeditionId(today.expedition.id)
      setStudentId(today.student?.id || null)
      const [wallRes, snapsRes] = await Promise.all([
        fetch(`/api/life-explorer/wonder?expedition_id=${today.expedition.id}`),
        fetch(
          `/api/life-explorer/evidence?expedition_id=${today.expedition.id}&type=photo&title_prefix=${encodeURIComponent('Wonder Wall')}`
        ),
      ])
      const json = await wallRes.json()
      if (!wallRes.ok) throw new Error(json.error || 'Failed to load')
      setWall(json.wonder_wall)
      const snapsJson = await snapsRes.json()
      if (snapsRes.ok) {
        setSnapshots(
          ((snapsJson.evidence || []) as WallSnapshot[]).filter((s) => s.photo_url)
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addItem(kind: WonderKind) {
    const statement = drafts[kind].trim()
    if (!expeditionId || !statement) return
    setSaving(kind)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/wonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedition_id: expeditionId,
          kind,
          statement,
          interest_level: kind === 'wonder' ? 4 : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setDrafts((d) => ({ ...d, [kind]: '' }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  async function saveEdit() {
    if (!editing || !editing.text.trim()) return
    setSaving('edit')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/wonder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, statement: editing.text.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm('Remove this sticky from the wall?')) return
    setSaving('delete')
    setError(null)
    try {
      const res = await fetch(`/api/life-explorer/wonder?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to remove')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setSaving(null)
    }
  }

  /** Persist the current order of one or more columns (optimistic UI first). */
  async function persistOrder(next: typeof wall, kinds: WonderKind[]) {
    setWall(next)
    const reorder = kinds.flatMap((kind) =>
      next[kind].map((item, i) => ({ id: item.id, sort_order: i, kind }))
    )
    try {
      const res = await fetch('/api/life-explorer/wonder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to save order')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order')
      await load()
    }
  }

  /** Move a sticky within its column, or into another column at a position. */
  function moveSticky(id: string, fromKind: WonderKind, toKind: WonderKind, toIndex: number) {
    const item = wall[fromKind].find((i) => i.id === id)
    if (!item) return
    const next = { ...wall, [fromKind]: wall[fromKind].filter((i) => i.id !== id) }
    const target = fromKind === toKind ? next[toKind] : [...next[toKind]]
    const clamped = Math.max(0, Math.min(toIndex, target.length))
    next[toKind] = [...target.slice(0, clamped), { ...item, kind: toKind }, ...target.slice(clamped)]
    void persistOrder(next, fromKind === toKind ? [toKind] : [fromKind, toKind])
  }

  function nudge(id: string, kind: WonderKind, delta: -1 | 1) {
    const idx = wall[kind].findIndex((i) => i.id === id)
    if (idx < 0) return
    const to = idx + delta
    if (to < 0 || to >= wall[kind].length) return
    moveSticky(id, kind, kind, to)
  }

  async function updateSnapshotDate(id: string, date: string) {
    if (!date) return
    setSnapshots((s) => s.map((x) => (x.id === id ? { ...x, captured_on: date } : x)))
    try {
      const res = await fetch('/api/life-explorer/evidence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, captured_on: date }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to save date')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save date')
      await load()
    }
  }

  async function removeSnapshot(id: string) {
    if (!window.confirm('Remove this wall photo? The stickies it added stay on the wall.')) return
    setSnapshots((s) => s.filter((x) => x.id !== id))
    try {
      const res = await fetch(`/api/life-explorer/evidence?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to remove photo')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo')
      await load()
    }
  }

  async function handlePhoto(file: File) {
    if (!expeditionId) return
    setError(null)
    setSnapBusy('converting')
    try {
      const jpeg = await ensureJpegCompatible(file)
      const dataUrl = await fileToDataUrl(jpeg)

      setSnapBusy('uploading')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in — refresh and try again')

      const { url } = await uploadUserFile('lifeExplorer', jpeg, user.id)
      setPhotoUrl(url)

      setSnapBusy('reading')
      const res = await fetch('/api/life-explorer/wonder/from-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedition_id: expeditionId,
          photo_url: url,
          image_data_url: dataUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not read the photo')
      setProposals(
        (json.stickies as Omit<ProposedSticky, 'include'>[]).map((s) => ({
          ...s,
          include: s.statement !== '(unreadable)',
        }))
      )
    } catch (err) {
      console.error('snap wall failed', err)
      setError(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setSnapBusy(null)
    }
  }

  async function confirmProposals() {
    if (!expeditionId || !proposals) return
    setSnapBusy('saving')
    setError(null)
    try {
      const chosen = proposals.filter((p) => p.include && p.statement !== '(unreadable)')
      for (const p of chosen) {
        const res = await fetch('/api/life-explorer/wonder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expedition_id: expeditionId,
            kind: p.kind,
            statement: p.statement,
            interest_level: p.kind === 'wonder' ? 4 : null,
            source: 'wall_photo',
          }),
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error || 'Failed to save a sticky')
        }
      }
      // The photo itself becomes evidence → Journey Feed + Florida portfolio.
      if (studentId && photoUrl) {
        await fetch('/api/life-explorer/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            expedition_id: expeditionId,
            type: 'photo',
            title: 'Wonder Wall',
            photo_url: photoUrl,
            student_explanation: null,
            academic_tags: ['oral language', 'inquiry'],
          }),
        })
      }
      setProposals(null)
      setPhotoUrl(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSnapBusy(null)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-10 md:py-14">
      <Stack gap="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Wonder Wall</h2>
            <p className="text-neutral-400 mt-2 max-w-xl">
              The child&apos;s language is sacred — capture exact words, never auto-correct. The
              physical wall is the experience; this is its mirror. Drag stickies to reorder or
              move them between boards.
            </p>
          </div>
          {expeditionId && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handlePhoto(f)
                  e.target.value = ''
                }}
              />
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={snapBusy !== null}
              >
                {snapBusy === 'converting'
                  ? 'Converting photo…'
                  : snapBusy === 'uploading'
                    ? 'Uploading…'
                    : snapBusy === 'reading'
                      ? 'Reading stickies…'
                      : 'Snap the wall'}
              </Button>
            </div>
          )}
        </div>

        {!expeditionId && (
          <p className="text-amber-200 text-sm">
            No active expedition yet. Start from Today to launch one.
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Review checklist — nothing saves without parent confirmation */}
        {proposals && (
          <ReviewChecklist
            proposals={proposals}
            setProposals={setProposals}
            onConfirm={confirmProposals}
            onCancel={() => {
              setProposals(null)
              setPhotoUrl(null)
            }}
            saving={snapBusy === 'saving'}
          />
        )}

        {/* Three boards: side-by-side on desktop, swipeable on mobile */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {BOARDS.map((board) => {
            const items = wall[board.kind]
            return (
              <section
                key={board.kind}
                onDragOver={(e) => {
                  if (dragging) e.preventDefault()
                }}
                onDrop={() => {
                  if (!dragging) return
                  // Drop on empty column space → send to the end of this board.
                  moveSticky(
                    dragging.id,
                    dragging.kind,
                    board.kind,
                    wall[board.kind].filter((i) => i.id !== dragging.id).length
                  )
                  setDragging(null)
                }}
                className="min-w-[85%] snap-center sm:min-w-[60%] md:min-w-0 rounded-2xl border border-[#222] bg-[#111] p-4 flex flex-col"
              >
                <h3 className={`font-bold text-lg ${board.accent}`}>{board.title}</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-4">{board.hint}</p>

                <div className="flex-1 space-y-3">
                  {items.length === 0 && (
                    <p className="text-sm text-neutral-600 italic">Nothing here yet.</p>
                  )}
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      draggable={editing?.id !== item.id}
                      onDragStart={() => setDragging({ id: item.id, kind: board.kind })}
                      onDragEnd={() => setDragging(null)}
                      onDragOver={(e) => {
                        if (dragging) e.preventDefault()
                      }}
                      onDrop={(e) => {
                        if (!dragging || dragging.id === item.id) return
                        e.stopPropagation()
                        // Insert before this sticky (index within the list minus the dragged item).
                        const toIndex = wall[board.kind]
                          .filter((x) => x.id !== dragging.id)
                          .findIndex((x) => x.id === item.id)
                        moveSticky(dragging.id, dragging.kind, board.kind, Math.max(0, toIndex))
                        setDragging(null)
                      }}
                      className={`group rounded-sm px-4 py-3 shadow-md text-sm font-medium cursor-grab active:cursor-grabbing ${board.note} ${
                        i % 3 === 0 ? '-rotate-1' : i % 3 === 1 ? 'rotate-1' : 'rotate-0'
                      } ${dragging?.id === item.id ? 'opacity-40' : ''}`}
                    >
                      {editing?.id === item.id ? (
                        <div>
                          <input
                            value={editing.text}
                            onChange={(e) => setEditing({ id: item.id, text: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void saveEdit()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            autoFocus
                            className="w-full rounded border border-black/20 bg-white/60 px-2 py-1 text-sm focus:outline-none"
                          />
                          <div className="mt-2 flex gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => void saveEdit()}
                              disabled={saving === 'edit' || !editing.text.trim()}
                              className="underline underline-offset-2 disabled:opacity-40"
                            >
                              {saving === 'edit' ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="opacity-60 hover:opacity-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <p className="min-w-0 flex-1">{item.statement}</p>
                          <span className="flex shrink-0 gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              aria-label="Move up"
                              title="Move up"
                              onClick={() => nudge(item.id, board.kind, -1)}
                              disabled={i === 0}
                              className="rounded p-0.5 hover:bg-black/10 disabled:opacity-30"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Move down"
                              title="Move down"
                              onClick={() => nudge(item.id, board.kind, 1)}
                              disabled={i === items.length - 1}
                              className="rounded p-0.5 hover:bg-black/10 disabled:opacity-30"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Edit sticky"
                              title="Edit"
                              onClick={() => setEditing({ id: item.id, text: item.statement })}
                              className="rounded p-0.5 hover:bg-black/10"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Remove sticky"
                              title="Remove"
                              onClick={() => void removeItem(item.id)}
                              disabled={saving === 'delete'}
                              className="rounded p-0.5 hover:bg-black/10 disabled:opacity-40"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                          </span>
                        </div>
                      )}
                      {editing?.id !== item.id && board.kind === 'wonder' && (
                        <p className="text-[11px] mt-1.5 opacity-70">
                          {item.status === 'answered'
                            ? 'Answered — see What I Learned'
                            : item.status === 'exploring'
                              ? 'Exploring now'
                              : item.priority != null
                                ? `Up next #${item.priority}`
                                : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {expeditionId && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={drafts[board.kind]}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [board.kind]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void addItem(board.kind)
                      }}
                      placeholder={
                        board.kind === 'know'
                          ? 'They already believe…'
                          : board.kind === 'wonder'
                            ? 'They wonder…'
                            : 'They learned…'
                      }
                      className="min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void addItem(board.kind)}
                      disabled={saving === board.kind || !drafts[board.kind].trim()}
                      className="rounded-lg border border-[#333] px-3 py-2 text-sm text-neutral-200 hover:border-[#39FF14]/40 transition-colors disabled:opacity-40"
                    >
                      {saving === board.kind ? '…' : 'Add'}
                    </button>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* Wall snapshots — every "Snap the wall" photo with an editable date */}
        {snapshots.length > 0 && (
          <section className="rounded-2xl border border-[#222] bg-[#111] p-4">
            <h3 className="font-bold text-lg text-white">Wall snapshots</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Photos of the physical wall over time. The date is when the wall session happened —
              change it if you uploaded on a different day.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {snapshots.map((snap) => (
                <figure
                  key={snap.id}
                  className="group/snap overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]"
                >
                  <button
                    type="button"
                    aria-label="View photo full size"
                    onClick={() => setLightbox(snap.photo_url)}
                    className="block w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={snap.photo_url!}
                      alt="Wonder Wall snapshot"
                      className="aspect-square w-full object-cover transition-transform group-hover/snap:scale-[1.02]"
                    />
                  </button>
                  <figcaption className="flex items-center justify-between gap-2 p-2">
                    <input
                      type="date"
                      value={snap.captured_on || snap.created_at.slice(0, 10)}
                      onChange={(e) => void updateSnapshotDate(snap.id, e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-transparent px-2 py-1 text-xs text-neutral-300 focus:border-[#39FF14]/50 focus:outline-none [color-scheme:dark]"
                    />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      title="Remove photo"
                      onClick={() => void removeSnapshot(snap.id)}
                      className="rounded p-1 text-neutral-500 hover:bg-white/10 hover:text-neutral-200 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </Stack>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Wonder Wall photo"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </Container>
  )
}

/* ————— Snap-the-wall review checklist ————— */

function ReviewChecklist({
  proposals,
  setProposals,
  onConfirm,
  onCancel,
  saving,
}: {
  proposals: ProposedSticky[]
  setProposals: (p: ProposedSticky[]) => void
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}) {
  function update(i: number, patch: Partial<ProposedSticky>) {
    setProposals(proposals.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  const includedCount = proposals.filter(
    (p) => p.include && p.statement !== '(unreadable)'
  ).length

  return (
    <div className="rounded-2xl border-2 border-[#00FFFF]/50 bg-[#001a1a]/60 p-5">
      <p className="text-white font-semibold">Review what the camera read</p>
      <p className="text-sm text-neutral-400 mt-1 mb-4">
        Fix any words, switch boards, uncheck anything wrong. Only checked stickies are saved —
        in the child&apos;s exact words.
      </p>
      <ul className="space-y-3">
        {proposals.map((p, i) => (
          <li
            key={i}
            className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 ${
              p.include ? 'border-[#2a2a2a]' : 'border-[#1a1a1a] opacity-50'
            }`}
          >
            <input
              type="checkbox"
              checked={p.include}
              onChange={(e) => update(i, { include: e.target.checked })}
              className="h-4 w-4 accent-[#39FF14]"
            />
            <input
              value={p.statement}
              onChange={(e) => update(i, { statement: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1.5 text-sm text-white focus:border-[#39FF14]/50 focus:outline-none"
            />
            <select
              value={p.kind}
              onChange={(e) => update(i, { kind: e.target.value as WonderKind })}
              className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1.5 text-sm text-neutral-200 focus:outline-none"
            >
              <option value="know">Know</option>
              <option value="wonder">Wonder</option>
              <option value="learned">Learned</option>
            </select>
            {p.confidence !== 'high' && (
              <span className="text-[11px] text-amber-300">
                {p.statement === '(unreadable)' ? 'unreadable' : 'double-check'}
              </span>
            )}
            {p.cleaned && (
              <span className="w-full text-[11px] text-neutral-500 pl-7">
                Cleaned spelling: {p.cleaned}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onConfirm} disabled={saving || includedCount === 0}>
          {saving ? 'Saving…' : `Add ${includedCount} to the wall`}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
      <p className="mt-3 text-[11px] text-neutral-500">
        The photo itself is saved as evidence — it appears in the Journey Feed and the Florida
        portfolio automatically.
      </p>
    </div>
  )
}
