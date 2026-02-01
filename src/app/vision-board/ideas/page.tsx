'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Spinner,
  Badge,
  CategoryGrid,
  VIVALoadingOverlay,
} from '@/lib/design-system/components'
import { Sparkles, Plus, Lightbulb, Check, RefreshCw } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface VisionSuggestion {
  category: string
  categoryLabel: string
  suggestions: {
    name: string
    description: string
    wasAdded?: boolean // Track if this specific suggestion was added to board
  }[]
  generatedAt?: string
  ideaId?: string
  itemsCreated?: number // Total items created from this idea generation
  createdItemIds?: string[] // IDs of created items
}

export default function VisionBoardIdeasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visionSuggestions, setVisionSuggestions] = useState<VisionSuggestion[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [addingToBoard, setAddingToBoard] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  
  // Category selection for generation
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [existingCategorySuggestions, setExistingCategorySuggestions] = useState<Set<string>>(new Set())
  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  useEffect(() => {
    loadExistingSuggestions()
  }, [])

  const loadExistingSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch existing active suggestions
      const { data: existingIdeas, error: fetchError } = await supabase
        .from('vision_board_ideas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('generated_at', { ascending: false })

      if (fetchError) {
        console.error('Error loading existing suggestions:', fetchError)
      }

      if (existingIdeas && existingIdeas.length > 0) {
        // Fetch created items to check which suggestions were already added
        const { data: createdItems } = await supabase
          .from('vision_board_items')
          .select('id, name, description')
          .eq('user_id', user.id)

        // Convert DB format to component format
        const suggestions: VisionSuggestion[] = []
        const categoriesWithSuggestions = new Set<string>()
        const categoryMap = new Map<string, VisionSuggestion>() // Track latest per category

        existingIdeas.forEach((idea) => {
          const createdIds = idea.created_item_ids || []
          const itemsCreated = idea.items_created || 0

          if (idea.category === 'all') {
            // Full generation - parse all categories from suggestions
            const suggestionsArray = idea.suggestions as any[]
            suggestionsArray.forEach((catSuggestion: any) => {
              const categoryKey = catSuggestion.category
              const existing = categoryMap.get(categoryKey)
              
              // Only keep this if it's newer than existing, or if no existing
              if (!existing || new Date(idea.generated_at) > new Date(existing.generatedAt || '')) {
                // Mark suggestions that were already added
                const enhancedSuggestions = catSuggestion.suggestions.map((sugg: any) => ({
                  ...sugg,
                  wasAdded: createdItems?.some(item => 
                    item.name === sugg.name && item.description === sugg.description
                  ) || false
                }))

                categoryMap.set(categoryKey, {
                  category: catSuggestion.category,
                  categoryLabel: catSuggestion.categoryLabel,
                  suggestions: enhancedSuggestions || [],
                  generatedAt: idea.generated_at,
                  ideaId: idea.id,
                  itemsCreated,
                  createdItemIds: createdIds,
                })
              }
              categoriesWithSuggestions.add(categoryKey)
            })
          } else {
            // Single or multi-category generation (not 'all')
            // The suggestions array has the same nested structure as 'all'
            const suggestionsArray = idea.suggestions as any[]
            suggestionsArray.forEach((catSuggestion: any) => {
              const categoryKey = catSuggestion.category
              const existing = categoryMap.get(categoryKey)
              
              // Only keep this if it's newer than existing, or if no existing
              if (!existing || new Date(idea.generated_at) > new Date(existing.generatedAt || '')) {
                // Mark suggestions that were already added
                const enhancedSuggestions = (catSuggestion.suggestions || []).map((sugg: any) => ({
                  ...sugg,
                  wasAdded: createdItems?.some(item => 
                    item.name === sugg.name && item.description === sugg.description
                  ) || false
                }))

                categoryMap.set(categoryKey, {
                  category: catSuggestion.category,
                  categoryLabel: catSuggestion.categoryLabel,
                  suggestions: enhancedSuggestions || [],
                  generatedAt: idea.generated_at,
                  ideaId: idea.id,
                  itemsCreated,
                  createdItemIds: createdIds,
                })
              }
              categoriesWithSuggestions.add(categoryKey)
            })
          }
        })

        // Convert map to array
        setVisionSuggestions(Array.from(categoryMap.values()))
        setExistingCategorySuggestions(categoriesWithSuggestions)
        setHasGenerated(true)
        
        // Auto-select categories that don't have suggestions yet (only on initial load)
        if (!hasAutoSelected) {
          const categoriesWithoutSuggestions = categoriesWithout
            .map(c => c.key)
            .filter(key => !categoriesWithSuggestions.has(key))
          
          if (categoriesWithoutSuggestions.length > 0) {
            setSelectedCategories(categoriesWithoutSuggestions)
          }
          setHasAutoSelected(true)
        }
      } else {
        // No suggestions exist at all - select all categories
        if (!hasAutoSelected) {
          setSelectedCategories(categoriesWithout.map(c => c.key))
          setHasAutoSelected(true)
        }
      }
    } catch (err) {
      console.error('Error loading suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const fetchVisionAndGenerateSuggestions = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category to generate ideas for')
      return
    }

    try {
      setLoading(true)
      setGenerating(true)
      setError(null)

      // Fetch active life vision directly from database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please log in to continue')
      }

      const { data: vision, error: visionError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('household_id', null)
        .single()

      if (visionError || !vision) {
        throw new Error('No active life vision found. Please create a vision first.')
      }

      // Generate suggestions using VIVA (with selected categories)
      const suggestionsResponse = await fetch('/api/vision-board/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visionId: vision.id,
          categories: selectedCategories,
        }),
      })

      if (!suggestionsResponse.ok) {
        const errorData = await suggestionsResponse.json().catch(() => ({ error: 'Failed to generate suggestions' }))
        throw new Error(errorData.error || 'Failed to generate suggestions')
      }

      const suggestionsData = await suggestionsResponse.json()
      console.log('✅ Suggestions received:', {
        success: suggestionsData.success,
        suggestionsCount: suggestionsData.suggestions?.length || 0,
        suggestions: suggestionsData.suggestions
      })
      
      // Merge with existing suggestions (replace categories that were regenerated)
      const newSuggestions = suggestionsData.suggestions || []
      const updatedSuggestions = [...visionSuggestions]
      
      newSuggestions.forEach((newSugg: VisionSuggestion) => {
        const existingIndex = updatedSuggestions.findIndex(s => s.category === newSugg.category)
        if (existingIndex >= 0) {
          // Replace existing
          updatedSuggestions[existingIndex] = newSugg
        } else {
          // Add new
          updatedSuggestions.push(newSugg)
        }
      })
      
      setVisionSuggestions(updatedSuggestions)
      
      // Update existing categories set
      const newCategoriesSet = new Set(existingCategorySuggestions)
      newSuggestions.forEach((s: VisionSuggestion) => newCategoriesSet.add(s.category))
      setExistingCategorySuggestions(newCategoriesSet)
      
      setHasGenerated(true)
      
      // Clear selection after generation
      setSelectedCategories([])
    } catch (err) {
      console.error('Error generating suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const handleCategoryToggle = (key: string) => {
    setSelectedCategories(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    setSelectedCategories(prev => 
      prev.length === categoriesWithout.length 
        ? [] 
        : categoriesWithout.map(c => c.key)
    )
  }

  const toggleSelection = (category: string, index: number, wasAdded: boolean = false) => {
    // Don't allow selecting items that were already added
    if (wasAdded) return

    const key = `${category}-${index}`
    const newSelected = new Set(selectedItems)
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedItems(newSelected)
  }

  const handleAddToBoard = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to add to your board')
      return
    }

    // Collect selected suggestions (skip already added items)
    const itemsToCreate: Array<{
      name: string
      description: string
      category: string
      categoryLabel: string
      ideaId?: string
    }> = []
    visionSuggestions.forEach((categoryData) => {
      categoryData.suggestions.forEach((suggestion, index) => {
        const key = `${categoryData.category}-${index}`
        // Only include if selected and not already added
        if (selectedItems.has(key) && !suggestion.wasAdded) {
          itemsToCreate.push({
            name: suggestion.name,
            description: suggestion.description,
            category: categoryData.category,
            categoryLabel: categoryData.categoryLabel,
            ideaId: categoryData.ideaId, // Track which idea generation this came from
          })
        }
      })
    })

    // Store in sessionStorage and navigate to queue
    sessionStorage.setItem('visionBoardQueue', JSON.stringify(itemsToCreate))
    router.push('/vision-board/queue')
  }

  const renderSuggestionsSection = () => (
    <>
      {/* Selection Counter and Add Button */}
      <Card className="p-4 sticky top-4 z-10 bg-[#1F1F1F]/95 backdrop-blur-sm border-primary-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-base px-4 py-2">
              {selectedItems.size} selected
            </Badge>
            <span className="text-sm text-neutral-400">
              Choose items to add to your vision board
            </span>
          </div>
          <Button
            onClick={handleAddToBoard}
            disabled={selectedItems.size === 0 || addingToBoard}
            variant="primary"
            className="gap-2"
          >
            {addingToBoard ? (
              <>
                <Spinner variant="primary" size="sm" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Board ({selectedItems.size})
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Suggestions by Category */}
      <Stack gap="lg">
        {visionSuggestions.map((categoryData) => (
          <Card key={categoryData.category} className="p-6">
            <Stack gap="md">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h3 className="text-xl font-semibold text-white">
                  {categoryData.categoryLabel}
                </h3>
                <Badge variant="info">
                  {categoryData.suggestions.length} ideas
                </Badge>
                {categoryData.itemsCreated !== undefined && categoryData.itemsCreated > 0 && (
                  <Badge variant="success">
                    {categoryData.itemsCreated} added to board
                  </Badge>
                )}
                {categoryData.generatedAt && (
                  <Badge variant="neutral" className="text-xs">
                    {new Date(categoryData.generatedAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <Stack gap="sm">
                {categoryData.suggestions.map((suggestion, index) => {
                  const key = `${categoryData.category}-${index}`
                  const isSelected = selectedItems.has(key)
                  const wasAdded = suggestion.wasAdded || false

                  return (
                    <div
                      key={key}
                      onClick={() => toggleSelection(categoryData.category, index, wasAdded)}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${wasAdded 
                          ? 'border-neutral-700 bg-neutral-800/30 opacity-60 cursor-not-allowed' 
                          : isSelected 
                            ? 'border-primary-500 bg-primary-500/10 cursor-pointer' 
                            : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50 cursor-pointer'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {wasAdded ? (
                          <div className="w-6 h-6 rounded-md border-2 border-primary-500 bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className={`
                            w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                            ${isSelected 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-neutral-600'
                            }
                          `}>
                            {isSelected && <Check className="w-4 h-4 text-black" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-base font-semibold text-white">
                              {suggestion.name}
                            </h4>
                            {wasAdded && (
                              <Badge variant="success" className="text-xs flex-shrink-0">
                                ✓ Added
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-300 leading-relaxed">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* Bottom Add Button */}
      <Card className="p-4 bg-[#1F1F1F]/95">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">
            {selectedItems.size} items selected
          </span>
          <Button
            onClick={handleAddToBoard}
            disabled={selectedItems.size === 0 || addingToBoard}
            variant="primary"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Board ({selectedItems.size})
          </Button>
        </div>
      </Card>
    </>
  )

  // Initial state - before generation or with existing suggestions
  if (!loading && !generating) {
    const categoriesWithoutSuggestions = categoriesWithout.filter(
      cat => !existingCategorySuggestions.has(cat.key)
    )

    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Vision Board Ideas"
            subtitle="Select life areas to generate VIVA-powered suggestions for"
          >
            {existingCategorySuggestions.size > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Check className="w-4 h-4 text-primary-500" />
                <span>{existingCategorySuggestions.size} categories have suggestions below</span>
              </div>
            )}
          </PageHero>
          
          <Card className="p-6">
            <Stack gap="md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Select Categories to Generate
                </h3>
                <div className="flex items-center gap-3">
                  {categoriesWithoutSuggestions.length > 0 && (
                    <Button
                      onClick={() => setSelectedCategories(categoriesWithoutSuggestions.map(c => c.key))}
                      variant="ghost"
                      size="sm"
                    >
                      Select New Only
                    </Button>
                  )}
                  <Badge variant="info" className="text-sm">
                    {selectedCategories.length} selected
                  </Badge>
                </div>
              </div>

              <CategoryGrid
                categories={categoriesWithout}
                selectedCategories={selectedCategories}
                onCategoryClick={handleCategoryToggle}
                mode="selection"
                showSelectAll
                onSelectAll={handleSelectAll}
                layout="12-column"
              />

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-4">
                <Button 
                  onClick={fetchVisionAndGenerateSuggestions} 
                  variant="primary"
                  size="lg"
                  className="gap-2"
                  disabled={selectedCategories.length === 0}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate New Ideas for {selectedCategories.length} {selectedCategories.length === 1 ? 'Category' : 'Categories'}
                </Button>
                {visionSuggestions.length > 0 && (
                  <Button 
                    onClick={() => {
                      // Scroll to suggestions
                      document.getElementById('suggestions')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    variant="outline"
                    size="lg"
                  >
                    View Existing Suggestions
                  </Button>
                )}
              </div>
            </Stack>
          </Card>

          {/* Show existing suggestions if any */}
          {visionSuggestions.length > 0 && (
            <>
              <div id="suggestions" className="scroll-mt-8" />
              {renderSuggestionsSection()}
            </>
          )}
        </Stack>
      </Container>
    )
  }

  // Loading state (initial load only, not generating)
  if (loading && !generating) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-400">Loading your vision...</p>
        </div>
      </Container>
    )
  }

  // Generating state - show beautiful overlay
  if (generating) {
    return (
      <Container size="xl">
        <div className="relative min-h-[70vh]">
          <VIVALoadingOverlay
            isVisible={true}
            messages={[
              "VIVA is analyzing your life vision...",
              "Finding inspiration from your dreams...",
              "Crafting personalized vision board ideas...",
              "Curating the perfect suggestions for you..."
            ]}
            cycleDuration={4000}
            estimatedTime={`Generating ideas for ${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'}`}
            estimatedDuration={selectedCategories.length * 8000}
            className="rounded-2xl"
          />
        </div>
      </Container>
    )
  }

  // Error state after generation attempt
  if (error && hasGenerated) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Vision Board Ideas"
            subtitle="Unable to generate suggestions"
          />
          
          <Card className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Unable to Generate Ideas</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={fetchVisionAndGenerateSuggestions} variant="primary">
                Try Again
              </Button>
              <Button onClick={() => router.push('/life-vision')} variant="outline">
                View Life Vision
              </Button>
              <Button onClick={() => router.push('/vision-board')} variant="ghost">
                Back to Vision Board
              </Button>
            </div>
          </Card>
        </Stack>
      </Container>
    )
  }

  // Fallback loading state
  return (
    <Container size="xl">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-400">Loading...</p>
      </div>
    </Container>
  )
}

