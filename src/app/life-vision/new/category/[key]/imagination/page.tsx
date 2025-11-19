'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { getFilteredQuestionsForCategory, type IdealStateQuestion } from '@/lib/life-vision/ideal-state-questions'

export default function ImaginationPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<IdealStateQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [existingIdealState, setExistingIdealState] = useState('')

  const category = getVisionCategory(categoryKey)
  const IconComponent = category?.icon

  useEffect(() => {
    loadData()
  }, [categoryKey])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Load user profile for conditional questions
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()

      // Get filtered questions based on profile
      const filteredQuestions = getFilteredQuestionsForCategory(categoryKey, profile || {})
      setQuestions(filteredQuestions)

      // Initialize answers with empty strings
      const initialAnswers: Record<string, string> = {}
      filteredQuestions.forEach((q) => {
        initialAnswers[q.id] = ''
      })
      setAnswers(initialAnswers)

      // Load existing ideal_state answers if any
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('ideal_state')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (categoryState?.ideal_state) {
        setExistingIdealState(categoryState.ideal_state)
        // Could potentially parse and pre-fill individual answers here if needed
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    // Combine all answers
    const combinedAnswers = Object.values(answers)
      .filter(a => a.trim().length > 0)
      .join('\n\n')

    if (!combinedAnswers) {
      setError('Please answer at least one question before continuing')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database
      const { error: updateError } = await supabase
        .from('life_vision_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          ideal_state: combinedAnswers
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      // Navigate to blueprint
      router.push(`/life-vision/new/category/${categoryKey}/blueprint`)
    } catch (err) {
      console.error('Error saving ideal state:', err)
      setError('Failed to save your answers')
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" variant="primary" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 md:gap-4 mb-4">
          {category && IconComponent && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 border-[#FFB701]">
              <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-[#FFB701]" />
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
              Unleash Your Imagination
            </h1>
            <p className="text-xs md:text-sm text-neutral-400">{category?.label} - Step 2</p>
          </div>
        </div>

        <div className="p-3 md:p-4 bg-[#FFB701]/10 border border-[#FFB701]/30 rounded-lg">
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
            <strong className="text-[#FFB701]">Step 2: Imagination</strong> - Now that we have clarity on where you are, let's explore where you want to be. Answer the prompts below to paint your ideal state in this area.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-red-500 mb-1">Error</h3>
              <p className="text-sm text-neutral-300">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Questions & Answers */}
      {questions.length > 0 && (
        <>
          <div className="mb-4 md:mb-6">
            <Badge variant="success" className="text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-6 md:space-y-8 mb-6 md:mb-8">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4 md:p-6 border-2 border-[#FFB701]/30 bg-[#FFB701]/5">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="neutral" className="text-xs bg-[#FFB701]/20 text-[#FFB701]">
                        Question {index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                      {question.text}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div>
                    <RecordingTextarea
                      value={answers[question.id] || ''}
                      onChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                      placeholder="Type or speak your answer... Be as imaginative and detailed as you like!"
                      category={categoryKey}
                      storageFolder="lifeVision"
                      recordingPurpose="transcriptOnly"
                      className="w-full bg-neutral-800 border-2 border-[#FFB701]/30 text-white text-sm md:text-base min-h-[120px]"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm md:text-base font-semibold text-white mb-2">
                  General But Juicy
                </h4>
                <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                  Think <strong className="text-primary-500">big picture</strong> rather than specific details. 
                  What does your ideal {category?.label.toLowerCase()} <em>feel</em> like? What's the essence of what you want? 
                  You'll get specific in the next steps - for now, let your imagination flow freely.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="p-4 md:p-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveAndContinue}
              className="w-full"
            >
              Continue to Blueprint
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Button>
          </Card>
        </>
      )}
    </Container>
  )
}

