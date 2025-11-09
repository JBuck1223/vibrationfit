'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Badge,
  Input,
  Textarea,
  Select,
  Spinner,
} from '@/lib/design-system/components'
import { renderVoiceProfileForPrompt } from '@/lib/viva/voice-profile'

const wordFlowOptions = [
  { value: 'simple_direct', label: 'Simple & Direct' },
  { value: 'balanced_expressive', label: 'Balanced & Expressive' },
  { value: 'lyrical_reflective', label: 'Lyrical & Reflective' },
]

const emotionalRangeOptions = [
  { value: 'grounded', label: 'Grounded' },
  { value: 'warm_genuine', label: 'Warm & Genuine' },
  { value: 'passionate_vibrant', label: 'Passionate & Vibrant' },
]

const detailLevelOptions = [
  { value: 'clean_focused', label: 'Clean & Focused' },
  { value: 'sensory_balanced', label: 'Sensory Balanced' },
  { value: 'immersive_cinematic', label: 'Immersive & Cinematic' },
]

const energyTempoOptions = [
  { value: 'steady_measured', label: 'Steady & Measured' },
  { value: 'upbeat_flowing', label: 'Upbeat & Flowing' },
  { value: 'spirited_fast', label: 'Spirited & Dynamic' },
]

const wooLevelOptions = [
  { value: '1', label: 'Level 1 · Grounded' },
  { value: '2', label: 'Level 2 · Balanced' },
  { value: '3', label: 'Level 3 · Spiritual' },
]

const humorPersonalityOptions = [
  { value: 'grounded_sincere', label: 'Grounded & Sincere' },
  { value: 'lighthearted_approachable', label: 'Lighthearted & Approachable' },
  { value: 'playful_bold', label: 'Playful & Bold' },
]

const speechRhythmOptions = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'warm_conversational', label: 'Warm & Conversational' },
  { value: 'distinct_rooted', label: 'Distinct & Rooted' },
]

const emotionalIntensityOptions = [
  { value: 'low', label: 'Low · Soft & Understated' },
  { value: 'medium', label: 'Medium · Balanced' },
  { value: 'high', label: 'High · Fully Expressed' },
]

const narrativePreferenceOptions = [
  { value: 'short_affirmations', label: 'Short Affirmations' },
  { value: 'compact_scenes', label: 'Compact Scenes' },
  { value: 'story_mode', label: 'Story Mode' },
]

const depthPreferenceOptions = [
  { value: 'surface_light', label: 'Surface & Light' },
  { value: 'balanced', label: 'Balanced Depth' },
  { value: 'deep_reflective', label: 'Deep & Reflective' },
]

interface VoiceProfileVersion {
  id: string
  user_id: string
  word_flow: string
  emotional_range: string
  detail_level: string
  energy_tempo: string
  woo_level: number
  humor_personality: string
  speech_rhythm: string
  emotional_intensity_preference?: string | null
  narrative_preference?: string | null
  depth_preference?: string | null
  style_label?: string | null
  forbidden_styles?: string[] | null
  sample_phrases?: string[] | null
  source?: string | null
  is_active?: boolean | null
  created_at?: string | null
  last_refined_at?: string | null
  versionNumber: number
}

interface VoiceProfileResponse {
  profile: VoiceProfileVersion | null
  versions: VoiceProfileVersion[]
}

interface FormState {
  word_flow: string
  emotional_range: string
  detail_level: string
  energy_tempo: string
  woo_level: string
  humor_personality: string
  speech_rhythm: string
  emotional_intensity_preference: string
  narrative_preference: string
  depth_preference: string
  style_label: string
  forbidden_styles_text: string
  sample_phrases_text: string
}

const defaultForm: FormState = {
  word_flow: 'balanced_expressive',
  emotional_range: 'warm_genuine',
  detail_level: 'sensory_balanced',
  energy_tempo: 'upbeat_flowing',
  woo_level: '2',
  humor_personality: 'lighthearted_approachable',
  speech_rhythm: 'warm_conversational',
  emotional_intensity_preference: 'medium',
  narrative_preference: 'compact_scenes',
  depth_preference: 'balanced',
  style_label: 'Balanced, warm, and expressive in a natural way.',
  forbidden_styles_text: '',
  sample_phrases_text: '',
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function toMultiline(list?: string[] | null): string {
  if (!list || list.length === 0) return ''
  return list.join('\n')
}

function parseMultiline(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function sourceLabel(source?: string | null): string {
  switch (source) {
    case 'quiz':
      return 'Quiz'
    case 'ai_analysis':
      return 'Analyzer'
    case 'manual_edit':
      return 'Manual Edit'
    case 'hybrid':
      return 'Hybrid'
    default:
      return 'Unknown'
  }
}

export default function VoiceProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [profile, setProfile] = useState<VoiceProfileVersion | null>(null)
  const [versions, setVersions] = useState<VoiceProfileVersion[]>([])
  const [form, setForm] = useState<FormState>(defaultForm)
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const response = await fetch('/api/voice-profile', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load voice profile.')
      }
      const data = (await response.json()) as VoiceProfileResponse
      setProfile(data.profile)
      setVersions(data.versions)
      if (data.profile) {
        setForm({
          word_flow: data.profile.word_flow,
          emotional_range: data.profile.emotional_range,
          detail_level: data.profile.detail_level,
          energy_tempo: data.profile.energy_tempo,
          woo_level: String(data.profile.woo_level ?? 2),
          humor_personality: data.profile.humor_personality,
          speech_rhythm: data.profile.speech_rhythm,
          emotional_intensity_preference: data.profile.emotional_intensity_preference ?? 'medium',
          narrative_preference: data.profile.narrative_preference ?? 'compact_scenes',
          depth_preference: data.profile.depth_preference ?? 'balanced',
          style_label: data.profile.style_label ?? defaultForm.style_label,
          forbidden_styles_text: toMultiline(data.profile.forbidden_styles),
          sample_phrases_text: toMultiline(data.profile.sample_phrases),
        })
        setSelectedVersionId(data.profile.id ?? '')
      } else {
        setForm(defaultForm)
        setSelectedVersionId('')
      }
    } catch (error) {
      console.error('voice_profile load error', error)
      setErrorMessage('Unable to load voice profile. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const promptPreview = useMemo(() => {
    const current: Partial<VoiceProfileVersion> = {
      word_flow: form.word_flow,
      emotional_range: form.emotional_range,
      detail_level: form.detail_level,
      energy_tempo: form.energy_tempo,
      woo_level: Number(form.woo_level),
      humor_personality: form.humor_personality,
      speech_rhythm: form.speech_rhythm,
      emotional_intensity_preference: form.emotional_intensity_preference,
      narrative_preference: form.narrative_preference,
      depth_preference: form.depth_preference,
      style_label: form.style_label,
      forbidden_styles: parseMultiline(form.forbidden_styles_text),
      sample_phrases: parseMultiline(form.sample_phrases_text),
    }
    return renderVoiceProfileForPrompt(current as any)
  }, [form])

  const handleFormChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSelectChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setStatusMessage(null)
      setErrorMessage(null)

      const response = await fetch('/api/voice-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_profile: {
            word_flow: form.word_flow,
            emotional_range: form.emotional_range,
            detail_level: form.detail_level,
            energy_tempo: form.energy_tempo,
            woo_level: Number(form.woo_level),
            humor_personality: form.humor_personality,
            speech_rhythm: form.speech_rhythm,
            emotional_intensity_preference: form.emotional_intensity_preference,
            narrative_preference: form.narrative_preference,
            depth_preference: form.depth_preference,
            style_label: form.style_label,
            forbidden_styles: parseMultiline(form.forbidden_styles_text),
            sample_phrases: parseMultiline(form.sample_phrases_text),
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save voice profile.')
      }

      setStatusMessage('Voice profile saved as a new version.')
      await loadData()
    } catch (error) {
      console.error('voice_profile save error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save voice profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleVersionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVersionId(event.target.value)
    const version = versions.find((item) => item.id === event.target.value)
    if (version) {
      setForm({
        word_flow: version.word_flow,
        emotional_range: version.emotional_range,
        detail_level: version.detail_level,
        energy_tempo: version.energy_tempo,
        woo_level: String(version.woo_level ?? 2),
        humor_personality: version.humor_personality,
        speech_rhythm: version.speech_rhythm,
        emotional_intensity_preference: version.emotional_intensity_preference ?? 'medium',
        narrative_preference: version.narrative_preference ?? 'compact_scenes',
        depth_preference: version.depth_preference ?? 'balanced',
        style_label: version.style_label ?? defaultForm.style_label,
        forbidden_styles_text: toMultiline(version.forbidden_styles),
        sample_phrases_text: toMultiline(version.sample_phrases),
      })
    }
  }

  const handleActivate = async () => {
    if (!selectedVersionId) return
    try {
      setActivating(true)
      setStatusMessage(null)
      setErrorMessage(null)

      const response = await fetch('/api/voice-profile/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVersionId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to activate voice profile.')
      }

      setStatusMessage('Voice profile activated.')
      await loadData()
    } catch (error) {
      console.error('voice_profile activate error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to activate voice profile.')
    } finally {
      setActivating(false)
    }
  }

  const versionsOptions = versions.map((version) => ({
    value: version.id,
    label: `Version ${version.versionNumber} · ${sourceLabel(version.source)} · ${formatDate(version.created_at)}`,
  }))

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Voice Profile</h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-3xl">
            Adjust how VIVA writes for you. Save manual edits, run the analyzer, or revisit quiz-based versions. The
            active version powers scenes, visions, and reflections across the app.
          </p>
          <Inline gap="sm" wrap>
            <Button variant="secondary" size="sm" onClick={() => router.push('/voice-profile/quiz')}>
              Start / Update Quiz
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/voice-profile/analyze')}>
              Run Analyzer
            </Button>
          </Inline>
        </Stack>

        {loading ? (
          <Card className="p-6 text-center">
            <Inline gap="sm" justify="center" align="center">
              <Spinner size="sm" />
              <span className="text-neutral-300">Loading voice profile…</span>
            </Inline>
          </Card>
        ) : (
          <Stack gap="lg">
            <Card className="p-6 space-y-4">
              <Stack gap="sm">
                <Inline gap="sm" align="center" wrap>
                  <h2 className="text-xl md:text-2xl font-semibold text-white">Current Profile Overview</h2>
                  {profile ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="warning">Not Set</Badge>
                  )}
                  {profile?.source && <Badge variant="info">{sourceLabel(profile.source)}</Badge>}
                </Inline>
                <p className="text-neutral-400 text-sm md:text-base">
                  Version {profile?.versionNumber ?? '—'} · Last updated {formatDate(profile?.created_at)} · Last refined{' '}
                  {formatDate(profile?.last_refined_at)}
                </p>
              </Stack>
              <pre className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-200 whitespace-pre-wrap">
                {promptPreview}
              </pre>
            </Card>

            <Card className="p-6 space-y-6">
              <Stack gap="sm">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Edit Voice Profile</h2>
                <p className="text-sm text-neutral-400">
                  Adjust any sliders, then save to create a new manual version. Saved versions appear in the dropdown below.
                </p>
              </Stack>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Word Flow" value={form.word_flow} onChange={handleSelectChange('word_flow')} options={wordFlowOptions} />
                <Select label="Emotional Tone" value={form.emotional_range} onChange={handleSelectChange('emotional_range')} options={emotionalRangeOptions} />
                <Select label="Detail Level" value={form.detail_level} onChange={handleSelectChange('detail_level')} options={detailLevelOptions} />
                <Select label="Energy / Tempo" value={form.energy_tempo} onChange={handleSelectChange('energy_tempo')} options={energyTempoOptions} />
                <Select label="Spiritual Tone (Woo)" value={form.woo_level} onChange={handleSelectChange('woo_level')} options={wooLevelOptions} />
                <Select label="Humor Personality" value={form.humor_personality} onChange={handleSelectChange('humor_personality')} options={humorPersonalityOptions} />
                <Select label="Speech Rhythm" value={form.speech_rhythm} onChange={handleSelectChange('speech_rhythm')} options={speechRhythmOptions} />
                <Select
                  label="Emotional Intensity"
                  value={form.emotional_intensity_preference}
                  onChange={handleSelectChange('emotional_intensity_preference')}
                  options={emotionalIntensityOptions}
                />
                <Select
                  label="Narrative Preference"
                  value={form.narrative_preference}
                  onChange={handleSelectChange('narrative_preference')}
                  options={narrativePreferenceOptions}
                />
                <Select
                  label="Depth Preference"
                  value={form.depth_preference}
                  onChange={handleSelectChange('depth_preference')}
                  options={depthPreferenceOptions}
                />
              </div>

              <Input label="Style Label" value={form.style_label} onChange={handleFormChange('style_label')} placeholder="e.g., Warm, grounded, and clear" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Forbidden Styles (one per line)"
                  value={form.forbidden_styles_text}
                  onChange={handleFormChange('forbidden_styles_text')}
                  rows={4}
                  placeholder="overly poetic\nstiff corporate\ntherapy-speak"
                />
                <Textarea
                  label="Sample Phrases (one per line)"
                  value={form.sample_phrases_text}
                  onChange={handleFormChange('sample_phrases_text')}
                  rows={4}
                  placeholder="I love how it feels to…\nThis is the life I choose."
                />
              </div>

              <Inline gap="sm" wrap>
                <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                  {saving ? 'Saving…' : 'Save Manual Version'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => loadData()}>
                  Refresh
                </Button>
              </Inline>

              {statusMessage && (
                <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <Stack gap="sm">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Versions</h2>
                <p className="text-sm text-neutral-400">
                  Load a previous version into the editor or activate it directly. Activating a version makes it the live profile for all VIVA outputs.
                </p>
              </Stack>

              <Select
                label="Select Version"
                value={selectedVersionId}
                onChange={handleVersionSelect}
                options={[{ value: '', label: 'Select a version…' }, ...versionsOptions]}
              />

              <Inline gap="sm" wrap>
                <Button variant="secondary" size="sm" onClick={handleActivate} disabled={!selectedVersionId} loading={activating}>
                  {activating ? 'Activating…' : 'Activate Selected Version'}
                </Button>
              </Inline>

              <div className="space-y-3">
                {versions.length === 0 ? (
                  <div className="text-sm text-neutral-500">No versions saved yet. Start with the quiz or save a manual edit.</div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/60 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <Inline gap="sm" align="center" wrap>
                          <Badge variant={version.is_active ? 'success' : 'neutral'}>
                            {version.is_active ? 'Active' : `Version ${version.versionNumber}`}
                          </Badge>
                          {version.source && <Badge variant="info">{sourceLabel(version.source)}</Badge>}
                        </Inline>
                        <p className="text-sm text-neutral-400 mt-2">
                          Saved {formatDate(version.created_at)} · Last refined {formatDate(version.last_refined_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVersionId(version.id)
                          setForm({
                            word_flow: version.word_flow,
                            emotional_range: version.emotional_range,
                            detail_level: version.detail_level,
                            energy_tempo: version.energy_tempo,
                            woo_level: String(version.woo_level ?? 2),
                            humor_personality: version.humor_personality,
                            speech_rhythm: version.speech_rhythm,
                            emotional_intensity_preference: version.emotional_intensity_preference ?? 'medium',
                            narrative_preference: version.narrative_preference ?? 'compact_scenes',
                            depth_preference: version.depth_preference ?? 'balanced',
                            style_label: version.style_label ?? defaultForm.style_label,
                            forbidden_styles_text: toMultiline(version.forbidden_styles),
                            sample_phrases_text: toMultiline(version.sample_phrases),
                          })
                        }}
                      >
                        Load into Editor
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
