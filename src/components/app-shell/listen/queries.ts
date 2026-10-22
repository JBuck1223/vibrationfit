'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

export interface VisionAudioSet {
  id: string
  name: string | null
  createdAt: string
  visionId: string
  visionTitle: string
}

/** Audio sets of the active Life Vision, newest first. */
export function useVisionAudioSets(limit = 6) {
  return useQuery({
    queryKey: [...keys.audioSets, 'listen', 'vision-sets', limit],
    queryFn: async (): Promise<VisionAudioSet[]> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: vision } = await supabase
        .from('vision_versions')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .is('household_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!vision) return []
      const { data: sets } = await supabase
        .from('audio_sets')
        .select('id, name, created_at')
        .eq('vision_id', vision.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      return (sets ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.created_at,
        visionId: vision.id,
        visionTitle: vision.title || 'The Life I Choose',
      }))
    },
    staleTime: 60_000,
  })
}

export interface RecentListenItem {
  id: string
  kind: 'story' | 'song'
  title: string
  href: string
  artwork: string | null
  createdAt: string
}

/** The newest stories with audio and completed songs, merged by date. */
export function useRecentListenItems(limit = 6) {
  return useQuery({
    queryKey: [...keys.audioSets, 'listen', 'recent', limit],
    queryFn: async (): Promise<RecentListenItem[]> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const [stories, songs] = await Promise.all([
        supabase
          .from('stories')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .not('audio_set_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('song_tracks')
          .select('id, title, cover_url, created_at, songs!inner(title)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('mp3_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit),
      ])
      const items: RecentListenItem[] = [
        ...(stories.data ?? []).map((s) => ({
          id: s.id,
          kind: 'story' as const,
          title: s.title || 'Story',
          href: `/story/${s.id}`,
          artwork: null,
          createdAt: s.created_at,
        })),
        ...(songs.data ?? []).map((t) => {
          const song = t.songs as unknown as { title?: string } | { title?: string }[] | null
          const songTitle = Array.isArray(song) ? song[0]?.title : song?.title
          return {
            id: t.id,
            kind: 'song' as const,
            title: t.title || songTitle || 'Song',
            href: '/audio/songs',
            artwork: t.cover_url ?? null,
            createdAt: t.created_at,
          }
        }),
      ]
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
    },
    staleTime: 60_000,
  })
}
