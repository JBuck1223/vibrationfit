'use client'

import { useRef, useState } from 'react'
import { Button, DeleteConfirmationDialog, ImageLightbox, Modal, Spinner } from '@/lib/design-system/components'
import { FileText, ImagePlus, Images, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaAttachment } from '@/lib/projects/types'
import { isImageAttachment, isVideoAttachment, uploadProjectFiles } from './media-utils'

interface ProjectMediaSectionProps {
  projectId: string
  taskId?: string | null
  /** Attachments to display (caller decides the scope: whole project or one task) */
  attachments: IdeaAttachment[]
  onChanged: () => void
}

export function ProjectMediaSection({
  projectId,
  taskId,
  attachments,
  onChanged,
}: ProjectMediaSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [playingVideo, setPlayingVideo] = useState<IdeaAttachment | null>(null)
  const [deleting, setDeleting] = useState<IdeaAttachment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const images = attachments.filter(isImageAttachment)
  const videos = attachments.filter(a => !isImageAttachment(a) && isVideoAttachment(a))
  const files = attachments.filter(a => !isImageAttachment(a) && !isVideoAttachment(a))

  const handleFiles = async (selected: File[]) => {
    if (selected.length === 0) return
    setUploading(true)
    try {
      const uploaded = await uploadProjectFiles(selected, setUploadPercent)
      const res = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploaded, ...(taskId ? { task_id: taskId } : {}) }),
      })
      if (!res.ok) throw new Error()
      onChanged()
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadPercent(0)
    }
  }

  const deleteAttachment = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/attachments?attachment_id=${deleting.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      setDeleting(null)
      onChanged()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  const mediaTiles: { attachment: IdeaAttachment; kind: 'image' | 'video'; imageIndex?: number }[] = [
    ...images.map((a, i) => ({ attachment: a, kind: 'image' as const, imageIndex: i })),
    ...videos.map(a => ({ attachment: a, kind: 'video' as const })),
  ]

  return (
    <div>
      {mediaTiles.length === 0 && files.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          <Images className="mx-auto mb-1.5 h-5 w-5 text-neutral-600" />
          No photos or videos yet.
        </p>
      ) : (
        <>
          {mediaTiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {mediaTiles.map(({ attachment, kind, imageIndex }) => (
                <div key={attachment.id} className="group relative">
                  {kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.file_url}
                      alt={attachment.file_name}
                      loading="lazy"
                      onClick={() => setLightboxIndex(imageIndex ?? 0)}
                      className="aspect-square w-full cursor-pointer rounded-lg border border-white/[0.06] object-cover transition-opacity hover:opacity-80"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(attachment)}
                      className="relative block aspect-square w-full overflow-hidden rounded-lg border border-white/[0.06] bg-black"
                    >
                      <video
                        src={`${attachment.file_url}#t=0.1`}
                        preload="metadata"
                        muted
                        playsInline
                        className="h-full w-full object-cover opacity-80"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60">
                          <Play className="ml-0.5 h-4 w-4 text-white" fill="currentColor" />
                        </span>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleting(attachment)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-neutral-300 opacity-100 transition-colors hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {files.map(file => (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-white hover:text-[#00FFFF]"
                  >
                    {file.file_name}
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleting(file)}
                    className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-3 border-t border-white/[0.06] pt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files || [])
            e.target.value = ''
            handleFiles(selected)
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" />
              Uploading {uploadPercent}%
            </span>
          ) : (
            <>
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Add Photos / Videos
            </>
          )}
        </Button>
      </div>

      <ImageLightbox
        images={images.map(img => ({ url: img.file_url, alt: img.file_name }))}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        showCopyButton={false}
      />

      <Modal
        isOpen={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
        title={playingVideo?.file_name || 'Video'}
        size="lg"
        className="!border !border-white/[0.06] bg-[#1F1F1F]/95 backdrop-blur-xl shadow-2xl"
      >
        {playingVideo && (
          <video
            src={playingVideo.file_url}
            controls
            autoPlay
            playsInline
            className="max-h-[70vh] w-full rounded-xl bg-black"
          />
        )}
      </Modal>

      <DeleteConfirmationDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={deleteAttachment}
        title="Delete Media"
        message={
          deleting?.note_id
            ? 'This file is attached to a note. Deleting it removes it from that note too.'
            : 'This removes the file from the project.'
        }
        itemName={deleting?.file_name || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
