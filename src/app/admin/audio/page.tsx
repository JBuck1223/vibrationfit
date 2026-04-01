'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Container,
  Card,
  Button,
  Spinner,
  PageHero,
} from '@/lib/design-system/components'
import {
  Play,
  Square,
  Volume2,
  Mic,
  Zap,
  Gauge,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Search,
  Globe,
  User,
  Headphones,
} from 'lucide-react'

// ── Static voice catalogs (OpenAI + Google) ─────────────────────────────────

const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'Neutral', description: 'Balanced, versatile' },
  { id: 'ash', name: 'Ash', gender: 'Male', description: 'Warm, conversational' },
  { id: 'coral', name: 'Coral', gender: 'Female', description: 'Bright, expressive' },
  { id: 'echo', name: 'Echo', gender: 'Male', description: 'Smooth, resonant' },
  { id: 'fable', name: 'Fable', gender: 'Male', description: 'British, storytelling' },
  { id: 'onyx', name: 'Onyx', gender: 'Male', description: 'Deep, authoritative' },
  { id: 'nova', name: 'Nova', gender: 'Female', description: 'Warm, friendly' },
  { id: 'sage', name: 'Sage', gender: 'Female', description: 'Calm, measured' },
  { id: 'shimmer', name: 'Shimmer', gender: 'Female', description: 'Soft, gentle' },
]

const GOOGLE_VOICES = [
  { id: 'Achernar', name: 'Achernar', gender: 'Female' },
  { id: 'Achird', name: 'Achird', gender: 'Male' },
  { id: 'Algenib', name: 'Algenib', gender: 'Male' },
  { id: 'Algieba', name: 'Algieba', gender: 'Male' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede', gender: 'Female' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'Female' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Female' },
  { id: 'Charon', name: 'Charon', gender: 'Male' },
  { id: 'Despina', name: 'Despina', gender: 'Female' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'Male' },
  { id: 'Erinome', name: 'Erinome', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Female' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'Male' },
  { id: 'Kore', name: 'Kore', gender: 'Female' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Female' },
  { id: 'Leda', name: 'Leda', gender: 'Female' },
  { id: 'Orus', name: 'Orus', gender: 'Male' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Female' },
  { id: 'Puck', name: 'Puck', gender: 'Male' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Male' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Male' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Male' },
  { id: 'Schedar', name: 'Schedar', gender: 'Male' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Female' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'Male' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Female' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male' },
]

type Provider = 'openai' | 'google' | 'elevenlabs'

interface VoiceItem {
  id: string
  name: string
  gender: string
  description?: string
  accent?: string
  age?: string
  useCase?: string
  category?: string
  previewUrl?: string | null
}

const DEFAULT_TEXT = `Take a deep breath in... and slowly release. Feel the tension leaving your body with each exhale. You are safe. You are supported. In this moment, there is nothing to fix, nowhere to rush. Just the gentle rhythm of your breath, carrying you deeper into stillness.`

const MEDITATION_PRESETS = [
  {
    label: 'Breathing guide',
    text: `Take a deep breath in... and slowly release. Feel the tension leaving your body with each exhale. You are safe. You are supported. In this moment, there is nothing to fix, nowhere to rush. Just the gentle rhythm of your breath, carrying you deeper into stillness.`,
  },
  {
    label: 'Body scan',
    text: `Bring your attention gently to the top of your head. Notice any sensation there... warmth, tingling, or simply openness. Now let your awareness flow downward, like warm honey, through your forehead, softening the muscles around your eyes. Let your jaw release.`,
  },
  {
    label: 'Affirmation',
    text: `I am aligned with my highest vision. Every step I take is guided by purpose and clarity. I trust the process of my becoming. The energy I put into the world returns to me multiplied. I am exactly where I need to be.`,
  },
  {
    label: 'Sleep story',
    text: `Imagine yourself walking along a quiet forest path at twilight. The air is cool and carries the scent of pine and damp earth. Fireflies begin to blink in the distance, soft golden lights floating between the trees. With each step, you feel lighter.`,
  },
]

const ELEVENLABS_SEARCH_SUGGESTIONS = [
  'meditation', 'calm', 'relaxing', 'soothing', 'whisper',
  'gentle', 'narration', 'sleep', 'ASMR', 'warm',
]

// ── Slider styles ───────────────────────────────────────────────────────────

const sliderStyles = `
  input[type="range"].audio-slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #a78bfa;
    cursor: pointer;
    border: 2px solid #1a1a2e;
    margin-top: -7px;
  }
  input[type="range"].audio-slider::-webkit-slider-runnable-track {
    height: 4px;
    background: #333;
    border-radius: 2px;
  }
  input[type="range"].audio-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #a78bfa;
    cursor: pointer;
    border: 2px solid #1a1a2e;
  }
  input[type="range"].audio-slider::-moz-range-track {
    height: 4px;
    background: #333;
    border-radius: 2px;
  }
`

// ── Voice card component ────────────────────────────────────────────────────

function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  isLoading,
  isPreviewPlaying,
  onSelect,
  onPlay,
  onPreview,
  providerColor,
  showPreviewButton,
}: {
  voice: VoiceItem
  isSelected: boolean
  isPlaying: boolean
  isLoading: boolean
  isPreviewPlaying?: boolean
  onSelect: () => void
  onPlay: () => void
  onPreview?: () => void
  providerColor: string
  showPreviewButton?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      className={`
        relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20'
          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-800/50'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
            <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
              {voice.name}
            </span>
            {voice.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">
                {voice.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-neutral-500">{voice.gender}</span>
            {voice.accent && (
              <>
                <span className="text-neutral-700 text-xs">|</span>
                <span className="text-xs text-neutral-500">{voice.accent}</span>
              </>
            )}
            {voice.description && (
              <>
                <span className="text-neutral-700 text-xs">|</span>
                <span className="text-xs text-neutral-500 truncate">{voice.description}</span>
              </>
            )}
            {voice.useCase && (
              <>
                <span className="text-neutral-700 text-xs">|</span>
                <span className="text-xs text-neutral-500 italic">{voice.useCase}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showPreviewButton && voice.previewUrl && onPreview && (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview() }}
              title="Quick preview (ElevenLabs sample)"
              className={`
                w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
                ${isPreviewPlaying
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-neutral-800/50 text-neutral-500 hover:text-purple-400 hover:bg-neutral-700'
                }
              `}
            >
              <Headphones className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onPlay() }}
            disabled={isLoading}
            title="Generate with your text"
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
              ${isPlaying
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : isLoading
                  ? 'bg-neutral-800 text-neutral-500'
                  : `bg-neutral-800 ${providerColor} hover:bg-neutral-700`
              }
            `}
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : isPlaying ? (
              <Square className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AudioAuditionPage() {
  const [activeProvider, setActiveProvider] = useState<Provider>('openai')
  const [selectedVoices, setSelectedVoices] = useState<Record<Provider, string>>({
    openai: 'nova',
    google: 'Zephyr',
    elevenlabs: '',
  })
  const [text, setText] = useState(DEFAULT_TEXT)
  const [speakingRate, setSpeakingRate] = useState(0.85)
  const [openaiSpeed, setOpenaiSpeed] = useState(1.0)
  const [stability, setStability] = useState(0.7)
  const [similarityBoost, setSimilarityBoost] = useState(0.75)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all')
  const [showPresets, setShowPresets] = useState(false)

  // ElevenLabs dynamic state
  const [elVoices, setElVoices] = useState<VoiceItem[]>([])
  const [elSearch, setElSearch] = useState('')
  const [elVoiceType, setElVoiceType] = useState<'default' | 'community'>('default')
  const [elLoading, setElLoading] = useState(false)
  const [elHasMore, setElHasMore] = useState(false)
  const [elNextPageToken, setElNextPageToken] = useState<string | null>(null)
  const [elTotalCount, setElTotalCount] = useState(0)
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch ElevenLabs voices
  const fetchElevenLabsVoices = useCallback(
    async (search: string, type: string, pageToken?: string) => {
      setElLoading(true)
      try {
        const params = new URLSearchParams({
          search,
          type,
          pageSize: '50',
        })
        if (pageToken) params.set('pageToken', pageToken)

        const res = await fetch(`/api/admin/audio/voices?${params.toString()}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to fetch' }))
          throw new Error(err.error)
        }

        const data = await res.json()
        const voices: VoiceItem[] = data.voices

        if (pageToken) {
          setElVoices((prev) => [...prev, ...voices])
        } else {
          setElVoices(voices)
          if (voices.length > 0 && !selectedVoices.elevenlabs) {
            setSelectedVoices((prev) => ({ ...prev, elevenlabs: voices[0].id }))
          }
        }
        setElHasMore(data.hasMore)
        setElNextPageToken(data.nextPageToken)
        setElTotalCount(data.totalCount)
      } catch (err: any) {
        setError(err.message || 'Failed to load ElevenLabs voices')
      } finally {
        setElLoading(false)
      }
    },
    [selectedVoices.elevenlabs]
  )

  // Load ElevenLabs voices when tab activates or search/type changes
  useEffect(() => {
    if (activeProvider !== 'elevenlabs') return

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(() => {
      fetchElevenLabsVoices(elSearch, elVoiceType)
    }, elSearch ? 400 : 0)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [activeProvider, elSearch, elVoiceType, fetchElevenLabsVoices])

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.src = ''
      previewAudioRef.current = null
    }
    setPreviewPlayingId(null)
  }, [])

  const playPreview = useCallback((voiceId: string, previewUrl: string) => {
    if (previewPlayingId === voiceId) {
      stopPreview()
      return
    }
    stopPreview()
    cleanup()
    setPlayingKey(null)

    const audio = new Audio(previewUrl)
    previewAudioRef.current = audio
    setPreviewPlayingId(voiceId)

    audio.onended = () => setPreviewPlayingId(null)
    audio.onerror = () => setPreviewPlayingId(null)
    audio.play().catch(() => setPreviewPlayingId(null))
  }, [previewPlayingId, stopPreview, cleanup])

  const generateAndPlay = useCallback(
    async (provider: Provider, voiceId: string) => {
      const key = `${provider}-${voiceId}`

      if (playingKey === key) {
        cleanup()
        setPlayingKey(null)
        return
      }

      cleanup()
      stopPreview()
      setPlayingKey(null)
      setLoadingKey(key)
      setError(null)

      try {
        const res = await fetch('/api/admin/audio/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            voice: voiceId,
            text,
            speed: provider === 'openai' ? openaiSpeed : undefined,
            speakingRate: provider === 'google' ? speakingRate : undefined,
            stability: provider === 'elevenlabs' ? stability : undefined,
            similarityBoost: provider === 'elevenlabs' ? similarityBoost : undefined,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errData.error || `HTTP ${res.status}`)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url

        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          setPlayingKey(null)
          cleanup()
        }

        audio.onerror = () => {
          setPlayingKey(null)
          setError('Audio playback failed')
          cleanup()
        }

        await audio.play()
        setPlayingKey(key)
      } catch (err: any) {
        setError(err.message || 'Failed to generate audio')
      } finally {
        setLoadingKey(null)
      }
    },
    [text, openaiSpeed, speakingRate, stability, similarityBoost, playingKey, cleanup, stopPreview]
  )

  // Resolve current voices list based on provider
  const currentVoices: VoiceItem[] =
    activeProvider === 'openai'
      ? OPENAI_VOICES
      : activeProvider === 'google'
        ? GOOGLE_VOICES
        : elVoices

  const filteredVoices = currentVoices.filter(
    (v) => genderFilter === 'all' || v.gender === genderFilter
  )

  const selectedVoiceName =
    currentVoices.find((v) => v.id === selectedVoices[activeProvider])?.name || 'None'

  const providerColors: Record<Provider, { color: string; borderColor: string; bgColor: string }> = {
    openai: { color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10' },
    google: { color: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10' },
    elevenlabs: { color: 'text-purple-400', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10' },
  }

  const pc = providerColors[activeProvider]

  return (
    <AdminWrapper>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      <Container size="xl" className="py-8">
        <PageHero
          title="Voice Audition Studio"
          subtitle="Compare TTS providers and find the perfect voice for meditative tracks"
        />

        {/* Provider tabs */}
        <div className="flex gap-3 mt-8 mb-6">
          {([
            { id: 'openai' as const, name: 'OpenAI', icon: <Zap className="w-5 h-5" />, pricing: '$15 / 1M chars' },
            { id: 'google' as const, name: 'Google Chirp 3 HD', icon: <Mic className="w-5 h-5" />, pricing: '$30 / 1M chars' },
            { id: 'elevenlabs' as const, name: 'ElevenLabs', icon: <Sparkles className="w-5 h-5" />, pricing: '$120 / 1M chars' },
          ]).map((p) => {
            const colors = providerColors[p.id]
            return (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium
                  transition-all duration-200
                  ${activeProvider === p.id
                    ? `${colors.borderColor} ${colors.bgColor} ${colors.color}`
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                  }
                `}
              >
                {p.icon}
                {p.name}
                <span className="text-xs opacity-60 ml-1">{p.pricing}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Text + controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Preview Text</h3>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Presets
                  {showPresets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showPresets && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {MEDITATION_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setText(preset.text)
                        setShowPresets(false)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-xs text-neutral-300 
                        hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                maxLength={1000}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200
                  placeholder-neutral-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 
                  focus:outline-none resize-none transition-colors"
                placeholder="Enter text to synthesize..."
              />
              <div className="text-right mt-1">
                <span className="text-xs text-neutral-500">{text.length} / 1000</span>
              </div>
            </Card>

            {/* Provider-specific controls */}
            {activeProvider === 'openai' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  OpenAI Controls
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-neutral-400">Speed</label>
                    <span className="text-xs font-mono text-emerald-400">{openaiSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.05"
                    value={openaiSpeed}
                    onChange={(e) => setOpenaiSpeed(parseFloat(e.target.value))}
                    className="w-full audio-slider"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-neutral-600">0.25x (slow)</span>
                    <span className="text-[10px] text-neutral-600">1.0x</span>
                    <span className="text-[10px] text-neutral-600">2.0x (fast)</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[0.75, 0.85, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setOpenaiSpeed(rate)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          Math.abs(openaiSpeed - rate) < 0.01
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {rate === 0.75 ? 'Meditative' : rate === 0.85 ? 'Calm' : rate === 1.0 ? 'Normal' : 'Energetic'}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeProvider === 'google' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  Google Controls
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-neutral-400">Speaking Rate</label>
                    <span className="text-xs font-mono text-blue-400">{speakingRate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.05"
                    value={speakingRate}
                    onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                    className="w-full audio-slider"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-neutral-600">0.25x (slow)</span>
                    <span className="text-[10px] text-neutral-600">1.0x</span>
                    <span className="text-[10px] text-neutral-600">2.0x (fast)</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[0.5, 0.7, 0.85, 1.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeakingRate(rate)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          Math.abs(speakingRate - rate) < 0.01
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {rate === 0.5 ? 'Meditative' : rate === 0.7 ? 'Calm' : rate === 0.85 ? 'Relaxed' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeProvider === 'elevenlabs' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  ElevenLabs Controls
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-neutral-400">Stability</label>
                      <span className="text-xs font-mono text-purple-400">{stability.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={stability}
                      onChange={(e) => setStability(parseFloat(e.target.value))}
                      className="w-full audio-slider"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-neutral-600">Variable</span>
                      <span className="text-[10px] text-neutral-600">Stable</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-neutral-400">Similarity Boost</label>
                      <span className="text-xs font-mono text-purple-400">{similarityBoost.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={similarityBoost}
                      onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                      className="w-full audio-slider"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-neutral-600">Low</span>
                      <span className="text-[10px] text-neutral-600">High</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick generate for selected voice */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Selected voice</p>
                  <p className="text-white font-medium">{selectedVoiceName}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => generateAndPlay(activeProvider, selectedVoices[activeProvider])}
                  disabled={!text.trim() || loadingKey !== null || !selectedVoices[activeProvider]}
                >
                  {loadingKey === `${activeProvider}-${selectedVoices[activeProvider]}` ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : playingKey === `${activeProvider}-${selectedVoices[activeProvider]}` ? (
                    <Square className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {playingKey === `${activeProvider}-${selectedVoices[activeProvider]}` ? 'Stop' : 'Generate'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column: Voice grid */}
          <div className="lg:col-span-2">
            <Card className="p-5">
              {/* Header with voice count + gender filter */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  {activeProvider === 'openai' && <Zap className="w-4 h-4 text-emerald-400" />}
                  {activeProvider === 'google' && <Mic className="w-4 h-4 text-blue-400" />}
                  {activeProvider === 'elevenlabs' && <Sparkles className="w-4 h-4 text-purple-400" />}
                  <span className={pc.color}>
                    {activeProvider === 'openai' ? 'OpenAI' : activeProvider === 'google' ? 'Google Chirp 3 HD' : 'ElevenLabs'}
                  </span>
                  <span className="text-neutral-500 font-normal">
                    {activeProvider === 'elevenlabs'
                      ? `(${filteredVoices.length}${elTotalCount > filteredVoices.length ? ` of ${elTotalCount}` : ''} voices)`
                      : `(${filteredVoices.length} voice${filteredVoices.length !== 1 ? 's' : ''})`
                    }
                  </span>
                </h3>
                <div className="flex gap-1">
                  {(['all', 'Female', 'Male'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenderFilter(g)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        genderFilter === g
                          ? 'bg-neutral-700 text-white'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {g === 'all' ? 'All' : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* ElevenLabs search + type toggle */}
              {activeProvider === 'elevenlabs' && (
                <div className="mb-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={elSearch}
                        onChange={(e) => {
                          setElSearch(e.target.value)
                          if (e.target.value && elVoiceType === 'default') setElVoiceType('community')
                        }}
                        placeholder="Search voices (e.g. meditation, calm, whisper...)"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200
                          placeholder-neutral-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
                          focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex border border-neutral-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => { setElVoiceType('default'); setElSearch('') }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${
                          elVoiceType === 'default'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <User className="w-3 h-3" />
                        My Voices
                      </button>
                      <button
                        onClick={() => setElVoiceType('community')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs border-l border-neutral-800 transition-colors ${
                          elVoiceType === 'community'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        Community Library
                      </button>
                    </div>
                  </div>
                  {!elSearch && (
                    <div className="flex flex-wrap gap-1.5">
                      {ELEVENLABS_SEARCH_SUGGESTIONS.map((term) => (
                        <button
                          key={term}
                          onClick={() => { setElSearch(term); setElVoiceType('community') }}
                          className="px-2.5 py-1 rounded-md bg-neutral-800/60 text-[11px] text-neutral-400
                            hover:bg-neutral-700 hover:text-neutral-200 transition-colors border border-neutral-800"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Loading state for ElevenLabs */}
              {activeProvider === 'elevenlabs' && elLoading && elVoices.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" variant="primary" />
                  <span className="ml-3 text-sm text-neutral-400">Loading voices...</span>
                </div>
              )}

              {/* Voice grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredVoices.map((voice) => {
                  const key = `${activeProvider}-${voice.id}`
                  return (
                    <VoiceCard
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoices[activeProvider] === voice.id}
                      isPlaying={playingKey === key}
                      isLoading={loadingKey === key}
                      isPreviewPlaying={previewPlayingId === voice.id}
                      onSelect={() =>
                        setSelectedVoices((prev) => ({ ...prev, [activeProvider]: voice.id }))
                      }
                      onPlay={() => generateAndPlay(activeProvider, voice.id)}
                      onPreview={
                        voice.previewUrl
                          ? () => playPreview(voice.id, voice.previewUrl!)
                          : undefined
                      }
                      providerColor={pc.color}
                      showPreviewButton={activeProvider === 'elevenlabs'}
                    />
                  )
                })}
              </div>

              {/* Empty state */}
              {!elLoading && activeProvider === 'elevenlabs' && filteredVoices.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-500">
                    {elSearch ? `No voices found for "${elSearch}"` : 'No voices available'}
                  </p>
                  {elSearch && (
                    <button
                      onClick={() => setElSearch('')}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}

              {/* Load more for ElevenLabs */}
              {activeProvider === 'elevenlabs' && elHasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => fetchElevenLabsVoices(elSearch, elVoiceType, elNextPageToken || undefined)}
                    disabled={elLoading}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-300
                      hover:bg-neutral-700 transition-colors border border-neutral-700 disabled:opacity-50"
                  >
                    {elLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" /> Loading...
                      </span>
                    ) : (
                      'Load more voices'
                    )}
                  </button>
                </div>
              )}
            </Card>

            {/* Info card */}
            <div className="mt-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Provider Notes
              </h4>
              {activeProvider === 'openai' && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Currently in production. 9 voices, $15/1M chars. Speed control 0.25x-2.0x. 
                  Good baseline quality with consistent output.
                </p>
              )}
              {activeProvider === 'google' && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Chirp 3: HD with 30 voices. Speaking rate 0.25x-2.0x for meditative pacing.
                  SSML support for pause/emphasis control. $30/1M chars. 1M free chars/month. 
                  Requires direct REST integration (no Vercel AI SDK provider).
                </p>
              )}
              {activeProvider === 'elevenlabs' && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  <strong className="text-neutral-400">Default voices</strong> ship with your account. 
                  <strong className="text-neutral-400"> Community voices</strong> are shared by other users -- 
                  thousands available including purpose-built meditation, ASMR, and calming voices. 
                  Use the headphone icon for a quick ElevenLabs sample, or the play button to generate with your text. 
                  $120/1M chars. Stability and similarity controls for fine-tuning.
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>
    </AdminWrapper>
  )
}
