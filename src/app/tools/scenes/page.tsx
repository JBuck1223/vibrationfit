'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge, Stack, PageHero, CategoryGrid, VIVALoadingOverlay, Textarea, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, RefreshCw, AlertCircle, Video, Edit2, Save, X, Trash2, Check } from 'lucide-react'
import { getVisionCategory, VISION_CATEGORIES, type LifeCategoryKey } from '@/lib/design-system/vision-categories'

interface Scene {
  id: string
  title: string
  text: string
  essence_word: string | null
  created_at: string
  is_selected?: boolean
}

export default function ScenesToolPage() {
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
  const [scenes, setScenes] = useState<Scene[]>([])
  const [editingScene, setEditingScene] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedText, setEditedText] = useState('')
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])

  const category = selectedCategory ? getVisionCategory(selectedCategory) : null
  
  // Categories for grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )

  useEffect(() => {
    if (selectedCategory) {
      loadScenes()
    } else {
      setLoading(false)
    }
  }, [selectedCategory])

  const loadScenes = async () => {
    if (!selectedCategory) return
    
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
        .eq('category', selectedCategory)
        .order('created_at', { ascending: true })

      if (existingScenes && existingScenes.length > 0) {
        setScenes(existingScenes)
        // Auto-select all scenes by default
        setSelectedScenes(new Set(existingScenes.map(s => s.id)))
      } else {
        setScenes([])
        setSelectedScenes(new Set())
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
      console.error('Error loading scenes:', err)
      setError('Failed to load scenes')
      setLoading(false)
    }
  }

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key as LifeCategoryKey)
    setScenes([])
    setSelectedScenes(new Set())
    setError(null)
    router.push(`/tools/scenes?category=${key}`)
  }

  const handleGenerateScenes = async (numToGenerate?: number) => {
    if (!selectedCategory) return
    
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
        .eq('category', selectedCategory)
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
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === selectedCategory) || []
      
      // Map category to profile story field
      const storyField = `${selectedCategory}_story`
      const profileStory = profile?.[storyField] || ''

      setVivaStage('generating')

      // Call scenes generation API
      const response = await fetch('/api/vibration/scenes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          category: selectedCategory,
          profileGoesWellText: profileStory,
          profileNotWellTextFlipped: '',
          assessmentSnippets: categoryResponses.map((r: any) => r.response_text),
          existingVisionParagraph: Array.isArray(categoryState?.clarity_keys) ? categoryState.clarity_keys.join('\n\n') : '',
          dataRichnessTier: 'B',
          numScenesToGenerate: numToGenerate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate scenes')
      }

      const data = await response.json()

      setVivaProgress(100)
      
      // Reload scenes from database
      await loadScenes()
      
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
    if (!selectedCategory) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const deselectedScenes = scenes.filter(s => !selectedScenes.has(s.id))
      const deselectedIds = deselectedScenes.map(s => s.id)
      
      if (deselectedIds.length === 0) {
        return
      }

      const { error: deleteError } = await supabase
        .from('scenes')
        .delete()
        .eq('user_id', user.id)
        .eq('category', selectedCategory)
        .in('id', deselectedIds)
      
      if (deleteError) {
        throw deleteError
      }

      setScenes(scenes.filter(s => selectedScenes.has(s.id)))
      
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
          title="Scene Generator"
          subtitle="Create cinematic visualization scenes for any category"
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
              <div className="w-16 h-16 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-accent-purple" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Select a Category
              </h2>
              <p className="text-sm text-neutral-400">
                Choose a life category above to generate visualization scenes
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
        {selectedCategory && scenes.length === 0 && !isProcessing && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-accent-purple" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Generate {category?.label} Scenes
              </h2>
              <p className="text-base text-neutral-400 mb-8">
                VIVA will create cinematic scenes that bring your {category?.label.toLowerCase()} vision to life with vivid sensory details and emotional depth.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleGenerateScenes()}
                className="w-full md:w-auto"
              >
                <Video className="w-5 h-5 mr-2" />
                Generate Scenes
              </Button>
            </div>
          </Card>
        )}

        {/* Scenes Display */}
        {selectedCategory && scenes.length > 0 && !isProcessing && (
          <>
            <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="success" className="text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {scenes.length} Scene{scenes.length !== 1 ? 's' : ''} Created
                </Badge>
                <Badge variant="primary" className="text-sm">
                  <Check className="w-4 h-4 mr-2" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {scenes.map((scene, index) => {
                const wordCount = getWordCount(scene.text)
                const isEditing = editingScene === scene.id
                const isSelected = selectedScenes.has(scene.id)

                return (
                  <Card 
                    key={scene.id} 
                    className={`p-6 border-2 transition-all bg-accent-purple/5 ${
                      isSelected 
                        ? 'border-primary-500' 
                        : 'border-accent-purple/30 hover:border-accent-purple/50'
                    }`}
                  >
                    <div className="space-y-4">
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
                            <h3 className="text-lg font-bold text-white">
                              {scene.title}
                            </h3>
                          ) : (
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-primary-500"
                              placeholder="Scene title"
                            />
                          )}
                        </div>
                      </div>

                      {/* Scene Text */}
                      {!isEditing ? (
                        <div className="text-base text-neutral-200 leading-relaxed whitespace-pre-wrap">
                          {scene.text}
                        </div>
                      ) : (
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          rows={10}
                          className="w-full text-base"
                          placeholder="Scene text"
                        />
                      )}

                      {/* Essence Word */}
                      {!isEditing && scene.essence_word && (
                        <div className="flex items-center gap-2 pt-2 border-t border-accent-purple/20">
                          <span className="text-sm text-neutral-400">Essence:</span>
                          <Badge variant="neutral" className="bg-accent-purple/20 text-accent-purple text-sm">
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
                              <Check className="w-4 h-4 mr-2" />
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditScene(scene)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => initiateDeleteScene(scene)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
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
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
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

            {/* Info Card */}
            <Card className="p-6 border-2 border-primary-500/30 bg-primary-500/5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-2">
                    Scene Selection
                  </h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    You have <strong className="text-primary-500">{scenes.length} scenes</strong> and <strong className="text-primary-500">{selectedCount} selected</strong> to use in your vision. 
                    Edit, regenerate individual scenes, or discard ones that don't match your vibe. Each scene is 140-220 words with Micro-Macro breathing.
                  </p>
                </div>
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

