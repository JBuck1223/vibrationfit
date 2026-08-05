'use client'

import { useRef, useState } from 'react'
import { Button, DatePicker, DeleteConfirmationDialog, ImageLightbox, Spinner } from '@/lib/design-system/components'
import { Calendar, ImagePlus, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaAttachment, ProjectNote } from '@/lib/projects/types'
import {
  formatNoteDate,
  isImageAttachment,
  isVideoAttachment,
  todayISO,
  uploadProjectFiles,
} from './media-utils'

interface ProjectNotesSectionProps {
  projectId: string
  taskId?: string | null
  notes: ProjectNote[]
  /** All project attachments; note media is matched by note_id */
  attachments: IdeaAttachment[]
  onChanged: () => void
}

function NoteMediaGrid({ media }: { media: IdeaAttachment[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const images = media.filter(isImageAttachment)
  const videos = media.filter(a => !isImageAttachment(a) && isVideoAttachment(a))
  const files = media.filter(a => !isImageAttachment(a) && !isVideoAttachment(a))

  if (media.length === 0) return null

  return (
    <div className="mt-2.5 space-y-2.5">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.file_url}
              alt={img.file_name}
              loading="lazy"
              onClick={() => setLightboxIndex(i)}
              className="aspect-square w-full cursor-pointer rounded-lg border border-white/[0.06] object-cover transition-opacity hover:opacity-80"
            />
          ))}
        </div>
      )}
      {videos.map(video => (
        <video
          key={video.id}
          src={video.file_url}
          controls
          preload="metadata"
          className="max-h-64 w-full rounded-lg border border-white/[0.06] bg-black"
        />
      ))}
      {files.map(file => (
        <a
          key={file.id}
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-[#00FFFF] hover:underline"
        >
          {file.file_name}
        </a>
      ))}
      <ImageLightbox
        images={images.map(img => ({ url: img.file_url, alt: img.file_name }))}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        showCopyButton={false}
      />
    </div>
  )
}

export function ProjectNotesSection({
  projectId,
  taskId,
  notes,
  attachments,
  onChanged,
}: ProjectNotesSectionProps) {
  const [body, setBody] = useState('')
  const [noteDate, setNoteDate] = useState(todayISO())
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editDate, setEditDate] = useState('')
  const [deletingNote, setDeletingNote] = useState<ProjectNote | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const mediaForNote = (noteId: string) => attachments.filter(a => a.note_id === noteId)

  const addNote = async () => {
    if (!body.trim() && pendingFiles.length === 0) return
    setSaving(true)
    try {
      let uploaded: Awaited<ReturnType<typeof uploadProjectFiles>> = []
      if (pendingFiles.length > 0) {
        uploaded = await uploadProjectFiles(pendingFiles, setUploadPercent)
      }
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          note_date: noteDate,
          ...(taskId ? { task_id: taskId } : {}),
          attachments: uploaded,
        }),
      })
      if (!res.ok) throw new Error()
      setBody('')
      setNoteDate(todayISO())
      setPendingFiles([])
      onChanged()
    } catch {
      toast.error('Failed to add note')
    } finally {
      setSaving(false)
      setUploadPercent(0)
    }
  }

  const startEdit = (note: ProjectNote) => {
    setEditingId(note.id)
    setEditBody(note.body)
    setEditDate(note.note_date.slice(0, 10))
  }

  const saveEdit = async () => {
    if (!editingId || !editBody.trim()) return
    const res = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: editingId, body: editBody, note_date: editDate }),
    })
    if (res.ok) {
      setEditingId(null)
      onChanged()
    } else {
      toast.error('Failed to update note')
    }
  }

  const deleteNote = async () => {
    if (!deletingNote) return
    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/notes?note_id=${deletingNote.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      setDeletingNote(null)
      onChanged()
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      {/* Composer */}
      <div className="rounded-xl border border-white/[0.06] bg-neutral-900/50 p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
        />
        {pendingFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingFiles.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-xs text-neutral-300"
              >
                {file.name.length > 24 ? `${file.name.slice(0, 24)}…` : file.name}
                <button
                  type="button"
                  onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-neutral-500 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-white/[0.06] pt-2">
          <DatePicker
            value={noteDate}
            onChange={setNoteDate}
            customTrigger={
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/40 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatNoteDate(noteDate)}
              </span>
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) setPendingFiles(prev => [...prev, ...files])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/40 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500"
            title="Attach photos or videos"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Media
          </button>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="primary"
              onClick={addNote}
              disabled={saving || (!body.trim() && pendingFiles.length === 0)}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  {pendingFiles.length > 0 && uploadPercent < 100
                    ? `Uploading ${uploadPercent}%`
                    : 'Saving...'}
                </span>
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          <StickyNote className="mx-auto mb-1.5 h-5 w-5 text-neutral-600" />
          No notes yet. Capture updates, decisions, and progress as dated notes.
        </p>
      ) : (
        <div className="mt-3 flex flex-col divide-y divide-white/[0.04]">
          {notes.map(note => (
            <div key={note.id} className="group py-3">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-900/70 p-2 text-sm text-white outline-none focus:border-[#39FF14]/40"
                  />
                  <div className="flex items-center gap-2">
                    <DatePicker
                      value={editDate}
                      onChange={setEditDate}
                      customTrigger={
                        <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/40 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatNoteDate(editDate)}
                        </span>
                      }
                    />
                    <div className="ml-auto flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={saveEdit} disabled={!editBody.trim()}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#39FF14]">
                      {formatNoteDate(note.note_date)}
                    </span>
                    {note.author_name && (
                      <span className="text-xs text-neutral-500">{note.author_name}</span>
                    )}
                    <div className="ml-auto flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-white/[0.06] hover:text-neutral-300"
                        title="Edit note"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingNote(note)}
                        className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {note.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-200">{note.body}</p>
                  )}
                  <NoteMediaGrid media={mediaForNote(note.id)} />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={deleteNote}
        title="Delete Note"
        message="This deletes the note and any photos or videos attached to it."
        itemName={deletingNote ? formatNoteDate(deletingNote.note_date) : ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
