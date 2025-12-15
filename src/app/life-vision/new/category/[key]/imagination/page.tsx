'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner } from '@/lib/design-system/components'
import { ArrowRight, ArrowLeft, Sparkles, Lightbulb } from 'lucide-react'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import { RecordingTextarea } from '@/components/RecordingTextarea'

export default function ImaginationPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [freeFlowText, setFreeFlowText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])

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

      // Get filtered questions for inspiration
      const filteredQuestions = getFilteredQuestionsForCategory(categoryKey, profile || {})
      setInspirationQuestions(filteredQuestions.map(q => q.text))

      // Load existing ideal_state text if any
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('ideal_state')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (categoryState?.ideal_state) {
        // Try to parse as old JSON format first
        try {
          const parsed = JSON.parse(categoryState.ideal_state)
          if (typeof parsed === 'object' && parsed !== null) {
            // Convert old individual answers to free-flow text
            setFreeFlowText(Object.values(parsed).filter(Boolean).join('\n\n'))
          } else {
            setFreeFlowText(categoryState.ideal_state)
          }
        } catch {
          // Not JSON, use as-is (new text format)
          setFreeFlowText(categoryState.ideal_state)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    if (!freeFlowText.trim()) {
      setError('Please describe your ideal state before continuing')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database as plain text
      const { error: updateError } = await supabase
        .from('life_vision_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          ideal_state: freeFlowText.trim()
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      // Navigate to blueprint
      router.push(`/life-vision/new/category/${categoryKey}/blueprint`)
    } catch (err) {
      console.error('Error saving ideal state:', err)
      setError('Failed to save your vision')
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
    <Container size="xl" className="py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => router.push(`/life-vision/new/category/${categoryKey}`)}
          className="mb-4"
        >
          Back to Clarity
        </Button>

        <div className="flex items-center gap-4 mb-4">
          {IconComponent && (
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-primary-500" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{category?.label}</h1>
            <p className="text-neutral-400">Step 2: Unleash Your Imagination</p>
          </div>
        </div>

        <Card variant="outlined" className="border-secondary-500/30 bg-secondary-500/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-secondary-500 shrink-0 mt-0.5" />
            <p className="text-sm text-secondary-300">
              Imagine your dream life in <strong>{category?.label.toLowerCase()}</strong>. 
              Let your imagination run wild! What would it look like if everything was exactly as you wanted?
            </p>
          </div>
        </Card>
      </div>

      {error && (
        <Card variant="elevated" className="bg-red-500/10 border border-red-500/30 p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Inspiration Questions */}
      {inspirationQuestions.length > 0 && (
        <Card variant="elevated" className="mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-white">Questions to Inspire You</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            Use these questions as inspiration, but feel free to write about anything that excites you!
          </p>
          <ul className="space-y-2">
            {inspirationQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-2 text-neutral-300">
                <span className="text-primary-500 mt-1">•</span>
                <span className="text-sm">{question}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Free Flow Textarea */}
      <Card variant="elevated" className="p-6 mb-6">
        <label className="block mb-3">
          <span className="text-lg font-semibold text-white mb-2 block">
            Your Dream Life in {category?.label}
          </span>
          <span className="text-sm text-neutral-400 block mb-4">
            Write freely about your ideal state. No structure required—just let it flow!
          </span>
        </label>
        <RecordingTextarea
          value={freeFlowText}
          onChange={(e) => setFreeFlowText(e.target.value)}
          placeholder={`Describe your dream ${category?.label.toLowerCase()} life...\n\nWhat does it look like? How does it feel? What are you doing? Who are you with?`}
          className="min-h-[300px] w-full"
          minRows={12}
        />
        <p className="text-xs text-neutral-500 mt-2">
          {freeFlowText.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      </Card>

      {/* Actions */}
      <Card variant="elevated" className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(`/life-vision/new/category/${categoryKey}`)}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Back to Clarity
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveAndContinue}
            disabled={!freeFlowText.trim()}
            className="flex-1"
          >
            Continue to Blueprint
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Button>
        </div>
      </Card>
    </Container>
  )
}
