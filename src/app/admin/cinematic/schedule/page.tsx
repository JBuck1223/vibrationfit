'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Calendar, Plus, Trash2, Send, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { CuScheduledPost, ScheduledPostStatus } from '@/lib/cinematic/types'

type PostWithEpisode = CuScheduledPost & {
  cu_episodes: { id: string; title: string; series_id: string; cu_series: { id: string; title: string } } | null
}

const STATUS_STYLES: Record<ScheduledPostStatus, { bg: string; icon: typeof Clock }> = {
  scheduled: { bg: 'bg-blue-500/20 text-blue-400', icon: Clock },
  publishing: { bg: 'bg-yellow-500/20 text-yellow-400', icon: Send },
  posted: { bg: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  failed: { bg: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
  cancelled: { bg: 'bg-zinc-500/20 text-zinc-400', icon: XCircle },
}

function ScheduleContent() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<PostWithEpisode[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  const [newEpisodeId, setNewEpisodeId] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newHashtags, setNewHashtags] = useState('')
  const [newScheduledAt, setNewScheduledAt] = useState('')
  const [newPlatforms, setNewPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/cinematic/schedule')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPosts(data.posts)
    } catch {
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleAdd = async () => {
    if (!newEpisodeId || !newScheduledAt) return
    setSaving(true)
    try {
      const res = await fetch('/api/cinematic/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_id: newEpisodeId,
          caption: newCaption,
          hashtags: newHashtags,
          scheduled_at: new Date(newScheduledAt).toISOString(),
          platforms: newPlatforms,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('Post scheduled')
      setShowAddModal(false)
      setNewEpisodeId('')
      setNewCaption('')
      setNewHashtags('')
      setNewScheduledAt('')
      setNewPlatforms([])
      fetchPosts()
    } catch {
      toast.error('Failed to schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await fetch('/api/cinematic/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      })
      toast.success('Post cancelled')
      fetchPosts()
    } catch {
      toast.error('Failed to cancel')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled post?')) return
    try {
      await fetch(`/api/cinematic/schedule?id=${id}`, { method: 'DELETE' })
      toast.success('Post deleted')
      fetchPosts()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const togglePlatform = (platform: string) => {
    setNewPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const groupedByDate = posts.reduce<Record<string, PostWithEpisode[]>>((acc, post) => {
    const date = new Date(post.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  return (
    <Container size="xl">
      <Stack gap="lg">
      <PageHero title="Content Calendar" subtitle="Schedule and manage cinematic video posts" />

      <div className="flex items-center justify-between">
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Post
        </Button>
      </div>

      {Object.keys(groupedByDate).length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
          <p className="text-zinc-400">No posts scheduled yet.</p>
        </Card>
      ) : (
        <Stack gap="lg">
          {Object.entries(groupedByDate).map(([date, datePosts]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">{date}</h3>
              <Stack gap="sm">
                {datePosts.map((post) => {
                  const statusInfo = STATUS_STYLES[post.status]
                  const StatusIcon = statusInfo.icon
                  return (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg}`}>
                              <StatusIcon className="w-3 h-3" /> {post.status}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {post.platforms.length > 0 && (
                              <span className="text-xs text-zinc-500">
                                {post.platforms.join(', ')}
                              </span>
                            )}
                          </div>
                          {post.cu_episodes && (
                            <p className="text-sm text-white font-medium">
                              {post.cu_episodes.cu_series?.title} - {post.cu_episodes.title}
                            </p>
                          )}
                          {post.caption && (
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{post.caption}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {post.status === 'scheduled' && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancel(post.id)}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </Stack>
            </div>
          ))}
        </Stack>
      )}

      </Stack>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Schedule Post">
        <Stack gap="md">
          <Input label="Episode ID" value={newEpisodeId} onChange={(e) => setNewEpisodeId(e.target.value)}
            placeholder="Paste episode UUID" />
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Caption</label>
            <RecordingTextarea
              value={newCaption}
              onChange={setNewCaption}
              rows={3}
              placeholder="Post caption..."
              recordingPurpose="quick"
              instanceId="cinematic-schedule-caption"
            />
          </div>
          <Input label="Hashtags" value={newHashtags} onChange={(e) => setNewHashtags(e.target.value)}
            placeholder="#manifestation #comedy #whatif" />
          <Input label="Schedule Date/Time" type="datetime-local" value={newScheduledAt}
            onChange={(e) => setNewScheduledAt(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {['instagram_reels', 'tiktok', 'youtube_shorts', 'facebook', 'twitter'].map((p) => (
                <Button key={p} variant={newPlatforms.includes(p) ? 'primary' : 'ghost'} size="sm"
                  onClick={() => togglePlatform(p)}>
                  {p.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="primary" onClick={handleAdd} disabled={saving || !newEpisodeId || !newScheduledAt}>
            {saving ? <Spinner size="sm" /> : 'Schedule Post'}
          </Button>
        </Stack>
      </Modal>
    </Container>
  )
}

export default function SchedulePage() {
  return (
    <AdminWrapper>
      <ScheduleContent />
    </AdminWrapper>
  )
}
