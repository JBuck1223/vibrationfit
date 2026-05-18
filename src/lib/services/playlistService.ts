import { createClient } from '@/lib/supabase/client'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

export type SourceType = 'life_vision' | 'story' | 'music'

export interface UserPlaylist {
  id: string
  name: string
  description: string | null
  icon_key: string | null
  created_at: string
  updated_at: string
  track_count: number
  total_duration: number
}

export interface PlaylistTrackRow {
  id: string
  playlist_id: string
  source_type: SourceType
  source_id: string
  track_data: AudioTrack
  position: number
  created_at: string
}

export async function getUserPlaylists(): Promise<UserPlaylist[]> {
  const supabase = createClient()
  const { data: playlists, error } = await supabase
    .from('user_playlists')
    .select('*, user_playlist_tracks(id, track_data)')
    .order('updated_at', { ascending: false })

  if (error || !playlists) return []

  return playlists.map((p: any) => {
    const tracks = p.user_playlist_tracks || []
    const totalDuration = tracks.reduce((sum: number, t: any) => {
      const d = t.track_data?.duration ?? 0
      return sum + d
    }, 0)

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      icon_key: p.icon_key,
      created_at: p.created_at,
      updated_at: p.updated_at,
      track_count: tracks.length,
      total_duration: totalDuration,
    }
  })
}

export async function getPlaylistTracks(playlistId: string): Promise<PlaylistTrackRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_playlist_tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true })

  if (error || !data) return []
  return data as PlaylistTrackRow[]
}

export function playlistTracksToAudioTracks(rows: PlaylistTrackRow[]): AudioTrack[] {
  return rows.map(r => r.track_data)
}

export async function createPlaylist(
  name: string,
  description?: string
): Promise<UserPlaylist | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_playlists')
    .insert({ user_id: user.id, name, description: description ?? null })
    .select()
    .single()

  if (error || !data) return null

  return {
    ...data,
    track_count: 0,
    total_duration: 0,
  }
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_playlists')
    .delete()
    .eq('id', playlistId)
  return !error
}

export async function renamePlaylist(
  playlistId: string,
  name: string
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_playlists')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', playlistId)
  return !error
}

export async function addTrackToPlaylist(
  playlistId: string,
  sourceType: SourceType,
  sourceId: string,
  trackData: AudioTrack
): Promise<boolean> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('user_playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { error } = await supabase
    .from('user_playlist_tracks')
    .insert({
      playlist_id: playlistId,
      source_type: sourceType,
      source_id: sourceId,
      track_data: trackData,
      position: nextPosition,
    })

  if (error) return false

  await supabase
    .from('user_playlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', playlistId)

  return true
}

export async function removeTrackFromPlaylist(trackId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: track } = await supabase
    .from('user_playlist_tracks')
    .select('playlist_id, position')
    .eq('id', trackId)
    .single()

  if (!track) return false

  const { error } = await supabase
    .from('user_playlist_tracks')
    .delete()
    .eq('id', trackId)

  if (error) return false

  const { data: remaining } = await supabase
    .from('user_playlist_tracks')
    .select('id, position')
    .eq('playlist_id', track.playlist_id)
    .order('position', { ascending: true })

  if (remaining && remaining.length > 0) {
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await supabase
          .from('user_playlist_tracks')
          .update({ position: i })
          .eq('id', remaining[i].id)
      }
    }
  }

  await supabase
    .from('user_playlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', track.playlist_id)

  return true
}

export async function reorderPlaylistTracks(
  playlistId: string,
  orderedTrackIds: string[]
): Promise<boolean> {
  const supabase = createClient()

  for (let i = 0; i < orderedTrackIds.length; i++) {
    const { error } = await supabase
      .from('user_playlist_tracks')
      .update({ position: i })
      .eq('id', orderedTrackIds[i])
      .eq('playlist_id', playlistId)
    if (error) return false
  }

  await supabase
    .from('user_playlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', playlistId)

  return true
}
