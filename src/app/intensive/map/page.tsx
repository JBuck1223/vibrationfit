'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Inline,
  Text,
  Badge,
  IntensiveStepCompleteModal
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import {
  Sun,
  Moon,
  Zap,
  BookOpen,
  Image as ImageIcon,
  FileText,
  Target,
  Headphones,
  CheckCircle,
  User,
  ClipboardCheck,
  Mic,
  Layers,
  Unlock,
  Video,
  UsersRound,
  Info,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { BadgeDetailModal } from '@/components/badges'
import {
  BADGE_DEFINITIONS,
  type BadgeType,
  type BadgeWithProgress as BadgeWithProgressType,
} from '@/lib/badges/types'
import type { AssessmentCategory } from '@/types/assessment'
import { getGreenLineColor, getGreenLineLabel } from '@/lib/assessment/scoring'
import {
  diagnoseGreenLine,
  suggestFirstCommitments,
  suggestionsToPayloads,
  type GreenLineMap,
  type SuggestedCommitment,
} from '@/lib/map/suggestion-engine'

const MAP_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/13-map-1080p.mp4'
const MAP_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/13-map-thumb.0000000.jpg'

const MILESTONES: Array<{
  day: number
  label: string
  message: string
  badgeType: BadgeType
}> = [
  {
    day: 3,
    label: '3-Day Activated',
    message: "You've shown up 3 days. You're officially someone who shows up for The Life I Choose.",
    badgeType: 'activated_3d',
  },
  {
    day: 7,
    label: '7-Day Activated',
    message: "7 days of practice. Consistency is now part of your story.",
    badgeType: 'activated_7d',
  },
  {
    day: 14,
    label: '14-Day Activated',
    message: "14 days of showing up. Returning to alignment is what you do.",
    badgeType: 'activated_14d',
  },
  {
    day: 21,
    label: '21-Day Activated',
    message: "21 days of activation. Old patterns are losing their grip.",
    badgeType: 'activated_21d',
  },
  {
    day: 28,
    label: '28-Day Activated',
    message: "28 days activated. You have proof: you are a conscious creator in action.",
    badgeType: 'activated_28d',
  },
]

const CATEGORY_DISPLAY: Record<string, string> = {
  money: 'Money', health: 'Health', family: 'Family', love: 'Love',
  social: 'Social', work: 'Work', fun: 'Fun', travel: 'Travel',
  home: 'Home', stuff: 'Stuff', giving: 'Giving', spirituality: 'Spirituality',
}

const MAP_CATEGORY_COLORS: Record<string, string> = {
  activations: '#39FF14',
  creations: '#FFFF00',
  connections: '#BF00FF',
  sessions: '#00FFFF',
}

function makeBadgeStub(badgeType: BadgeType): BadgeWithProgressType {
  const definition = BADGE_DEFINITIONS[badgeType]
  return {
    definition,
    earned: false,
    progress: {
      current: 0,
      target: definition.activationDays || definition.threshold || 1,
      percentage: 0,
    },
  }
}

export default function IntensiveMapPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [selectedMilestoneBadge, setSelectedMilestoneBadge] = useState<BadgeWithProgressType | null>(null)
  const [completing, setCompleting] = useState(false)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)

  const [greenLineStatus, setGreenLineStatus] = useState<GreenLineMap | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedCommitment[]>([])
  const [enabledSuggestions, setEnabledSuggestions] = useState<Set<number>>(new Set())

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        if (intensiveData.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
        }
      }

      const [visionResult, assessmentResult] = await Promise.all([
        supabase
          .from('vision_versions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('assessment_results')
          .select('green_line_status')
          .eq('user_id', user.id)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      if (visionResult.data) {
        setActiveVisionId(visionResult.data.id)
      }

      if (assessmentResult.data?.green_line_status) {
        const glStatus = assessmentResult.data.green_line_status as GreenLineMap
        setGreenLineStatus(glStatus)

        const diagnosis = diagnoseGreenLine(glStatus)
        const suggested = suggestFirstCommitments(diagnosis)
        setSuggestions(suggested)
        setEnabledSuggestions(new Set(suggested.map((_, i) => i)))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleSuggestion = (index: number) => {
    setEnabledSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleActivateMap = async () => {
    if (!intensiveId) return

    setCompleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const enabledList = suggestions.filter((_, i) => enabledSuggestions.has(i))

      if (enabledList.length > 0) {
        const { data: target } = await supabase
          .from('vision_targets')
          .insert({
            user_id: user.id,
            category: 'health',
            title: 'Above the Green Line',
            description: 'Achieve an above-the-line emotional state in harmony with your new Life Vision.',
            vision_version_id: activeVisionId,
          })
          .select('id')
          .single()

        if (target) {
          const payloads = suggestionsToPayloads(enabledList, target.id)
          const rows = payloads.map(p => ({
            ...p,
            user_id: user.id,
          }))
          await supabase.from('commitments').insert(rows)
        }
      }

      const completedTime = new Date().toISOString()
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: completedTime
        })
        .eq('intensive_id', intensiveId)

      invalidateIntensiveSnapshot()
      setShowStepCompleteModal(true)
    } catch (error) {
      console.error('Error activating MAP:', error)
      alert('Failed to continue. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const getVisionLink = (path: string) => {
    if (activeVisionId) {
      return `/intensive/life-vision/${activeVisionId}${path}`
    }
    return '/intensive/life-vision'
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

  const diagnosis = greenLineStatus ? diagnoseGreenLine(greenLineStatus) : null

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Intro Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={MAP_VIDEO}
            thumbnailUrl={MAP_POSTER}
            context="single"
            className="w-full"
          />
        </div>

        {/* Green Line Diagnosis */}
        {diagnosis && !isAlreadyCompleted && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-2">
                  Your Vibration Snapshot
                </Text>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  From your assessment, here is where each life category stands on the Green Line.
                  Your first target is achieving an above-the-line emotional state in harmony with your new Life Vision.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(greenLineStatus || {}).map(([cat, status]) => (
                  <div
                    key={cat}
                    className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center gap-2"
                  >
                    <CircleDot
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: getGreenLineColor(status) }}
                    />
                    <div className="min-w-0">
                      <Text size="xs" className="text-white font-medium truncate">
                        {CATEGORY_DISPLAY[cat] || cat}
                      </Text>
                      <Text size="xs" style={{ color: getGreenLineColor(status) }}>
                        {getGreenLineLabel(status)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              {(diagnosis.below.length > 0 || diagnosis.transition.length > 0) && (
                <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20">
                  <Text size="xs" className="text-primary-400">
                    {diagnosis.below.length > 0 && (
                      <span>
                        <strong>{diagnosis.below.map(c => CATEGORY_DISPLAY[c]).join(', ')}</strong>
                        {' '}
                        {diagnosis.below.length === 1 ? 'is' : 'are'} below the Green Line.
                        {diagnosis.transition.length > 0 ? ' ' : ''}
                      </span>
                    )}
                    {diagnosis.transition.length > 0 && (
                      <span>
                        <strong>{diagnosis.transition.map(c => CATEGORY_DISPLAY[c]).join(', ')}</strong>
                        {' '}
                        {diagnosis.transition.length === 1 ? 'is' : 'are'} in transition.
                      </span>
                    )}
                    {' '}The commitments below are designed to shift these areas.
                  </Text>
                </div>
              )}
            </Stack>
          </Card>
        )}

        {/* Suggested Commitments */}
        {suggestions.length > 0 && !isAlreadyCompleted && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-2">
                  Your First Commitments
                </Text>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  These are VibrationFit actions designed to move you above the Green Line.
                  Each uses the tools you built during the intensive. Toggle any off if needed.
                </p>
              </div>

              <div className="space-y-3">
                {suggestions.map((s, i) => {
                  const enabled = enabledSuggestions.has(i)
                  const color = MAP_CATEGORY_COLORS[s.category] || '#39FF14'
                  return (
                    <button
                      key={i}
                      onClick={() => toggleSuggestion(i)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        enabled
                          ? 'bg-neutral-900/80 border-neutral-700'
                          : 'bg-neutral-900/30 border-neutral-800/50 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {enabled ? (
                            <ToggleRight className="w-5 h-5" style={{ color }} />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Text size="sm" className="text-white font-semibold">
                              {s.title}
                            </Text>
                            <Badge
                              variant="neutral"
                              className="text-xs capitalize"
                              style={{ color, borderColor: `${color}30` }}
                            >
                              {s.category}
                            </Badge>
                          </div>
                          <Text size="xs" className="text-neutral-400">
                            {s.description}
                          </Text>
                          <Text size="xs" className="text-neutral-500 mt-1 italic">
                            {s.rationale}
                          </Text>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Stack>
          </Card>
        )}

        {/* MAP Guide (Collapsible) */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between"
          >
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
              MAP Guide
            </Text>
            {showGuide ? (
              <ChevronUp className="w-5 h-5 text-neutral-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-500" />
            )}
          </button>

          {showGuide && (
            <Stack gap="lg" className="mt-6">
              <div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                  You&apos;ve completed your first Creations. Your profile, assessment, Life Vision, audios, Vision Board, and journal entry are complete.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Now your MAP shows you exactly how to keep creating, activate what you&apos;ve built, connect with your community, and attend your sessions so The Life I Choose becomes your new normal.
                </p>
              </div>

              {/* Creations */}
              <div>
                <Text size="sm" className="text-[#FFFF00] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#FFFF00]/30 mb-4">
                  Creations
                </Text>
                <p className="text-sm text-neutral-500 mt-2 mb-4">Make and add to the tools that power your practice</p>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Sun className="h-5 w-5 text-amber-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Daily Paper</Text>
                      <Text size="xs" className="text-neutral-500">Each morning</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Complete your <strong>Daily Paper</strong> to set your intention for the day.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/daily-paper"><FileText className="w-4 h-4 mr-2" />Daily Paper</Link>
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Moon className="h-5 w-5 text-purple-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Evidence Journal</Text>
                      <Text size="xs" className="text-neutral-500">Each evening</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Journal</strong> and record evidence of alignment from the day.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/intensive/journal"><BookOpen className="w-4 h-4 mr-2" />Journal</Link>
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-3">
                    <ImageIcon className="h-5 w-5 text-[#FFFF00]" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Vision Board + Audios</Text>
                      <Text size="xs" className="text-neutral-500">As your vision evolves</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Refresh your <strong>Vision Board</strong> tiles as new images resonate.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Record fresh <strong>Vision Audios</strong> when you refine your Life Vision.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/intensive/vision-board"><ImageIcon className="w-4 h-4 mr-2" />Vision Board</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}><Headphones className="w-4 h-4 mr-2" />Vision Audios</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activations */}
              <div>
                <Text size="sm" className="text-[#39FF14] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#39FF14]/30 mb-4">
                  Activations
                </Text>
                <p className="text-sm text-neutral-500 mt-2 mb-4">Engage the tools you&apos;ve created to stay in alignment</p>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Sun className="h-5 w-5 text-amber-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Morning Vision Activation</Text>
                      <Text size="xs" className="text-neutral-500">Approximately 10-15 minutes</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Read your <strong>Life Vision</strong> out loud or listen to the audio.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Vision Board</strong> and quickly scan your tiles.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('')}><Target className="w-4 h-4 mr-2" />Life Vision</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/intensive/vision-board"><ImageIcon className="w-4 h-4 mr-2" />Vision Board</Link>
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Zap className="h-5 w-5 text-primary-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Real-Time Category Activation</Text>
                      <Text size="xs" className="text-neutral-500">1+ time per day</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Vision Audios</strong> and listen 1-3 minutes to the category you&apos;re about to step into.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Make one micro decision from that place.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}><Headphones className="w-4 h-4 mr-2" />Vision Audios</Link>
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-3">
                    <Moon className="h-5 w-5 text-purple-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Night Sleep Immersion</Text>
                      <Text size="xs" className="text-neutral-500">Approximately 5-10 minutes</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Read your <strong>Life Vision</strong> out loud or listen to the audio.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Press play on your <strong>Sleep Immersion</strong> track and let it loop.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}><Headphones className="w-4 h-4 mr-2" />Vision Audios</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connections */}
              <div>
                <Text size="sm" className="text-[#BF00FF] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#BF00FF]/30 mb-4">
                  Connections
                </Text>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-2">
                    <UsersRound className="h-5 w-5 text-purple-400" />
                    <Text size="sm" className="text-white font-semibold">Vibe Tribe</Text>
                  </Inline>
                  <p className="text-sm text-neutral-300">Share a short post or clip with your key takeaway from Alignment Gym.</p>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/vibe-tribe"><UsersRound className="w-4 h-4 mr-2" />Vibe Tribe</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div>
                <Text size="sm" className="text-[#00FFFF] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#00FFFF]/30 mb-4">
                  Sessions
                </Text>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-2">
                    <Video className="h-5 w-5 text-teal-400" />
                    <Text size="sm" className="text-white font-semibold">Alignment Gym</Text>
                  </Inline>
                  <p className="text-sm text-neutral-300">Attend live or watch the replay. Take session notes.</p>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/alignment-gym"><Video className="w-4 h-4 mr-2" />Alignment Gym</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333] mb-2">
                  Activation Milestones
                </Text>
                <p className="text-sm text-neutral-500 mb-4">Earn badges by logging activations on different days:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MILESTONES.map((milestone) => (
                    <div key={milestone.day} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-primary-400 font-bold">{milestone.day}</span>
                        </div>
                        <Badge variant="neutral" className="text-primary-400 border-primary-500/30 flex-1">
                          {milestone.label}
                        </Badge>
                        <button
                          onClick={() => setSelectedMilestoneBadge(makeBadgeStub(milestone.badgeType))}
                          className="p-1 rounded-md hover:bg-white/10 transition-colors text-neutral-400 hover:text-primary-400"
                          aria-label={`Learn more about ${milestone.label}`}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        &quot;{milestone.message}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Creations Cycle */}
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333] mb-4">
                  When Everything Upgrades, Start a New Creations Cycle
                </Text>
                <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                  When your current Life Vision mostly manifests or life takes a sharp turn, don&apos;t force an old vision. Start a new version.
                </p>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Text size="sm" className="text-white font-semibold mb-3">Checklist for a new version:</Text>
                  <div className="space-y-2">
                    {[
                      { icon: User, label: 'Update Profile' },
                      { icon: ClipboardCheck, label: 'New Assessment' },
                      { icon: FileText, label: 'Write your new Life Vision' },
                      { icon: Mic, label: 'Record fresh audios' },
                      { icon: Layers, label: 'Refresh your Vision Board' },
                    ].map(({ icon: StepIcon, label }) => (
                      <div key={label} className="flex items-center gap-3 text-sm text-neutral-300">
                        <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                          <StepIcon className="w-3 h-3 text-neutral-500" />
                        </div>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Stack>
          )}
        </Card>

        {/* Bottom CTA */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
          <div className="py-6">
            {!isAlreadyCompleted ? (
              <>
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-white">Activate Your MAP</h2>
                <p className="text-sm text-neutral-300 mb-6">
                  {enabledSuggestions.size > 0
                    ? `${enabledSuggestions.size} commitment${enabledSuggestions.size === 1 ? '' : 's'} will be created. You can adjust them anytime after unlocking.`
                    : 'Review your MAP guide above, then continue to unlock your full platform access.'}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleActivateMap}
                  disabled={completing}
                  className="w-full sm:w-auto"
                >
                  {completing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Activate MAP + Unlock Platform
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-neutral-300 mb-4">
                  This is your MAP. Come back anytime during your journey.
                </p>
                <Button variant="primary" asChild>
                  <Link href="/intensive/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </>
            )}
          </div>
        </Card>
      </Stack>

      <BadgeDetailModal
        badge={selectedMilestoneBadge}
        isOpen={!!selectedMilestoneBadge}
        onClose={() => setSelectedMilestoneBadge(null)}
      />

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="activation_protocol"
      />
    </Container>
  )
}
