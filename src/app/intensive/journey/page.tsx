'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Stack,
  PageHero,
  Card,
  Badge,
  Button,
  Spinner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import {
  getRatingQuestions,
  INTAKE_QUESTIONS,
  type IntakeQuestion,
} from '@/lib/constants/intensive-intake-questions'
import { getStepsInOrder, type IntensiveStepInfo } from '@/lib/intensive/step-mapping'
import {
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Clock,
  Target,
  Headphones,
  BookOpen,
  Image as ImageIcon,
  ClipboardCheck,
  Sparkles,
  Quote,
  Video,
  Settings,
  User,
  Wand2,
  Music,
  Mic,
  Sliders,
  Calendar,
  Rocket,
  Unlock,
  FileText,
  BarChart3,
} from 'lucide-react'

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface IntensiveChecklist {
  intensive_id: string
  status: string
  started_at: string | null
  completed_at: string | null
  intake_completed_at: string | null
  profile_completed_at: string | null
  assessment_completed_at: string | null
  vision_built_at: string | null
  vision_refined_at: string | null
  audio_generated_at: string | null
  audios_generated_at: string | null
  vision_board_completed_at: string | null
  first_journal_entry_at: string | null
  call_scheduled_at: string | null
  activation_protocol_completed_at: string | null
  unlock_completed_at: string | null
  [key: string]: string | boolean | null
}

interface IntensiveResponse {
  phase: string
  vision_clarity: number | null
  vibrational_harmony: number | null
  vibrational_constraints_clarity: number | null
  vision_iteration_ease: number | null
  has_audio_tracks: string | null
  audio_iteration_ease: number | null
  has_vision_board: string | null
  vision_board_management: number | null
  journey_capturing: number | null
  roadmap_clarity: number | null
  transformation_tracking: number | null
  previous_attempts: string | null
  biggest_shift: string | null
  testimonial_video_url: string | null
  testimonial_transcript: string | null
  stats_snapshot: Record<string, number | string | boolean | null> | null
  sharing_preference: string | null
  [key: string]: unknown
}

// -------------------------------------------------------------------
// Phase icons and colors (matches unlock page)
// -------------------------------------------------------------------

const PHASE_META: Record<string, { icon: React.ElementType; color: string }> = {
  Setup: { icon: Settings, color: 'text-neutral-400' },
  Foundation: { icon: User, color: 'text-[#5EC49A]' },
  'Vision Creation': { icon: Sparkles, color: 'text-[#2DD4BF]' },
  Audio: { icon: Music, color: 'text-[#8B5CF6]' },
  Activation: { icon: ImageIcon, color: 'text-[#FFB701]' },
  Completion: { icon: Rocket, color: 'text-primary-500' },
}

const STEP_ICONS: Record<string, React.ElementType> = {
  settings: Settings,
  intake: FileText,
  profile: User,
  assessment: ClipboardCheck,
  build_vision: Sparkles,
  refine_vision: Wand2,
  generate_audio: Music,
  record_audio: Mic,
  mix_audio: Sliders,
  vision_board: ImageIcon,
  journal: BookOpen,
  schedule_call: Calendar,
  activation_protocol: Rocket,
  unlock: Unlock,
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return '--'
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours < 1) return `${minutes}m`
  if (hours < 72) return `${hours}h ${minutes}m`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days}d ${remainingHours}h`
}

function getMultipleChoiceLabel(questionId: string, value: string | null): string {
  if (!value) return 'None'
  const question = INTAKE_QUESTIONS.find(q => q.id === questionId)
  if (!question?.options) return value.replace(/_/g, ' ')
  const option = question.options.find(o => o.value === value)
  return option?.label || value.replace(/_/g, ' ')
}

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------

export default function IntensiveJourneyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<IntensiveChecklist | null>(null)
  const [preResponse, setPreResponse] = useState<IntensiveResponse | null>(null)
  const [postResponse, setPostResponse] = useState<IntensiveResponse | null>(null)

  useEffect(() => {
    loadJourneyData()
  }, [])

  async function loadJourneyData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch the most recent completed intensive checklist
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!checklistData) {
        setLoading(false)
        return
      }

      setChecklist(checklistData as IntensiveChecklist)

      // Fetch both pre and post intensive responses
      const { data: responses } = await supabase
        .from('intensive_responses')
        .select('*')
        .eq('intensive_id', checklistData.intensive_id)
        .in('phase', ['pre_intensive', 'post_intensive'])

      if (responses) {
        const pre = responses.find(r => r.phase === 'pre_intensive')
        const post = responses.find(r => r.phase === 'post_intensive')
        if (pre) setPreResponse(pre as IntensiveResponse)
        if (post) setPostResponse(post as IntensiveResponse)
      }
    } catch (error) {
      console.error('Error loading journey data:', error)
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  // -------------------------------------------------------------------
  // No completed intensive
  // -------------------------------------------------------------------

  if (!checklist) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="ACTIVATION INTENSIVE"
            title="Your Intensive Journey"
            subtitle="Complete the Activation Intensive to see your full journey results here."
          />
          <Card className="p-4 md:p-6 lg:p-8 text-center">
            <p className="text-neutral-400 mb-6 text-sm md:text-base">
              No completed intensive found. Complete all 14 steps to unlock your journey recap.
            </p>
            <Button variant="primary" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Card>
        </Stack>
      </Container>
    )
  }

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------

  const totalDuration = formatDuration(checklist.started_at, checklist.completed_at)
  const completedDate = formatDate(checklist.completed_at)
  const steps = getStepsInOrder()
  const ratingQuestions = getRatingQuestions()
  const statsSnapshot = postResponse?.stats_snapshot
  const multipleChoiceQuestions = INTAKE_QUESTIONS.filter(
    q => q.type === 'multiple_choice' && q.showInPre && q.showInPost && q.id !== 'sharing_preference'
  )

  // Calculate average improvement across rating questions
  let totalImprovement = 0
  let comparisonCount = 0
  ratingQuestions.forEach(q => {
    const pre = preResponse?.[q.id] as number | null
    const post = postResponse?.[q.id] as number | null
    if (pre !== null && pre !== undefined && post !== null && post !== undefined) {
      totalImprovement += post - pre
      comparisonCount++
    }
  })
  const avgImprovement = comparisonCount > 0 ? (totalImprovement / comparisonCount).toFixed(1) : null

  // Group steps by phase for timeline
  const phaseGroups: { phase: string; steps: IntensiveStepInfo[] }[] = []
  steps.forEach(step => {
    const existing = phaseGroups.find(g => g.phase === step.phase)
    if (existing) {
      existing.steps.push(step)
    } else {
      phaseGroups.push({ phase: step.phase, steps: [step] })
    }
  })

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="ACTIVATION INTENSIVE"
          title="Your Intensive Journey"
          subtitle={`Completed on ${completedDate} in ${totalDuration}`}
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="success">14 / 14 Steps Complete</Badge>
            {avgImprovement && Number(avgImprovement) > 0 && (
              <Badge variant="premium">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{avgImprovement} avg growth
              </Badge>
            )}
          </div>
        </PageHero>

        {/* Journey Timeline */}
        <JourneyTimeline
          phaseGroups={phaseGroups}
          checklist={checklist}
        />

        {/* Before & After Comparison */}
        {preResponse && postResponse && (
          <BeforeAfterComparison
            ratingQuestions={ratingQuestions}
            multipleChoiceQuestions={multipleChoiceQuestions}
            preResponse={preResponse}
            postResponse={postResponse}
          />
        )}

        {/* Activity Snapshot */}
        {statsSnapshot && (
          <ActivitySnapshot stats={statsSnapshot} />
        )}

        {/* Biggest Shift */}
        {(postResponse?.biggest_shift || postResponse?.testimonial_transcript) && (
          <BiggestShiftCard
            biggestShift={postResponse.biggest_shift}
            transcript={postResponse.testimonial_transcript}
          />
        )}

        {/* Video Testimonial */}
        {postResponse?.testimonial_video_url && (
          <TestimonialVideo
            videoUrl={postResponse.testimonial_video_url}
            transcript={postResponse.testimonial_transcript}
          />
        )}

        {/* Back to Dashboard */}
        <div className="flex justify-center pb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </Stack>
    </Container>
  )
}

// ===================================================================
// Section Components
// ===================================================================

// -------------------------------------------------------------------
// Journey Timeline
// -------------------------------------------------------------------

function JourneyTimeline({
  phaseGroups,
  checklist,
}: {
  phaseGroups: { phase: string; steps: IntensiveStepInfo[] }[]
  checklist: IntensiveChecklist
}) {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="md">
        <div className="text-center">
          <h3 className="text-lg md:text-xl font-bold text-white mb-1">
            Your 14-Step Journey
          </h3>
          <p className="text-sm text-neutral-400">
            Started {formatDate(checklist.started_at)} {formatTime(checklist.started_at) && `at ${formatTime(checklist.started_at)}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phaseGroups.map(({ phase, steps }) => {
            const meta = PHASE_META[phase] || { icon: Settings, color: 'text-neutral-400' }
            const PhaseIcon = meta.icon

            return (
              <div key={phase} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <PhaseIcon className={`w-5 h-5 ${meta.color}`} />
                  <span className="font-semibold text-white">{phase}</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  {steps.map(step => {
                    const StepIcon = STEP_ICONS[step.id] || CheckCircle
                    const completedAtKey = step.completedAtKey
                    const completedAt = completedAtKey ? checklist[completedAtKey] as string | null : null

                    return (
                      <div key={step.id} className="flex items-center gap-2 text-sm text-neutral-400">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="text-xs font-mono text-neutral-600 w-4">
                          {step.stepNumber}
                        </span>
                        <StepIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="flex-1 truncate">{step.title}</span>
                        {completedAt && (
                          <span className="text-xs text-neutral-600 flex-shrink-0 hidden sm:inline">
                            {formatDate(completedAt)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {checklist.started_at && checklist.completed_at && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-400">
              Total time: <span className="text-white font-semibold">{formatDuration(checklist.started_at, checklist.completed_at)}</span>
            </span>
          </div>
        )}
      </Stack>
    </Card>
  )
}

// -------------------------------------------------------------------
// Before & After Comparison
// -------------------------------------------------------------------

function BeforeAfterComparison({
  ratingQuestions,
  multipleChoiceQuestions,
  preResponse,
  postResponse,
}: {
  ratingQuestions: IntakeQuestion[]
  multipleChoiceQuestions: IntakeQuestion[]
  preResponse: IntensiveResponse
  postResponse: IntensiveResponse
}) {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="md">
        <div className="text-center">
          <h3 className="text-lg md:text-xl font-bold text-white mb-1">
            Before & After
          </h3>
          <p className="text-sm text-neutral-400">
            Your self-reported scores from intake vs. unlock
          </p>
        </div>

        {/* Rating comparisons */}
        <div className="space-y-4">
          {ratingQuestions.map(q => {
            const pre = preResponse[q.id] as number | null
            const post = postResponse[q.id] as number | null
            const delta = pre !== null && pre !== undefined && post !== null && post !== undefined
              ? post - pre
              : null

            return (
              <div key={q.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{q.label}</span>
                  {delta !== null && (
                    <Badge
                      variant={delta > 0 ? 'success' : delta === 0 ? 'neutral' : 'neutral'}
                      className="text-xs"
                    >
                      {delta > 0 && <TrendingUp className="w-3 h-3 mr-1" />}
                      {delta > 0 ? `+${delta}` : delta === 0 ? 'No change' : `${delta}`}
                    </Badge>
                  )}
                </div>

                {/* Bar comparison */}
                <div className="space-y-1.5">
                  {/* Before bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 w-12 text-right">Before</span>
                    <div className="flex-1 h-3 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-600 rounded-full transition-all duration-500"
                        style={{ width: `${((pre ?? 0) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-neutral-500 w-8 text-right">
                      {pre ?? '--'}/10
                    </span>
                  </div>

                  {/* After bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 w-12 text-right">After</span>
                    <div className="flex-1 h-3 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${((post ?? 0) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-8 text-right">
                      {post ?? '--'}/10
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Multiple choice comparisons */}
        {multipleChoiceQuestions.length > 0 && (
          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-sm font-semibold text-neutral-300 mb-3">Status Changes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {multipleChoiceQuestions.map(q => {
                const preVal = preResponse[q.id] as string | null
                const postVal = postResponse[q.id] as string | null
                const changed = preVal !== postVal

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border ${
                      changed
                        ? 'border-primary-500/30 bg-primary-500/5'
                        : 'border-neutral-800 bg-neutral-900/30'
                    }`}
                  >
                    <div className="text-xs text-neutral-400 mb-1">{q.label}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">
                        {getMultipleChoiceLabel(q.id, preVal)}
                      </span>
                      {changed && (
                        <>
                          <span className="text-neutral-600">&rarr;</span>
                          <span className="text-primary-400 font-medium">
                            {getMultipleChoiceLabel(q.id, postVal)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Stack>
    </Card>
  )
}

// -------------------------------------------------------------------
// Activity Snapshot
// -------------------------------------------------------------------

function ActivitySnapshot({
  stats,
}: {
  stats: Record<string, number | string | boolean | null>
}) {
  const statItems: { icon: React.ElementType; label: string; value: string }[] = [
    {
      icon: Target,
      label: 'Life Visions',
      value: `${stats.visions_count ?? 0} created`,
    },
    {
      icon: Sparkles,
      label: 'Refinements',
      value: `${stats.total_refinements ?? 0}`,
    },
    {
      icon: Headphones,
      label: 'Audio Sets',
      value: `${stats.audio_sets_count ?? 0} sets, ${stats.audio_tracks_count ?? 0} tracks`,
    },
    {
      icon: ImageIcon,
      label: 'Vision Board',
      value: `${stats.vision_board_items_count ?? 0} items`,
    },
    {
      icon: BookOpen,
      label: 'Journal Entries',
      value: `${stats.journal_entries_count ?? 0}`,
    },
    {
      icon: ClipboardCheck,
      label: 'Assessment',
      value: stats.assessment_completed ? 'Completed' : 'Not started',
    },
    {
      icon: User,
      label: 'Profile',
      value: `${stats.profile_completion_percent ?? 0}% complete`,
    },
    {
      icon: BarChart3,
      label: 'Engagement Score',
      value: `${stats.engagement_score ?? 0}/100`,
    },
  ]

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="md">
        <div className="text-center">
          <h3 className="text-lg md:text-xl font-bold text-white mb-1">
            What You Built
          </h3>
          <p className="text-sm text-neutral-400">
            A snapshot of everything created during your intensive
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="p-3 md:p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center"
              >
                <Icon className="w-5 h-5 mx-auto mb-2 text-primary-500" />
                <div className="text-sm font-semibold text-white mb-0.5">{item.value}</div>
                <div className="text-xs text-neutral-500">{item.label}</div>
              </div>
            )
          })}
        </div>
      </Stack>
    </Card>
  )
}

// -------------------------------------------------------------------
// Biggest Shift Card
// -------------------------------------------------------------------

function BiggestShiftCard({
  biggestShift,
  transcript,
}: {
  biggestShift: string | null
  transcript: string | null
}) {
  const text = biggestShift || transcript
  if (!text) return null

  return (
    <Card
      variant="outlined"
      className="bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-primary-500/20"
    >
      <Stack gap="sm">
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold text-white">Your Biggest Shift</h3>
        </div>
        <blockquote className="text-neutral-300 text-sm md:text-base leading-relaxed italic pl-4 border-l-2 border-primary-500/40">
          &ldquo;{text}&rdquo;
        </blockquote>
      </Stack>
    </Card>
  )
}

// -------------------------------------------------------------------
// Video Testimonial
// -------------------------------------------------------------------

function TestimonialVideo({
  videoUrl,
  transcript,
}: {
  videoUrl: string
  transcript: string | null
}) {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="md">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold text-white">Your Testimonial</h3>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <OptimizedVideo
            url={videoUrl}
            context="single"
            className="w-full rounded-lg"
          />
        </div>

        {transcript && (
          <div className="p-3 md:p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1 font-medium">Transcript</p>
            <p className="text-sm text-neutral-300 leading-relaxed">{transcript}</p>
          </div>
        )}
      </Stack>
    </Card>
  )
}
