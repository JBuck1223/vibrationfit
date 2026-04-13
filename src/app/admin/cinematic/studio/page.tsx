'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container, Card, Button, Input, Stack, PageHero, Spinner,
  Modal, Badge,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  Sparkles, Play, Save, ChevronRight, Film, Image as ImageIcon,
  Video, ArrowRight, Edit3, RotateCcw, Scissors,
} from 'lucide-react'
import { toast } from 'sonner'
import { Monitor, Smartphone, Square } from 'lucide-react'
import type {
  CuSeries, CuCharacter, CuEpisode, ExecutionPlan,
  ExecutionPlanKeyframe, ExecutionPlanClip, StyleGuide, AspectRatio,
} from '@/lib/cinematic/types'

const ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: typeof Monitor }[] = [
  { value: 'landscape_16_9', label: '16:9', icon: Monitor },
  { value: 'portrait_9_16', label: '9:16', icon: Smartphone },
  { value: 'square_1_1', label: '1:1', icon: Square },
]

function StudioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seriesId = searchParams.get('series_id')

  const [series, setSeries] = useState<CuSeries | null>(null)
  const [characters, setCharacters] = useState<CuCharacter[]>([])
  const [episodes, setEpisodes] = useState<CuEpisode[]>([])
  const [loading, setLoading] = useState(true)

  // Studio state
  const [storyPrompt, setStoryPrompt] = useState('')
  const [episodeTitle, setEpisodeTitle] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait_9_16')
  const [plan, setPlan] = useState<ExecutionPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!seriesId) { setLoading(false); return }
    try {
      const [seriesRes, episodesRes] = await Promise.all([
        fetch(`/api/cinematic/series/${seriesId}`),
        fetch(`/api/cinematic/episodes?series_id=${seriesId}`),
      ])
      if (seriesRes.ok) {
        const d = await seriesRes.json()
        setSeries(d.series)
        setCharacters(d.series.cu_characters || [])
        const sg = d.series.style_guide as StyleGuide | null
        if (sg?.default_aspect_ratio) setAspectRatio(sg.default_aspect_ratio)
      }
      if (episodesRes.ok) {
        const d = await episodesRes.json()
        setEpisodes(d.episodes)
      }
    } catch {
      toast.error('Failed to load series data')
    } finally {
      setLoading(false)
    }
  }, [seriesId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleGeneratePlan = async () => {
    if (!storyPrompt.trim()) return
    setGenerating(true)
    setPlan(null)
    try {
      const res = await fetch('/api/cinematic/generate/execution-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_prompt: storyPrompt,
          series_id: seriesId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate plan')
      }
      const data = await res.json()
      setPlan(data.plan)
      toast.success('Execution plan generated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAsEpisode = async () => {
    if (!plan || !seriesId || !episodeTitle.trim()) return
    setSaving(true)
    try {
      // Create episode
      const epRes = await fetch('/api/cinematic/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series_id: seriesId,
          title: episodeTitle,
          concept: storyPrompt,
          target_aspect_ratio: aspectRatio,
        }),
      })
      if (!epRes.ok) throw new Error('Failed to create episode')
      const { episode } = await epRes.json()

      // Save plan and create keyframes/clips
      const saveRes = await fetch('/api/cinematic/generate/execution-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_prompt: storyPrompt,
          series_id: seriesId,
          episode_id: episode.id,
          save: true,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save plan')

      toast.success('Episode created with execution plan')
      router.push(`/admin/cinematic/${episode.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
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

  return (
    <Container size="xl">
      <Stack gap="lg">
      <PageHero
        title={series ? `Studio: ${series.title}` : 'Cinematic Studio'}
        subtitle="Enter a story concept and VIVA will produce a keyframe execution plan"
      />

      {/* Story Prompt Input */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Story Concept</h3>
        <div className="mb-4">
          <RecordingTextarea
            value={storyPrompt}
            onChange={setStoryPrompt}
            placeholder="Describe your video concept... e.g. 'What if things manifested instantly? Jordan thinks about an elephant and one appears in the living room. Vanessa thinks about waking up on the wrong side of the bed and falls into a giant hole.'"
            rows={5}
            recordingPurpose="quick"
            instanceId="cinematic-story-prompt"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleGeneratePlan}
            disabled={generating || !storyPrompt.trim()}
          >
            {generating ? (
              <><Spinner size="sm" className="mr-2" /> Generating Plan...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Execution Plan</>
            )}
          </Button>
          {characters.length > 0 && (
            <span className="text-sm text-zinc-500">
              {characters.length} character{characters.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>
      </Card>

      {/* Execution Plan Display */}
      {plan && (
        <div className="space-y-6">
          {/* Keyframes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#39FF14]" />
                Keyframes ({plan.keyframes.length})
              </h3>
            </div>
            <div className="space-y-3">
              {plan.keyframes.map((kf) => (
                <KeyframeCard key={kf.sort_order} keyframe={kf} clips={plan.clips} />
              ))}
            </div>
          </Card>

          {/* Clips */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[#00FFFF]" />
                Video Clips ({plan.clips.length})
              </h3>
            </div>
            <div className="space-y-3">
              {plan.clips.map((clip) => (
                <ClipCard key={clip.sort_order} clip={clip} />
              ))}
            </div>
          </Card>

          {/* Narrative Beats */}
          {plan.narrative_beats && plan.narrative_beats.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Narrative Beats</h3>
              <div className="flex gap-3 flex-wrap">
                {plan.narrative_beats.map((beat, i) => (
                  <div key={i} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700">
                    <span className="text-sm font-medium text-white">{beat.title}</span>
                    <span className="text-xs text-zinc-500 ml-2">
                      KF {beat.keyframe_range_start}-{beat.keyframe_range_end}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Save as Episode */}
          <Card className="p-6 border-[#39FF14]/30">
            <h3 className="text-lg font-semibold text-white mb-4">Save as Episode</h3>
            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-500 mb-2 block">Aspect Ratio</label>
              <div className="flex gap-2">
                {ASPECT_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const active = aspectRatio === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAspectRatio(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                placeholder="Episode title"
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleSaveAsEpisode}
                disabled={saving || !episodeTitle.trim()}
              >
                {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4 mr-2" /> Save & Open</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Existing Episodes */}
      {episodes.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Episodes</h3>
          <Stack gap="sm">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/cinematic/${ep.id}`)}
              >
                <div>
                  <span className="text-white font-medium">{ep.title}</span>
                  <span className="text-xs text-zinc-500 ml-3">{ep.status}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            ))}
          </Stack>
        </Card>
      )}
      </Stack>
    </Container>
  )
}

function KeyframeCard({ keyframe, clips }: { keyframe: ExecutionPlanKeyframe; clips: ExecutionPlanClip[] }) {
  const usedIn = clips.filter(
    (c) => c.first_frame_keyframe === keyframe.sort_order || c.last_frame_keyframe === keyframe.sort_order
  )

  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#39FF14]/20 text-[#39FF14] flex items-center justify-center text-xs font-bold">
            {keyframe.sort_order}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            keyframe.generation_approach === 'image_edit'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-green-500/20 text-green-400'
          }`}>
            {keyframe.generation_approach === 'image_edit' ? 'Edit' : 'Generate'}
          </span>
        </div>
        {usedIn.length > 0 && (
          <span className="text-xs text-zinc-500">
            Used in {usedIn.length} clip{usedIn.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-300 mb-2">{keyframe.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
        {keyframe.characters.length > 0 && (
          <span>Characters: {keyframe.characters.join(', ')}</span>
        )}
        {keyframe.camera && <span>Camera: {keyframe.camera}</span>}
        {keyframe.lens && <span>Lens: {keyframe.lens}</span>}
        {keyframe.lighting && <span>Lighting: {keyframe.lighting}</span>}
        {keyframe.emotional_beat && (
          <span className="text-[#BF00FF]">Emotion: {keyframe.emotional_beat}</span>
        )}
      </div>
    </div>
  )
}

function ClipCard({ clip }: { clip: ExecutionPlanClip }) {
  const isJumpCut = clip.transition_type === 'jump_cut'

  return (
    <div className={`p-4 rounded-xl bg-zinc-800/50 border ${isJumpCut ? 'border-[#FF0040]/40' : 'border-zinc-700'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-7 h-7 rounded-full bg-[#00FFFF]/20 text-[#00FFFF] flex items-center justify-center text-xs font-bold">
          {clip.sort_order}
        </span>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span className="px-1.5 py-0.5 rounded bg-zinc-700">KF {clip.first_frame_keyframe}</span>
          {isJumpCut ? (
            <Scissors className="w-3 h-3 text-[#FF0040]" />
          ) : (
            <ArrowRight className="w-3 h-3" />
          )}
          <span className="px-1.5 py-0.5 rounded bg-zinc-700">KF {clip.last_frame_keyframe}</span>
        </div>
        {isJumpCut && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FF0040]/20 text-[#FF0040]">
            JUMP CUT
          </span>
        )}
        <span className="text-xs text-zinc-500">{clip.duration_seconds}s</span>
      </div>
      <p className="text-sm text-zinc-300 mb-1">{clip.action}</p>
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
        {clip.camera_motion && <span>Camera: {clip.camera_motion}</span>}
        {clip.emotional_beat && (
          <span className="text-[#BF00FF]">Emotion: {clip.emotional_beat}</span>
        )}
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <AdminWrapper>
      <StudioContent />
    </AdminWrapper>
  )
}
