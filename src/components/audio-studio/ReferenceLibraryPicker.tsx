'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/lib/design-system/components'
import { Library, Music2, Trash2, ChevronDown, ChevronUp, Loader2, Clock, Youtube } from 'lucide-react'
import { cn } from '@/lib/design-system/components/shared-utils'

export interface ReferenceTrack {
  id: string
  title: string | null
  youtube_url: string | null
  full_audio_url: string
  clip_url: string | null
  clip_start: number
  clip_end: number
  duration: number | null
  mureka_file_id: string | null
  created_at: string
}

interface ReferenceLibraryPickerProps {
  onSelect: (ref: ReferenceTrack) => void
  className?: string
}

export function ReferenceLibraryPicker({ onSelect, className }: ReferenceLibraryPickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [references, setReferences] = useState<ReferenceTrack[]>([])
  const [loaded, setLoaded] = useState(false)

  const loadReferences = useCallback(async () => {
    if (loaded && references.length > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/songs/references')
      if (res.ok) {
        const data = await res.json()
        setReferences(data.references || [])
      }
    } catch (err) {
      console.error('Failed to load references:', err)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [loaded, references.length])

  useEffect(() => {
    if (open && !loaded) loadReferences()
  }, [open, loaded, loadReferences])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Remove this reference from your library?')) return
    try {
      await fetch(`/api/songs/references?id=${id}`, { method: 'DELETE' })
      setReferences(prev => prev.filter(r => r.id !== id))
    } catch {}
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-neutral-700/50 bg-neutral-800/40 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white',
          className
        )}
      >
        <Library className="h-3.5 w-3.5 text-neutral-400" />
        My Reference Tracks
        <ChevronDown className="ml-auto h-3 w-3 text-neutral-500" />
      </button>
    )
  }

  return (
    <div className={cn('rounded-xl border border-neutral-700/50 bg-neutral-900/80', className)}>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-white transition-colors hover:bg-white/[0.03]"
      >
        <Library className="h-3.5 w-3.5 text-[#39FF14]" />
        My Reference Tracks
        <ChevronUp className="ml-auto h-3 w-3 text-neutral-500" />
      </button>

      <div className="border-t border-neutral-800 px-1.5 pb-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
          </div>
        ) : references.length === 0 ? (
          <div className="py-6 text-center">
            <Music2 className="mx-auto h-6 w-6 text-neutral-600" />
            <p className="mt-2 text-xs text-neutral-500">
              No reference tracks yet. They'll appear here after your first song uses one.
            </p>
          </div>
        ) : (
          <div className="max-h-[240px] space-y-0.5 overflow-y-auto pt-1.5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {references.map(ref => (
              <div
                key={ref.id}
                className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(ref)
                    setOpen(false)
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Music2 className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-200 group-hover:text-white">
                      {ref.title || 'Untitled reference'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                      {ref.youtube_url && <Youtube className="h-2.5 w-2.5" />}
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {Number(ref.clip_start).toFixed(0)}s – {Number(ref.clip_end).toFixed(0)}s
                      </span>
                      <span>
                        {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, ref.id)}
                  className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-[#FF0040] transition-all"
                  title="Remove from library"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
