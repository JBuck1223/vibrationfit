'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, ListMusic, Check, Loader2 } from 'lucide-react'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import {
  getUserPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  type UserPlaylist,
  type SourceType,
} from '@/lib/services/playlistService'

interface AddToPlaylistSheetProps {
  isOpen: boolean
  onClose: () => void
  track: AudioTrack | null
  sourceType: SourceType
  sourceId: string
}

export function AddToPlaylistSheet({
  isOpen,
  onClose,
  track,
  sourceType,
  sourceId,
}: AddToPlaylistSheetProps) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAdded(new Set())
      setShowCreate(false)
      setNewName('')
      loadPlaylists()
    }
  }, [isOpen])

  async function loadPlaylists() {
    setLoading(true)
    const data = await getUserPlaylists()
    setPlaylists(data)
    setLoading(false)
  }

  async function handleAdd(playlistId: string) {
    if (!track || adding) return
    setAdding(playlistId)
    const ok = await addTrackToPlaylist(playlistId, sourceType, sourceId, track)
    if (ok) {
      setAdded(prev => new Set(prev).add(playlistId))
    }
    setAdding(null)
  }

  async function handleCreate() {
    if (!newName.trim() || creating) return
    setCreating(true)
    const playlist = await createPlaylist(newName.trim())
    if (playlist) {
      setPlaylists(prev => [playlist, ...prev])
      setShowCreate(false)
      setNewName('')
      if (track) {
        setAdding(playlist.id)
        const ok = await addTrackToPlaylist(playlist.id, sourceType, sourceId, track)
        if (ok) setAdded(prev => new Set(prev).add(playlist.id))
        setAdding(null)
      }
    }
    setCreating(false)
  }

  if (!isOpen || !track) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[380px] md:rounded-2xl bg-zinc-950 border-t md:border border-neutral-800 rounded-t-2xl max-h-[70vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/50">
          <h3 className="text-sm font-semibold text-white">Add to Playlist</h3>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-neutral-800/30">
          <p className="text-xs text-neutral-400 truncate">{track.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-white">New Playlist</span>
          </button>

          {showCreate && (
            <div className="px-4 pb-3 flex gap-2">
              <input
                type="text"
                placeholder="Playlist name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-3 py-2 rounded-lg bg-primary-500 text-black text-sm font-medium disabled:opacity-50 transition-opacity"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : playlists.length === 0 && !showCreate ? (
            <div className="text-center py-8 px-4">
              <ListMusic className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">No playlists yet</p>
              <p className="text-xs text-neutral-500 mt-1">Create one to get started</p>
            </div>
          ) : (
            <div className="py-1">
              {playlists.map(playlist => {
                const isAdded = added.has(playlist.id)
                const isAdding = adding === playlist.id
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleAdd(playlist.id)}
                    disabled={isAdded || isAdding}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-xs text-neutral-500">
                        {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                      ) : isAdded ? (
                        <Check className="w-4 h-4 text-primary-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
