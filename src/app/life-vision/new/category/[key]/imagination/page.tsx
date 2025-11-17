'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge, AutoResizeTextarea } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Lightbulb } from 'lucide-react'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import { RecordingTextarea } from '@/components/RecordingTextarea'

interface IdealStatePrompt {
  title: string
  prompt: string
  focusArea: string
}

function VIVAActionCard({ stage, className = '' }: { stage: string; className?: string }) {
  const stageData = {
    'generating': {
      title: 'Generating imagination prompts',
      description: 'Creating personalized prompts for your ideal state...',
      icon: Sparkles
    },
    'analyzing': {
      title: 'Analyzing your clarity',
      description: 'Understanding what you want to imagine...',
      icon: Lightbulb
    }
  }

  const data = stageData[stage as keyof typeof stageData] || stageData.generating
  const Icon = data.icon

  return (
    <Card className={`${className} border-2 border-primary-500/50 bg-primary-500/10 p-4 md:p-6`}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white mb-1">{data.title}</h3>
          <p className="text-xs md:text-sm text-neutral-400">{data.description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function ImaginationPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<IdealStatePrompt[]>([])
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

      // Load existing category state (prompts + ideal state answers)
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('ideal_state, ideal_state_prompts')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      // Load existing AI-generated prompts if they exist
      if (categoryState?.ideal_state_prompts && Array.isArray(categoryState.ideal_state_prompts)) {
        const loadedPrompts = categoryState.ideal_state_prompts
        if (loadedPrompts.length > 0) {
          setPrompts(loadedPrompts)
          console.log('[Imagination] Loaded existing prompts from database:', loadedPrompts.length)
          
          // Initialize answers object with empty strings
          const initialAnswers: Record<string, string> = {}
          loadedPrompts.forEach((p: IdealStatePrompt, idx: number) => {
            initialAnswers[`prompt-${idx}`] = ''
          })
          setAnswers(initialAnswers)
        }
      }

      // Load existing user answers if any
      if (categoryState?.ideal_state) {
        setExistingIdealState(categoryState.ideal_state)
        // Note: We could potentially parse and pre-fill answers here if needed
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }

  const handleGeneratePrompts = async () => {
    setIsProcessing(true)
    setVivaStage('analyzing')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get clarity and contrast data
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (!categoryState?.ai_summary) {
        setError('Please complete Step 1 (Clarity) first')
        setIsProcessing(false)
        return
      }

      // Get profile and assessment
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setVivaStage('generating')

      // Call ideal-state API
      const response = await fetch('/api/viva/ideal-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          categoryName: category?.label || categoryKey,
          currentClarity: categoryState?.ai_summary || '',
          flippedContrast: '', // Flipped contrast is in frequency_flip table
          profile,
          assessment,
          existingIdealState: existingIdealState || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompts')
      }

      const data = await response.json()
      console.log('[Imagination] API Response:', data)

      // API returns { success: true, data: { prompts: [...] } }
      const prompts = data.data?.prompts || data.prompts || []
      console.log('[Imagination] Extracted prompts:', prompts)
      
      if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
        throw new Error('No prompts were generated. Please try again.')
      }
      
      if (prompts && Array.isArray(prompts)) {
        setPrompts(prompts)
        // Initialize empty answers
        const initialAnswers: Record<string, string> = {}
        prompts.forEach((p: IdealStatePrompt, idx: number) => {
          initialAnswers[`prompt-${idx}`] = ''
        })
        setAnswers(initialAnswers)
        console.log('[Imagination] Successfully loaded', prompts.length, 'prompts')
      }

      setVivaStage('')
    } catch (err) {
      console.error('Error generating prompts:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate prompts')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveAndContinue = async () => {
    // Combine all answers
    const combinedAnswers = Object.values(answers)
      .filter(a => a.trim().length > 0)
      .join('\n\n')

    if (!combinedAnswers) {
      setError('Please answer at least one prompt before continuing')
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

      {/* Processing State */}
      {isProcessing && vivaStage && (
        <VIVAActionCard stage={vivaStage} className="mb-6 md:mb-8" />
      )}

      {/* Generate Prompts (if none exist) */}
      {prompts.length === 0 && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#FFB701]/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-[#FFB701]" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3">
              Generate Imagination Prompts
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create personalized prompts to help you explore your ideal state in {category?.label.toLowerCase()}. These prompts are designed to unlock your imagination and help you articulate what you truly desire.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGeneratePrompts}
              className="w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Prompts
            </Button>
          </div>
        </Card>
      )}

      {/* Prompts & Answers */}
      {prompts.length > 0 && !isProcessing && (
        <>
          <div className="mb-4 md:mb-6">
            <Badge variant="success" className="text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {prompts.length} Prompt{prompts.length !== 1 ? 's' : ''} Generated
            </Badge>
          </div>

          <div className="space-y-6 md:space-y-8 mb-6 md:mb-8">
            {prompts.map((prompt, index) => (
              <Card key={index} className="p-4 md:p-6 border-2 border-[#FFB701]/30 bg-[#FFB701]/5">
                <div className="space-y-4">
                  {/* Prompt Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="neutral" className="text-xs bg-[#FFB701]/20 text-[#FFB701]">
                        Prompt {index + 1}
                      </Badge>
                      {prompt.focusArea && (
                        <Badge variant="neutral" className="text-xs text-neutral-400">
                          {prompt.focusArea}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">
                      {prompt.title}
                    </h3>
                    <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div>
                    <RecordingTextarea
                      value={answers[`prompt-${index}`] || ''}
                      onChange={(value) => setAnswers({ ...answers, [`prompt-${index}`]: value })}
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
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePrompts}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate Prompts
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSaveAndContinue}
                className="flex-1"
              >
                Continue to Blueprint
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </>
      )}
    </Container>
  )
}

