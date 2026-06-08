'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, FileUpload, ImageLightbox, Toggle } from '@/lib/design-system/components'
import { X, Loader2, Check, Maximize2 } from 'lucide-react'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { toast } from 'sonner'

type ImageSource = 'upload' | 'ai'

interface AlbumArtModalProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  songTitle: string
  lyrics: string
  onArtGenerated: (imageUrl: string) => void
}

export function AlbumArtModal({
  isOpen,
  onClose,
  songId,
  songTitle,
  lyrics,
  onArtGenerated,
}: AlbumArtModalProps) {
  const [saving, setSaving] = useState(false)
  const [imageSource, setImageSource] = useState<ImageSource>('ai')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(uploadFile)
    setUploadPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [uploadFile])

  useEffect(() => {
    if (!isOpen) {
      setImageSource('ai')
      setUploadFile(null)
      setLightboxOpen(false)
    }
  }, [isOpen])

  const saveCover = useCallback(async (coverUrl?: string, file?: File) => {
    setSaving(true)
    try {
      let res: Response

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch(`/api/songs/${songId}/cover`, {
          method: 'POST',
          body: formData,
        })
      } else if (coverUrl) {
        res = await fetch(`/api/songs/${songId}/cover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_url: coverUrl }),
        })
      } else {
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save album art')
      }

      const data = await res.json()
      onArtGenerated(data.cover_url || coverUrl!)
      toast.success('Album art saved to all tracks!')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save album art')
    } finally {
      setSaving(false)
    }
  }, [songId, onArtGenerated, onClose])

  const handleVivaImageSelected = useCallback((imageUrl: string) => {
    if (!imageUrl) return
    saveCover(imageUrl)
  }, [saveCover])

  const handleUseUploadedImage = () => {
    if (!uploadFile) {
      toast.error('Please upload an image first')
      return
    }
    saveCover(undefined, uploadFile)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Album Art</h2>
            <p className="text-sm text-neutral-400 mt-0.5">{songTitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {saving && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Saving album art...</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <Toggle
              variant="segmented"
              size="sm"
              fullWidth
              value={imageSource}
              onChange={(v) => {
                setImageSource(v)
                if (v === 'ai') setUploadFile(null)
              }}
              options={[
                { value: 'ai', label: 'VIVA Generate' },
                { value: 'upload', label: 'Upload' },
              ]}
              className="w-full"
            />
          </div>

          {imageSource === 'upload' ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 text-center">
                Uploads are auto-cropped to 3000×3000 and branded with the Vibration Fit logo (bottom-right), matching our published music covers.
              </p>
              <FileUpload
                dragDrop
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                multiple={false}
                maxFiles={1}
                maxSize={20}
                value={uploadFile ? [uploadFile] : []}
                onChange={(files) => setUploadFile(files[0] || null)}
                onUpload={(files) => setUploadFile(files[0] || null)}
                dragDropText="Click to upload or drag and drop"
                dragDropSubtext="JPG, PNG, or WebP (max 20MB)"
                previewSize="lg"
              />

              {uploadPreviewUrl && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative mx-auto block overflow-hidden rounded-xl border-2 border-primary-500/50"
                    aria-label="View full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadPreviewUrl}
                      alt="Upload preview"
                      className="max-h-64 w-auto object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                        <Maximize2 className="h-3.5 w-3.5" />
                        View full size
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleUseUploadedImage}
                    disabled={saving}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Image
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <AIImageGenerator
              type="album_art"
              lyricsText={lyrics}
              onImageGenerated={handleVivaImageSelected}
            />
          )}
        </div>
      </div>

      {uploadPreviewUrl && (
        <ImageLightbox
          images={[{ url: uploadPreviewUrl, alt: 'Upload preview' }]}
          currentIndex={0}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          showCopyButton={false}
          showNavigation={false}
          showThumbnails={false}
          showCounter={false}
        />
      )}
    </div>
  )
}
