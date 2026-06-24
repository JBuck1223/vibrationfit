'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Disc3, Music2, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/design-system/components/shared-utils'

export interface VibrationFitSong {
  id: string
  title: string
  artist: string | null
  album: string | null
  artwork_url: string | null
  preview_url: string
  duration_seconds: number | null
}

interface VibrationFitSongPickerProps {
  onSelect: (song: VibrationFitSong) => void
  className?: string
}

export function VibrationFitSongPicker({ onSelect, className }: VibrationFitSongPickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [songs, setSongs] = useState<VibrationFitSong[]>([])
  const [search, setSearch] = useState('')

  const loadSongs = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('music_catalog')
        .select('id, title, artist, album, artwork_url, preview_url, duration_seconds')
        .eq('is_active', true)
        .not('preview_url', 'is', null)
        .order('artist')
        .order('title')
      if (!error && data) {
        setSongs(data.filter((s): s is VibrationFitSong => Boolean(s.preview_url)))
      }
    } catch (err) {
      console.error('Failed to load Vibration Fit songs:', err)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [loaded])

  useEffect(() => {
    if (open && !loaded) loadSongs()
  }, [open, loaded, loadSongs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q) ||
      (s.album || '').toLowerCase().includes(q)
    )
  }, [songs, search])

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
        <Disc3 className="h-3.5 w-3.5 text-neutral-400" />
        Vibration Fit Songs
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
        <Disc3 className="h-3.5 w-3.5 text-[#39FF14]" />
        Vibration Fit Songs
        <ChevronUp className="ml-auto h-3 w-3 text-neutral-500" />
      </button>

      <div className="border-t border-neutral-800 px-1.5 pb-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
          </div>
        ) : songs.length === 0 ? (
          <div className="py-6 text-center">
            <Music2 className="mx-auto h-6 w-6 text-neutral-600" />
            <p className="mt-2 text-xs text-neutral-500">No Vibration Fit songs available yet.</p>
          </div>
        ) : (
          <>
            {songs.length > 6 && (
              <div className="px-1 pt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search songs..."
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-neutral-500 focus:border-[#39FF14]/50 focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div className="mt-1.5 max-h-[240px] space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-neutral-500">No songs match your search.</p>
              ) : (
                filtered.map(song => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => {
                      onSelect(song)
                      setOpen(false)
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#39FF14]/10">
                      {song.artwork_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={song.artwork_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Music2 className="h-4 w-4 text-[#39FF14]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-200 group-hover:text-white">
                        {song.title}
                      </p>
                      <p className="truncate text-[10px] text-neutral-500">
                        {song.artist || 'Vibration Fit'}
                        {song.album ? ` · ${song.album}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
