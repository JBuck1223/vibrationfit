'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container, Card, Button, Stack, PageHero, Spinner, Badge,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  Play, CheckCircle, XCircle, RotateCcw, Image as ImageIcon,
  Video, ArrowRight, AlertTriangle, Pause, ChevronLeft, Zap, Scissors, Film,
  History, Undo2, Pencil, Save, Clock, Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Monitor, Smartphone, Square } from 'lucide-react'
import type { CuEpisode, EpisodeStatus, AspectRatio } from '@/lib/cinematic/types'
import { FAL_VIDEO_MODELS, type VideoModelDef } from '@/lib/cinematic/fal-models'

const ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: typeof Monitor }[] = [
  { value: 'landscape_16_9', label: '16:9', icon: Monitor },
  { value: 'portrait_9_16', label: '9:16', icon: Smartphone },
  { value: 'square_1_1', label: '1:1', icon: Square },
]
import RoughDraftPlayer from '@/components/cinematic/RoughDraftPlayer'

type PrevVersion = {
  media_id: string
  media_url: string
  fal_model?: string
  generated_at: string
}

type KeyframeRow = {
  id: string
  sort_order: number
  description: string
  prompt: string | null
  status: string
  fal_model: string | null
  generated_media_id: string | null
  generated_media: { id: string; url: string; file_type: string } | null
  generation_metadata: Record<string, unknown> | null
}

type ClipRow = {
  id: string
  sort_order: number
  transition_type: 'chain' | 'jump_cut'
  prompt: string | null
  status: string
  duration_seconds: number
  fal_model: string | null
  generated_media: { id: string; url: string; file_type: string } | null
  first_frame_kf: { id: string; sort_order: number; status: string; generated_media: { url: string } | null } | null
  last_frame_kf: { id: string; sort_order: number; status: string; generated_media: { url: string } | null } | null
  generation_metadata: Record<string, unknown> | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-600/30 text-zinc-400',
  generating: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
  complete: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
  waiting_keyframes: 'bg-zinc-600/30 text-zinc-400',
}

function EpisodeContent() {
  const { episodeId } = useParams<{ episodeId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [episode, setEpisode] = useState<CuEpisode | null>(null)
  const [keyframes, setKeyframes] = useState<KeyframeRow[]>([])
  const [clips, setClips] = useState<ClipRow[]>([])
  const [runningKeyframes, setRunningKeyframes] = useState(false)
  const [runningClips, setRunningClips] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [promptDraft, setPromptDraft] = useState('')
  const [editingClip, setEditingClip] = useState<string | null>(null)
  const [clipPromptDraft, setClipPromptDraft] = useState('')
  const [clipDurationDraft, setClipDurationDraft] = useState(6)
  const [clipModelDraft, setClipModelDraft] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/cinematic/episodes/${episodeId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setEpisode(data.episode)
      setKeyframes(data.keyframes || [])
      setClips(data.clips || [])
    } catch {
      toast.error('Failed to load episode')
    } finally {
      setLoading(false)
    }
  }, [episodeId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh while generation is running so UI shows progress
  useEffect(() => {
    if (!runningKeyframes && !runningClips) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [runningKeyframes, runningClips, fetchData])

  const updateAspectRatio = async (ratio: AspectRatio) => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_aspect_ratio: ratio }),
      })
      fetchData()
    } catch {
      toast.error('Failed to update aspect ratio')
    }
  }

  const updateKeyframeStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}/keyframes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyframe_id: id, status }),
      })
      fetchData()
    } catch {
      toast.error('Failed to update')
    }
  }

  const revertKeyframe = async (keyframeId: string, mediaId: string) => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}/keyframes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyframe_id: keyframeId, revert_to_media_id: mediaId }),
      })
      toast.success('Reverted to previous version')
      fetchData()
    } catch {
      toast.error('Failed to revert')
    }
  }

  const saveKeyframePrompt = async (keyframeId: string, prompt: string) => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}/keyframes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyframe_id: keyframeId, prompt }),
      })
      setEditingPrompt(null)
      toast.success('Prompt updated')
      fetchData()
    } catch {
      toast.error('Failed to save prompt')
    }
  }

  const saveClipSettings = async (clipId: string, prompt: string, duration: number, model?: string) => {
    try {
      const payload: Record<string, unknown> = { clip_id: clipId, prompt, duration_seconds: duration }
      if (model) payload.fal_model = model
      await fetch(`/api/cinematic/episodes/${episodeId}/clips`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setEditingClip(null)
      toast.success('Clip updated')
      fetchData()
    } catch {
      toast.error('Failed to save clip')
    }
  }

  const updateClipStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}/clips`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_id: id, status }),
      })
      fetchData()
    } catch {
      toast.error('Failed to update')
    }
  }

  const runKeyframeQueue = async () => {
    setRunningKeyframes(true)
    toast.info('Keyframe generation started -- runs server-side, safe to navigate away')
    try {
      const res = await fetch(`/api/cinematic/episodes/${episodeId}/queue/keyframes`, {
        method: 'POST',
      })
      const result = await res.json()
      if (result.failed > 0) {
        toast.error(`${result.failed} keyframe(s) failed`)
      }
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} keyframe(s) generated`)
      }
      if (result.allComplete) {
        toast.success('All keyframes complete')
      }
    } catch {
      toast.error('Queue error')
    }
    await fetchData()
    setRunningKeyframes(false)
  }

  const runClipQueue = async () => {
    setRunningClips(true)
    toast.info('Clip generation started -- runs server-side, safe to navigate away')
    try {
      const res = await fetch(`/api/cinematic/episodes/${episodeId}/queue/clips`, {
        method: 'POST',
      })
      const result = await res.json()
      if (result.failed > 0) {
        toast.error(`${result.failed} clip(s) failed`)
      }
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} clip(s) generated`)
      }
      if (result.allComplete) {
        toast.success('All clips complete')
      }
    } catch {
      toast.error('Queue error')
    }
    await fetchData()
    setRunningClips(false)
  }

  const resetStuck = async () => {
    try {
      await fetch(`/api/cinematic/episodes/${episodeId}/queue/reset`, { method: 'POST' })
      toast.success('Reset stuck items')
      fetchData()
    } catch {
      toast.error('Failed to reset')
    }
  }

  const generateSingleKeyframe = async (kfId: string) => {
    try {
      toast.info('Generating keyframe...')
      const res = await fetch('/api/cinematic/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyframe_id: kfId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Keyframe generated')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const generateSingleClip = async (clipId: string) => {
    try {
      toast.info('Generating video clip...')
      const res = await fetch('/api/cinematic/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_id: clipId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Clip generated')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
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

  if (!episode) {
    return (
      <Container size="xl">
        <p className="text-center text-zinc-400 py-12">Episode not found</p>
      </Container>
    )
  }

  const allKeyframesApproved = keyframes.length > 0 && keyframes.every((kf) => kf.status === 'approved')
  const allClipsApproved = clips.length > 0 && clips.every((c) => c.status === 'approved')

  return (
    <Container size="xl">
      <Stack gap="lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <PageHero
          title={episode.title}
          subtitle={`Status: ${episode.status}`}
          className="flex-1"
        />
        <div className="flex gap-1.5">
          {ASPECT_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = episode.target_aspect_ratio === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => updateAspectRatio(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/40'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-500'
                }`}
                title={`Set to ${opt.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={runKeyframeQueue}
            disabled={runningKeyframes || keyframes.length === 0}
          >
            {runningKeyframes ? (
              <><Spinner size="sm" className="mr-2" /> Running Keyframes...</>
            ) : (
              <><ImageIcon className="w-4 h-4 mr-2" /> Run Keyframe Queue</>
            )}
          </Button>
          <Button
            variant={allKeyframesApproved ? 'primary' : 'ghost'}
            onClick={runClipQueue}
            disabled={runningClips || !allKeyframesApproved}
          >
            {runningClips ? (
              <><Spinner size="sm" className="mr-2" /> Running Clips...</>
            ) : (
              <><Video className="w-4 h-4 mr-2" /> Run Clip Queue</>
            )}
          </Button>
          <Button variant="ghost" onClick={resetStuck}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Stuck
          </Button>
        </div>
        {!allKeyframesApproved && keyframes.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2">
            Approve all keyframes before generating video clips.
          </p>
        )}
      </Card>

      {/* Rough Draft Preview */}
      {clips.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-[#BF00FF]" />
              Rough Draft Preview
            </h3>
          </div>
          <RoughDraftPlayer clips={clips} keyframes={keyframes} />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keyframes Panel */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#39FF14]" />
            Keyframes ({keyframes.length})
          </h3>
          <Stack gap="md">
            {keyframes.map((kf) => (
              <Card key={kf.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#39FF14]/20 text-[#39FF14] flex items-center justify-center text-xs font-bold">
                      {kf.sort_order}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[kf.status] || ''}`}>
                      {kf.status}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(kf.status === 'pending' || kf.status === 'failed' || kf.status === 'rejected') && (
                      <Button variant="ghost" size="sm" onClick={() => generateSingleKeyframe(kf.id)} title="Generate">
                        <Zap className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {kf.status === 'complete' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => updateKeyframeStatus(kf.id, 'approved')} title="Approve">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => updateKeyframeStatus(kf.id, 'rejected')} title="Reject">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => generateSingleKeyframe(kf.id)} title="Re-generate">
                          <RotateCcw className="w-3.5 h-3.5 text-[#00FFFF]" />
                        </Button>
                      </>
                    )}
                    {kf.status === 'approved' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => updateKeyframeStatus(kf.id, 'rejected')} title="Reject">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => generateSingleKeyframe(kf.id)} title="Re-generate">
                          <RotateCcw className="w-3.5 h-3.5 text-[#00FFFF]" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {kf.generated_media?.url && (
                  <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900">
                    <img
                      src={kf.generated_media.url}
                      alt={`Keyframe ${kf.sort_order}`}
                      className="w-full h-auto max-h-48 object-contain"
                    />
                  </div>
                )}

                {(() => {
                  const prevVersions = (kf.generation_metadata?.previous_versions as PrevVersion[] | undefined) || []
                  if (prevVersions.length === 0) return null
                  const isExpanded = expandedHistory === kf.id
                  return (
                    <div className="mb-2">
                      <button
                        onClick={() => setExpandedHistory(isExpanded ? null : kf.id)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <History className="w-3 h-3" />
                        {prevVersions.length} previous version{prevVersions.length > 1 ? 's' : ''}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {prevVersions.map((v, idx) => (
                            <div
                              key={`${v.media_id}-${idx}`}
                              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 group"
                            >
                              <img
                                src={v.media_url}
                                alt="Previous version"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => revertKeyframe(kf.id, v.media_id)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5"
                                title={`Revert to version from ${new Date(v.generated_at).toLocaleDateString()}`}
                              >
                                <Undo2 className="w-4 h-4 text-[#00FFFF]" />
                                <span className="text-[10px] text-zinc-300">Revert</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <p className="text-sm text-zinc-400 mb-2">{kf.description}</p>

                {editingPrompt === kf.id ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">Generation Prompt</label>
                    <RecordingTextarea
                      value={promptDraft}
                      onChange={setPromptDraft}
                      placeholder="Describe what this keyframe should look like..."
                      rows={3}
                      recordingPurpose="quick"
                      instanceId={`kf-prompt-${kf.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveKeyframePrompt(kf.id, promptDraft)}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPrompt(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingPrompt(kf.id)
                      setPromptDraft(kf.prompt || kf.description || '')
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
                  >
                    <Pencil className="w-3 h-3" />
                    {kf.prompt ? 'Edit prompt' : 'Add custom prompt'}
                  </button>
                )}

                {kf.prompt && editingPrompt !== kf.id && (
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2 italic">
                    {kf.prompt}
                  </p>
                )}
              </Card>
            ))}
          </Stack>
        </div>

        {/* Clips Panel */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#00FFFF]" />
            Video Clips ({clips.length})
          </h3>
          <Stack gap="md">
            {clips.map((clip) => {
              const isJumpCut = clip.transition_type === 'jump_cut'
              return (
              <Card key={clip.id} className={`p-4 ${isJumpCut ? 'border-[#FF0040]/30' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#00FFFF]/20 text-[#00FFFF] flex items-center justify-center text-xs font-bold">
                      {clip.sort_order}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <span className="px-1 py-0.5 rounded bg-zinc-700">KF {clip.first_frame_kf?.sort_order}</span>
                      {isJumpCut ? (
                        <Scissors className="w-3 h-3 text-[#FF0040]" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                      <span className="px-1 py-0.5 rounded bg-zinc-700">KF {clip.last_frame_kf?.sort_order}</span>
                    </div>
                    {isJumpCut && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FF0040]/20 text-[#FF0040]">
                        JUMP CUT
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[clip.status] || ''}`}>
                      {clip.status}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(clip.status === 'pending' || clip.status === 'waiting_keyframes' || clip.status === 'failed' || clip.status === 'rejected') && (
                      <Button variant="ghost" size="sm" onClick={() => generateSingleClip(clip.id)} title="Generate">
                        <Zap className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {clip.status === 'complete' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => updateClipStatus(clip.id, 'approved')} title="Approve">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => updateClipStatus(clip.id, 'rejected')} title="Reject">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Keyframe thumbnails */}
                <div className="flex items-center gap-2 mb-2">
                  {clip.first_frame_kf?.generated_media?.url ? (
                    <div className="w-20 h-12 rounded overflow-hidden bg-zinc-900">
                      <img src={clip.first_frame_kf.generated_media.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded bg-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                  <ArrowRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  {clip.last_frame_kf?.generated_media?.url ? (
                    <div className="w-20 h-12 rounded overflow-hidden bg-zinc-900">
                      <img src={clip.last_frame_kf.generated_media.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded bg-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                </div>

                {clip.generated_media?.url && (
                  <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900">
                    <video
                      src={clip.generated_media.url}
                      controls
                      className="w-full max-h-48"
                    />
                  </div>
                )}

                {editingClip === clip.id ? (
                  <div className="space-y-3 mt-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Clip Prompt</label>
                      <RecordingTextarea
                        value={clipPromptDraft}
                        onChange={setClipPromptDraft}
                        placeholder="Describe the motion, camera work, and mood for this clip..."
                        rows={3}
                        recordingPurpose="quick"
                        instanceId={`clip-prompt-${clip.id}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Duration (seconds)</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[4, 5, 6, 8, 10, 15].map((d) => (
                          <button
                            key={d}
                            onClick={() => setClipDurationDraft(d)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              clipDurationDraft === d
                                ? 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                            }`}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Video Model</label>
                      <select
                        value={clipModelDraft}
                        onChange={(e) => setClipModelDraft(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FFFF]/50"
                      >
                        {FAL_VIDEO_MODELS.filter((m) => m.features.includes('first-last-frame') || m.features.includes('image-to-video')).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.durations.join('/')}) {m.features.includes('native-audio') ? '+ Audio' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveClipSettings(clip.id, clipPromptDraft, clipDurationDraft, clipModelDraft)}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingClip(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1 min-w-0">
                      {clip.prompt ? (
                        <p className="text-sm text-zinc-400 truncate">{clip.prompt}</p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">No prompt set</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {clip.fal_model && (
                        <span className="text-xs text-zinc-600 truncate max-w-[120px]" title={clip.fal_model}>
                          {FAL_VIDEO_MODELS.find((m) => m.id === clip.fal_model)?.label || clip.fal_model.split('/').pop()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {clip.duration_seconds}s
                      </span>
                      <button
                        onClick={() => {
                          setEditingClip(clip.id)
                          setClipPromptDraft(clip.prompt || '')
                          setClipDurationDraft(clip.duration_seconds)
                          setClipModelDraft(clip.fal_model || '')
                        }}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Edit prompt & duration"
                      >
                        <Settings2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
              )
            })}
          </Stack>
        </div>
      </div>
      </Stack>
    </Container>
  )
}

export default function EpisodePage() {
  return (
    <AdminWrapper>
      <EpisodeContent />
    </AdminWrapper>
  )
}
