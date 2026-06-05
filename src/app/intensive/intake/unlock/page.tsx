'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Card, 
  Button, 
  Textarea,
  Spinner,
  Container,
  Stack,
  RadioGroup,
  Badge,
  Checkbox,
} from '@/lib/design-system/components'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { 
  TrendingUp, 
  CheckCircle, 
  Video, 
  FileText,
  Target,
  Headphones,
  Layout,
  Sparkles,
  Keyboard,
  Settings,
  User,
  Music,
  Mic,
  Sliders,
  Image as ImageIcon,
  BookOpen,
  Rocket,
  Unlock,
  MessageSquare,
  Users,
  Activity,
  AlertCircle,
} from 'lucide-react'

import { 
  getQuestionsForPhase, 
  INTAKE_QUESTIONS,
  type IntakeQuestion 
} from '@/lib/constants/intensive-intake-questions'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import { emptyMapPillarActive } from '@/lib/map/compute-map-pillar-stats'
import type { MapCategory, MapPillarActive } from '@/lib/map/types'

const UNLOCK_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/14-unlock--5-15-26-1080p.mp4'
const UNLOCK_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/14-unlock--5-15-26-thumb.0000000.jpg'

const TESTIMONIAL_QUESTION_TEXT =
  'What was your experience in completing the 72-Hour Activation Intensive?'

function truncateForError(text: string, maxLength = 100): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 3)}...`
}

function scrollToUnlockField(fieldId: string) {
  requestAnimationFrame(() => {
    document
      .getElementById(`unlock-question-${fieldId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// Types
interface IntensiveStats {
  visions_count: number
  visions_active: number
  visions_draft: number
  visions_with_refinements: number
  total_refinements: number
  audio_sets_count: number
  audio_tracks_count: number
  audio_tracks_completed: number
  vision_board_items_count: number
  vision_board_images_count: number
  journal_entries_count: number
  profile_completion_percent: number
  profile_versions_count: number
  vibe_posts_count: number
  vibe_tribe_engaged: boolean
  map_activated: boolean
  map_commitments_count: number
  map_pillar_active: MapPillarActive
  map_all_pillars_active: boolean
  alignment_gym_toured: boolean
  alignment_gym_map_commitment: boolean
  alignment_gym_schedule_label: string
  alignment_gym_sessions_attended: number
  assessment_completed: boolean
  assessment_completed_count: number
  assessment_strengths_count: number
  assessment_growth_areas_count: number
  first_vision_created_at: string | null
  last_vision_updated_at: string | null
  last_audio_generated_at: string | null
  days_since_start: number
  engagement_score: number
}

// Build form data type from questions
type UnlockFormData = {
  [key: string]: number | string | boolean | null
}

// Initialize form data from questions
const initializeFormData = (): UnlockFormData => {
  const data: UnlockFormData = {}
  INTAKE_QUESTIONS.forEach(q => {
    if (q.type === 'rating') {
      data[q.id] = null
    } else if (q.type === 'multiple_choice') {
      // Default sharing_preference to 'named'
      data[q.id] = q.id === 'sharing_preference' ? 'named' : null
    } else if (q.type === 'text') {
      data[q.id] = ''
    } else if (q.type === 'boolean') {
      data[q.id] = false
    }
  })
  return data
}

export default function IntensiveUnlockPage() {
  const router = useRouter()
  const supabase = createClient()

  // Get questions for post_intensive phase (excluding text, boolean, and sharing_preference - rendered separately)
  const questions = getQuestionsForPhase('post_intensive').filter(q => 
    q.type !== 'text' && q.type !== 'boolean' && q.id !== 'sharing_preference'
  )

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [stats, setStats] = useState<IntensiveStats | null>(null)
  const [baseline, setBaseline] = useState<Record<string, number | string | null>>({})
  const [testimonialVideoUrl, setTestimonialVideoUrl] = useState<string | null>(null)
  const [testimonialTranscript, setTestimonialTranscript] = useState<string | null>(null)
  const [formData, setFormData] = useState<UnlockFormData>(initializeFormData)
  const [showTextInput, setShowTextInput] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitErrorItems, setSubmitErrorItems] = useState<string[]>([])
  const [highlightFieldIds, setHighlightFieldIds] = useState<string[]>([])
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()

  useEffect(() => {
    if (isAlreadyCompleted && completedAt) setStepCompleted(completedAt)
    return () => setStepCompleted(null)
  }, [isAlreadyCompleted, completedAt, setStepCompleted])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for super_admin access
      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)

      const { data: checklistRow, error: checklistError } = await supabase
        .from('intensive_checklist')
        .select('intensive_id, unlock_completed, unlock_completed_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklistError || !checklistRow) {
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
        } else {
          router.push('/intensive/dashboard')
          return
        }
      } else {
        setIntensiveId(checklistRow.intensive_id)

        if (checklistRow?.unlock_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklistRow.unlock_completed_at)
        }
      }
      
      const activeIntensiveId = checklistRow?.intensive_id || 'super-admin-test-mode'

      // Get baseline responses (pre_intensive phase) - skip for test mode
      if (activeIntensiveId !== 'super-admin-test-mode') {
        const { data: baselineData } = await supabase
          .from('intensive_responses')
          .select('*')
          .eq('intensive_id', activeIntensiveId)
          .eq('phase', 'pre_intensive')
          .single()

        if (baselineData) {
          // Extract all baseline values dynamically
          const baselineValues: Record<string, number | string | null> = {}
          INTAKE_QUESTIONS.forEach(q => {
            if (baselineData[q.id] !== undefined) {
              baselineValues[q.id] = baselineData[q.id]
            }
          })
          setBaseline(baselineValues)
        }
      }

      // Fetch user stats
      const statsResponse = await fetch('/api/intensive/stats')
      if (statsResponse.ok) {
        const { stats: userStats } = await statsResponse.json()
        setStats({
          ...userStats,
          vibe_posts_count: Number(userStats?.vibe_posts_count) || 0,
          vibe_tribe_engaged: Boolean(userStats?.vibe_tribe_engaged),
          map_activated: Boolean(userStats?.map_activated),
          map_commitments_count: Number(userStats?.map_commitments_count) || 0,
          map_pillar_active: {
            activations: Boolean(userStats?.map_pillar_active?.activations),
            creations: Boolean(userStats?.map_pillar_active?.creations),
            connections: Boolean(userStats?.map_pillar_active?.connections),
            sessions: Boolean(userStats?.map_pillar_active?.sessions),
          },
          map_all_pillars_active: Boolean(userStats?.map_all_pillars_active),
          alignment_gym_toured: Boolean(userStats?.alignment_gym_toured),
          alignment_gym_map_commitment: Boolean(userStats?.alignment_gym_map_commitment),
          alignment_gym_schedule_label: String(userStats?.alignment_gym_schedule_label ?? ''),
          alignment_gym_sessions_attended: Number(userStats?.alignment_gym_sessions_attended) || 0,
        })
        
        // Auto-populate form based on objective data
        const autoFilled = autoPopulateFromStats(userStats)
        setFormData(prev => ({ ...prev, ...autoFilled } as UnlockFormData))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-populate answers based on objective stats data
  const autoPopulateFromStats = (stats: IntensiveStats): Partial<UnlockFormData> => {
    const data: Partial<UnlockFormData> = {}

    // Vision clarity - if they have visions
    if (stats.visions_count > 0) {
      data.vision_clarity = 10
    }

    // Vibrational harmony - if they have active visions
    if (stats.visions_active > 0) {
      data.vibrational_harmony = 10
    }

    // Vibe Tribe - posted and engaged with other members
    if (stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged) {
      data.vibrational_constraints_clarity = 10
    }

    // Vision iteration ease - active Life Vision ready to clone as a Graduate
    if (stats.visions_active > 0) {
      data.vision_iteration_ease = 10
    }

    // Audio tracks - yes/no based on audio sets
    if (stats.audio_sets_count > 0) {
      data.has_audio_tracks = 'yes'
      data.audio_iteration_ease = 10
    }

    // Vision board - based on vision board items (both digital + physical via downloader)
    if (stats.vision_board_items_count > 0) {
      data.has_vision_board = 'yes_both'
      data.vision_board_management = 10
    }

    // Journey capturing - based on journal entries
    if (stats.journal_entries_count > 0) {
      data.journey_capturing = 10
    }

    // My Alignment Plan — active commitment in each of the four pillars
    if (stats.map_all_pillars_active) {
      data.roadmap_clarity = 10
    }

    // Alignment Gym (Q11) — tour complete (or MAP done, which requires gym in intensive flow)
    if (stats.alignment_gym_toured || stats.map_activated) {
      data.transformation_tracking = 10
    }

    return data
  }

  // Get score explanation for a question
  const getScoreExplanation = (questionId: string): string | null => {
    if (!stats) return null
    const value = formData[questionId]
    
    // For yes/no questions, check the value differently
    if (questionId === 'has_vision_board' && formData[questionId] === 'yes_both') {
      return `Our choice for you is Yes, both physical and digital, because you have a digital board and access to a downloadable PDF.`
    }
    
    if (questionId === 'has_audio_tracks' && formData[questionId] === 'yes') {
      return `Our score for you is "Yes", as you have ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''} with ${stats.audio_tracks_count} track${stats.audio_tracks_count !== 1 ? 's' : ''}.`
    }
    
    if (value !== 10) return null

    switch (questionId) {
      case 'vision_clarity':
        return 'Our score for you is 10/10, as you have created a Life Vision.'
      case 'vibrational_harmony':
        return `Our score for you is 10/10, as you have ${stats.visions_count} vision${stats.visions_count !== 1 ? 's' : ''}, ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''}, and ${stats.vision_board_items_count} vision board item${stats.vision_board_items_count !== 1 ? 's' : ''}.`
      case 'vibrational_constraints_clarity':
        if (stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged) {
          return 'Our score for you is 10/10, as you have posted in and engaged with the Vibe Tribe.'
        }
        return null
      case 'vision_iteration_ease':
        return 'Our score for you is 10/10, as you can easily create and edit new versions of your active Life Vision upon graduation.'
      case 'audio_iteration_ease':
        return `Our score for you is 10/10, as you have created ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''} with ${stats.audio_tracks_count} track${stats.audio_tracks_count !== 1 ? 's' : ''} with new generations ready at the click of a button.`
      case 'vision_board_management':
        return `Our score for you is 10/10, as you have ${stats.vision_board_items_count} item${stats.vision_board_items_count !== 1 ? 's' : ''} on your vision board with easy management and downloads.`
      case 'journey_capturing': {
        const profiles = stats.profile_versions_count ?? 0
        const visions = stats.visions_count ?? 0
        const boardItems = stats.vision_board_items_count ?? 0
        const journals = stats.journal_entries_count ?? 0
        return `Our score for you is 10/10, as you have ${profiles} profile version${profiles !== 1 ? 's' : ''}, ${visions} life vision${visions !== 1 ? 's' : ''}, ${boardItems} vision board item${boardItems !== 1 ? 's' : ''}, ${journals} journal entr${journals !== 1 ? 'ies' : 'y'}, and Vibe Tribe activity on your account - each easy to create new versions or add new entries.`
      }
      case 'roadmap_clarity': {
        if (!stats.map_all_pillars_active) return null
        return 'Our score for you is 10/10, because you have an active MAP (My Alignment Plan) with commitments in each of the four categories: Activations, Creations, Connections, & Sessions.'
      }
      case 'transformation_tracking':
        return 'Our score for you is 10/10, because you completed the Alignment Gym tour, have an Alignment Gym commitment on your MAP, and have access to all session replays.'
      default:
        return null
    }
  }

  const clearSubmitValidation = () => {
    setSubmitError(null)
    setSubmitErrorItems([])
    setHighlightFieldIds([])
  }

  const updateFormData = (field: string, value: number | string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearSubmitValidation()
  }

  const submitForm = async () => {
    if (!intensiveId) return

    const testimonialQuestionNumber = questions.length + 1
    const missing: { fieldId: string; label: string }[] = []

    questions.forEach((q, index) => {
      if (q.type !== 'rating' && q.type !== 'multiple_choice') return
      if (formData[q.id] === null || formData[q.id] === '') {
        const prompt = q.questionPost || q.label
        missing.push({
          fieldId: q.id,
          label: `Question ${index + 1}: ${truncateForError(prompt)}`,
        })
      }
    })

    const hasTestimonial =
      Boolean(testimonialVideoUrl) ||
      Boolean(testimonialTranscript?.trim()) ||
      Boolean((formData.biggest_shift as string)?.trim())

    if (!hasTestimonial) {
      missing.push({
        fieldId: 'testimonial',
        label: `Question ${testimonialQuestionNumber}: ${truncateForError(TESTIMONIAL_QUESTION_TEXT)} (record a video or type your response)`,
      })
    }

    if (missing.length > 0) {
      setSubmitError('Please complete the following before unlocking your platform:')
      setSubmitErrorItems(missing.map(m => m.label))
      setHighlightFieldIds(missing.map(m => m.fieldId))
      scrollToUnlockField(missing[0].fieldId)
      return
    }

    clearSubmitValidation()
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Build insert data from form
      const insertData: Record<string, unknown> = {
        intensive_id: intensiveId,
        user_id: user.id,
        phase: 'post_intensive',
        stats_snapshot: stats,
        testimonial_video_url: testimonialVideoUrl,
        testimonial_transcript: testimonialTranscript,
        biggest_shift: showTextInput ? formData.biggest_shift : testimonialTranscript,
        sharing_preference: formData.sharing_preference,
      }

      // Add all form fields from questions
      questions.forEach(q => {
        if (formData[q.id] !== null && formData[q.id] !== '') {
          insertData[q.id] = formData[q.id]
        }
      })

      // Store post-intensive response (one per user per intensive)
      const { error: insertError } = await supabase
        .from('intensive_responses')
        .insert(insertData)

      if (insertError) {
        // Log but don't block - the user should still be able to unlock
        // This will error if user already submitted (unique constraint) - that's expected
        console.error('Error storing response (non-blocking):', insertError)
      }

      // Mark unlock completed and intensive as completed in checklist
      const { error: updateError } = await supabase
        .from('intensive_checklist')
        .update({
          unlock_completed: true,
          unlock_completed_at: new Date().toISOString(),
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (updateError) {
        console.error('Error updating checklist:', updateError)
        throw new Error('Failed to complete unlock')
      }

      // Fire intensive.completed event to cancel onboarding sequence
      fetch('/api/intensive/completed', { method: 'POST' })
        .catch(err => console.error('intensive.completed event error:', err))

      window.location.href = '/dashboard?unlocked=true'

    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitError('Something went wrong while unlocking. Please try again.')
      setSubmitErrorItems([])
      setHighlightFieldIds([])
    } finally {
      setSubmitting(false)
    }
  }

  // Stat badge component
  const StatBadge = ({ 
    icon: Icon, 
    label, 
    value, 
    suffix = '' 
  }: { 
    icon: React.ElementType
    label: string
    value: number | string
    suffix?: string 
  }) => (
    <div className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-2">
      <Icon className="w-4 h-4 text-primary-500" />
      <span className="text-xs text-neutral-400">{label}:</span>
      <span className="text-sm font-semibold text-white">{value}{suffix}</span>
    </div>
  )

  // Get stats info for a specific question
  const getStatsForQuestion = (questionId: string): React.ReactNode => {
    if (!stats) return null

    switch (questionId) {
      case 'vision_clarity':
        return (
          <>
            <StatBadge icon={Target} label="Visions Created" value={stats.visions_count} />
            {stats.visions_draft > 0 && (
              <StatBadge icon={FileText} label="In Draft" value={stats.visions_draft} />
            )}
          </>
        )
      case 'vibrational_harmony':
        return (
          <>
            <StatBadge icon={Target} label="Visions" value={stats.visions_count} />
            <StatBadge icon={Headphones} label="Audio Sets" value={stats.audio_sets_count} />
            <StatBadge icon={Layout} label="Board Items" value={stats.vision_board_items_count} />
          </>
        )
      case 'vision_iteration_ease':
        return (
          <StatBadge icon={Target} label="Active Life Vision" value={stats.visions_active > 0 ? 'Yes' : 'No'} />
        )
      case 'has_audio_tracks':
      case 'audio_iteration_ease':
        return (
          <>
            <StatBadge icon={Headphones} label="Audio Sets" value={stats.audio_sets_count} />
            <StatBadge icon={CheckCircle} label="Tracks" value={stats.audio_tracks_count} />
          </>
        )
      case 'has_vision_board':
      case 'vision_board_management':
        return (
          <>
            <StatBadge icon={Layout} label="Board Items" value={stats.vision_board_items_count} />
            <StatBadge icon={CheckCircle} label="With Images" value={stats.vision_board_images_count} />
          </>
        )
      case 'vibrational_constraints_clarity': {
        const vibePosts = stats.vibe_posts_count ?? 0
        const engaged = stats.vibe_tribe_engaged ?? false
        return (
          <>
            <StatBadge icon={Users} label="Vibe Tribe Posts" value={vibePosts} />
            <StatBadge icon={MessageSquare} label="Engaged" value={engaged ? 'Yes' : 'No'} />
          </>
        )
      }
      case 'journey_capturing': {
        const vibePosts = stats.vibe_posts_count ?? 0
        const engaged = stats.vibe_tribe_engaged ?? false
        return (
          <>
            <StatBadge icon={User} label="Profile Versions" value={stats.profile_versions_count ?? 0} />
            <StatBadge icon={Target} label="Life Visions" value={stats.visions_count ?? 0} />
            <StatBadge icon={Layout} label="Vision Board Items" value={stats.vision_board_items_count ?? 0} />
            <StatBadge icon={FileText} label="Journal Entries" value={stats.journal_entries_count ?? 0} />
            <StatBadge icon={Users} label="Vibe Tribe Posts" value={vibePosts} />
            <StatBadge icon={MessageSquare} label="Vibe Tribe Engaged" value={engaged ? 'Yes' : 'No'} />
          </>
        )
      }
      case 'transformation_tracking': {
        const schedule =
          stats.alignment_gym_schedule_label ||
          (stats.alignment_gym_toured || stats.alignment_gym_map_commitment
            ? 'Committed to 1 live group coaching session per week'
            : '')
        if (!schedule) return null
        return (
          <StatBadge icon={Video} label="Alignment Gym" value={schedule} />
        )
      }
      case 'roadmap_clarity': {
        const pillars = stats.map_pillar_active ?? emptyMapPillarActive()
        return (
          <>
            {PILLAR_ORDER.map((pillar: MapCategory) => {
              const meta = PILLAR_META[pillar]
              const Icon = meta.exampleIcon
              return (
                <StatBadge
                  key={pillar}
                  icon={Icon}
                  label={meta.label}
                  value={pillars[pillar] ? 'Yes' : 'No'}
                />
              )
            })}
          </>
        )
      }
      default:
        return null
    }
  }

  // Rating selector with baseline comparison
  const RatingSelector = ({
    question,
    displayNumber,
    highlight,
  }: {
    question: IntakeQuestion
    displayNumber: number
    highlight?: boolean
  }) => {
    const value = formData[question.id] as number | null
    const baselineValue = baseline[question.id] as number | null
    const improvement = value !== null && baselineValue !== null 
      ? value - baselineValue 
      : null
    const statsInfo = getStatsForQuestion(question.id)
    const scoreExplanation = getScoreExplanation(question.id)

    return (
      <div
        id={`unlock-question-${question.id}`}
        className={`border rounded-lg p-4 md:p-6 bg-neutral-900/30 overflow-hidden ${
          highlight ? 'border-red-500/60 ring-1 ring-red-500/30' : 'border-neutral-800'
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
            {displayNumber}
          </div>
          <div className="flex-1">
            <label className="block text-sm md:text-base font-medium text-white">
              {question.questionPost}
            </label>
            {baselineValue !== null && baselineValue !== undefined && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge variant="neutral" className="text-xs">
                  Baseline: {baselineValue}/10
                </Badge>
                {improvement !== null && improvement > 0 && (
                  <Badge variant="success" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{improvement} improvement
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {question.hint && (
          <p className="text-xs md:text-sm text-neutral-500 mb-3 md:ml-10 italic">
            {question.hint}
          </p>
        )}

        {/* Stats info panel with score explanation */}
        {statsInfo && (
          <div className="mb-4 md:ml-10 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
            <div className="text-xs text-neutral-400 mb-2 font-medium">Your Activity:</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {statsInfo}
            </div>
            {scoreExplanation && (
              <p className="text-xs text-primary-400 mt-2 font-medium">
                {scoreExplanation}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 md:flex md:flex-wrap md:ml-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => updateFormData(question.id, num)}
              className={`
                h-11 rounded border-2 font-semibold transition-colors duration-150 text-sm md:w-11
                ${value === num 
                  ? 'bg-primary-500 border-primary-500 text-black' 
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Multiple choice selector with baseline comparison
  const MultipleChoiceSelector = ({
    question,
    displayNumber,
    highlight,
  }: {
    question: IntakeQuestion
    displayNumber: number
    highlight?: boolean
  }) => {
    const baselineValue = baseline[question.id] as string | null
    const statsInfo = getStatsForQuestion(question.id)
    const scoreExplanation = getScoreExplanation(question.id)

    return (
      <div
        id={`unlock-question-${question.id}`}
        className={`border rounded-lg p-4 md:p-6 bg-neutral-900/30 overflow-hidden ${
          highlight ? 'border-red-500/60 ring-1 ring-red-500/30' : 'border-neutral-800'
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
            {displayNumber}
          </div>
          <div className="flex-1">
            <label className="block text-sm md:text-base font-medium text-white">
              {question.questionPost}
            </label>
            {baselineValue && (
              <Badge variant="neutral" className="mt-2 text-xs">
                Baseline: {baselineValue.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>

        {question.hint && (
          <p className="text-xs md:text-sm text-neutral-500 mb-3 md:ml-10 italic">
            {question.hint}
          </p>
        )}

        {/* Stats info panel */}
        {statsInfo && (
          <div className="mb-4 md:ml-10 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
            <div className="text-xs text-neutral-400 mb-2 font-medium">Your Activity:</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {statsInfo}
            </div>
            {scoreExplanation && (
              <p className="text-xs text-primary-400 mt-2 font-medium">
                {scoreExplanation}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 md:mt-0 md:ml-10">
          <RadioGroup
            name={question.id}
            value={(formData[question.id] as string) || ''}
            onChange={(value) => updateFormData(question.id, value)}
            options={question.options || []}
            orientation="vertical"
          />
        </div>
      </div>
    )
  }

  // Render question based on type with display number
  const renderQuestion = (question: IntakeQuestion, index: number) => {
    const displayNumber = index + 1
    const highlight = highlightFieldIds.includes(question.id)
    switch (question.type) {
      case 'rating':
        return (
          <RatingSelector
            key={question.id}
            question={question}
            displayNumber={displayNumber}
            highlight={highlight}
          />
        )
      case 'multiple_choice':
        return (
          <MultipleChoiceSelector
            key={question.id}
            question={question}
            displayNumber={displayNumber}
            highlight={highlight}
          />
        )
      default:
        return null
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
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={UNLOCK_VIDEO}
            thumbnailUrl={UNLOCK_POSTER}
            context="single"
            className="w-full"
          />
        </div>

        {/* 14-Step Journey Completed */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-1">Your 14-Step Journey Complete</h3>
              <div className="text-sm text-neutral-400 space-y-2 max-w-2xl mx-auto">
                <p>You&apos;ve completed all 14 steps. This page does two things:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Captures your before/after results and experience,</li>
                  <li>Unlocks your full Vibration Fit platform access as a Graduate.</li>
                </ol>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Setup */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Setup</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">1</span>
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">2</span>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Baseline Intake</span>
                  </div>
                </div>
              </div>

              {/* Foundation */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Foundation</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">3</span>
                    <User className="w-3.5 h-3.5" />
                    <span>Create Profile</span>
                  </div>
                </div>
              </div>

              {/* Vision Creation */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Vision Creation</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">4</span>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Build Life Vision</span>
                  </div>
                </div>
              </div>

              {/* Audio */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Audio</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">5</span>
                    <Music className="w-3.5 h-3.5" />
                    <span>Generate Audio</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">6</span>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Voice (Optional)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">7</span>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Create Audio Mix</span>
                  </div>
                </div>
              </div>

              {/* Activation */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Activation</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">8</span>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Vision Board</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">9</span>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Journal Entry</span>
                  </div>
                </div>
              </div>

              {/* Community */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Community</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">10</span>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>First Vibe Tribe Post</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">11</span>
                    <Users className="w-3.5 h-3.5" />
                    <span>Engage in Vibe Tribe</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">12</span>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Alignment Gym Tour</span>
                  </div>
                </div>
              </div>

              {/* Completion */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white">Completion</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">13</span>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>My Alignment Plan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">14</span>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Platform</span>
                  </div>
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Activation Snapshot Header */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="sm" className="text-center items-center">
            <h3 className="text-lg font-bold text-white">Your Activation Snapshot</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Below you&apos;ll see your original baseline scores, what you&apos;ve built, and a chance to rate where you are now.
              Take 1–2 minutes to answer honestly – this helps you see your own growth and helps us keep improving the Intensive.
            </p>
          </Stack>
        </Card>

        <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
          {/* Render all questions from constants in order */}
          {questions.map((q, index) => renderQuestion(q, index))}

          {/* Combined Video Testimonial / Text Response Section - Q12 */}
          <div
            id="unlock-question-testimonial"
            className={`border rounded-lg p-4 md:p-6 bg-neutral-900/30 overflow-hidden ${
              highlightFieldIds.includes('testimonial')
                ? 'border-red-500/60 ring-1 ring-red-500/30'
                : 'border-neutral-800'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                {questions.length + 1}
              </div>
              <div>
                <label className="block text-sm md:text-base font-medium text-white">
                  {TESTIMONIAL_QUESTION_TEXT}
                </label>
                <p className="text-xs md:text-sm text-neutral-500 mt-1">
                  Share your experience in your own words! This helps others see what's possible.
                </p>
              </div>
            </div>
            
            <div className="mt-3 md:mt-0 md:ml-10">
              {showTextInput ? (
                <>
                  <Textarea
                    value={(formData.biggest_shift as string) || ''}
                    onChange={(e) => updateFormData('biggest_shift', e.target.value)}
                    placeholder="Share the biggest shifts, breakthroughs, or 'aha' moments you experienced..."
                    rows={4}
                    className="text-sm md:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTextInput(false)}
                    className="mt-3 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Record a video instead
                  </button>
                </>
              ) : testimonialVideoUrl ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Video recorded successfully!</span>
                  </div>
                  {testimonialTranscript && (
                    <p className="mt-2 text-sm text-neutral-400 italic">
                      "{testimonialTranscript.slice(0, 200)}..."
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <MediaRecorderComponent
                    mode="video"
                    storageFolder="intensiveTestimonials"
                    recordingPurpose="support"
                    submitLabel="Send"
                    recordingId={intensiveId ? `intensive-${intensiveId}-testimonial` : undefined}
                    onRecordingComplete={(blob, _transcript, _shouldSaveFile, s3Url) => {
                      if (s3Url) {
                        setTestimonialVideoUrl(s3Url)
                        clearSubmitValidation()
                      }
                    }}
                    enableEditor={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTextInput(true)}
                    className="mt-3 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-2"
                  >
                    <Keyboard className="w-4 h-4" />
                    Type my response instead
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sharing Preference - No number */}
          <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30 overflow-hidden space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">How would you like to share your success?</h3>
              <p className="text-sm text-neutral-400 mt-1">All data can be used as part of member success calculations.</p>
            </div>
            <div className="space-y-3 ml-4">
              <Checkbox
                checked={formData.sharing_preference === 'named'}
                onChange={() => updateFormData('sharing_preference', 'named')}
                label="Share my success with first name"
              />
              <Checkbox
                checked={formData.sharing_preference === 'anonymous'}
                onChange={() => updateFormData('sharing_preference', 'anonymous')}
                label="Share my success anonymously"
              />
              <Checkbox
                checked={formData.sharing_preference === 'none'}
                onChange={() => updateFormData('sharing_preference', 'none')}
                label="Do not share my success"
              />
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 md:p-5"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium text-red-200">{submitError}</p>
                  {submitErrorItems.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-200/90">
                      {submitErrorItems.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ready to Graduate Section */}
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="sm" className="text-center items-center">
              <h3 className="text-lg font-bold text-white">Ready to Graduate?</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                When you&apos;re done, click Unlock Platform to activate your full membership, access your Graduate unlocks, and start running your MAP.
              </p>
              <div className="pt-4">
                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock Platform
                    </>
                  )}
                </Button>
              </div>
            </Stack>
          </Card>
        </form>
      </Stack>

    </Container>
  )
}
