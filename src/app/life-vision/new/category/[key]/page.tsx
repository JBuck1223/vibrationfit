'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Container, Stack, PageHero, CategoryGrid, IconList, InsufficientTokensDialog, VIVALoadingOverlay } from '@/lib/design-system/components'
import { ProfileStateCard } from '@/lib/design-system/profile-cards'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, ArrowLeft, ArrowRight, ChevronDown, User, Lightbulb, Wand2, RefreshCw, Trash2, CheckCircle } from 'lucide-react'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS, getVisionCategory, getCategoryStateField, getCategoryStoryField, visionToRecordingKey, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import { Modal } from '@/lib/design-system/components/overlays'

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as LifeCategoryKey
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showContextCard, setShowContextCard] = useState(false)
  const [showInspirationQuestions, setShowInspirationQuestions] = useState(false)
  const [profileData, setProfileData] = useState<{
    story: string
    hasStory: boolean
    state: string
    hasStateData: boolean
  } | null>(null)
  
  // Get Me Started + Imagination state
  const [getMeStartedText, setGetMeStartedText] = useState('')
  const [imaginationText, setImaginationText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenErrorInfo, setTokenErrorInfo] = useState<{ tokensRemaining?: number }>({})
  
  // Track completion across all categories for the grid
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [showAllReadyModal, setShowAllReadyModal] = useState(false)

  const DRAFT_STARTER_KEY = `life-vision-new-starter-${categoryKey}`
  const DRAFT_IMAGINATION_KEY = `life-vision-new-imagination-${categoryKey}`

  const category = getVisionCategory(categoryKey)
  if (!category) {
    return <div>Invalid category</div>
  }

  // Get all categories excluding forward and conclusion
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null

  // Categories without forward and conclusion for the grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )

  useEffect(() => {
    loadExistingData()
  }, [categoryKey])

  // Persist drafts to localStorage (debounced) so refresh or tab recovery doesn't lose content
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!getMeStartedText.trim() && !imaginationText.trim()) return
    draftTimeoutRef.current = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          if (getMeStartedText.trim()) window.localStorage.setItem(DRAFT_STARTER_KEY, getMeStartedText)
          if (imaginationText.trim()) window.localStorage.setItem(DRAFT_IMAGINATION_KEY, imaginationText)
        }
      } catch (_) { /* ignore */ }
    }, 800)
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current)
    }
  }, [getMeStartedText, imaginationText, categoryKey])

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Get active profile (or latest if no active)
      const { data: activeProfile } = await supabase
        .from('user_profiles')
        .select('id, *')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single()

      const { data: fallbackProfile } = activeProfile 
        ? { data: null }
        : await supabase
          .from('user_profiles')
          .select('id, *')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

      const profile = activeProfile || fallbackProfile
      setFullProfile(profile)

      // Set profile data for display
      const storyField = getCategoryStoryField(categoryKey)
      const profileStory = profile?.[storyField] || ''

      // Load state profile field for this category
      const stateField = getCategoryStateField(categoryKey)
      const stateValue = profile?.[stateField] || ''

      setProfileData({
        story: profileStory,
        hasStory: profileStory.trim().length > 0,
        state: stateValue,
        hasStateData: !!stateValue
      })

      // Get filtered questions for inspiration
      const filteredQuestions = getFilteredQuestionsForCategory(categoryKey, profile || {})
      setInspirationQuestions(filteredQuestions.map(q => q.text))

      // Load existing data from vision_new_category_state table
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('get_me_started_text, imagination_text')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (categoryState?.get_me_started_text) {
        setGetMeStartedText(categoryState.get_me_started_text)
      }
      if (categoryState?.imagination_text) {
        setImaginationText(categoryState.imagination_text)
      }

      // Restore unsaved drafts from localStorage if present (e.g. after refresh or tab recovery)
      try {
        const starterDraft = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_STARTER_KEY) : null
        const imaginationDraft = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_IMAGINATION_KEY) : null
        if (starterDraft && starterDraft.trim().length > 0) {
          setGetMeStartedText(starterDraft)
          setRestoredDraft(true)
        }
        if (imaginationDraft && imaginationDraft.trim().length > 0) {
          setImaginationText(imaginationDraft)
          setRestoredDraft(true)
        }
      } catch (_) { /* ignore */ }
      
      // Load completion status for all categories for the grid
      const { data: allCategoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, get_me_started_text, imagination_text')
        .eq('user_id', user.id)
      
      const completed = allCategoryStates
        ?.filter(state => 
          (state.get_me_started_text && state.get_me_started_text.trim().length > 0) ||
          (state.imagination_text && state.imagination_text.trim().length > 0)
        )
        .map(state => state.category) || []
      
      setCompletedCategoryKeys(completed)

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }

  const handleGetMeStarted = async () => {
    setIsGeneratingStarter(true)
    setGetMeStartedText('')
    setError(null)
    
    try {
      const response = await fetch('/api/viva/imagination-starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryKey,
          perspective: 'singular'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 402) {
          setTokenErrorInfo({ tokensRemaining: errorData.tokensRemaining })
          setShowInsufficientTokens(true)
          return
        }
        
        throw new Error(errorData.error || `Failed to generate starter (${response.status})`)
      }

      // Stream the response into the Get Me Started textarea
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setGetMeStartedText(fullText)
        }
      }

      // Final cleanup of any remaining buffer
      const finalChunk = decoder.decode()
      if (finalChunk) {
        fullText += finalChunk
        setGetMeStartedText(fullText)
      }

    } catch (err) {
      console.error('Error generating starter:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate starter text')
    } finally {
      setIsGeneratingStarter(false)
    }
  }

  const handleSaveAndContinue = async () => {
    if (!getMeStartedText.trim() && !imaginationText.trim()) {
      setError('Please use Get Me Started or write your imagination before continuing')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database - both fields + clarity_keys from profile
      const stateField = getCategoryStateField(categoryKey)
      const stateValue = fullProfile?.[stateField] || ''
      
      const { error: updateError } = await supabase
        .from('vision_new_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          get_me_started_text: getMeStartedText.trim() || null,
          imagination_text: imaginationText.trim() || null,
          clarity_keys: stateValue ? [stateValue] : [],
          category_vision_text: null,
          source_profile_id: fullProfile?.id || null,
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      // Clear drafts from localStorage after successful save
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(DRAFT_STARTER_KEY)
          window.localStorage.removeItem(DRAFT_IMAGINATION_KEY)
        }
      } catch (_) { /* ignore */ }

      // Update local completion state with this category
      const updatedCompleted = completedCategoryKeys.includes(categoryKey)
        ? completedCategoryKeys
        : [...completedCategoryKeys, categoryKey]
      setCompletedCategoryKeys(updatedCompleted)

      // Check if all 12 life categories are now complete
      const allReady = LIFE_CATEGORY_KEYS.every(key => updatedCompleted.includes(key))

      if (allReady && !completedCategoryKeys.includes(categoryKey)) {
        // This save just completed all 12 — show the modal
        setShowAllReadyModal(true)
      } else if (nextCategory) {
        router.push(`/life-vision/new/category/${nextCategory.key}`)
      }
    } catch (err) {
      console.error('Error saving ideal state:', err)
      setError('Failed to save your vision. Try again or refresh and save again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Clear the saved data for this category
      await supabase
        .from('vision_new_category_state')
        .delete()
        .eq('user_id', user.id)
        .eq('category', categoryKey)

      // Clear localStorage drafts
      try {
        window.localStorage.removeItem(DRAFT_STARTER_KEY)
        window.localStorage.removeItem(DRAFT_IMAGINATION_KEY)
      } catch (_) { /* ignore */ }

      // Reset local state
      setGetMeStartedText('')
      setImaginationText('')
      setRestoredDraft(false)
      setCompletedCategoryKeys(prev => prev.filter(k => k !== categoryKey))
    } catch (err) {
      console.error('Error clearing category:', err)
      setError('Failed to clear category data')
    }
  }

  const allCategoriesReady = LIFE_CATEGORY_KEYS.every(key => completedCategoryKeys.includes(key))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Ready to Assemble Banner */}
        {allCategoriesReady && !showAllReadyModal && (
          <button
            onClick={() => router.push('/life-vision/new/assembly')}
            className="w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-primary-500/15 border border-primary-500/40 hover:bg-primary-500/25 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-primary-400">
                All 12 categories are ready. Create your vision now.
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-primary-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Page Hero with Category Navigation */}
        <PageHero
          eyebrow={`Category ${currentIndex + 1} of ${allCategories.length}`}
          title={category.label}
          subtitle={category.description}
        >
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
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => nextCategory && router.push(`/life-vision/new/category/${nextCategory.key}`)}
              disabled={!nextCategory}
              className="flex-1"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </PageHero>

        {/* Categories bar - full width under hero */}
        <CategoryGrid
          categories={categoriesWithout}
          selectedCategories={[categoryKey]}
          completedCategories={completedCategoryKeys}
          onCategoryClick={(key: string) => router.push(`/life-vision/new/category/${key}`)}
          mode="completion"
          layout="12-column"
          withCard={true}
          className="!bg-black/40 backdrop-blur-sm w-full"
        />

        {/* Context Card - Profile Details + Current State */}
        {(profileData || fullProfile) && (
          <Card className="border-2 border-neutral-700 bg-neutral-800/30">
            <button
              onClick={() => setShowContextCard(!showContextCard)}
              className={`w-full flex items-center justify-between gap-3 ${showContextCard ? 'pb-4 border-b border-neutral-700' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-white">Your {category.label} Context</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Profile data used to generate your starter</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                  showContextCard ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showContextCard && (
              <div className="pt-6 space-y-6">
                {/* Profile Details Toggle */}
                {fullProfile && (
                  <Card className="border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5 overflow-visible">
                    <button
                      onClick={() => setShowProfileDetails(!showProfileDetails)}
                      className={`w-full flex items-center justify-between gap-3 ${showProfileDetails ? 'pb-4 border-b border-[#00FFFF]/20' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#00FFFF]" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-[#00FFFF]">{category.label} Profile</h3>
                          <p className="text-xs text-neutral-400 mt-0.5">Your {category.label.toLowerCase()} information</p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-[#00FFFF] transition-transform duration-300 ${
                          showProfileDetails ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {showProfileDetails && (
                      <div className="pt-4 space-y-4 max-h-[600px] overflow-y-auto">
                        {/* Category-Specific Profile Story */}
                        {profileData?.hasStory && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[#00FFFF] uppercase tracking-wide">Your {category.label} Story</h4>
                            <div className="bg-black/30 rounded-lg p-4 border border-[#00FFFF]/10">
                              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                {profileData.story}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Category-Specific Structured Fields */}
                        {(() => {
                          const categoryFields: Record<string, { label: string; value: any; format?: (v: any) => string | null }[]> = {
                            fun: [
                              { label: 'Hobbies', value: fullProfile?.hobbies, format: (v) => Array.isArray(v) ? v.join(', ') : v },
                              { label: 'Leisure Time Weekly', value: fullProfile?.leisure_time_weekly }
                            ],
                            health: [
                              { label: 'Exercise Frequency', value: fullProfile?.exercise_frequency },
                              { label: 'Height', value: fullProfile?.height, format: (v) => v ? `${v} ${fullProfile?.units === 'Metric' ? 'cm' : 'in'}` : null },
                              { label: 'Weight', value: fullProfile?.weight, format: (v) => v ? `${v} ${fullProfile?.units === 'Metric' ? 'kg' : 'lbs'}` : null },
                              { label: 'Health Conditions', value: fullProfile?.health_conditions },
                              { label: 'Medications', value: fullProfile?.medications }
                            ],
                            travel: [
                              { label: 'Travel Frequency', value: fullProfile?.travel_frequency },
                              { label: 'Has Passport', value: fullProfile?.passport, format: (v) => v === true ? 'Yes' : v === false ? 'No' : null },
                              { label: 'Countries Visited', value: fullProfile?.countries_visited }
                            ],
                            love: [
                              { label: 'Relationship Status', value: fullProfile?.relationship_status },
                              { label: 'Relationship Length', value: fullProfile?.relationship_length },
                              { label: 'Partner Name', value: fullProfile?.partner_name }
                            ],
                            family: [
                              { label: 'Has Children', value: fullProfile?.has_children, format: (v) => v === true ? 'Yes' : v === false ? 'No' : null },
                              { label: 'Number of Children', value: fullProfile?.number_of_children },
                              { label: 'Children Ages', value: fullProfile?.children_ages, format: (v) => Array.isArray(v) ? v.join(', ') : v }
                            ],
                            social: [
                              { label: 'Close Friends Count', value: fullProfile?.close_friends_count },
                              { label: 'Social Preference', value: fullProfile?.social_preference }
                            ],
                            home: [
                              { label: 'Living Situation', value: fullProfile?.living_situation },
                              { label: 'Time at Location', value: fullProfile?.time_at_location },
                              { label: 'City', value: fullProfile?.city },
                              { label: 'State', value: fullProfile?.state },
                              { label: 'Country', value: fullProfile?.country }
                            ],
                            work: [
                              { label: 'Employment Type', value: fullProfile?.employment_type },
                              { label: 'Occupation', value: fullProfile?.occupation },
                              { label: 'Company', value: fullProfile?.company },
                              { label: 'Time in Role', value: fullProfile?.time_in_role }
                            ],
                            money: [
                              { label: 'Household Income', value: fullProfile?.household_income },
                              { label: 'Savings/Retirement', value: fullProfile?.savings_retirement },
                              { label: 'Assets/Equity', value: fullProfile?.assets_equity },
                              { label: 'Consumer Debt', value: fullProfile?.consumer_debt }
                            ],
                            stuff: [
                              { label: 'Lifestyle Category', value: fullProfile?.lifestyle_category }
                            ],
                            giving: [
                              { label: 'Volunteer Status', value: fullProfile?.volunteer_status },
                              { label: 'Charitable Giving', value: fullProfile?.charitable_giving },
                              { label: 'Legacy Mindset', value: fullProfile?.legacy_mindset, format: (v) => v === true ? 'Yes' : v === false ? 'No' : null }
                            ],
                            spirituality: [
                              { label: 'Spiritual Practice', value: fullProfile?.spiritual_practice },
                              { label: 'Meditation Frequency', value: fullProfile?.meditation_frequency },
                              { label: 'Personal Growth Focus', value: fullProfile?.personal_growth_focus, format: (v) => v === true ? 'Yes' : v === false ? 'No' : null }
                            ]
                          }

                          const fields = categoryFields[categoryKey] || []
                          const validFields = fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '' && (!Array.isArray(f.value) || f.value.length > 0))

                          if (validFields.length > 0) {
                            return (
                              <div className="space-y-3 pt-3">
                                <h4 className="text-sm font-semibold text-[#00FFFF] uppercase tracking-wide">{category.label} Details</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {validFields.map((field, idx) => {
                                    const displayValue = field.format 
                                      ? field.format(field.value)
                                      : field.value
                                    
                                    if (!displayValue) return null

                                    return (
                                      <div key={idx} className={field.label === 'Health Conditions' || field.label === 'Medications' || field.label === 'Partner Name' || field.label === 'Children Ages' ? 'col-span-2' : ''}>
                                        <span className="text-neutral-400">{field.label}:</span>
                                        <p className="text-white font-medium">{displayValue}</p>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}
                  </Card>
                )}

                {/* Current State Card */}
                {profileData && (
                  <ProfileStateCard
                    stateText={profileData.state}
                    categoryLabel={category.label}
                  />
                )}
              </div>
            )}
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}

        {/* Restored draft notice */}
        {restoredDraft && (
          <Card className="bg-primary-500/10 border border-primary-500/30 p-4">
            <p className="text-sm text-primary-400">
              Unsaved content was restored. Click Save and Continue to keep it.
            </p>
          </Card>
        )}

        {/* Inspiration Questions (toggle) */}
        {inspirationQuestions.length > 0 && (
          <Card variant="elevated">
            <button
              onClick={() => setShowInspirationQuestions(!showInspirationQuestions)}
              className={`w-full flex items-center justify-between gap-3 ${showInspirationQuestions ? 'pb-4 border-b border-neutral-700' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white">Questions to Inspire You</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Tap to explore prompts for your imagination</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                  showInspirationQuestions ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showInspirationQuestions && (
              <div className="pt-4">
                <p className="text-sm text-neutral-400 mb-4">
                  Use these as inspiration, but feel free to write about anything that excites you!
                </p>
                <IconList items={inspirationQuestions} />
              </div>
            )}
          </Card>
        )}

        {/* Section 1: Get Me Started */}
        <Card variant="elevated" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <label className="block">
              <span className="text-lg font-semibold text-white mb-2 block">
                Get Me Started
              </span>
              <span className="text-sm text-neutral-400 block">
                VIVA builds a starting point from your profile. Edit freely to make it yours.
              </span>
            </label>
            
            <Button
              variant="accent"
              size="sm"
              onClick={handleGetMeStarted}
              disabled={isGeneratingStarter}
              className="flex-shrink-0 whitespace-nowrap"
            >
              {isGeneratingStarter ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : getMeStartedText.trim().length >= 50 || completedCategoryKeys.includes(categoryKey) ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Get Me Started
                </>
              )}
            </Button>
          </div>
          
          {/* Clear & Start Over for completed categories */}
          {completedCategoryKeys.includes(categoryKey) && !isGeneratingStarter && (
            <div className="flex justify-end mb-3">
              <button
                onClick={handleClearCategory}
                className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear & Start Over
              </button>
            </div>
          )}

          <div className="relative">
            <VIVALoadingOverlay
              isVisible={isGeneratingStarter && !getMeStartedText.trim()}
              messages={[
                `VIVA is reading your ${category.label.toLowerCase()} profile...`,
                'Activating your vision language...',
                'Building your starting point...',
              ]}
              cycleDuration={3000}
              showProgressBar={false}
              size="sm"
              className="rounded-xl"
            />
            <RecordingTextarea
              value={getMeStartedText}
              onChange={(value) => setGetMeStartedText(value)}
              placeholder={`Press "Get Me Started" and VIVA will create a starting point from your ${category.label.toLowerCase()} profile data...`}
              className="min-h-[200px] w-full"
              rows={8}
              storageFolder="lifeVision"
              recordingPurpose="quick"
              category={visionToRecordingKey(categoryKey)}
              instanceId="get-me-started"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            {getMeStartedText.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </Card>

        {/* Section 2: Imagination */}
        <Card variant="elevated" className="p-6 border-2 border-accent-500/20">
          <label className="block mb-4">
            <span className="text-lg font-semibold text-white mb-2 block">
              Unleash Your Imagination
            </span>
            <span className="text-sm text-neutral-400 block">
              Dream bigger. What does your absolute dream {category.label.toLowerCase()} life look like? Go beyond what exists today.
            </span>
          </label>
          
          <RecordingTextarea
            value={imaginationText}
            onChange={(value) => setImaginationText(value)}
            placeholder={`Let your imagination run wild...\n\nIf there were no limits, what would your ${category.label.toLowerCase()} life look like? What experiences, feelings, and realities would you create?`}
            className="min-h-[250px] w-full"
            rows={10}
            storageFolder="lifeVision"
            recordingPurpose="quick"
            category={visionToRecordingKey(categoryKey)}
            instanceId="imagination"
          />
          <p className="text-xs text-neutral-500 mt-2">
            {imaginationText.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </Card>

        {/* Save and Continue */}
        <Card variant="elevated" className="p-6" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="lg"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSaveAndContinue()
            }}
            disabled={(!getMeStartedText.trim() && !imaginationText.trim()) || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                Save and Continue
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </>
            )}
          </Button>
        </Card>
      </Stack>

      {/* Insufficient Tokens Dialog */}
      <InsufficientTokensDialog
        isOpen={showInsufficientTokens}
        onClose={() => setShowInsufficientTokens(false)}
        tokensRemaining={tokenErrorInfo.tokensRemaining}
        actionName="Get Me Started"
      />

      {/* All Categories Ready Modal */}
      <Modal
        isOpen={showAllReadyModal}
        onClose={() => setShowAllReadyModal(false)}
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center space-y-6 py-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center ring-4 ring-primary-500/10">
              <CheckCircle className="w-10 h-10 text-primary-500" />
            </div>
          </div>

          <div className="inline-block px-4 py-1 rounded-full bg-primary-500/20 border border-primary-500/40">
            <span className="text-sm font-semibold text-primary-400">
              12 of 12 Categories Complete
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            All Categories Are Ready to Assemble!
          </h2>

          <p className="text-neutral-300 text-sm">
            You can now combine all 12 categories into your unified Life Vision.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/life-vision/new/assembly')}
              className="w-full"
            >
              Go to Assembly
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllReadyModal(false)}
              className="w-full"
            >
              Stay Here
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
