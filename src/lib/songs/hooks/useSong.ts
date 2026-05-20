'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Song, SongTrack, UseSongReturn } from '../types'

export function useSong(songId: string | null): UseSongReturn {
  const [song, setSong] = useState<Song | null>(null)
  const [tracks, setTracks] = useState<SongTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const refetch = useCallback(async () => {
    if (!songId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (songError) throw songError
      setSong(songData as Song)

      const { data: trackData, error: trackError } = await supabase
        .from('song_tracks')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: true })

      if (trackError) throw trackError
      setTracks((trackData as SongTrack[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load song')
    } finally {
      setLoading(false)
    }
  }, [songId, supabase])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { song, tracks, loading, error, refetch }
}
