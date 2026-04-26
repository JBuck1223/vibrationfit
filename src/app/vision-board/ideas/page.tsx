'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  Spinner,
  Badge,
  FullBleed,
  VIVALoadingOverlay,
} from '@/lib/design-system/components'
import { Sparkles, Plus, Lightbulb, Check } from 'lucide-react'
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

function AppSectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="space-y-3 text-center">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2A2A2A]" />
        <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{title}</p>
        <div className="h-px flex-1 bg-[#2A2A2A]" />
      </div>
      {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
    </section>
  )
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
        
        // Auto-select all life categories on initial load
        if (!hasAutoSelected) {
          setSelectedCategories(categoriesWithout.map(c => c.key))
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
    setSelectedCategories(prev => {
      const isAllSelected = prev.length === categoriesWithout.length
      if (isAllSelected) {
        return [key]
      }
      return prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    })
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

  const handleAddToBoard = async () => {
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

    if (itemsToCreate.length === 0) {
      return
    }

    try {
      setAddingToBoard(true)
      const res = await fetch('/api/vision-board/queue/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToCreate }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create queue')
      }
      const batchId = data.batchId as string
      if (!batchId) {
        throw new Error('No batch id returned')
      }
      router.push(`/vision-board/queue/${encodeURIComponent(batchId)}`)
    } catch (e) {
      console.error('Add to board queue error:', e)
      alert(e instanceof Error ? e.message : 'Failed to add items to queue')
      setAddingToBoard(false)
    }
  }

  const renderSuggestionsSection = () => (
    <Stack gap="lg">
      {/* Selection Counter and Add Button */}
      <div className="hidden md:flex sticky top-4 z-10 justify-end">
        <Button
          onClick={handleAddToBoard}
          disabled={selectedItems.size === 0 || addingToBoard}
          variant="primary"
          className="gap-2 justify-center"
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

      {/* Suggestions by Category */}
      <Stack gap="lg">
        {visionSuggestions.map((categoryData) => (
          <Card key={categoryData.category}>
            <Stack gap="md">
              {(() => {
                const categoryMeta = categoriesWithout.find(c => c.key === categoryData.category)
                const CategoryIcon = categoryMeta?.icon
                return (
              <div className="w-full flex items-center justify-center gap-3 mb-1 flex-wrap text-center">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
                  {CategoryIcon ? (
                    <CategoryIcon className="w-3.5 h-3.5 text-neutral-200" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-neutral-200" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.25em]">
                  {categoryData.categoryLabel}
                </h3>
              </div>
                )
              })()}

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
                        p-3 md:p-3.5 rounded-xl border transition-all
                        ${wasAdded 
                          ? 'border-neutral-700 bg-neutral-800/30 opacity-60 cursor-not-allowed'
                          : isSelected 
                            ? 'border-primary-500 bg-primary-500/10 cursor-pointer'
                            : 'border-neutral-700/80 hover:border-neutral-500 bg-neutral-800/40 cursor-pointer'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2.5">
                        {wasAdded ? (
                          <div className="w-5 h-5 rounded-md border border-primary-500 bg-primary-500 flex items-center justify-center flex-shrink-0 -mt-0.5 md:mt-0">
                            <Check className="w-3.5 h-3.5 text-black" />
                          </div>
                        ) : (
                          <div className={`
                            w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 -mt-0.5 md:mt-0
                            ${isSelected 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-neutral-600'
                            }
                          `}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <h4 className="text-sm md:text-base font-semibold text-white leading-tight">
                              {suggestion.name}
                            </h4>
                            <Badge
                              variant="success"
                              className={`text-xs flex-shrink-0 inline-flex items-center gap-1 -mt-0.5 md:mt-0 ${wasAdded ? '' : 'invisible'}`}
                            >
                              <Check className="w-3 h-3" />
                              Added
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
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

      <div className="hidden md:flex justify-end">
        <Button
          onClick={handleAddToBoard}
          disabled={selectedItems.size === 0 || addingToBoard}
          variant="primary"
          className="gap-2 justify-center"
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

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
        <Button
          onClick={handleAddToBoard}
          disabled={selectedItems.size === 0 || addingToBoard}
          variant="primary"
          className="w-full justify-center gap-2 shadow-lg"
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
    </Stack>
  )

  // Add to Board - must run before the main `!loading && !generating` branch below
  if (addingToBoard) {
    return (
      <Container size="xl">
        <div className="relative min-h-[100dvh]">
          <VIVALoadingOverlay
            isVisible
            messages={[
              'Preparing your creation queue...',
              'Saving your picks to your account...',
              'Opening the queue...',
            ]}
            cycleDuration={3000}
            estimatedTime="This usually takes a few seconds. Large lists can take a bit longer."
            estimatedDuration={20000}
            className="rounded-2xl min-h-[100dvh] !absolute inset-0"
          />
        </div>
      </Container>
    )
  }

  // Initial state - before generation or with existing suggestions
  if (!loading && !generating) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <Card>
            <Stack gap="md">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Select life categories to generate VIVA-powered suggestions.
                </h3>
              </div>

              {/* Match Card p-4 md:p-6 lg:p-8 so life category pills sit flush on iPad (lg) */}
              <FullBleed className="md:-mx-6 lg:-mx-8">
                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-3 mb-1.5 lg:hidden px-4">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500">Tag life categories</p>
                    <span className="text-[10px] text-neutral-600">Scroll to see all &rarr;</span>
                  </div>
                  <div className="flex items-center gap-2 pb-1 px-4 md:px-0 max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:justify-start max-lg:scrollbar-hide lg:flex-wrap lg:justify-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={`
                        shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                        ${selectedCategories.length === categoriesWithout.length
                          ? 'bg-primary-500 text-black border-primary-500'
                          : 'bg-[#171717] text-neutral-400 border-[#2A2A2A] hover:text-neutral-200 hover:border-[#3A3A3A]'
                        }
                      `}
                    >
                      All
                    </button>
                    {categoriesWithout.map((category) => {
                      const CategoryIcon = category.icon
                      const isSelected = selectedCategories.includes(category.key)
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => handleCategoryToggle(category.key)}
                          className={`
                            shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                            ${isSelected
                              ? 'bg-primary-500 text-black border-primary-500'
                              : 'bg-[#171717] text-neutral-400 border-[#2A2A2A] hover:text-neutral-200 hover:border-[#3A3A3A]'
                            }
                          `}
                        >
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {category.label}
                        </button>
                      )
                    })}
                  </div>
                </section>
              </FullBleed>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button 
                  onClick={fetchVisionAndGenerateSuggestions} 
                  variant="accent"
                  size="md"
                  className="gap-2 justify-center"
                  disabled={selectedCategories.length === 0}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate New Ideas for {selectedCategories.length} {selectedCategories.length === 1 ? 'Category' : 'Categories'}
                </Button>
                {visionSuggestions.length > 0 && (
                  <Button 
                    onClick={() => {
                      document.getElementById('suggestions')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    variant="outline-purple"
                    size="md"
                    className="justify-center antialiased font-semibold"
                  >
                    View Existing Suggestions
                  </Button>
                )}
              </div>
            </Stack>
          </Card>

          {/* Show existing suggestions if any */}
          {visionSuggestions.length > 0 && (
            <div>
              <div id="suggestions" className="scroll-mt-8" />
              {renderSuggestionsSection()}
            </div>
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
          <AppSectionTitle
            title="Vision board ideas"
            subtitle="Unable to generate suggestions"
          />
          
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-8 text-center">
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

