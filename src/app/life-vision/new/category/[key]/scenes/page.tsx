'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge, Stack, PageHero, CategoryGrid, VIVALoadingOverlay, Textarea, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Video, Edit2, Save, X, Trash2, Check } from 'lucide-react'
import { getVisionCategory, VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface Scene {
  id: string
  title: string
  text: string
  essence_word: string | null
  created_at: string
  is_selected?: boolean
}

export default function ScenesPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [editingScene, setEditingScene] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedText, setEditedText] = useState('')
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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
  
  // Determine current step (this is scenes, so step 3)
  const currentStepIndex = 3

  useEffect(() => {
    loadScenes()
  }, [categoryKey])

  const loadScenes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Load existing scenes for this category
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .order('created_at', { ascending: true })

      if (existingScenes && existingScenes.length > 0) {
        setScenes(existingScenes)
        // Auto-select all scenes by default
        setSelectedScenes(new Set(existingScenes.map(s => s.id)))
      }
      
      // Load existing data for all steps from vision_new_category_state table
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('clarity_keys, ideal_state, blueprint_data')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()
      
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
      console.error('Error loading scenes:', err)
      setError('Failed to load scenes')
      setLoading(false)
    }
  }

  const handleGenerateScenes = async (numToGenerate?: number) => {
    setIsProcessing(true)
    setVivaProgress(0)
    setVivaStage('analyzing')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get all category data
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      // Get profile data for this category
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      // Get active assessment data for this category
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*, assessment_responses(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      // Extract category-specific data
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []
      
      // Map category to profile story field
      const storyField = `${categoryKey}_story`
      const profileStory = profile?.[storyField] || ''

      setVivaStage('generating')

      // Call scenes generation API
      const response = await fetch('/api/vibration/scenes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          category: categoryKey,
          profileGoesWellText: profileStory,
          profileNotWellTextFlipped: '', // Flipped contrast is in frequency_flip table
          assessmentSnippets: categoryResponses.map((r: any) => r.response_text),
          existingVisionParagraph: Array.isArray(categoryState?.clarity_keys) ? categoryState.clarity_keys.join('\n\n') : '',
          dataRichnessTier: 'B', // Will be calculated by API
          numScenesToGenerate: numToGenerate // Pass the specific count if provided
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate scenes')
      }

      const data = await response.json()

      // Slide progress to 100%
      setVivaProgress(100)
      
      // Reload scenes from database
      await loadScenes()
      
      // Wait briefly to show 100% completion, then hide overlay
      await new Promise(resolve => setTimeout(resolve, 600))

      setVivaStage('')
    } catch (err) {
      console.error('Error generating scenes:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate scenes')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
      setVivaProgress(0)
    }
  }

  const handleCompleteCategory = () => {
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
    }
  }

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene.id)
    setEditedTitle(scene.title)
    setEditedText(scene.text)
  }

  const handleSaveEdit = async (sceneId: string) => {
    try {
      const { error } = await supabase
        .from('scenes')
        .update({
          title: editedTitle,
          text: editedText,
          updated_at: new Date().toISOString()
        })
        .eq('id', sceneId)

      if (error) throw error

      // Update local state
      setScenes(scenes.map(s => 
        s.id === sceneId 
          ? { ...s, title: editedTitle, text: editedText }
          : s
      ))
      
      setEditingScene(null)
    } catch (err) {
      console.error('Error saving scene:', err)
      setError('Failed to save scene edits')
    }
  }

  const handleCancelEdit = () => {
    setEditingScene(null)
    setEditedTitle('')
    setEditedText('')
  }

  const initiateDeleteScene = (scene: Scene) => {
    setSceneToDelete(scene)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteScene = async () => {
    if (!sceneToDelete) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneToDelete.id)

      if (error) throw error

      // Update local state
      setScenes(scenes.filter(s => s.id !== sceneToDelete.id))
      setSelectedScenes(prev => {
        const next = new Set(prev)
        next.delete(sceneToDelete.id)
        return next
      })
      
      setShowDeleteConfirm(false)
      setSceneToDelete(null)
    } catch (err) {
      console.error('Error deleting scene:', err)
      setError('Failed to delete scene')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteScene = () => {
    setShowDeleteConfirm(false)
    setSceneToDelete(null)
  }

  const handleToggleSelection = (sceneId: string) => {
    setSelectedScenes(prev => {
      const next = new Set(prev)
      if (next.has(sceneId)) {
        next.delete(sceneId)
      } else {
        next.add(sceneId)
      }
      return next
    })
  }

  const handleRegenerateAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get deselected scenes (the ones to regenerate)
      const deselectedScenes = scenes.filter(s => !selectedScenes.has(s.id))
      const deselectedIds = deselectedScenes.map(s => s.id)
      
      if (deselectedIds.length === 0) {
        return // Nothing to regenerate
      }

      // Delete only the deselected scenes from database
      const { error: deleteError } = await supabase
        .from('scenes')
        .delete()
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .in('id', deselectedIds)
      
      if (deleteError) {
        throw deleteError
      }

      // Update local state immediately to remove deleted scenes
      setScenes(scenes.filter(s => selectedScenes.has(s.id)))
      
      // Generate that many new scenes
      await handleGenerateScenes(deselectedIds.length)
    } catch (err) {
      console.error('Error regenerating scenes:', err)
      setError('Failed to regenerating scenes')
    }
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length
  }

  const selectedCount = selectedScenes.size
  const deselectedCount = scenes.length - selectedCount

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
          "VIVA is analyzing your vision richness...",
          "Creating cinematic visualization scenes...",
          "Crafting Micro-Macro breathing moments...",
          "Generating your personalized scenes..."
        ]}
        cycleDuration={4000}
        estimatedTime="Usually takes 15-25 seconds"
        estimatedDuration={20000}
        progress={vivaProgress}
      />

      {/* Generate Scenes (if none exist) */}
      {scenes.length === 0 && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Video className="w-8 h-8 md:w-10 md:h-10 text-accent-purple" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3">
              Generate Visualization Scenes
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create cinematic scenes that bring your {category?.label.toLowerCase()} vision to life with vivid sensory details and emotional depth.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleGenerateScenes()}
              className="w-full md:w-auto"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Scenes
            </Button>
          </div>
        </Card>
      )}

      {/* Scenes Display */}
      {scenes.length > 0 && !isProcessing && (
        <>
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="success" className="text-xs md:text-sm">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {scenes.length} Scene{scenes.length !== 1 ? 's' : ''} Created
              </Badge>
              <Badge variant="primary" className="text-xs md:text-sm">
                <Check className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {selectedCount} Selected
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedScenes(new Set(scenes.map(s => s.id)))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedScenes(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateAll}
                disabled={deselectedCount === 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate {deselectedCount > 0 ? deselectedCount : 'All'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {scenes.map((scene, index) => {
              const wordCount = getWordCount(scene.text)
              const isEditing = editingScene === scene.id
              const isSelected = selectedScenes.has(scene.id)

              return (
                <Card 
                  key={scene.id} 
                  className={`p-4 md:p-6 border-2 transition-all bg-accent-purple/5 ${
                    isSelected 
                      ? 'border-primary-500' 
                      : 'border-accent-purple/30 hover:border-accent-purple/50'
                  }`}
                >
                  <div className="space-y-3 md:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="neutral" className="text-xs bg-accent-purple/20 text-accent-purple">
                            Scene {index + 1}
                          </Badge>
                          <Badge variant="neutral" className="text-xs text-neutral-400">
                            {wordCount} words
                          </Badge>
                          {isSelected && (
                            <Badge variant="success" className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        {!isEditing ? (
                          <h3 className="text-base md:text-lg font-bold text-white">
                            {scene.title}
                          </h3>
                        ) : (
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-base md:text-lg font-bold focus:outline-none focus:border-primary-500"
                            placeholder="Scene title"
                          />
                        )}
                      </div>
                    </div>

                    {/* Scene Text */}
                    {!isEditing ? (
                      <div className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {scene.text}
                      </div>
                    ) : (
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        rows={10}
                        className="w-full text-sm md:text-base"
                        placeholder="Scene text"
                      />
                    )}

                    {/* Essence Word */}
                    {!isEditing && scene.essence_word && (
                      <div className="flex items-center gap-2 pt-2 border-t border-accent-purple/20">
                        <span className="text-xs md:text-sm text-neutral-400">Essence:</span>
                        <Badge variant="neutral" className="bg-accent-purple/20 text-accent-purple text-xs md:text-sm">
                          {scene.essence_word}
                        </Badge>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-700">
                      {!isEditing ? (
                        <>
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleToggleSelection(scene.id)}
                            className="flex-1"
                          >
                            <Check className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScene(scene)}
                          >
                            <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => initiateDeleteScene(scene)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEdit(scene.id)}
                            className="flex-1"
                          >
                            <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Info Card about Scene Selection */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm md:text-base font-semibold text-white mb-2">
                  Scene Selection
                </h4>
                <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                  You have <strong className="text-primary-500">{scenes.length} scenes</strong> and <strong className="text-primary-500">{selectedCount} selected</strong> to use in your vision. 
                  Edit, regenerate individual scenes, or discard ones that don't match your vibe. Each scene is 140-220 words with Micro-Macro breathing.
                </p>
              </div>
            </div>
          </Card>

          {/* Continue Button */}
          <Card className="p-4 md:p-6">
            {selectedCount === 0 ? (
              <div className="text-center mb-4">
                <p className="text-sm text-neutral-400 mb-3">
                  Please select at least one scene to continue
                </p>
              </div>
            ) : null}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
               <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateScenes()}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate All Scenes
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCompleteCategory}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                {nextCategory ? `Save and Continue to ${nextCategory.label}` : 'Complete All Categories'}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteScene}
        onConfirm={confirmDeleteScene}
        itemName={sceneToDelete?.title || ''}
        itemType="Scene"
        isLoading={isDeleting}
        loadingText="Deleting scene..."
      />
      </Stack>
    </Container>
  )
}

