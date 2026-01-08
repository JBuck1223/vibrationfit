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
  const [loading, setLoading] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Get questions for pre_intensive phase
  const questions = getQuestionsForPhase('pre_intensive')

  useEffect(() => {
    loadIntensiveData()
  }, [])

  const loadIntensiveData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get intensive purchase
      const { data: intensiveData, error } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (error || !intensiveData) {
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

    } catch (error) {
      console.error('Error loading intensive data:', error)
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

    setLoading(true)
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
      const { error: checklistError } = await supabase
        .from('intensive_checklist')
        .update({
          intake_completed: true,
          intake_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (checklistError) {
        console.error('Error updating checklist:', checklistError)
      }

      // Redirect to next step
      router.push('/intensive/dashboard')

    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setLoading(false)
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
      <div className="flex flex-wrap gap-2 ml-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => updateFormData(question.id, num)}
            className={`
              w-10 h-10 rounded border-2 font-semibold transition-colors duration-150 text-sm
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

  const TextQuestion = ({ 
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
        return <TextQuestion key={question.id} question={question} />
      case 'boolean':
        return <BooleanQuestion key={question.id} question={question} />
      default:
        return null
    }
  }

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
          eyebrow="ACTIVATION INTENSIVE"
          title="Pre-Intensive Intake"
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
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading ? (
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
