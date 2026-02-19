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
  PageHero,
  RadioGroup,
  Badge,
  Checkbox,
  IntensiveCompletionBanner
} from '@/lib/design-system/components'
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
  ClipboardCheck,
  Wand2,
  Music,
  Mic,
  Sliders,
  Image as ImageIcon,
  BookOpen,
  Calendar,
  Rocket,
  Unlock
} from 'lucide-react'

import { 
  getQuestionsForPhase, 
  INTAKE_QUESTIONS,
  type IntakeQuestion 
} from '@/lib/constants/intensive-intake-questions'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'

const UNLOCK_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

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

      // Get intensive order item
      const { data: intensiveData, error: intensiveError } = await supabase
        .from('order_items')
        .select('id, orders!inner(user_id), products!inner(product_type)')
        .eq('orders.user_id', user.id)
        .eq('products.product_type', 'intensive')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (intensiveError || !intensiveData) {
        // Allow super_admin to access without enrollment
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
        } else {
          router.push('/intensive/dashboard')
          return
        }
      } else {
        setIntensiveId(intensiveData.id)
        
        // Check if unlock step is already completed
        const { data: checklistData } = await supabase
          .from('intensive_checklist')
          .select('unlock_completed, unlock_completed_at')
          .eq('intensive_id', intensiveData.id)
          .maybeSingle()

        if (checklistData?.unlock_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklistData.unlock_completed_at)
        }
      }
      
      const activeIntensiveId = intensiveData?.id || 'super-admin-test-mode'

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
        setStats(userStats)
        
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

    // Vibrational constraints - based on assessment completion
    if (stats.assessment_completed) {
      data.vibrational_constraints_clarity = 10
    }

    // Vision iteration ease - if they have refinements
    if (stats.total_refinements > 0) {
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

    // Roadmap clarity - if they have active visions
    if (stats.visions_active > 0) {
      data.roadmap_clarity = 10
    }

    // Transformation tracking - based on complete profile, assessment, vision, and vision board
    const hasProfile = stats.profile_completion_percent >= 80
    const hasAssessment = stats.assessment_completed
    const hasVision = stats.visions_count > 0
    const hasVisionBoard = stats.vision_board_items_count > 0
    if (hasProfile && hasAssessment && hasVision && hasVisionBoard) {
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
      return `Our score for you is "Yes, both physical and digital", as you have ${stats.vision_board_items_count} item${stats.vision_board_items_count !== 1 ? 's' : ''} on your digital vision board with easy downloads to print for a physical board.`
    }
    
    if (questionId === 'has_audio_tracks' && formData[questionId] === 'yes') {
      return `Our score for you is "Yes", as you have ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''} with ${stats.audio_tracks_count} track${stats.audio_tracks_count !== 1 ? 's' : ''}.`
    }
    
    if (value !== 10) return null

    switch (questionId) {
      case 'vision_clarity':
        return `Our score for you is 10/10, as you have created ${stats.visions_count} vision${stats.visions_count !== 1 ? 's' : ''} with ${stats.total_refinements} refinement${stats.total_refinements !== 1 ? 's' : ''}.`
      case 'vibrational_harmony':
        return `Our score for you is 10/10, as you have ${stats.visions_count} vision${stats.visions_count !== 1 ? 's' : ''}, ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''}, and ${stats.vision_board_items_count} vision board item${stats.vision_board_items_count !== 1 ? 's' : ''}.`
      case 'vibrational_constraints_clarity':
        if (stats.assessment_completed) {
          return `Our score for you is 10/10, as you have completed your assessment across ${stats.assessment_strengths_count} life categor${stats.assessment_strengths_count !== 1 ? 'ies' : 'y'} with clear visibility into what supports and what constrains your vibration.`
        }
        return null
      case 'vision_iteration_ease':
        return `Our score for you is 10/10, as you have an active vision that can easily be cloned and refined.`
      case 'audio_iteration_ease':
        return `Our score for you is 10/10, as you have created ${stats.audio_sets_count} audio set${stats.audio_sets_count !== 1 ? 's' : ''} with ${stats.audio_tracks_count} track${stats.audio_tracks_count !== 1 ? 's' : ''} with new generations ready at the click of a button.`
      case 'vision_board_management':
        return `Our score for you is 10/10, as you have ${stats.vision_board_items_count} item${stats.vision_board_items_count !== 1 ? 's' : ''} on your vision board with easy management and downloads.`
      case 'journey_capturing':
        return `Our score for you is 10/10, as you have ${stats.journal_entries_count} journal entr${stats.journal_entries_count !== 1 ? 'ies' : 'y'}.`
      case 'roadmap_clarity':
        return `Our score for you is 10/10, as you have an active activation protocol to activate your life vision.`
      case 'transformation_tracking':
        return `Our score for you is 10/10, as you have ${stats.profile_versions_count} profile version${stats.profile_versions_count !== 1 ? 's' : ''}, ${stats.assessment_completed_count} assessment${stats.assessment_completed_count !== 1 ? 's' : ''}, ${stats.visions_count} vision${stats.visions_count !== 1 ? 's' : ''}, and ${stats.journal_entries_count} journal entr${stats.journal_entries_count !== 1 ? 'ies' : 'y'} - each easy to create new versions or add new items.`
      default:
        return null
    }
  }

  const updateFormData = (field: string, value: number | string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const submitForm = async () => {
    if (!intensiveId) return

    // Validate all required rating and multiple choice fields
    const requiredQuestions = questions.filter(q => q.type === 'rating' || q.type === 'multiple_choice')
    const missingFields = requiredQuestions.filter(q => formData[q.id] === null)

    if (missingFields.length > 0) {
      alert(`Please answer all questions. Missing: ${missingFields.map(q => q.label).join(', ')}`)
      return
    }

    // Must have either video or text testimonial
    if (!testimonialVideoUrl && !testimonialTranscript && !formData.biggest_shift) {
      alert('Please record a video testimonial or type your response.')
      return
    }

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

      // Redirect to main dashboard with unlock celebration
      router.push('/dashboard?unlocked=true')

    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
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
            <StatBadge icon={Sparkles} label="Refinements" value={stats.total_refinements} />
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
          <>
            <StatBadge icon={CheckCircle} label="Active Vision" value={stats.visions_active > 0 ? 'Yes' : 'No'} />
            <StatBadge icon={Sparkles} label="Refinements" value={stats.total_refinements} />
          </>
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
      case 'vibrational_constraints_clarity':
        return (
          <>
            <StatBadge icon={CheckCircle} label="Assessment" value={stats.assessment_completed ? 'Completed' : 'Pending'} />
            <StatBadge icon={Target} label="Categories Assessed" value={stats.assessment_strengths_count} />
          </>
        )
      case 'journey_capturing':
        return (
          <>
            <StatBadge icon={FileText} label="Journal Entries" value={stats.journal_entries_count} />
          </>
        )
      case 'transformation_tracking':
        return (
          <>
            <StatBadge icon={Target} label="Profile Versions" value={stats.profile_versions_count} />
            <StatBadge icon={CheckCircle} label="Assessments" value={stats.assessment_completed_count} />
            <StatBadge icon={Target} label="Visions" value={stats.visions_count} />
            <StatBadge icon={FileText} label="Journal" value={stats.journal_entries_count} />
          </>
        )
      case 'roadmap_clarity':
        return (
          <>
            <StatBadge icon={Target} label="Active Visions" value={stats.visions_active} />
          </>
        )
      default:
        return null
    }
  }

  // Rating selector with baseline comparison
  const RatingSelector = ({ question, displayNumber }: { question: IntakeQuestion, displayNumber: number }) => {
    const value = formData[question.id] as number | null
    const baselineValue = baseline[question.id] as number | null
    const improvement = value !== null && baselineValue !== null 
      ? value - baselineValue 
      : null
    const statsInfo = getStatsForQuestion(question.id)
    const scoreExplanation = getScoreExplanation(question.id)

    return (
      <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
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
          <p className="text-xs md:text-sm text-neutral-500 mb-3 ml-10 italic">
            {question.hint}
          </p>
        )}

        {/* Stats info panel with score explanation */}
        {statsInfo && (
          <div className="mb-4 ml-10 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
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

        <div className="flex flex-wrap gap-2 ml-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => updateFormData(question.id, num)}
              className={`
                w-10 h-10 rounded border-2 font-semibold transition-colors duration-150 text-sm
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
  const MultipleChoiceSelector = ({ question, displayNumber }: { question: IntakeQuestion, displayNumber: number }) => {
    const baselineValue = baseline[question.id] as string | null
    const statsInfo = getStatsForQuestion(question.id)

    return (
      <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
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
          <p className="text-xs md:text-sm text-neutral-500 mb-3 ml-10 italic">
            {question.hint}
          </p>
        )}

        {/* Stats info panel */}
        {statsInfo && (
          <div className="mb-4 ml-10 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
            <div className="text-xs text-neutral-400 mb-2 font-medium">Your Activity:</div>
            <div className="flex flex-wrap gap-2">
              {statsInfo}
            </div>
          </div>
        )}

        <div className="ml-10">
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
    switch (question.type) {
      case 'rating':
        return <RatingSelector key={question.id} question={question} displayNumber={displayNumber} />
      case 'multiple_choice':
        return <MultipleChoiceSelector key={question.id} question={question} displayNumber={displayNumber} />
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
        {/* Completion Banner - Shows when step is already complete */}
        {isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Full Platform Unlock"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow="ACTIVATION INTENSIVE • STEP 14 OF 14"
          title="Unlock Platform"
          subtitle="Let's capture your journey and unlock your full membership"
        >
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={UNLOCK_VIDEO}
              context="single"
              className="w-full"
            />
          </div>
        </PageHero>

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
                  <Settings className="w-5 h-5 text-neutral-400" />
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
                  <User className="w-5 h-5 text-[#5EC49A]" />
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
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">4</span>
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Vibration Assessment</span>
                  </div>
                </div>
              </div>

              {/* Vision Creation */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
                  <span className="font-semibold text-white">Vision Creation</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">5</span>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Build Life Vision</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">6</span>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Refine with VIVA</span>
                  </div>
                </div>
              </div>

              {/* Audio */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-5 h-5 text-[#8B5CF6]" />
                  <span className="font-semibold text-white">Audio</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">7</span>
                    <Music className="w-3.5 h-3.5" />
                    <span>Generate Audio</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">8</span>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Voice (Optional)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">9</span>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Create Audio Mix</span>
                  </div>
                </div>
              </div>

              {/* Activation */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-[#FFB701]" />
                  <span className="font-semibold text-white">Activation</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">10</span>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Vision Board</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">11</span>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Journal Entry</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">12</span>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Calibration Call</span>
                  </div>
                </div>
              </div>

              {/* Completion */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-primary-500" />
                  <span className="font-semibold text-white">Completion</span>
                  <Badge variant="success" className="ml-auto text-xs">Complete</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-neutral-600 w-4">13</span>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>My Activation Plan</span>
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
          <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                {questions.length + 1}
              </div>
              <div>
                <label className="block text-sm md:text-base font-medium text-white">
                  What feels most different for you after completing the 72-Hour Activation Intensive?
                </label>
                <p className="text-xs md:text-sm text-neutral-500 mt-1">
                  Share your experience in your own words! This helps others see what's possible.
                </p>
              </div>
            </div>
            
            <div className="ml-10">
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
                    autoTranscribe={true}
                    maxDuration={180}
                    storageFolder="intensiveTestimonials"
                    recordingPurpose="withFile"
                    recordingId={intensiveId ? `intensive-${intensiveId}-testimonial` : undefined}
                    onRecordingComplete={(blob, transcript, shouldSaveFile, s3Url) => {
                      if (s3Url) setTestimonialVideoUrl(s3Url)
                    }}
                    onTranscriptComplete={(transcript) => {
                      setTestimonialTranscript(transcript)
                    }}
                    enableEditor={false}
                    fullscreenVideo={false}
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
          <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30 space-y-4">
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

          {/* Ready to Graduate Section */}
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="sm" className="text-center items-center">
              <h3 className="text-lg font-bold text-white">Ready to Graduate?</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                When you&apos;re done, click Unlock Platform to activate your full membership, access your Graduate unlocks, and start running your 28‑Day MAP.
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
