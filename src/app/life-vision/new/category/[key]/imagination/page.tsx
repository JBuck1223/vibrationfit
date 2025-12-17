'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Stack, PageHero, CategoryGrid, Badge, IconList } from '@/lib/design-system/components'
import { ArrowRight, ArrowLeft, Sparkles, Lightbulb, CheckCircle } from 'lucide-react'
import { getVisionCategory, VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import { RecordingTextarea } from '@/components/RecordingTextarea'

export default function ImaginationPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [freeFlowText, setFreeFlowText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])

  const category = getVisionCategory(categoryKey)
  const IconComponent = category?.icon
  
  // Get all categories and navigation
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null
  
  // Categories for grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )
  
  // Define the 4 steps for each category
  const categorySteps = [
    { key: 'clarity', label: 'Clarity', path: `/life-vision/new/category/${categoryKey}` },
    { key: 'imagination', label: 'Imagination', path: `/life-vision/new/category/${categoryKey}/imagination` },
    { key: 'blueprint', label: 'Blueprint', path: `/life-vision/new/category/${categoryKey}/blueprint` },
    { key: 'scenes', label: 'Scenes', path: `/life-vision/new/category/${categoryKey}/scenes` }
  ]
  
  // Determine current step (this is imagination, so step 1)
  const currentStepIndex = 1

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
      
      // Load completion status for all categories for the grid
      const { data: allCategoryStates } = await supabase
        .from('life_vision_category_state')
        .select('category, ai_summary')
        .eq('user_id', user.id)
      
      const completed = allCategoryStates
        ?.filter(state => state.ai_summary && state.ai_summary.trim().length > 0)
        .map(state => state.category) || []
      
      setCompletedCategoryKeys(completed)

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
    <Container size="xl">
      <Stack gap="lg">
        {/* Unified Header with PageHero */}
        <PageHero
          eyebrow={`Category ${currentIndex + 1} of ${allCategories.length}`}
          title={category?.label || ''}
          subtitle={category?.description || ''}
        >
          {/* Category Grid */}
          <div className="mb-6">
            <CategoryGrid
              categories={categoriesWithout}
              selectedCategories={[categoryKey]}
              completedCategories={completedCategoryKeys}
              onCategoryClick={(key) => router.push(`/life-vision/new/category/${key}`)}
              mode="completion"
              layout="12-column"
              withCard={true}
              className="!bg-black/40 backdrop-blur-sm"
            />
          </div>

          {/* Step Progress Indicator */}
          <div className="space-y-4">
            {/* 4-Step Flow Indicator */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Steps */}
              {categorySteps.map((step, index) => {
                const isCompleted = index < currentStepIndex
                const isCurrent = index === currentStepIndex
                const isClickable = index <= currentStepIndex

                return (
                  <button
                    key={step.key}
                    onClick={() => isClickable && router.push(step.path)}
                    disabled={!isClickable}
                    className={`
                      flex-1 relative group
                      ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    <div className={`
                      relative rounded-xl p-3 md:p-4 border-2 transition-all duration-300
                      ${isCurrent 
                        ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20' 
                        : isCompleted
                        ? 'border-primary-500/50 bg-primary-500/5'
                        : 'border-neutral-700 bg-neutral-800/30'
                      }
                      ${isClickable ? 'hover:border-primary-500/70 hover:bg-primary-500/5' : ''}
                    `}>
                      <div className="flex items-center justify-center mb-1 md:mb-2">
                        <div className={`
                          w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center
                          transition-all duration-300
                          ${isCurrent 
                            ? 'bg-primary-500 text-black' 
                            : isCompleted
                            ? 'bg-primary-500 text-black'
                            : 'bg-neutral-700 text-neutral-400'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                          ) : (
                            <span className="text-xs md:text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className={`
                        text-xs md:text-sm font-semibold text-center transition-colors
                        ${isCurrent 
                          ? 'text-white' 
                          : isCompleted
                          ? 'text-primary-500/70'
                          : 'text-neutral-500'
                        }
                      `}>
                        {step.label}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="flex md:hidden gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prevCategory && router.push(`/life-vision/new/category/${prevCategory.key}`)}
                disabled={!prevCategory}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Prev Category
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextCategory && router.push(`/life-vision/new/category/${nextCategory.key}`)}
                disabled={!nextCategory}
                className="flex-1"
              >
                Next Category
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </PageHero>

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
          <IconList items={inspirationQuestions} />
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
          onChange={(value) => setFreeFlowText(value)}
          placeholder={`Describe your dream ${category?.label.toLowerCase()} life...\n\nWhat does it look like? How does it feel? What are you doing? Who are you with?`}
          className="min-h-[300px] w-full"
          rows={12}
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
            Save and Continue
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Button>
        </div>
      </Card>
      </Stack>
    </Container>
  )
}
