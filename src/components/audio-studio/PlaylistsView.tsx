'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  ListMusic, Plus, Trash2, Edit2, ChevronLeft, Loader2, GripVertical,
} from 'lucide-react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button, Spinner, DeleteConfirmationDialog, EmbeddedPlayer } from '@/lib/design-system/components'
import {
  getUserPlaylists,
  getPlaylistTracks,
  playlistTracksToAudioTracks,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  reorderPlaylists,
  reorderPlaylistTracks,
  removeTrackFromPlaylist,
  type UserPlaylist,
  type PlaylistTrackRow,
} from '@/lib/services/playlistService'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

function formatTotalDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0 min'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins} min`
}

function SortablePlaylistRow({
  playlist,
  onSelect,
}: {
  playlist: UserPlaylist
  onSelect: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(playlist.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(playlist.id) } }}
      className="flex items-center gap-3 w-full pl-2 pr-4 py-3 rounded-xl bg-embedded-panel border border-neutral-800 hover:border-neutral-700 transition-colors text-left cursor-pointer"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        onClick={e => e.stopPropagation()}
        className="p-1 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
        <ListMusic className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
          {playlist.total_duration > 0 && ` · ${formatTotalDuration(playlist.total_duration)}`}
        </p>
      </div>
    </div>
  )
}

export function PlaylistsView() {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrackRow[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const loadPlaylists = useCallback(async () => {
    setLoading(true)
    const data = await getUserPlaylists()
    setPlaylists(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadPlaylists() }, [loadPlaylists])

  const loadTracks = useCallback(async (playlistId: string) => {
    setTracksLoading(true)
    const data = await getPlaylistTracks(playlistId)
    setTracks(data)
    setTracksLoading(false)
  }, [])

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId)

  async function handleCreate() {
    if (!newName.trim() || creating) return
    setCreating(true)
    const playlist = await createPlaylist(newName.trim())
    if (playlist) {
      setPlaylists(prev => [playlist, ...prev])
      setShowCreate(false)
      setNewName('')
    }
    setCreating(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const ok = await deletePlaylist(deleteTarget.id)
    if (ok) {
      setPlaylists(prev => prev.filter(p => p.id !== deleteTarget.id))
      if (selectedPlaylistId === deleteTarget.id) {
        setSelectedPlaylistId(null)
        setTracks([])
      }
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleRename(id: string) {
    const name = editingName.trim()
    if (!name) { setEditingId(null); return }
    const ok = await renamePlaylist(id, name)
    if (ok) {
      setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p))
    }
    setEditingId(null)
  }

  async function handleRemoveTrack(trackId: string) {
    setRemovingTrackId(trackId)
    const ok = await removeTrackFromPlaylist(trackId)
    if (ok) {
      setTracks(prev => prev.filter(t => t.id !== trackId))
      setPlaylists(prev => prev.map(p => {
        if (p.id !== selectedPlaylistId) return p
        const remaining = tracks.filter(t => t.id !== trackId)
        return {
          ...p,
          track_count: remaining.length,
          total_duration: remaining.reduce((sum, t) => sum + (t.track_data?.duration ?? 0), 0),
        }
      }))
    }
    setRemovingTrackId(null)
  }

  function handleSelectPlaylist(id: string) {
    setSelectedPlaylistId(id)
    loadTracks(id)
  }

  const handlePlaylistDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = playlists.findIndex(p => p.id === active.id)
    const newIndex = playlists.findIndex(p => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const previous = playlists
    const reordered = arrayMove(playlists, oldIndex, newIndex)
    setPlaylists(reordered)

    const ok = await reorderPlaylists(reordered.map(p => p.id))
    if (!ok) setPlaylists(previous)
  }, [playlists])

  const audioTracks = playlistTracksToAudioTracks(tracks)

  const trackIdToRowId = new Map(tracks.map(row => [row.track_data.id, row.id]))

  const handleRemoveFromPlayer = useCallback((track: AudioTrack) => {
    const rowId = trackIdToRowId.get(track.id)
    if (rowId) handleRemoveTrack(rowId)
  }, [tracks, trackIdToRowId])

  const handleReorderTracks = useCallback(async (reordered: AudioTrack[]) => {
    if (!selectedPlaylistId) return
    const rowByTrackId = new Map(tracks.map(r => [r.track_data.id, r]))
    const reorderedRows = reordered
      .map(t => rowByTrackId.get(t.id))
      .filter((r): r is PlaylistTrackRow => !!r)
    if (reorderedRows.length !== tracks.length) return

    const previous = tracks
    setTracks(reorderedRows)
    const ok = await reorderPlaylistTracks(selectedPlaylistId, reorderedRows.map(r => r.id))
    if (!ok) setTracks(previous)
  }, [selectedPlaylistId, tracks])

  // Detail view
  if (selectedPlaylistId && selectedPlaylist) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => { setSelectedPlaylistId(null); setTracks([]) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Playlists
          </button>
        </div>

        {tracksLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl bg-embedded-panel border border-neutral-800 overflow-hidden">
            <div className="relative bg-black/40 px-5 pt-5 pb-4 border-b border-neutral-800/60 text-center">
              <div className="absolute top-3 right-3 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => { setEditingId(selectedPlaylistId); setEditingName(selectedPlaylist.name) }}
                  className="p-2 text-neutral-500 hover:text-white transition-colors rounded-lg"
                  aria-label="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: selectedPlaylistId, name: selectedPlaylist.name })}
                  className="p-2 text-neutral-500 hover:text-[#FF0040] transition-colors rounded-lg"
                  aria-label="Delete playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {editingId === selectedPlaylistId ? (
                <input
                  type="text"
                  className="w-full max-w-md mx-auto rounded-lg border border-white/10 bg-neutral-800 px-3 py-1 text-base font-semibold text-white text-center placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(selectedPlaylistId)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleRename(selectedPlaylistId)}
                  autoFocus
                />
              ) : (
                <h3 className="text-white font-semibold text-lg">{selectedPlaylist.name}</h3>
              )}
              <p className="text-xs text-neutral-400 mt-1">
                {selectedPlaylist.track_count} {selectedPlaylist.track_count === 1 ? 'track' : 'tracks'}
                {selectedPlaylist.total_duration > 0 && ` · ${formatTotalDuration(selectedPlaylist.total_duration)}`}
              </p>
            </div>
            <div className="text-center py-10 px-4">
              <ListMusic className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">This playlist is empty</p>
              <p className="text-xs text-neutral-500 mt-1">
                Add tracks from Life Vision, Stories, or Music
              </p>
            </div>
          </div>
        ) : (
          <EmbeddedPlayer
            tracks={audioTracks}
            setName={selectedPlaylist.name}
            setIconKey="list-music"
            trackCount={selectedPlaylist.track_count}
            onRename={(newName) => {
              renamePlaylist(selectedPlaylistId, newName).then(ok => {
                if (ok) setPlaylists(prev => prev.map(p => p.id === selectedPlaylistId ? { ...p, name: newName } : p))
              })
            }}
            onDelete={() => setDeleteTarget({ id: selectedPlaylistId, name: selectedPlaylist.name })}
            onRemoveTrack={(track) => handleRemoveFromPlayer(track)}
            onReorderTracks={handleReorderTracks}
          />
        )}

        <DeleteConfirmationDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          itemName={deleteTarget?.name || ''}
          itemType="Playlist"
          isLoading={deleting}
          loadingText="Deleting playlist..."
        />
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-2xl mx-auto w-full">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary-500/10 text-primary-500 text-sm font-medium border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Playlist name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setShowCreate(false); setNewName('') }
                }}
                className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex-1"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCreate(false); setNewName('') }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {playlists.length === 0 ? (
            <Card variant="elevated" className="p-8 md:p-12 text-center">
              <ListMusic className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Playlists Yet</h3>
              <p className="text-neutral-400 mb-6">
                Create a playlist and add tracks from Life Vision, Stories, or Music to build your own custom listening experience.
              </p>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePlaylistDragEnd}>
              <SortableContext
                items={playlists.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {playlists.map(playlist => (
                    <SortablePlaylistRow
                      key={playlist.id}
                      playlist={playlist}
                      onSelect={handleSelectPlaylist}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      <DeleteConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name || ''}
        itemType="Playlist"
        isLoading={deleting}
        loadingText="Deleting playlist..."
      />
    </div>
  )
}
