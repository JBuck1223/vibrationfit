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
  IntensiveStepCompleteModal,
  VIVALoadingOverlay,
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
  Sparkles,
  Check,
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
  formatCategoryList,
  type GreenLineMap,
  type SuggestedCommitment,
  type GreenLineDiagnosis,
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

const MAP_CATEGORY_LABELS: Record<string, string> = {
  activations: 'Activations',
  creations: 'Creations',
  connections: 'Connections',
  sessions: 'Sessions',
}

const ANALYZING_MESSAGES = [
  'VIVA is analyzing your Vibration Assessment...',
  'Reviewing your Green Line status across all 12 categories...',
  'Identifying areas that need attention...',
  'Building personalized commitments for your first MAP...',
]

type Phase = 'launch' | 'analyzing' | 'review' | 'activating'

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

  const [phase, setPhase] = useState<Phase>('launch')
  const [loading, setLoading] = useState(true)
  const [selectedMilestoneBadge, setSelectedMilestoneBadge] = useState<BadgeWithProgressType | null>(null)
  const [completing, setCompleting] = useState(false)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)

  const [greenLineStatus, setGreenLineStatus] = useState<GreenLineMap | null>(null)
  const [diagnosis, setDiagnosis] = useState<GreenLineDiagnosis | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedCommitment[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())

  const loadInitialData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const intensiveData = await getActiveIntensiveClient()
      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        if (intensiveData.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
        }
      }

      const { data: visionData } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (visionData) setActiveVisionId(visionData.id)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  const runAnalysis = useCallback(async () => {
    setPhase('analyzing')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: assessmentData } = await supabase
        .from('assessment_results')
        .select('green_line_status')
        .eq('user_id', user.id)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let glStatus: GreenLineMap = {}
      let diag: GreenLineDiagnosis = { below: [], transition: [], above: [] }
      let suggested: SuggestedCommitment[] = []

      if (assessmentData?.green_line_status) {
        glStatus = assessmentData.green_line_status as GreenLineMap
        diag = diagnoseGreenLine(glStatus)
        suggested = suggestFirstCommitments(diag)
      } else {
        diag = { below: [], transition: [], above: [] }
        suggested = suggestFirstCommitments(diag)
      }

      setGreenLineStatus(glStatus)
      setDiagnosis(diag)
      setSuggestions(suggested)
      setSelectedSuggestions(new Set(suggested.map((_, i) => i)))

      await new Promise(resolve => setTimeout(resolve, 8000))

      setPhase('review')
    } catch (error) {
      console.error('Error running analysis:', error)
      setPhase('launch')
    }
  }, [])

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleActivateMap = async () => {
    if (!intensiveId) return

    setPhase('activating')
    setCompleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const enabledList = suggestions.filter((_, i) => selectedSuggestions.has(i))

      if (enabledList.length > 0) {
        const { data: target } = await supabase
          .from('vision_targets')
          .insert({
            user_id: user.id,
            category: 'health',
            title: 'Above the Green Line',
            description: 'Achieve an above-the-line emotional state in harmony with your new Life Vision. We help you get there with Creation, Activation, Connection, and Sessions.',
            vision_version_id: activeVisionId,
          })
          .select('id')
          .single()

        if (target) {
          const payloads = suggestionsToPayloads(enabledList, target.id)
          const rows = payloads.map(p => ({ ...p, user_id: user.id }))
          await supabase.from('commitments').insert(rows)
        }
      }

      const completedTime = new Date().toISOString()
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: completedTime,
        })
        .eq('intensive_id', intensiveId)

      invalidateIntensiveSnapshot()
      setShowStepCompleteModal(true)
    } catch (error) {
      console.error('Error activating MAP:', error)
      alert('Failed to continue. Please try again.')
      setPhase('review')
    } finally {
      setCompleting(false)
    }
  }

  const getVisionLink = (path: string) => {
    if (activeVisionId) return `/intensive/life-vision/${activeVisionId}${path}`
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

  // ── PHASE 2: VIVA is analyzing ────────────────────────────────────

  if (phase === 'analyzing') {
    return (
      <Container size="xl">
        <div className="relative min-h-[70vh]">
          <VIVALoadingOverlay
            isVisible
            messages={ANALYZING_MESSAGES}
            cycleDuration={2000}
            estimatedTime="Building your personalized MAP"
            estimatedDuration={8000}
            className="rounded-2xl min-h-[70vh] !absolute inset-0"
          />
        </div>
      </Container>
    )
  }

  // ── PHASE 4: Activating ───────────────────────────────────────────

  if (phase === 'activating') {
    return (
      <Container size="xl">
        <div className="relative min-h-[70vh]">
          <VIVALoadingOverlay
            isVisible
            messages={[
              'Creating your Above the Green Line target...',
              'Setting up your commitments...',
              'Activating your MAP...',
              'Unlocking your full platform access...',
            ]}
            cycleDuration={2000}
            estimatedTime="Almost there!"
            estimatedDuration={6000}
            className="rounded-2xl min-h-[70vh] !absolute inset-0"
          />
        </div>

        <IntensiveStepCompleteModal
          isOpen={showStepCompleteModal}
          onClose={() => setShowStepCompleteModal(false)}
          stepId="activation_protocol"
        />
      </Container>
    )
  }

  // ── PHASE 3: Review + Activate ────────────────────────────────────

  if (phase === 'review') {
    const baseSuggestions = suggestions.filter(s => s.tier === 'base')
    const supplementSuggestions = suggestions.filter(s => s.tier === 'supplement')
    const selectedCount = selectedSuggestions.size

    return (
      <Container size="xl">
        <Stack gap="lg">
          {/* VIVA Header */}
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Your MAP is Ready</h1>
            <p className="text-sm text-neutral-400 max-w-lg mx-auto">
              Your first target is an <strong className="text-primary-400">Above the Green Line</strong> emotional state.
              We help you get there with Creation, Activation, Connection, and Sessions.
            </p>
          </div>

          {/* Vibration Snapshot */}
          {greenLineStatus && Object.keys(greenLineStatus).length > 0 && (
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <Stack gap="md">
                <div>
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-2">
                    Your Vibration Snapshot
                  </Text>
                  {diagnosis && (diagnosis.below.length > 0 || diagnosis.transition.length > 0) && (
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      VIVA identified areas that need attention. The commitments below are designed to shift these areas above the Green Line.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(greenLineStatus).map(([cat, status]) => (
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

                {diagnosis && (diagnosis.below.length > 0 || diagnosis.transition.length > 0) && (
                  <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20">
                    <Text size="xs" className="text-primary-400">
                      {diagnosis.below.length > 0 && (
                        <span>
                          <strong>{formatCategoryList(diagnosis.below)}</strong>
                          {' '}{diagnosis.below.length === 1 ? 'is' : 'are'} below the Green Line.{' '}
                        </span>
                      )}
                      {diagnosis.transition.length > 0 && (
                        <span>
                          <strong>{formatCategoryList(diagnosis.transition)}</strong>
                          {' '}{diagnosis.transition.length === 1 ? 'is' : 'are'} in transition.
                        </span>
                      )}
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>
          )}

          {/* Base Commitments */}
          {baseSuggestions.length > 0 && (
            <div>
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-3">
                Your Core Actions
              </Text>
              <Stack gap="sm">
                {baseSuggestions.map((s, i) => {
                  const globalIndex = suggestions.indexOf(s)
                  return (
                    <CommitmentCheckbox
                      key={globalIndex}
                      suggestion={s}
                      selected={selectedSuggestions.has(globalIndex)}
                      onToggle={() => toggleSuggestion(globalIndex)}
                    />
                  )
                })}
              </Stack>
            </div>
          )}

          {/* Supplement Commitments */}
          {supplementSuggestions.length > 0 && (
            <div>
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-1">
                VIVA Recommends
              </Text>
              <p className="text-xs text-neutral-500 mb-3">
                Extra activation reps on areas that need attention
              </p>
              <Stack gap="sm">
                {supplementSuggestions.map((s, i) => {
                  const globalIndex = suggestions.indexOf(s)
                  return (
                    <CommitmentCheckbox
                      key={globalIndex}
                      suggestion={s}
                      selected={selectedSuggestions.has(globalIndex)}
                      onToggle={() => toggleSuggestion(globalIndex)}
                    />
                  )
                })}
              </Stack>
            </div>
          )}

          {/* MAP Guide (Collapsible in review phase) */}
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
            {showGuide && <MapGuideContent getVisionLink={getVisionLink} />}
          </Card>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Button
              variant="primary"
              size="lg"
              onClick={handleActivateMap}
              disabled={completing || selectedCount === 0}
              className="w-full justify-center"
            >
              {completing ? (
                <><Spinner size="sm" className="mr-2" />Activating...</>
              ) : (
                <><Unlock className="w-5 h-5 mr-2" />Activate MAP ({selectedCount} commitment{selectedCount !== 1 ? 's' : ''})</>
              )}
            </Button>
          </div>

          {/* Mobile fixed bottom CTA */}
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
            <Button
              variant="primary"
              size="lg"
              onClick={handleActivateMap}
              disabled={completing || selectedCount === 0}
              className="w-full justify-center shadow-lg"
            >
              {completing ? (
                <><Spinner size="sm" className="mr-2" />Activating...</>
              ) : (
                <><Unlock className="w-5 h-5 mr-2" />Activate MAP ({selectedCount})</>
              )}
            </Button>
          </div>

          {/* Spacer for mobile fixed button */}
          <div className="md:hidden h-16" />
        </Stack>

        <IntensiveStepCompleteModal
          isOpen={showStepCompleteModal}
          onClose={() => setShowStepCompleteModal(false)}
          stepId="activation_protocol"
        />
      </Container>
    )
  }

  // ── PHASE 1: Launch (default) ─────────────────────────────────────

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

        {/* Build MAP CTA */}
        {!isAlreadyCompleted && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
            <div className="py-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">Build MAP with VIVA</h2>
              <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
                VIVA will analyze your assessment, identify where you stand on the Green Line, and build your personalized MAP commitments.
              </p>
              <Button
                variant="accent"
                size="lg"
                onClick={runAnalysis}
                className="w-full sm:w-auto justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Build MAP with VIVA
              </Button>
            </div>
          </Card>
        )}

        {/* Already Completed */}
        {isAlreadyCompleted && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
            <div className="py-6">
              <p className="text-neutral-300 mb-4">
                This is your MAP. Come back anytime during your journey.
              </p>
              <Button variant="primary" asChild>
                <Link href="/intensive/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
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
          {showGuide && <MapGuideContent getVisionLink={getVisionLink} />}
        </Card>

        {/* Milestones */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
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
        </Card>
      </Stack>

      <BadgeDetailModal
        badge={selectedMilestoneBadge}
        isOpen={!!selectedMilestoneBadge}
        onClose={() => setSelectedMilestoneBadge(null)}
      />
    </Container>
  )
}

// ── Commitment Checkbox Card ──────────────────────────────────────

function CommitmentCheckbox({
  suggestion,
  selected,
  onToggle,
}: {
  suggestion: SuggestedCommitment
  selected: boolean
  onToggle: () => void
}) {
  const color = MAP_CATEGORY_COLORS[suggestion.category] || '#39FF14'
  const cadenceLabel = suggestion.cadence.kind === 'daily'
    ? 'Daily'
    : `${(suggestion.cadence as any).count}x/week`

  return (
    <div
      onClick={onToggle}
      className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-neutral-700/80 hover:border-neutral-500 bg-neutral-800/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
          selected
            ? 'border-primary-500 bg-primary-500'
            : 'border-neutral-600'
        }`}>
          {selected && <Check className="w-3.5 h-3.5 text-black" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm md:text-base font-semibold text-white leading-tight">
              {suggestion.title}
            </h4>
            <Badge
              variant="neutral"
              className="text-xs capitalize"
              style={{ color, borderColor: `${color}30` }}
            >
              {MAP_CATEGORY_LABELS[suggestion.category] || suggestion.category}
            </Badge>
            <span className="text-xs text-neutral-500">{cadenceLabel}</span>
          </div>
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
            {suggestion.description}
          </p>
          <p className="text-xs text-neutral-500 mt-1 italic">
            {suggestion.rationale}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── MAP Guide Content (shared between phases) ─────────────────────

function MapGuideContent({ getVisionLink }: { getVisionLink: (path: string) => string }) {
  return (
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
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
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
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
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
      </div>

      {/* Activations */}
      <div>
        <Text size="sm" className="text-[#39FF14] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#39FF14]/30 mb-4">
          Activations
        </Text>
        <p className="text-sm text-neutral-500 mt-2 mb-4">Engage the tools you&apos;ve created to stay in alignment</p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
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
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
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
  )
}
