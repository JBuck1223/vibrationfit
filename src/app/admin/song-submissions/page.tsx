'use client'

import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Music2, RefreshCw, ArrowLeft, CheckCircle, XCircle,
  Clock, Play, Pause, Send, ChevronDown, ChevronUp, Download,
  Copy, Check, Image as ImageIcon, FileAudio,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  user_id: string
  song_id: string
  track_id: string
  songwriter_legal_name: string
  royalty_split_percent: number
  status: 'pending' | 'approved' | 'rejected' | 'published'
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  agreement_version: string
  created_at: string
  songs: {
    id: string
    title: string | null
    entity_type: string
    lyrics: string | null
  } | null
  song_tracks: {
    id: string
    title: string | null
    version: string
    mp3_url: string | null
    cover_url: string | null
    duration_ms: number | null
    metadata: {
      mureka_wav_url?: string
      mureka_flac_url?: string
      mureka_url?: string
    } | null
  } | null
  user_accounts: {
    id: string
    email: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

type FilterStatus = 'pending' | 'approved' | 'published' | 'rejected' | 'all'

const STATUS_CONFIG: Record<string, { variant: 'warning' | 'success' | 'danger' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending Review' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  published: { variant: 'info', label: 'Published' },
}

export default function SongSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)
  const [expandedLyrics, setExpandedLyrics] = useState<Record<string, boolean>>({})
  const [downloadingArt, setDownloadingArt] = useState<string | null>(null)
  const [downloadingAudio, setDownloadingAudio] = useState<string | null>(null)
  const [copiedLyrics, setCopiedLyrics] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = filter === 'all'
        ? '/api/admin/song-submissions'
        : `/api/admin/song-submissions?status=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch submissions')
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  useEffect(() => {
    return () => {
      if (audioEl) {
        audioEl.pause()
        audioEl.src = ''
      }
    }
  }, [audioEl])

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'published', notes?: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/song-submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes }),
      })
      if (!res.ok) throw new Error('Action failed')
      setRejectingId(null)
      setRejectNotes('')
      fetchSubmissions()
    } catch (err) {
      console.error('Action error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const togglePlay = (trackUrl: string, trackId: string) => {
    if (playingTrackId === trackId && audioEl) {
      audioEl.pause()
      setPlayingTrackId(null)
      return
    }

    if (audioEl) {
      audioEl.pause()
      audioEl.src = ''
    }

    const el = new Audio(trackUrl)
    el.play()
    el.onended = () => setPlayingTrackId(null)
    setAudioEl(el)
    setPlayingTrackId(trackId)
  }

  const handleDownloadArt = async (coverUrl: string, songTitle: string, subId: string) => {
    setDownloadingArt(subId)
    try {
      const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(coverUrl)}`
      const res = await fetch(proxyUrl)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(songTitle || 'album-art').replace(/[^a-zA-Z0-9-_ ]/g, '')}-cover.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloadingArt(null)
    }
  }

  const handleDownloadAudio = async (url: string, songTitle: string, subId: string, ext: string) => {
    setDownloadingAudio(subId)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${(songTitle || 'track').replace(/[^a-zA-Z0-9-_ ]/g, '')}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Audio download failed:', err)
    } finally {
      setDownloadingAudio(null)
    }
  }

  const handleCopyLyrics = (lyrics: string, subId: string) => {
    navigator.clipboard.writeText(lyrics)
    setCopiedLyrics(subId)
    setTimeout(() => setCopiedLyrics(null), 2000)
  }

  const counts = {
    pending: submissions.length > 0 && filter !== 'all'
      ? submissions.filter(s => s.status === 'pending').length
      : 0,
    total: submissions.length,
  }

  const pendingCount = filter === 'pending' ? submissions.length : 0

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ]

  return (
    <AdminWrapper>
      <Container size="xl" className="py-8">
        <Stack gap="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <Music2 className="w-6 h-6 text-[#39FF14]" />
                  Song Publishing Review
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Review and approve songs submitted for publishing under Vibration Fit
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl w-fit">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <Card variant="glass" className="border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : submissions.length === 0 ? (
            <Card variant="glass" className="p-8 text-center">
              <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">
                {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => {
                const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending
                const userName = sub.user_accounts?.full_name
                  || [sub.user_accounts?.first_name, sub.user_accounts?.last_name].filter(Boolean).join(' ')
                  || sub.user_accounts?.email
                  || 'Unknown User'
                const isPlaying = playingTrackId === sub.track_id

                return (
                  <Card key={sub.id} variant="glass" className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Track artwork */}
                      <div className="flex-shrink-0">
                        {sub.song_tracks?.cover_url ? (
                          <div className="relative group">
                            <img
                              src={sub.song_tracks.cover_url}
                              alt={sub.songs?.title || 'Cover'}
                              className="w-24 h-24 rounded-xl object-cover"
                            />
                            <button
                              onClick={() => handleDownloadArt(sub.song_tracks!.cover_url!, sub.songs?.title || 'album-art', sub.id)}
                              disabled={downloadingArt === sub.id}
                              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Download album art"
                            >
                              {downloadingArt === sub.id ? (
                                <RefreshCw className="w-5 h-5 text-white animate-spin" />
                              ) : (
                                <Download className="w-5 h-5 text-white" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                            <Music2 className="w-8 h-8 text-[#39FF14]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {sub.songs?.title || 'Untitled Song'}
                            </h3>
                            <p className="text-sm text-neutral-400">
                              {sub.song_tracks?.title || `Version ${sub.song_tracks?.version || '?'}`}
                            </p>
                          </div>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                          <div>
                            <span className="text-neutral-500">Artist: </span>
                            <span className="text-white font-medium">Vibration Fit</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Songwriter Credit: </span>
                            <span className="text-white font-medium">{sub.songwriter_legal_name}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Submitted by: </span>
                            <span className="text-neutral-200">{userName}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Email: </span>
                            <span className="text-neutral-200">{sub.user_accounts?.email || '—'}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Royalty Split: </span>
                            <span className="text-neutral-200">{sub.royalty_split_percent}/{100 - sub.royalty_split_percent}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Submitted: </span>
                            <span className="text-neutral-200">
                              {new Date(sub.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* DistroKid Assets */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {sub.song_tracks?.mp3_url && (
                            <button
                              onClick={() => togglePlay(sub.song_tracks!.mp3_url!, sub.track_id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-colors"
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5" fill="currentColor" />
                              ) : (
                                <Play className="w-3.5 h-3.5" fill="currentColor" />
                              )}
                              {isPlaying ? 'Pause' : 'Play'}
                            </button>
                          )}
                          {(() => {
                            const meta = sub.song_tracks?.metadata
                            const wavUrl = meta?.mureka_wav_url
                            const mp3Url = sub.song_tracks?.mp3_url
                            const audioUrl = wavUrl || mp3Url
                            const ext = wavUrl ? 'wav' : 'mp3'
                            if (!audioUrl) return null
                            return (
                              <button
                                onClick={() => handleDownloadAudio(audioUrl, sub.songs?.title || 'track', sub.id, ext)}
                                disabled={downloadingAudio === sub.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-colors"
                                title={`Download ${ext.toUpperCase()}`}
                              >
                                {downloadingAudio === sub.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FileAudio className="w-3.5 h-3.5" />
                                )}
                                {downloadingAudio === sub.id ? 'Downloading...' : `Download ${ext.toUpperCase()}`}
                              </button>
                            )
                          })()}
                          {sub.song_tracks?.cover_url && (
                            <button
                              onClick={() => handleDownloadArt(sub.song_tracks!.cover_url!, sub.songs?.title || 'album-art', sub.id)}
                              disabled={downloadingArt === sub.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-colors"
                              title="Download 3000x3000 album art"
                            >
                              {downloadingArt === sub.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5" />
                              )}
                              {downloadingArt === sub.id ? 'Downloading...' : 'Download Art'}
                            </button>
                          )}
                        </div>

                        {/* Lyrics */}
                        {sub.songs?.lyrics && (
                          <div className="mb-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setExpandedLyrics(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                              >
                                {expandedLyrics[sub.id] ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                                {expandedLyrics[sub.id] ? 'Hide Lyrics' : 'Show Lyrics'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyLyrics(sub.songs!.lyrics!, sub.id)}
                                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-200 transition-colors"
                              >
                                {copiedLyrics === sub.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#39FF14]" />
                                    <span className="text-[#39FF14]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Lyrics
                                  </>
                                )}
                              </button>
                            </div>
                            {expandedLyrics[sub.id] && (
                              <pre className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 font-sans text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                                {sub.songs.lyrics}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* Admin notes (if rejected) */}
                        {sub.admin_notes && (
                          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 mb-3">
                            <p className="text-xs text-neutral-500 mb-1">Admin Notes</p>
                            <p className="text-sm text-neutral-300">{sub.admin_notes}</p>
                          </div>
                        )}

                        {/* Actions for pending */}
                        {sub.status === 'pending' && (
                          <div className="flex flex-wrap gap-2">
                            {rejectingId === sub.id ? (
                              <div className="flex flex-col gap-2 w-full">
                                <input
                                  type="text"
                                  value={rejectNotes}
                                  onChange={(e) => setRejectNotes(e.target.value)}
                                  placeholder="Rejection reason (optional)"
                                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleAction(sub.id, 'rejected', rejectNotes)}
                                    disabled={actionLoading === sub.id}
                                  >
                                    {actionLoading === sub.id ? 'Rejecting...' : 'Confirm Reject'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setRejectingId(null); setRejectNotes('') }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAction(sub.id, 'approved')}
                                  disabled={actionLoading === sub.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1.5" />
                                  {actionLoading === sub.id ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRejectingId(sub.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Actions for approved (uploaded to DistroKid) */}
                        {sub.status === 'approved' && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAction(sub.id, 'published')}
                              disabled={actionLoading === sub.id}
                            >
                              <Send className="w-4 h-4 mr-1.5" />
                              {actionLoading === sub.id ? 'Updating...' : 'Mark as Published'}
                            </Button>
                            <p className="text-[11px] text-neutral-600 w-full mt-0.5">
                              Use after uploading to DistroKid and confirming it&apos;s live on streaming platforms.
                            </p>
                          </div>
                        )}

                        {/* Reviewed info */}
                        {sub.reviewed_at && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-2">
                            <Clock className="w-3 h-3" />
                            Reviewed {new Date(sub.reviewed_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
