'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge, AutoResizeTextarea, Stack, PageHero, CategoryGrid, VIVALoadingOverlay } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, ArrowLeft, Edit2, Save, X, RefreshCw, AlertCircle } from 'lucide-react'
import { getVisionCategory, VISION_CATEGORIES, type LifeCategoryKey } from '@/lib/design-system/vision-categories'

interface BeingDoingReceivingLoop {
  being: string
  doing: string
  receiving: string
  essence?: string
}

export default function BlueprintPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const categoryKey = params.key as LifeCategoryKey
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loops, setLoops] = useState<BeingDoingReceivingLoop[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedLoop, setEditedLoop] = useState<BeingDoingReceivingLoop | null>(null)
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  
  // Track completion of individual steps
  const [completedSteps, setCompletedSteps] = useState<{
    clarity: boolean
    imagination: boolean
    blueprint: boolean
    scenes: boolean
  }>({
    clarity: false,
    imagination: false,
    blueprint: false,
    scenes: false
  })

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
  
  // Determine current step (this is blueprint, so step 2)
  const currentStepIndex = 2

  useEffect(() => {
    loadBlueprintData()
  }, [categoryKey])

  const loadBlueprintData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Load existing data for all steps from vision_new_category_state table
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('clarity_keys, ideal_state, blueprint_data')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (categoryState?.blueprint_data?.loops) {
        setLoops(categoryState.blueprint_data.loops)
      }
      
      // Check for existing scenes for this category
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .limit(1)
      
      // Set step completion status based on actual data
      setCompletedSteps({
        clarity: !!(categoryState?.clarity_keys && Array.isArray(categoryState.clarity_keys) && categoryState.clarity_keys.length > 0),
        imagination: !!(categoryState?.ideal_state && categoryState.ideal_state.trim().length > 0),
        blueprint: !!(categoryState?.blueprint_data && Object.keys(categoryState.blueprint_data).length > 0),
        scenes: !!(existingScenes && existingScenes.length > 0)
      })
      
      // Load completion status for all categories for the grid
      const { data: allCategoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, clarity_keys')
        .eq('user_id', user.id)
      
      const completed = allCategoryStates
        ?.filter(state => state.clarity_keys && Array.isArray(state.clarity_keys) && state.clarity_keys.length > 0)
        .map(state => state.category) || []
      
      setCompletedCategoryKeys(completed)

      setLoading(false)
    } catch (err) {
      console.error('Error loading blueprint:', err)
      setError('Failed to load blueprint data')
      setLoading(false)
    }
  }

  const handleGenerateBlueprint = async () => {
    setIsProcessing(true)
    setVivaProgress(0)
    setVivaStage('analyzing')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get ideal state and other context
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .single()

      if (!categoryState?.ideal_state) {
        setError('Please complete the Ideal State step first')
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
        .eq('is_active', true)
        .maybeSingle()

      setVivaStage('generating')

      // Call blueprint API
      const response = await fetch('/api/viva/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          categoryName: category?.label || categoryKey,
          idealState: categoryState.ideal_state,
          currentClarity: Array.isArray(categoryState.clarity_keys) ? categoryState.clarity_keys.join('\n\n') : '',
          flippedContrast: '', // Optional
          profile,
          assessment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blueprint')
      }

      if (data.blueprint?.loops) {
        // Slide progress to 100%
        setVivaProgress(100)
        setLoops(data.blueprint.loops)
        
        // Wait briefly to show 100% completion, then hide overlay
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      setVivaStage('')
    } catch (err) {
      console.error('Error generating blueprint:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate blueprint')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
      setVivaProgress(0)
    }
  }

  const handleEditLoop = (index: number) => {
    setEditingIndex(index)
    setEditedLoop({ ...loops[index] })
  }

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editedLoop) return

    const updatedLoops = [...loops]
    updatedLoops[editingIndex] = editedLoop

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database
      const { error: updateError } = await supabase
        .from('vision_new_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          blueprint_data: { loops: updatedLoops }
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      setLoops(updatedLoops)
      setEditingIndex(null)
      setEditedLoop(null)
    } catch (err) {
      console.error('Error saving loop:', err)
      setError('Failed to save changes')
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditedLoop(null)
  }

  const handleContinueToScenes = () => {
    router.push(`/life-vision/new/category/${categoryKey}/scenes`)
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
                // Check actual completion status from database
                const stepKey = step.key as keyof typeof completedSteps
                const isCompleted = completedSteps[stepKey]
                const isCurrent = index === currentStepIndex
                // Step is clickable if it's completed, current, or the next step after last completed
                const isClickable = isCompleted || isCurrent || index <= currentStepIndex

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
      {/* VIVA Processing Overlay */}
      <VIVALoadingOverlay
        isVisible={isProcessing}
        messages={[
          "VIVA is analyzing your ideal state...",
          "Generating Being/Doing/Receiving loops...",
          "Crafting your identity and action cycles...",
          "Creating your personalized blueprint..."
        ]}
        cycleDuration={4000}
        estimatedTime="Usually takes 15-25 seconds"
        estimatedDuration={20000}
        progress={vivaProgress}
      />

      {/* Generate Blueprint (if none exists) */}
      {loops.length === 0 && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary-500" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3">
              Generate Your Blueprint
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create Being/Doing/Receiving loops based on your ideal state, connecting identity, action, and manifestation.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateBlueprint}
              className="w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Blueprint
            </Button>
          </div>
        </Card>
      )}

      {/* Blueprint Loops Display */}
      {loops.length > 0 && !isProcessing && (
        <>
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <Badge variant="success" className="text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {loops.length} Loop{loops.length !== 1 ? 's' : ''} Created
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateBlueprint}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            {loops.map((loop, index) => (
              <Card key={index} className="p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold text-white">
                    Loop {index + 1}
                    {loop.essence && (
                      <span className="ml-3 text-sm font-normal text-primary-500">
                        Essence: {loop.essence}
                      </span>
                    )}
                  </h3>
                  {editingIndex !== index && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLoop(index)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {editingIndex === index && editedLoop ? (
                  /* Edit Mode */
                  <div className="space-y-4 md:space-y-6">
                    {/* Being */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                        Being (Identity & Feeling)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.being}
                        onChange={(value) => setEditedLoop({ ...editedLoop, being: value })}
                        placeholder="Who you are being..."
                        className="w-full bg-neutral-800 border-2 border-[#00FFFF]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Doing */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                        Doing (Actions & Rhythms)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.doing}
                        onChange={(value) => setEditedLoop({ ...editedLoop, doing: value })}
                        placeholder="What you are doing..."
                        className="w-full bg-neutral-800 border-2 border-[#14B8A6]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Receiving */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                        Receiving (Evidence & Support)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.receiving}
                        onChange={(value) => setEditedLoop({ ...editedLoop, receiving: value })}
                        placeholder="What you are receiving..."
                        className="w-full bg-neutral-800 border-2 border-[#8B5CF6]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Essence */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#FFB701] mb-2 uppercase tracking-wide">
                        Essence (Optional)
                      </label>
                      <input
                        type="text"
                        value={editedLoop.essence || ''}
                        onChange={(e) => setEditedLoop({ ...editedLoop, essence: e.target.value })}
                        placeholder="One-word essence..."
                        className="w-full bg-neutral-800 border-2 border-[#FFB701]/30 text-white text-sm md:text-base px-4 py-2 rounded-lg"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4 md:space-y-6">
                    {/* Being */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                        Being
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.being}
                      </p>
                    </div>

                    {/* Doing */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                        Doing
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.doing}
                      </p>
                    </div>

                    {/* Receiving */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                        Receiving
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.receiving}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateBlueprint}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate All
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueToScenes}
                className="flex-1"
              >
                Save and Continue
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </>
      )}
      </Stack>
    </Container>
  )
}

