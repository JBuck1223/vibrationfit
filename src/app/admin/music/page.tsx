'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Container,
  Card,
  Button,
  Spinner,
  PageHero,
} from '@/lib/design-system/components'
import {
  Music2,
  Check,
  X,
  Play,
  Square,
  Tag,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  CheckSquare,
  AlertCircle,
  Star,
  EyeOff,
  AlignLeft,
  Loader2,
  XCircle,
  Edit2,
} from 'lucide-react'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string | null
  track_number: number | null
  genre: string | null
  tags: string[]
  release_date: string | null
  duration_seconds: number | null
  artwork_url: string | null
  preview_url: string | null
  spotify_url: string | null
  apple_music_url: string | null
  amazon_music_url: string | null
  youtube_music_url: string | null
  tidal_url: string | null
  deezer_url: string | null
  soundcloud_url: string | null
  description: string | null
  isrc: string | null
  is_active: boolean
  is_featured: boolean
  sort_order: number
  synced_lyrics: { lines: { text: string; startTime: number; endTime: number }[] } | null
  plain_lyrics: string | null
  created_at: string
  updated_at: string
}

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(c =>
  (LIFE_CATEGORY_KEYS as readonly string[]).includes(c.key)
)

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const cat = LIFE_CATEGORIES.find(c => c.key === tag)
  const Icon = cat?.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
      {Icon && <Icon className="w-3 h-3" />}
      {cat?.label || tag}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 hover:text-red-400 transition-colors">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

function TagSelector({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (tags: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LIFE_CATEGORIES.map(cat => {
        const isSelected = selected.includes(cat.key)
        const Icon = cat.icon
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => {
              if (isSelected) {
                onChange(selected.filter(t => t !== cat.key))
              } else {
                onChange([...selected, cat.key])
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 ring-1 ring-purple-500/20'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600 hover:text-neutral-300'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {cat.label}
            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
          </button>
        )
      })}
    </div>
  )
}

function LyricsSyncSection({
  track,
  onSynced,
}: {
  track: MusicTrack
  onSynced: (updated: MusicTrack) => void
}) {
  const [lyricsText, setLyricsText] = useState(track.plain_lyrics || '')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ lineCount: number; wordCount: number } | null>(null)

  const hasSyncedLyrics = !!track.synced_lyrics
  const lineCount = track.synced_lyrics?.lines?.length ?? 0

  const doSync = async (syncMode: 'timestamped' | 'align' | 'auto') => {
    setSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const body: Record<string, string> = { catalogId: track.id, mode: syncMode }
      if (syncMode === 'timestamped' || syncMode === 'align') body.lyrics = lyricsText
      const res = await fetch('/api/admin/music-catalog/sync-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setSyncResult({ lineCount: data.lineCount, wordCount: data.wordCount })
      if (data.plainLyrics) setLyricsText(data.plainLyrics)
      onSynced({
        ...track,
        synced_lyrics: data.syncedLyrics,
        plain_lyrics: data.plainLyrics || lyricsText.trim(),
      })
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Remove synced lyrics for this track?')) return
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch(`/api/admin/music-catalog/sync-lyrics?catalogId=${track.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to clear')
      }
      setSyncResult(null)
      setLyricsText('')
      onSynced({ ...track, synced_lyrics: null, plain_lyrics: null })
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Clear failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5" />
          Synced Lyrics
        </label>
        {hasSyncedLyrics && (
          <span className="text-[11px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            {lineCount} lines synced
          </span>
        )}
      </div>

      {/* Paste with timestamps (from Mureka, LRC, etc.) -- fastest option */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
        <p className="text-xs text-neutral-300 font-medium">Paste timestamped lyrics (from Mureka, etc.)</p>
        <p className="text-xs text-neutral-500">
          Copy lyrics from Mureka or any source that includes timestamps. No audio processing needed -- instant sync.
        </p>
        <textarea
          value={lyricsText}
          onChange={e => setLyricsText(e.target.value)}
          placeholder={"Everything I asked for's at my door  0:03\nKnocking like it's been here before  0:08\nEvery dream I whispered low  0:12"}
          rows={8}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-colors resize-y font-mono leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => doSync('timestamped')}
            disabled={syncing || !lyricsText.trim()}
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
            )}
            {syncing ? 'Parsing...' : 'Sync from Timestamps'}
          </Button>
        </div>
      </div>

      {/* Auto-transcribe (no lyrics needed) */}
      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/50 p-3 space-y-2">
        <p className="text-xs text-neutral-300 font-medium">Auto-transcribe from audio</p>
        <p className="text-xs text-neutral-500">
          Whisper listens to the audio and generates timed text. Works best for spoken word; sung vocals may be approximate.
        </p>
        {!track.preview_url && (
          <p className="text-xs text-yellow-400/70">
            This track needs a preview audio URL first.
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => doSync('auto')}
          disabled={syncing || !track.preview_url}
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Music2 className="w-3.5 h-3.5 mr-1.5" />
          )}
          {syncing ? 'Transcribing...' : 'Auto-transcribe'}
        </Button>
      </div>

      {/* Manual lyrics + Whisper alignment */}
      <details className="rounded-lg border border-neutral-700/50 bg-neutral-900/50 overflow-hidden">
        <summary className="px-3 py-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-300">
          Advanced: Align plain lyrics with audio (uses Whisper for timing)
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-2">
          <p className="text-xs text-neutral-500">
            Paste lyrics without timestamps. Whisper transcribes the audio and aligns your words to get timing.
          </p>
          {!track.preview_url && (
            <p className="text-xs text-yellow-400/70">
              Needs a preview audio URL.
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => doSync('align')}
            disabled={syncing || !lyricsText.trim() || !track.preview_url}
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
            )}
            {hasSyncedLyrics ? 'Re-align with Audio' : 'Align with Audio'}
          </Button>
        </div>
      </details>

      {syncError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{syncError}</p>
        </div>
      )}

      {syncResult && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <p className="text-xs text-green-400">
            Synced {syncResult.lineCount} lines from {syncResult.wordCount} transcribed words
          </p>
        </div>
      )}

      {hasSyncedLyrics && (
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={syncing}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Clear Lyrics
          </Button>
        </div>
      )}
    </div>
  )
}

function TrackEditor({
  track,
  onSave,
  onCancel,
  saving,
  onTrackUpdate,
}: {
  track: MusicTrack
  onSave: (updates: Partial<MusicTrack>) => Promise<void>
  onCancel: () => void
  saving: boolean
  onTrackUpdate: (updated: MusicTrack) => void
}) {
  const [form, setForm] = useState({
    title: track.title,
    artist: track.artist,
    album: track.album || '',
    track_number: track.track_number ?? '',
    genre: track.genre || '',
    tags: [...(track.tags || [])],
    description: track.description || '',
    release_date: track.release_date || '',
    duration_seconds: track.duration_seconds ?? '',
    isrc: track.isrc || '',
    artwork_url: track.artwork_url || '',
    preview_url: track.preview_url || '',
    spotify_url: track.spotify_url || '',
    apple_music_url: track.apple_music_url || '',
    amazon_music_url: track.amazon_music_url || '',
    youtube_music_url: track.youtube_music_url || '',
    tidal_url: track.tidal_url || '',
    deezer_url: track.deezer_url || '',
    soundcloud_url: track.soundcloud_url || '',
    is_featured: track.is_featured,
    sort_order: track.sort_order,
  })

  const inputClass = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-colors'
  const labelClass = 'text-xs font-medium text-neutral-400 mb-1 block'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title</label>
          <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Artist</label>
          <input className={inputClass} value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Album</label>
          <input className={inputClass} value={form.album} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Track #</label>
            <input className={inputClass} type="number" value={form.track_number} onChange={e => setForm(f => ({ ...f, track_number: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Sort Order</label>
            <input className={inputClass} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Genre</label>
          <input className={inputClass} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Release Date</label>
          <input className={inputClass} type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Duration (seconds)</label>
          <input className={inputClass} type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>ISRC</label>
          <input className={inputClass} value={form.isrc} onChange={e => setForm(f => ({ ...f, isrc: e.target.value }))} placeholder="e.g. USRC11600001" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>Life Category Tags</label>
        <TagSelector selected={form.tags} onChange={tags => setForm(f => ({ ...f, tags }))} />
      </div>

      <div>
        <label className={`${labelClass} mb-2`}>Media URLs</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-neutral-500 mb-0.5 block">Artwork URL</label>
            <input className={inputClass} value={form.artwork_url} onChange={e => setForm(f => ({ ...f, artwork_url: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] text-neutral-500 mb-0.5 block">Preview URL (in-app playback)</label>
            <input className={inputClass} value={form.preview_url} onChange={e => setForm(f => ({ ...f, preview_url: e.target.value }))} />
          </div>
        </div>
      </div>

      <div>
        <label className={`${labelClass} mb-2`}>Streaming Links</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'spotify_url', label: 'Spotify' },
            { key: 'apple_music_url', label: 'Apple Music' },
            { key: 'amazon_music_url', label: 'Amazon Music' },
            { key: 'youtube_music_url', label: 'YouTube Music' },
            { key: 'tidal_url', label: 'Tidal' },
            { key: 'deezer_url', label: 'Deezer' },
            { key: 'soundcloud_url', label: 'SoundCloud' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-[11px] text-neutral-500 mb-0.5 block">{label}</label>
              <input
                className={inputClass}
                value={(form as unknown as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={`https://...`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-purple-500/20"
          />
          <span className="text-sm text-neutral-300">Featured</span>
        </label>
      </div>

      {/* Lyrics Sync */}
      <div className="pt-4 border-t border-neutral-800">
        <LyricsSyncSection track={track} onSynced={onTrackUpdate} />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
        <Button
          variant="primary"
          onClick={() => {
            const updates: Record<string, unknown> = { ...form }
            if (updates.track_number === '') updates.track_number = null
            else updates.track_number = parseInt(updates.track_number as string) || null
            if (updates.duration_seconds === '') updates.duration_seconds = null
            else updates.duration_seconds = parseInt(updates.duration_seconds as string) || null
            if (!updates.album) updates.album = null
            if (!updates.genre) updates.genre = null
            if (!updates.description) updates.description = null
            if (!updates.release_date) updates.release_date = null
            if (!updates.isrc) updates.isrc = null
            if (!updates.artwork_url) updates.artwork_url = null
            if (!updates.preview_url) updates.preview_url = null
            ;['spotify_url', 'apple_music_url', 'amazon_music_url', 'youtube_music_url', 'tidal_url', 'deezer_url', 'soundcloud_url'].forEach(k => {
              if (!updates[k]) updates[k] = null
            })
            onSave(updates as Partial<MusicTrack>)
          }}
          disabled={saving}
        >
          {saving ? <Spinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function MusicCatalogAdminPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [filterAlbum, setFilterAlbum] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string>('')
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'sort_order' | 'title' | 'album' | 'tags'>('sort_order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchTracks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/music-catalog')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      const { data } = await res.json()
      setTracks(data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTracks() }, [fetchTracks])

  const handleSave = async (id: string, updates: Partial<MusicTrack>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/music-catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      const { data } = await res.json()
      setTracks(prev => prev.map(t => t.id === id ? data : t))
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this track? It will be hidden from users.')) return
    try {
      const res = await fetch(`/api/admin/music-catalog?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate')
      setTracks(prev => prev.map(t => t.id === id ? { ...t, is_active: false } : t))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate')
    }
  }

  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction || bulkTags.length === 0) return
    setBulkSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/music-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk_action: bulkAction,
          ids: Array.from(selectedIds),
          tags: bulkTags,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Bulk action failed')
      }
      await fetchTracks()
      setSelectedIds(new Set())
      setBulkAction('')
      setBulkTags([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk action failed')
    } finally {
      setBulkSaving(false)
    }
  }

  const togglePlay = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (!track.preview_url) return
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(track.preview_url)
    audioRef.current = audio
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => setPlayingId(null)
    audio.play()
    setPlayingId(track.id)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTracks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTracks.map(t => t.id)))
    }
  }

  const albums = useMemo(() => {
    const set = new Set(tracks.filter(t => t.album).map(t => t.album!))
    return Array.from(set).sort()
  }, [tracks])

  const filteredTracks = useMemo(() => {
    let result = tracks

    if (!showInactive) result = result.filter(t => t.is_active)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album || '').toLowerCase().includes(q)
      )
    }

    if (filterTag !== 'all') {
      if (filterTag === 'untagged') {
        result = result.filter(t => !t.tags || t.tags.length === 0)
      } else {
        result = result.filter(t => (t.tags || []).includes(filterTag))
      }
    }

    if (filterAlbum !== 'all') {
      result = result.filter(t => t.album === filterAlbum)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'sort_order') cmp = a.sort_order - b.sort_order
      else if (sortField === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortField === 'album') cmp = (a.album || '').localeCompare(b.album || '')
      else if (sortField === 'tags') cmp = (a.tags?.length || 0) - (b.tags?.length || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [tracks, search, filterTag, filterAlbum, showInactive, sortField, sortDir])

  const taggedCount = tracks.filter(t => t.is_active && t.tags && t.tags.length > 0).length
  const activeCount = tracks.filter(t => t.is_active).length

  const SortButton = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button
      type="button"
      onClick={() => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
      }}
      className={`text-xs font-medium transition-colors ${sortField === field ? 'text-purple-400' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      {label}
      {sortField === field && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)}
    </button>
  )

  return (
    <AdminWrapper>
      <Container size="xl" className="py-8">
        <PageHero
          title="Music Catalog"
          subtitle={`${activeCount} active tracks · ${taggedCount} tagged with life categories`}
        />

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters + Search */}
        <Card className="p-4 mt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title, artist, album..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none"
              />
            </div>

            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:border-purple-500/50 focus:outline-none"
            >
              <option value="all">All Tags</option>
              <option value="untagged">Untagged</option>
              {LIFE_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>

            <select
              value={filterAlbum}
              onChange={e => setFilterAlbum(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:border-purple-500/50 focus:outline-none"
            >
              <option value="all">All Albums</option>
              {albums.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-purple-500"
              />
              Show inactive
            </label>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="p-4 mt-4 border-purple-500/30 bg-purple-500/5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-purple-300 font-medium">
                  {selectedIds.size} track{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <select
                  value={bulkAction}
                  onChange={e => { setBulkAction(e.target.value); setBulkTags([]) }}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-300 focus:border-purple-500/50 focus:outline-none"
                >
                  <option value="">Action...</option>
                  <option value="add_tags">Add Tags</option>
                  <option value="remove_tags">Remove Tags</option>
                </select>
                {bulkAction && bulkTags.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkAction}
                    disabled={bulkSaving}
                  >
                    {bulkSaving ? <Spinner size="sm" className="mr-1" /> : <Tag className="w-3.5 h-3.5 mr-1" />}
                    {bulkAction === 'add_tags' ? 'Add' : 'Remove'} {bulkTags.length} tag{bulkTags.length !== 1 ? 's' : ''}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedIds(new Set()); setBulkAction(''); setBulkTags([]) }}
                  className="text-xs text-neutral-500 hover:text-neutral-300 ml-auto"
                >
                  Clear selection
                </button>
              </div>
              {bulkAction && (
                <TagSelector selected={bulkTags} onChange={setBulkTags} />
              )}
            </div>
          </Card>
        )}

        {/* Track List */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" variant="primary" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <Card className="p-8 text-center">
              <Music2 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No tracks match your filters</p>
            </Card>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center gap-3 px-4 pb-2 border-b border-neutral-800">
                <button type="button" onClick={toggleSelectAll} className="text-neutral-500 hover:text-purple-400 transition-colors">
                  <CheckSquare className={`w-4 h-4 ${selectedIds.size === filteredTracks.length && filteredTracks.length > 0 ? 'text-purple-400' : ''}`} />
                </button>
                <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1"></div>
                  <div className="col-span-4"><SortButton field="title" label="Title" /></div>
                  <div className="col-span-2"><SortButton field="album" label="Album" /></div>
                  <div className="col-span-3"><SortButton field="tags" label="Tags" /></div>
                  <div className="col-span-1"><SortButton field="sort_order" label="#" /></div>
                  <div className="col-span-1 text-right text-xs text-neutral-500">Actions</div>
                </div>
              </div>

              {/* Track Rows */}
              <div className="divide-y divide-neutral-800/50">
                {filteredTracks.map(track => {
                  const isEditing = editingId === track.id
                  const isSelected = selectedIds.has(track.id)

                  return (
                    <div key={track.id} className={`${isEditing ? 'bg-neutral-900/80' : isSelected ? 'bg-purple-500/5' : 'hover:bg-neutral-900/40'} transition-colors`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedIds)
                            if (isSelected) next.delete(track.id)
                            else next.add(track.id)
                            setSelectedIds(next)
                          }}
                          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            isSelected ? 'bg-purple-500 border-purple-500' : 'border-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>

                        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                          {/* Preview button + artwork */}
                          <div className="col-span-1 flex items-center">
                            {track.preview_url ? (
                              <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  playingId === track.id
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                                }`}
                              >
                                {playingId === track.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-800/50 flex items-center justify-center">
                                <Music2 className="w-3 h-3 text-neutral-600" />
                              </div>
                            )}
                          </div>

                          {/* Title + artist */}
                          <div
                            className="col-span-4 min-w-0 cursor-pointer"
                            onClick={() => setEditingId(isEditing ? null : track.id)}
                          >
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${track.is_active ? 'text-white' : 'text-neutral-500 line-through'}`}>
                                {track.title}
                              </p>
                              {track.is_featured && <Star className="w-3 h-3 text-yellow-400 shrink-0" />}
                              {!track.is_active && <EyeOff className="w-3 h-3 text-neutral-600 shrink-0" />}
                              {track.synced_lyrics && <AlignLeft className="w-3 h-3 text-cyan-400 shrink-0" aria-label="Has synced lyrics" />}
                            </div>
                            <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                          </div>

                          {/* Album */}
                          <div className="col-span-2 min-w-0">
                            <p className="text-xs text-neutral-400 truncate">{track.album || '—'}</p>
                            {track.genre && <p className="text-[10px] text-neutral-600">{track.genre}</p>}
                          </div>

                          {/* Tags */}
                          <div className="col-span-3">
                            {track.tags && track.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {track.tags.map(tag => <TagPill key={tag} tag={tag} />)}
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-600 italic">No tags</span>
                            )}
                          </div>

                          {/* Sort order */}
                          <div className="col-span-1">
                            <span className="text-xs text-neutral-500 font-mono">{track.sort_order}</span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(isEditing ? null : track.id)}
                              className={`p-1.5 rounded transition-colors ${isEditing ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-500 hover:text-white'}`}
                              title="Edit track"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {track.is_active && (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(track.id)}
                                className="p-1.5 rounded text-neutral-600 hover:text-red-400 transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Editor */}
                      {isEditing && (
                        <div className="px-4 pb-4 pt-2 ml-7 border-l-2 border-purple-500/30">
                          <TrackEditor
                            track={track}
                            onSave={updates => handleSave(track.id, updates)}
                            onCancel={() => setEditingId(null)}
                            saving={saving}
                            onTrackUpdate={updated => setTracks(prev => prev.map(t => t.id === updated.id ? updated : t))}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Container>
    </AdminWrapper>
  )
}
