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
  RadioGroup
} from '@/lib/design-system/components'

import { 
  getQuestionsForPhase, 
  INTAKE_QUESTIONS,
  type IntakeQuestion 
} from '@/lib/constants/intensive-intake-questions'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { ReadOnlySection } from '@/components/IntensiveStepCompletedBanner'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { getStepInfo, getNextStep } from '@/lib/intensive/step-mapping'

// Text Question Component - defined outside to prevent re-renders
const TextQuestionComponent = ({ 
  question,
  value,
  onValueChange
}: { 
  question: IntakeQuestion
  value: string
  onValueChange: (value: string) => void
}) => (
  <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
        {question.order}
      </div>
      <label className="block text-sm md:text-base font-medium text-white pt-0.5">
        {question.questionPre}
      </label>
    </div>
    <div className="ml-10">
      <Textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Share your experience..."
        rows={4}
        className="text-sm md:text-base"
      />
    </div>
  </div>
)

// Build form data type from questions
type IntakeFormData = {
  [key: string]: number | string | boolean | null
}

// Initialize form data from questions
const initializeFormData = (): IntakeFormData => {
  const data: IntakeFormData = {}
  INTAKE_QUESTIONS.forEach(q => {
    if (q.type === 'rating') {
      data[q.id] = null
    } else if (q.type === 'multiple_choice') {
      data[q.id] = null
    } else if (q.type === 'text') {
      data[q.id] = ''
    } else if (q.type === 'boolean') {
      data[q.id] = true // Default consent to true
    }
  })
  return data
}

export default function IntensiveIntake() {
  const [formData, setFormData] = useState<IntakeFormData>(initializeFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  
  // Completion states
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [savedResponses, setSavedResponses] = useState<IntakeFormData | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Get questions for pre_intensive phase
  const questions = getQuestionsForPhase('pre_intensive')
  
  // Get step info for banners
  const currentStep = getStepInfo('intake')
  const nextStep = getNextStep('intake')

  useEffect(() => {
    loadIntensiveData()
  }, [])

  const loadIntensiveData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for super_admin access
      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)

      // Get intensive purchase
      const { data: intensiveData, error } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (error || !intensiveData) {
        // Allow super_admin to access without enrollment
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
          setLoading(false)
          return
        }
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

      // Check if intake is already completed
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('intake_completed, intake_completed_at')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (checklistData?.intake_completed) {
        setIsAlreadyCompleted(true)
        setCompletedAt(checklistData.intake_completed_at)
        
        // Fetch the saved responses
        const { data: responseData } = await supabase
          .from('intensive_responses')
          .select('*')
          .eq('intensive_id', intensiveData.id)
          .eq('phase', 'pre_intensive')
          .single()

        if (responseData) {
          // Map database response to form data format
          const responses: IntakeFormData = {}
          questions.forEach(q => {
            if (responseData[q.id] !== undefined) {
              responses[q.id] = responseData[q.id]
            }
          })
          setSavedResponses(responses)
        }
      }

    } catch (error) {
      console.error('Error loading intensive data:', error)
    } finally {
      setLoading(false)
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

    setSubmitting(true)
    try {
      // Get user for the insert
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Session expired. Please log in again.')
        router.push('/auth/login')
        return
      }

      // Build insert data from form
      const insertData: Record<string, unknown> = {
        intensive_id: intensiveId,
        user_id: user.id,
        phase: 'pre_intensive',
      }

      // Add all form fields
      questions.forEach(q => {
        if (formData[q.id] !== null && formData[q.id] !== '') {
          insertData[q.id] = formData[q.id]
        }
      })

      // Store pre_intensive intake data in unified table
      const { error: intakeError } = await supabase
        .from('intensive_responses')
        .insert(insertData)

      if (intakeError) {
        console.error('Error storing intake:', intakeError)
        alert('Error submitting form. Please try again.')
        return
      }

      // Update intensive checklist
      const completedTime = new Date().toISOString()
      const { error: checklistError } = await supabase
        .from('intensive_checklist')
        .update({
          intake_completed: true,
          intake_completed_at: completedTime
        })
        .eq('intensive_id', intensiveId)

      if (checklistError) {
        console.error('Error updating checklist:', checklistError)
      }

      // Redirect to dashboard to show progress with completion toast
      router.push('/intensive/dashboard?completed=intake')

    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Read-only rating display
  const ReadOnlyRating = ({ 
    question, 
    value 
  }: { 
    question: IntakeQuestion
    value: number | null 
  }) => (
    <div className="border border-neutral-700/50 rounded-lg p-4 md:p-6 bg-neutral-900/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-500 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-neutral-300 pt-0.5">
          {question.questionPre}
        </label>
      </div>
      <div className="flex flex-wrap gap-2 ml-10 max-w-[232px] md:max-w-fit">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <div
            key={num}
            className={`
              w-10 h-10 rounded border-2 font-semibold flex items-center justify-center text-sm flex-shrink-0
              ${value === num 
                ? 'bg-primary-500/30 border-primary-500/50 text-primary-400' 
                : 'bg-neutral-800/50 border-neutral-700/30 text-neutral-600'
              }
            `}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  )

  // Read-only multiple choice display
  const ReadOnlyMultipleChoice = ({ 
    question, 
    value 
  }: { 
    question: IntakeQuestion
    value: string | null 
  }) => (
    <div className="border border-neutral-700/50 rounded-lg p-4 md:p-6 bg-neutral-900/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-500 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-neutral-300 pt-0.5">
          {question.questionPre}
        </label>
      </div>
      <div className="ml-10 space-y-2">
        {question.options?.map((option) => (
          <div 
            key={option.value} 
            className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${value === option.value 
                ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                : 'bg-neutral-800/30 border-neutral-700/30 text-neutral-500'
              }
            `}
          >
            <div className={`
              w-4 h-4 rounded-full border-2 flex-shrink-0
              ${value === option.value 
                ? 'bg-primary-500 border-primary-500' 
                : 'border-neutral-600'
              }
            `} />
            <span className="text-sm">{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // Read-only text display
  const ReadOnlyText = ({ 
    question, 
    value 
  }: { 
    question: IntakeQuestion
    value: string | null 
  }) => (
    <div className="border border-neutral-700/50 rounded-lg p-4 md:p-6 bg-neutral-900/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-500 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-neutral-300 pt-0.5">
          {question.questionPre}
        </label>
      </div>
      <div className="ml-10">
        <div className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30 text-neutral-400 text-sm min-h-[80px]">
          {value || <span className="italic text-neutral-600">No response provided</span>}
        </div>
      </div>
    </div>
  )

  // Read-only boolean display
  const ReadOnlyBoolean = ({ 
    question, 
    value 
  }: { 
    question: IntakeQuestion
    value: boolean | null 
  }) => (
    <div className="border border-neutral-700/50 rounded-lg p-4 md:p-6 bg-neutral-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-500 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            ${value 
              ? 'bg-primary-500/30 border-primary-500/50' 
              : 'bg-neutral-800/50 border-neutral-700/30'
            }
          `}>
            {value && <span className="text-primary-400 text-xs">✓</span>}
          </div>
          <span className="text-sm md:text-base text-neutral-300">
            {question.questionPre}
          </span>
        </div>
      </div>
    </div>
  )

  const renderReadOnlyQuestion = (question: IntakeQuestion, responses: IntakeFormData) => {
    const value = responses[question.id]
    
    switch (question.type) {
      case 'rating':
        return <ReadOnlyRating key={question.id} question={question} value={value as number} />
      case 'multiple_choice':
        return <ReadOnlyMultipleChoice key={question.id} question={question} value={value as string} />
      case 'text':
        return <ReadOnlyText key={question.id} question={question} value={value as string} />
      case 'boolean':
        return <ReadOnlyBoolean key={question.id} question={question} value={value as boolean} />
      default:
        return null
    }
  }

  const RatingSelector = ({ 
    question
  }: { 
    question: IntakeQuestion
  }) => (
    <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-white pt-0.5">
          {question.questionPre}
        </label>
      </div>
      {question.hint && (
        <p className="text-xs md:text-sm text-neutral-500 mb-4 ml-10 italic">
          {question.hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2 ml-10 max-w-[232px] md:max-w-fit">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => updateFormData(question.id, num)}
            className={`
              w-10 h-10 rounded border-2 font-semibold transition-colors duration-150 text-sm flex-shrink-0
              ${formData[question.id] === num 
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

  const MultipleChoiceSelector = ({ 
    question
  }: { 
    question: IntakeQuestion
  }) => (
    <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <label className="block text-sm md:text-base font-medium text-white pt-0.5">
          {question.questionPre}
        </label>
      </div>
      {question.hint && (
        <p className="text-xs md:text-sm text-neutral-500 mb-4 ml-10 italic">
          {question.hint}
        </p>
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


  const BooleanQuestion = ({ 
    question
  }: { 
    question: IntakeQuestion
  }) => (
    <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
          {question.order}
        </div>
        <div className="pt-0.5">
          <Checkbox
            checked={formData[question.id] as boolean}
            onChange={(e) => updateFormData(question.id, e.target.checked)}
            label={question.questionPre}
          />
        </div>
      </div>
    </div>
  )

  const renderQuestion = (question: IntakeQuestion) => {
    switch (question.type) {
      case 'rating':
        return <RatingSelector key={question.id} question={question} />
      case 'multiple_choice':
        return <MultipleChoiceSelector key={question.id} question={question} />
      case 'text':
        return (
          <TextQuestionComponent 
            key={question.id} 
            question={question} 
            value={(formData[question.id] as string) || ''}
            onValueChange={(value) => updateFormData(question.id, value)}
          />
        )
      case 'boolean':
        return <BooleanQuestion key={question.id} question={question} />
      default:
        return null
    }
  }

  // Loading state
  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  // SCENARIO B: User is revisiting a completed step
  if (isAlreadyCompleted && !justSubmitted && savedResponses && completedAt) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          {/* Completion Banner - Shows above PageHero when step is already complete */}
          <IntensiveCompletionBanner 
            stepTitle="Baseline Intake"
            completedAt={completedAt}
          />

          {/* Page Hero - Same as normal view, with intensive eyebrow */}
          <PageHero
            eyebrow="ACTIVATION INTENSIVE • STEP 2 OF 14"
            title="Baseline Intake"
            subtitle="Help us understand where you are today so we can measure your transformation"
          />

          {/* Read-Only Responses */}
          <ReadOnlySection
            title="Your Baseline Responses"
            helperText="These responses are locked in as part of your 72-Hour Activation baseline and cannot be edited."
          >
            <div className="space-y-4">
              {questions.map(q => renderReadOnlyQuestion(q, savedResponses))}
            </div>
          </ReadOnlySection>
        </Stack>
      </Container>
    )
  }

  // Default: Show the intake form
  if (!intensiveId) {
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
          eyebrow="ACTIVATION INTENSIVE • STEP 2 OF 14"
          title="Baseline Intake"
          subtitle="Help us understand where you are today so we can measure your transformation"
        />

        <div className="space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
            {questions.map(renderQuestion)}

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
                  <>
                    Submit Intake
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Stack>
    </Container>
  )
}
