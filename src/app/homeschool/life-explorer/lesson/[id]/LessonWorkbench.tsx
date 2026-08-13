'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  ChevronDown,
  Link2,
  Paperclip,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { ensureJpegCompatible } from '@/lib/life-explorer/ensure-jpeg'
import type {
  ActivityMediaType,
  LeLessonItem,
  LeLessonLink,
  LeLessonMedia,
  LeLessonNote,
  LessonBundle,
  LessonItemKind,
} from '@/lib/life-explorer/types'

// ============================================================================
// Shared helpers
// ============================================================================

const KIND_GROUPS: Array<{ kind: LessonItemKind; label: string }> = [
  { kind: 'prep', label: 'Before the lesson' },
  { kind: 'activity', label: 'During the lesson' },
  { kind: 'wrap_up', label: 'Wrap-up & record' },
  { kind: 'custom', label: 'Added by you' },
]

function mediaTypeFor(file: File): ActivityMediaType {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) return 'photo'
  return 'file'
}

async function uploadToLesson(
  lessonId: string,
  file: File,
  itemId?: string | null
): Promise<LeLessonMedia> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in — refresh and try again')

  const mediaType = mediaTypeFor(file)
  const toUpload = mediaType === 'photo' ? await ensureJpegCompatible(file) : file
  const { url } = await uploadUserFile('lifeExplorer', toUpload, user.id)

  const res = await fetch(`/api/life-explorer/lessons/${lessonId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      media_type: mediaType,
      file_name: file.name,
      item_id: itemId || null,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Upload failed')
  return json.media as LeLessonMedia
}

type BundleUpdater = (fn: (b: LessonBundle) => LessonBundle) => void

// ============================================================================
// Checklist — the lesson's prescribed action items, checkable, each one can
// hold its own notes, links, and photos (like a project task).
// ============================================================================

export function LessonChecklist({
  bundle,
  updateBundle,
}: {
  bundle: LessonBundle
  updateBundle: BundleUpdater
}) {
  const lessonId = bundle.lesson.id
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const done = bundle.items.filter((i) => i.is_complete).length

  async function toggleItem(item: LeLessonItem) {
    const next = !item.is_complete
    updateBundle((b) => ({
      ...b,
      items: b.items.map((i) =>
        i.id === item.id
          ? { ...i, is_complete: next, completed_at: next ? new Date().toISOString() : null }
          : i
      ),
    }))
    const res = await fetch(`/api/life-explorer/lessons/${lessonId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id, is_complete: next }),
    })
    if (!res.ok) {
      updateBundle((b) => ({
        ...b,
        items: b.items.map((i) => (i.id === item.id ? item : i)),
      }))
    }
  }

  async function addItem() {
    const title = newTitle.trim()
    if (!title) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(`/api/life-explorer/lessons/${lessonId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add item')
      updateBundle((b) => ({ ...b, items: [...b.items, json.item] }))
      setNewTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  async function deleteItem(item: LeLessonItem) {
    updateBundle((b) => ({
      ...b,
      items: b.items.filter((i) => i.id !== item.id),
      notes: b.notes.filter((n) => n.item_id !== item.id),
      links: b.links.filter((l) => l.item_id !== item.id),
      media: b.media.filter((m) => m.item_id !== item.id),
    }))
    await fetch(`/api/life-explorer/lessons/${lessonId}/items?item_id=${item.id}`, {
      method: 'DELETE',
    })
  }

  return (
    <section className="rounded-2xl border border-[#39FF14]/25 bg-[#101510] p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Mission Checklist</h3>
        <span className="text-sm text-[#39FF14]">
          {done}/{bundle.items.length} done
        </span>
      </div>

      <div className="space-y-5">
        {KIND_GROUPS.map((group) => {
          const items = bundle.items.filter((i) => i.kind === group.kind)
          if (items.length === 0) return null
          return (
            <div key={group.kind}>
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    bundle={bundle}
                    updateBundle={updateBundle}
                    onToggle={() => void toggleItem(item)}
                    onDelete={() => void deleteItem(item)}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void addItem()}
          placeholder="Add your own action item…"
          className="flex-1 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
        />
        <Button variant="outline" size="sm" onClick={() => void addItem()} disabled={adding || !newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
    </section>
  )
}

function ChecklistRow({
  item,
  bundle,
  updateBundle,
  onToggle,
  onDelete,
}: {
  item: LeLessonItem
  bundle: LessonBundle
  updateBundle: BundleUpdater
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const notes = bundle.notes.filter((n) => n.item_id === item.id)
  const links = bundle.links.filter((l) => l.item_id === item.id)
  const media = bundle.media.filter((m) => m.item_id === item.id)
  const attachedCount = notes.length + links.length + media.length

  return (
    <li className="rounded-xl border border-[#242424] bg-[#141414]">
      <div className="flex items-start gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={item.is_complete ? 'Mark not done' : 'Mark done'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            item.is_complete
              ? 'border-[#39FF14] bg-[#39FF14] text-black'
              : 'border-[#3a3a3a] hover:border-[#39FF14]/60'
          }`}
        >
          {item.is_complete && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm leading-snug ${
              item.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-100'
            }`}
          >
            {item.title}
          </p>
          {item.detail && <p className="text-xs text-neutral-500 mt-0.5">{item.detail}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {attachedCount > 0 && !open && (
            <span className="rounded-full bg-[#00FFFF]/10 px-2 py-0.5 text-[10px] text-[#00FFFF]">
              {attachedCount}
            </span>
          )}
          {item.source === 'custom' && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete item"
              className="p-1 text-neutral-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Attach notes, links, or photos"
            className={`p-1 transition-colors ${open ? 'text-[#39FF14]' : 'text-neutral-500 hover:text-white'}`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#222] px-3 py-3">
          <AttachmentPanel
            bundle={bundle}
            updateBundle={updateBundle}
            itemId={item.id}
            notes={notes}
            links={links}
            media={media}
            compact
          />
        </div>
      )}
    </li>
  )
}

// ============================================================================
// Journal — the lesson-level record: every document, photo, note, and link
// that lives in this lesson bucket (item-scoped ones are tagged).
// ============================================================================

export function LessonJournal({
  bundle,
  updateBundle,
}: {
  bundle: LessonBundle
  updateBundle: BundleUpdater
}) {
  return (
    <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Lesson Record</h3>
      <p className="text-xs text-neutral-500 mb-4">
        Everything captured in this lesson — documents, photos, notes, and links — stays
        with the lesson forever.
      </p>
      <AttachmentPanel
        bundle={bundle}
        updateBundle={updateBundle}
        itemId={null}
        notes={bundle.notes}
        links={bundle.links}
        media={bundle.media}
      />
    </section>
  )
}

// ============================================================================
// Attachment panel — notes + links + media for one scope (item or lesson).
// ============================================================================

function AttachmentPanel({
  bundle,
  updateBundle,
  itemId,
  notes,
  links,
  media,
  compact = false,
}: {
  bundle: LessonBundle
  updateBundle: BundleUpdater
  itemId: string | null
  notes: LeLessonNote[]
  links: LeLessonLink[]
  media: LeLessonMedia[]
  compact?: boolean
}) {
  const lessonId = bundle.lesson.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [linkDraft, setLinkDraft] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const itemTitle = (id: string | null) =>
    id ? bundle.items.find((i) => i.id === id)?.title || null : null

  async function addNote() {
    const body = noteDraft.trim()
    if (!body) return
    setBusy('note')
    setError(null)
    try {
      const res = await fetch(`/api/life-explorer/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, item_id: itemId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save note')
      updateBundle((b) => ({ ...b, notes: [...b.notes, json.note] }))
      setNoteDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setBusy(null)
    }
  }

  async function deleteNote(note: LeLessonNote) {
    updateBundle((b) => ({ ...b, notes: b.notes.filter((n) => n.id !== note.id) }))
    await fetch(`/api/life-explorer/lessons/${lessonId}/notes?note_id=${note.id}`, {
      method: 'DELETE',
    })
  }

  async function addLink() {
    let url = linkDraft.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) url = `https://${url}`
    setBusy('link')
    setError(null)
    try {
      const res = await fetch(`/api/life-explorer/lessons/${lessonId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, item_id: itemId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save link')
      updateBundle((b) => ({ ...b, links: [...b.links, json.link] }))
      setLinkDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save link')
    } finally {
      setBusy(null)
    }
  }

  async function deleteLink(link: LeLessonLink) {
    updateBundle((b) => ({ ...b, links: b.links.filter((l) => l.id !== link.id) }))
    await fetch(`/api/life-explorer/lessons/${lessonId}/links?link_id=${link.id}`, {
      method: 'DELETE',
    })
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy('upload')
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const row = await uploadToLesson(lessonId, file, itemId)
        updateBundle((b) => ({ ...b, media: [...b.media, row] }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function deleteMedia(row: LeLessonMedia) {
    updateBundle((b) => ({ ...b, media: b.media.filter((m) => m.id !== row.id) }))
    await fetch(`/api/life-explorer/lessons/${lessonId}/media?media_id=${row.id}`, {
      method: 'DELETE',
    })
  }

  return (
    <div className="space-y-4">
      {/* Media grid */}
      {media.length > 0 && (
        <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'}`}>
          {media.map((m) => (
            <div key={m.id} className="group relative">
              {m.media_type === 'photo' ? (
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={m.url}
                    alt={m.file_name || 'Lesson photo'}
                    width={200}
                    height={200}
                    unoptimized
                    className="h-24 w-full rounded-lg object-cover border border-[#2a2a2a]"
                  />
                </a>
              ) : (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-2 text-center"
                >
                  <Paperclip className="h-5 w-5 text-[#00FFFF]" />
                  <span className="w-full truncate text-[10px] text-neutral-400">
                    {m.file_name || m.media_type}
                  </span>
                </a>
              )}
              {!itemId && m.item_id && (
                <span className="absolute left-1 top-1 max-w-[90%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-[#00FFFF]">
                  {itemTitle(m.item_id)}
                </span>
              )}
              <button
                type="button"
                onClick={() => void deleteMedia(m)}
                aria-label="Delete file"
                className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-red-400 group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="group flex items-start gap-2 rounded-lg bg-[#0d0d0d] px-3 py-2">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFFF00]/70" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{n.body}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  {new Date(n.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {!itemId && n.item_id && (
                    <span className="text-[#00FFFF]"> · {itemTitle(n.item_id)}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void deleteNote(n)}
                aria-label="Delete note"
                className="hidden p-1 text-neutral-600 hover:text-red-400 group-hover:block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Links */}
      {links.length > 0 && (
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.id} className="group flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-[#00FFFF]" />
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-[#00FFFF] hover:underline"
              >
                {l.title || l.url}
              </a>
              {!itemId && l.item_id && (
                <span className="hidden sm:inline truncate text-[10px] text-neutral-600">
                  {itemTitle(l.item_id)}
                </span>
              )}
              <button
                type="button"
                onClick={() => void deleteLink(l)}
                aria-label="Delete link"
                className="hidden p-1 text-neutral-600 hover:text-red-400 group-hover:block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addNote()}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void addNote()}
            disabled={busy === 'note' || !noteDraft.trim()}
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#39FF14]/40 hover:text-white disabled:opacity-40 transition-colors"
          >
            Note
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addLink()}
            placeholder="Paste a link…"
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void addLink()}
            disabled={busy === 'link' || !linkDraft.trim()}
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#00FFFF]/40 hover:text-white disabled:opacity-40 transition-colors"
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy === 'upload'}
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#FFFF00]/40 hover:text-white disabled:opacity-40 transition-colors"
          >
            {busy === 'upload' ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.heic,.heif"
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}
