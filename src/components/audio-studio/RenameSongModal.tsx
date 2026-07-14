'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/lib/design-system/components'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RenameSongModalProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  currentTitle: string
  onRenamed: (newTitle: string) => void
}

export function RenameSongModal({
  isOpen,
  onClose,
  songId,
  currentTitle,
  onRenamed,
}: RenameSongModalProps) {
  const [title, setTitle] = useState(currentTitle)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle)
      // Focus after the modal renders
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [isOpen, currentTitle])

  const handleSave = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      toast.error('Song title cannot be empty')
      return
    }
    if (trimmed === currentTitle) {
      onClose()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to rename song')
      }
      toast.success('Song renamed')
      onRenamed(trimmed)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename song')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Rename Song</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !saving) handleSave()
              if (e.key === 'Escape' && !saving) onClose()
            }}
            maxLength={120}
            placeholder="Song title"
            disabled={saving}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-neutral-500">
            The new name applies to all versions of this song.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
