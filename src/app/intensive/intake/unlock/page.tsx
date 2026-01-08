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
  Checkbox,
  RadioGroup,
  Badge
} from '@/lib/design-system/components'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { 
  TrendingUp, 
  CheckCircle, 
  Video, 
  FileText,
  Target,
  Headphones,
  Layout,
  BookOpen,
  Sparkles
} from 'lucide-react'

import { 
  getQuestionsForPhase, 
  INTAKE_QUESTIONS,
  type IntakeQuestion 
} from '@/lib/constants/intensive-intake-questions'

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
  daily_paper_entries_count: number
  profile_completion_percent: number
  first_vision_created_at: string | null
  last_vision_updated_at: string | null
  last_audio_generated_at: string | null
  last_journal_entry_at: string | null
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
      data[q.id] = null
    } else if (q.type === 'text') {
      data[q.id] = ''
    } else if (q.type === 'boolean') {
      data[q.id] = q.id === 'testimonial_consent' ? true : false
    }
  })
  // Add consent_for_named_testimonial (not in questions but needed)
  data['consent_for_named_testimonial'] = false
  return data
}

export default function IntensiveUnlockPage() {
  const router = useRouter()
  const supabase = createClient()

  // Get questions for post_intensive phase
  const questions = getQuestionsForPhase('post_intensive')

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [stats, setStats] = useState<IntensiveStats | null>(null)
  const [baseline, setBaseline] = useState<Record<string, number | string | null>>({})
  const [testimonialVideoUrl, setTestimonialVideoUrl] = useState<string | null>(null)
  const [testimonialTranscript, setTestimonialTranscript] = useState<string | null>(null)
  const [formData, setFormData] = useState<UnlockFormData>(initializeFormData)

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

      // Get intensive purchase
      const { data: intensiveData, error: intensiveError } = await supabase
        .from('intensive_purchases')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (intensiveError || !intensiveData) {
        router.push('/intensive/dashboard')
        return
      }

      setIntensiveId(intensiveData.id)

      // Get baseline responses (pre_intensive phase)
      const { data: baselineData } = await supabase
        .from('intensive_responses')
        .select('*')
        .eq('intensive_id', intensiveData.id)
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

      // Fetch user stats
      const statsResponse = await fetch('/api/intensive/stats')
      if (statsResponse.ok) {
        const { stats: userStats } = await statsResponse.json()
        setStats(userStats)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: number | string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVideoComplete = (result: { url?: string, transcript?: string }) => {
    if (result.url) {
      setTestimonialVideoUrl(result.url)
    }
    if (result.transcript) {
      setTestimonialTranscript(result.transcript)
    }
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
        consent_for_named_testimonial: formData.consent_for_named_testimonial,
      }

      // Add all form fields from questions
      questions.forEach(q => {
        if (formData[q.id] !== null && formData[q.id] !== '') {
          insertData[q.id] = formData[q.id]
        }
      })

      // Store post-intensive response
      const { error: insertError } = await supabase
        .from('intensive_responses')
        .insert(insertData)

      if (insertError) {
        console.error('Error storing response:', insertError)
        throw new Error('Failed to save responses')
      }

      // Mark unlock completed in checklist
      await supabase
        .from('intensive_checklist')
        .update({
          unlock_completed: true,
          unlock_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      // Redirect to success or next step
      router.push('/intensive/calibration')

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
            <StatBadge icon={CheckCircle} label="Active" value={stats.visions_active} />
            {stats.visions_draft > 0 && (
              <StatBadge icon={FileText} label="In Draft" value={stats.visions_draft} />
            )}
          </>
        )
      case 'vision_iteration_ease':
        return (
          <>
            <StatBadge icon={Sparkles} label="Total Refinements" value={stats.total_refinements} />
            <StatBadge icon={Target} label="Versions Refined" value={stats.visions_with_refinements} />
          </>
        )
      case 'has_audio_tracks':
      case 'audio_iteration_ease':
        return (
          <>
            <StatBadge icon={Headphones} label="Audio Sets" value={stats.audio_sets_count} />
            <StatBadge icon={CheckCircle} label="Completed" value={stats.audio_tracks_completed} />
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
      case 'journey_capturing':
        return (
          <>
            <StatBadge icon={BookOpen} label="Daily Paper Entries" value={stats.daily_paper_entries_count} />
            <StatBadge icon={FileText} label="Journal Entries" value={stats.journal_entries_count} />
          </>
        )
      case 'transformation_tracking':
        return (
          <>
            <StatBadge icon={BookOpen} label="Journal Entries" value={stats.daily_paper_entries_count} />
            <StatBadge icon={Target} label="Profile Complete" value={stats.profile_completion_percent} suffix="%" />
          </>
        )
      default:
        return null
    }
  }

  // Rating selector with baseline comparison
  const RatingSelector = ({ question }: { question: IntakeQuestion }) => {
    const value = formData[question.id] as number | null
    const baselineValue = baseline[question.id] as number | null
    const improvement = value !== null && baselineValue !== null 
      ? value - baselineValue 
      : null
    const statsInfo = getStatsForQuestion(question.id)

    return (
      <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
            {question.order}
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

        {/* Stats info panel */}
        {statsInfo && (
          <div className="mb-4 ml-10 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
            <div className="text-xs text-neutral-400 mb-2 font-medium">Your Activity:</div>
            <div className="flex flex-wrap gap-2">
              {statsInfo}
            </div>
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
  const MultipleChoiceSelector = ({ question }: { question: IntakeQuestion }) => {
    const baselineValue = baseline[question.id] as string | null
    const statsInfo = getStatsForQuestion(question.id)

    return (
      <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
            {question.order}
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

  // Text question
  const TextQuestion = ({ question }: { question: IntakeQuestion }) => (
    <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-white pt-0.5">
          {question.questionPost}
        </label>
      </div>
      <div className="ml-10">
        <Textarea
          value={(formData[question.id] as string) || ''}
          onChange={(e) => updateFormData(question.id, e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          className="text-sm md:text-base"
        />
      </div>
    </div>
  )

  // Boolean question
  const BooleanQuestion = ({ question }: { question: IntakeQuestion }) => (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={formData[question.id] as boolean}
        onChange={(e) => updateFormData(question.id, e.target.checked)}
        label={question.questionPost}
      />
    </div>
  )

  // Render question based on type
  const renderQuestion = (question: IntakeQuestion) => {
    switch (question.type) {
      case 'rating':
        return <RatingSelector key={question.id} question={question} />
      case 'multiple_choice':
        return <MultipleChoiceSelector key={question.id} question={question} />
      case 'text':
        return <TextQuestion key={question.id} question={question} />
      case 'boolean':
        // Skip boolean here - we handle consent separately with named testimonial option
        return null
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
        <PageHero
          eyebrow="ACTIVATION INTENSIVE"
          title="Unlock Your Results"
          subtitle="Let's measure your transformation and capture your journey"
        />

        {/* Engagement Score Banner */}
        {stats && (
          <Card className="p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm text-neutral-400 mb-1">Your Engagement Score</div>
                <div className="text-4xl font-bold text-primary-500">{stats.engagement_score}/100</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatBadge icon={Target} label="Visions" value={stats.visions_count} />
                <StatBadge icon={Headphones} label="Audio Sets" value={stats.audio_sets_count} />
                <StatBadge icon={Layout} label="Board Items" value={stats.vision_board_items_count} />
                <StatBadge icon={BookOpen} label="Journal" value={stats.daily_paper_entries_count} />
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
          {/* Render all questions from constants in order */}
          {questions.map(renderQuestion)}

          {/* Video Testimonial Section */}
          <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-accent-500 text-white flex items-center justify-center font-semibold text-sm">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-sm md:text-base font-medium text-white">
                  Record a Quick Video Testimonial (Optional)
                </label>
                <p className="text-xs md:text-sm text-neutral-500 mt-1">
                  Share your experience in your own words! This helps others see what's possible.
                </p>
              </div>
            </div>
            
            <div className="ml-10">
              {testimonialVideoUrl ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Video recorded successfully!</span>
                  </div>
                  {testimonialTranscript && (
                    <p className="mt-2 text-sm text-neutral-400 italic">
                      "{testimonialTranscript.slice(0, 150)}..."
                    </p>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                {questions.length + 1}
              </div>
              <div className="space-y-4">
                <Checkbox
                  checked={formData.testimonial_consent as boolean}
                  onChange={(e) => updateFormData('testimonial_consent', e.target.checked)}
                  label="I'm open to you using my feedback and results as anonymized data once I approve them."
                />
                <Checkbox
                  checked={formData.consent_for_named_testimonial as boolean}
                  onChange={(e) => updateFormData('consent_for_named_testimonial', e.target.checked)}
                  label="I'm open to being featured as a named testimonial with my video/story (with my approval before publishing)."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button 
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Unlock My Results'
              )}
            </Button>
          </div>
        </form>
      </Stack>
    </Container>
  )
}
