'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function BlueprintToolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as LifeCategoryKey | null
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<LifeCategoryKey | null>(categoryParam)
  const [loops, setLoops] = useState<BeingDoingReceivingLoop[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedLoop, setEditedLoop] = useState<BeingDoingReceivingLoop | null>(null)
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])

  const category = selectedCategory ? getVisionCategory(selectedCategory) : null
  
  // Get all categories
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  
  // Categories for grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )

  useEffect(() => {
    if (selectedCategory) {
      loadBlueprintData()
    } else {
      setLoading(false)
    }
  }, [selectedCategory])

  const loadBlueprintData = async () => {
    if (!selectedCategory) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Load existing data from vision_new_category_state table
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('clarity_keys, ideal_state, blueprint_data')
        .eq('user_id', user.id)
        .eq('category', selectedCategory)
        .maybeSingle()

      if (categoryState?.blueprint_data?.loops) {
        setLoops(categoryState.blueprint_data.loops)
      } else {
        setLoops([])
      }
      
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

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key as LifeCategoryKey)
    setLoops([])
    setError(null)
    router.push(`/tools/blueprint?category=${key}`)
  }

  const handleGenerateBlueprint = async () => {
    if (!selectedCategory) return
    
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
        .eq('category', selectedCategory)
        .single()

      if (!categoryState?.ideal_state) {
        setError('Please complete the Imagination step for this category first')
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
          category: selectedCategory,
          categoryName: category?.label || selectedCategory,
          idealState: categoryState.ideal_state,
          currentState: Array.isArray(categoryState.clarity_keys) ? categoryState.clarity_keys.join('\n\n') : '',
          profile,
          assessment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blueprint')
      }

      if (data.blueprint?.loops) {
        setVivaProgress(100)
        setLoops(data.blueprint.loops)
        
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
    if (editingIndex === null || !editedLoop || !selectedCategory) return

    const updatedLoops = [...loops]
    updatedLoops[editingIndex] = editedLoop

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { error: updateError } = await supabase
        .from('vision_new_category_state')
        .upsert({
          user_id: user.id,
          category: selectedCategory,
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

  if (loading && selectedCategory) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" variant="primary" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          eyebrow="Vision Tools"
          title="Blueprint Generator"
          subtitle="Create Being/Doing/Receiving loops for any category"
        >
          {/* Category Selection */}
          <div className="mb-6">
            <CategoryGrid
              categories={categoriesWithout}
              selectedCategories={selectedCategory ? [selectedCategory] : []}
              completedCategories={completedCategoryKeys}
              onCategoryClick={handleCategorySelect}
              mode="completion"
              layout="12-column"
              withCard={true}
              className="!bg-black/40 backdrop-blur-sm"
            />
          </div>
        </PageHero>

        {/* No Category Selected State */}
        {!selectedCategory && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Select a Category
              </h2>
              <p className="text-sm text-neutral-400">
                Choose a life category above to generate Being/Doing/Receiving loops
              </p>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && selectedCategory && (
          <Card className="p-6 border-2 border-red-500/30 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-red-500 mb-1">Error</h3>
                <p className="text-sm text-neutral-300">{error}</p>
              </div>
            </div>
          </Card>
        )}

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

        {/* Generate Blueprint */}
        {selectedCategory && loops.length === 0 && !isProcessing && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Generate Your {category?.label} Blueprint
              </h2>
              <p className="text-base text-neutral-400 mb-8">
                VIVA will create Being/Doing/Receiving loops based on your ideal state, connecting identity, action, and manifestation.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateBlueprint}
                className="w-full md:w-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Blueprint
              </Button>
            </div>
          </Card>
        )}

        {/* Blueprint Loops Display */}
        {selectedCategory && loops.length > 0 && !isProcessing && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <Badge variant="success" className="text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
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

            <div className="space-y-6 mb-8">
              {loops.map((loop, index) => (
                <Card key={index} className="p-6 border-2 border-primary-500/30 bg-primary-500/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
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
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                          Being (Identity & Feeling)
                        </label>
                        <AutoResizeTextarea
                          value={editedLoop.being}
                          onChange={(value) => setEditedLoop({ ...editedLoop, being: value })}
                          placeholder="Who you are being..."
                          className="w-full bg-neutral-800 border-2 border-[#00FFFF]/30 text-white"
                          minHeight={80}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                          Doing (Actions & Rhythms)
                        </label>
                        <AutoResizeTextarea
                          value={editedLoop.doing}
                          onChange={(value) => setEditedLoop({ ...editedLoop, doing: value })}
                          placeholder="What you are doing..."
                          className="w-full bg-neutral-800 border-2 border-[#14B8A6]/30 text-white"
                          minHeight={80}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                          Receiving (Evidence & Support)
                        </label>
                        <AutoResizeTextarea
                          value={editedLoop.receiving}
                          onChange={(value) => setEditedLoop({ ...editedLoop, receiving: value })}
                          placeholder="What you are receiving..."
                          className="w-full bg-neutral-800 border-2 border-[#8B5CF6]/30 text-white"
                          minHeight={80}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#FFB701] mb-2 uppercase tracking-wide">
                          Essence (Optional)
                        </label>
                        <input
                          type="text"
                          value={editedLoop.essence || ''}
                          onChange={(e) => setEditedLoop({ ...editedLoop, essence: e.target.value })}
                          placeholder="One-word essence..."
                          className="w-full bg-neutral-800 border-2 border-[#FFB701]/30 text-white px-4 py-2 rounded-lg"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
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
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                          Being
                        </h4>
                        <p className="text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-4 rounded-lg">
                          {loop.being}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                          Doing
                        </h4>
                        <p className="text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-4 rounded-lg">
                          {loop.doing}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                          Receiving
                        </h4>
                        <p className="text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-4 rounded-lg">
                          {loop.receiving}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Info Card */}
            <Card className="p-6 border-2 border-primary-500/30 bg-primary-500/5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-2">
                    Blueprint Complete
                  </h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Your Being/Doing/Receiving loops are saved. Select another category above to create more blueprints, or continue to other tools.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}

