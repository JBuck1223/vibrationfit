'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Stack,
  Inline,
  Button,
  Select,
  Spinner,
} from '@/lib/design-system/components'

const wordFlowOptions = [
  { value: 'simple_direct', label: 'Simple & Direct – short, clear, say it plain' },
  { value: 'balanced_expressive', label: 'Balanced & Expressive – mix of simple with rhythm' },
  { value: 'lyrical_reflective', label: 'Lyrical & Reflective – flowing, a touch poetic' },
]

const emotionalRangeOptions = [
  { value: 'grounded', label: 'Grounded – steady, calm, no drama' },
  { value: 'warm_genuine', label: 'Warm & Genuine – open-hearted, honest' },
  { value: 'passionate_vibrant', label: 'Passionate & Vibrant – high energy, expressive' },
]

const detailLevelOptions = [
  { value: 'clean_focused', label: 'Clean & Focused – minimal detail, just enough' },
  { value: 'sensory_balanced', label: 'Sensory & Balanced – some sight/sound/feel where it matters' },
  { value: 'immersive_cinematic', label: 'Immersive & Cinematic – rich, vivid scenes' },
]

const energyTempoOptions = [
  { value: 'steady_measured', label: 'Steady & Measured – calm, even pace' },
  { value: 'upbeat_flowing', label: 'Upbeat & Flowing – smooth optimistic motion' },
  { value: 'spirited_fast', label: 'Spirited & Dynamic – lively, high momentum' },
]

const humorPersonalityOptions = [
  { value: 'grounded_sincere', label: 'Grounded & Sincere – warm, never jokey' },
  { value: 'lighthearted_approachable', label: 'Lighthearted & Approachable – gentle smile in the words' },
  { value: 'playful_bold', label: 'Playful & Bold – let some fun and edges show' },
]

const speechRhythmOptions = [
  { value: 'neutral', label: 'Neutral – clean, timeless, no strong accent' },
  { value: 'warm_conversational', label: 'Warm & Conversational – easy talk with a friend' },
  { value: 'distinct_rooted', label: 'Distinct & Rooted – clear sense of self (without slang spellings)' },
]

interface VoiceProfileQuizState {
  word_flow: string
  emotional_range: string
  detail_level: string
  energy_tempo: string
  humor_personality: string
  speech_rhythm: string
  emotional_intensity_preference: string
  narrative_preference: string
  depth_preference: string
  style_label: string
  forbidden_styles_text: string
  sample_phrases_text: string
}

const defaultQuizState: VoiceProfileQuizState = {
  word_flow: 'balanced_expressive',
  emotional_range: 'warm_genuine',
  detail_level: 'sensory_balanced',
  energy_tempo: 'upbeat_flowing',
  humor_personality: 'lighthearted_approachable',
  speech_rhythm: 'warm_conversational',
  emotional_intensity_preference: 'medium',
  narrative_preference: 'compact_scenes',
  depth_preference: 'balanced',
  style_label: 'Balanced, warm, and expressive in a natural way.',
  forbidden_styles_text: '',
  sample_phrases_text: '',
}

function parseMultiline(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function toMultiline(list?: string[] | null): string {
  if (!list || list.length === 0) return ''
  return list.join('\n')
}

export default function VoiceProfileQuizPage() {
  const router = useRouter()
  const [state, setState] = useState<VoiceProfileQuizState>(defaultQuizState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/voice-profile', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to load voice profile.')
        }
        const data = await response.json()
        const profile = data.profile
        if (profile) {
          setState({
            word_flow: profile.word_flow,
            emotional_range: profile.emotional_range,
            detail_level: profile.detail_level,
            energy_tempo: profile.energy_tempo,
            humor_personality: profile.humor_personality,
            speech_rhythm: profile.speech_rhythm,
            emotional_intensity_preference: profile.emotional_intensity_preference ?? 'medium',
            narrative_preference: profile.narrative_preference ?? 'compact_scenes',
            depth_preference: profile.depth_preference ?? 'balanced',
            style_label: profile.style_label ?? defaultQuizState.style_label,
            forbidden_styles_text: toMultiline(profile.forbidden_styles),
            sample_phrases_text: toMultiline(profile.sample_phrases),
          })
        }
      } catch (error) {
        console.error('voice_profile quiz load error', error)
        setErrorMessage('Unable to load existing voice profile. Starting with defaults.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSelectChange = (field: keyof VoiceProfileQuizState) => (value: string) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setStatusMessage(null)
      setErrorMessage(null)
      const response = await fetch('/api/voice-profile/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_profile: {
            word_flow: state.word_flow,
            emotional_range: state.emotional_range,
            detail_level: state.detail_level,
            energy_tempo: state.energy_tempo,
            woo_level: 2, // Default to balanced since they're on VibrationFit
            humor_personality: state.humor_personality,
            speech_rhythm: state.speech_rhythm,
            emotional_intensity_preference: state.emotional_intensity_preference,
            narrative_preference: state.narrative_preference,
            depth_preference: state.depth_preference,
            style_label: state.style_label,
            forbidden_styles: parseMultiline(state.forbidden_styles_text),
            sample_phrases: parseMultiline(state.sample_phrases_text),
          },
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save quiz answers.')
      }
      setStatusMessage('Voice profile quiz saved. New version is now active.')
      router.push('/voice-profile')
    } catch (error) {
      console.error('voice_profile quiz submit error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save quiz answers.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container size="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Stack gap="sm">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Voice Profile Quiz</h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl">
              Answer these six quick questions so VIVA knows your voice preferences. Each section matches one core part of your
              voice profile.
            </p>
          </Stack>

          {loading ? (
            <Card className="p-6 text-center">
              <Inline gap="sm" justify="center" align="center">
                <Spinner size="sm" />
                <span className="text-neutral-300">Loading quiz…</span>
              </Inline>
            </Card>
          ) : (
            <Stack gap="lg">
              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">1. Word Flow</h2>
                <p className="text-sm text-neutral-400">How do you like your sentences to feel most of the time?</p>
                <Select value={state.word_flow} onChange={handleSelectChange('word_flow')} options={wordFlowOptions} />
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">2. Emotional Tone Range</h2>
                <p className="text-sm text-neutral-400">How big do you like your feelings to sound in writing?</p>
                <Select value={state.emotional_range} onChange={handleSelectChange('emotional_range')} options={emotionalRangeOptions} />
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">3. Detail Level</h2>
                <p className="text-sm text-neutral-400">How much description feels right when you talk about your life?</p>
                <Select value={state.detail_level} onChange={handleSelectChange('detail_level')} options={detailLevelOptions} />
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">4. Energy / Tempo</h2>
                <p className="text-sm text-neutral-400">What speed or energy feels like you when you write?</p>
                <Select value={state.energy_tempo} onChange={handleSelectChange('energy_tempo')} options={energyTempoOptions} />
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">5. Humor / Personality</h2>
                <p className="text-sm text-neutral-400">How much playfulness feels like you?</p>
                <Select
                  value={state.humor_personality}
                  onChange={handleSelectChange('humor_personality')}
                  options={humorPersonalityOptions}
                />
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">6. Speech Rhythm</h2>
                <p className="text-sm text-neutral-400">How do you want your words to sound in your head when you read them?</p>
                <Select value={state.speech_rhythm} onChange={handleSelectChange('speech_rhythm')} options={speechRhythmOptions} />
              </Card>

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

              <Inline gap="sm" wrap justify="between">
                <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/voice-profile')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  {submitting ? 'Saving…' : 'Save Quiz & Continue'}
                </Button>
              </Inline>
            </Stack>
          )}
        </Stack>
      </form>
    </Container>
  )
}
