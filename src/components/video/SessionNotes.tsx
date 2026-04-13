'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner, Button } from '@/lib/design-system'
import { FileUpload } from '@/lib/design-system/components/forms/FileUpload'
import { NotebookPen, Check, Lock, X, Film, Upload } from 'lucide-react'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'

interface SessionNotesProps {
  sessionId: string
}

function isVideoUrl(url: string): boolean {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
  return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
}

export function SessionNotes({ sessionId }: SessionNotesProps) {
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [showUploader, setShowUploader] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef({ content: '', mediaUrls: [] as string[] })

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}/notes`)
        if (res.ok) {
          const data = await res.json()
          const noteContent = data.note?.content || ''
          const noteMedia = data.note?.media_urls || []
          setContent(noteContent)
          setMediaUrls(noteMedia)
          lastSavedRef.current = { content: noteContent, mediaUrls: noteMedia }
        }
      } catch {
        setError('Could not load your notes')
      } finally {
        setLoading(false)
      }
    }
    fetchNote()
  }, [sessionId])

  const saveNote = useCallback(async (text: string, media: string[]) => {
    if (
      text === lastSavedRef.current.content &&
      JSON.stringify(media) === JSON.stringify(lastSavedRef.current.mediaUrls)
    ) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/video/sessions/${sessionId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, media_urls: media }),
      })
      if (!res.ok) throw new Error('Save failed')
      lastSavedRef.current = { content: text, mediaUrls: media }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Could not save')
    } finally {
      setSaving(false)
    }
  }, [sessionId])

  const scheduleSave = useCallback((text: string, media: string[]) => {
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveNote(text, media), 1200)
  }, [saveNote])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    scheduleSave(val, mediaUrls)
  }

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(files)
    if (files.length > 0) {
      handleUpload(files)
    }
  }

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const results = await uploadMultipleUserFiles(
        'sessionNotes',
        files,
        undefined,
        (progress) => setUploadProgress(Math.round(progress))
      )

      const urls = results
        .filter((r: { url: string; key: string; error?: string }) => !r.error && r.url)
        .map((r: { url: string; key: string; error?: string }) => r.url)

      if (urls.length > 0) {
        const updated = [...mediaUrls, ...urls]
        setMediaUrls(updated)
        await saveNote(content, updated)
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setPendingFiles([])
      setShowUploader(false)
    }
  }

  const removeMedia = async (index: number) => {
    const updated = mediaUrls.filter((_, i) => i !== index)
    setMediaUrls(updated)
    await saveNote(content, updated)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-white">My Notes</h3>
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <Lock className="w-3 h-3" />
            Private
          </span>
        </div>
        <div className="text-xs text-neutral-500 h-4">
          {uploading && `Uploading ${uploadProgress}%...`}
          {!uploading && saving && 'Saving...'}
          {!uploading && saved && (
            <span className="text-primary-500 inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {error && <span className="text-red-400">{error}</span>}
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Jot down your takeaways, action items, or anything that resonated..."
        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 resize-none transition-colors min-h-[120px]"
        rows={5}
      />

      {/* Saved media thumbnails */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
              {isVideoUrl(url) ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                  <Film className="w-6 h-6 text-neutral-400" />
                </div>
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeMedia(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload toggle + drag-drop */}
      {!showUploader ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowUploader(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      ) : (
        <FileUpload
          dragDrop
          accept="image/*,video/*"
          multiple
          maxFiles={5}
          maxSize={500}
          value={pendingFiles}
          onChange={handleFilesSelected}
          onUpload={handleFilesSelected}
          showProgress={uploading}
          uploadProgress={uploadProgress}
          isUploading={uploading}
          dragDropText="Click to upload or drag and drop"
          dragDropSubtext="Images or videos (max 5 files, 500MB each)"
          previewSize="md"
        />
      )}
    </div>
  )
}
