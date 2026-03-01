'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Container, Stack, PageHero, CategoryGrid, IconList, InsufficientTokensDialog } from '@/lib/design-system/components'
import { ProfileStateCard } from '@/lib/design-system/profile-cards'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, ArrowLeft, ArrowRight, ChevronDown, User, Lightbulb, Wand2, RefreshCw } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory, getCategoryStateField, getCategoryStoryField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'

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
  const [profileData, setProfileData] = useState<{
    story: string
    hasStory: boolean
    state: string
    hasStateData: boolean
  } | null>(null)
  
  // Imagination state
  const [freeFlowText, setFreeFlowText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenErrorInfo, setTokenErrorInfo] = useState<{ tokensRemaining?: number }>({})
  
  // Track completion across all categories for the grid
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)

  const DRAFT_STORAGE_KEY = `life-vision-new-draft-${categoryKey}`

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

  // Persist draft to localStorage (debounced) so refresh or tab recovery doesn't lose content
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!freeFlowText.trim()) return
    draftTimeoutRef.current = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(DRAFT_STORAGE_KEY, freeFlowText)
        }
      } catch (_) { /* ignore */ }
    }, 800)
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current)
    }
  }, [freeFlowText, categoryKey])

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

      // Load existing ideal_state from vision_new_category_state table
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
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

      // Restore unsaved draft from localStorage if present (e.g. after refresh or tab recovery)
      try {
        const draft = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_STORAGE_KEY) : null
        if (draft && draft.trim().length > 0) {
          setFreeFlowText(draft)
          setRestoredDraft(true)
          // Keep draft in localStorage until they successfully save (cleared in handleSaveAndContinue)
        }
      } catch (_) { /* ignore */ }
      
      // Load completion status for all categories for the grid
      const { data: allCategoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, ideal_state')
        .eq('user_id', user.id)
      
      const completed = allCategoryStates
        ?.filter(state => state.ideal_state && state.ideal_state.trim().length > 0)
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

      // Stream the response into the textarea
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setFreeFlowText(fullText)
        }
      }

      // Final cleanup of any remaining buffer
      const finalChunk = decoder.decode()
      if (finalChunk) {
        fullText += finalChunk
        setFreeFlowText(fullText)
      }

    } catch (err) {
      console.error('Error generating starter:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate starter text')
    } finally {
      setIsGeneratingStarter(false)
    }
  }

  const handleSaveAndContinue = async () => {
    if (!freeFlowText.trim()) {
      setError('Please describe your ideal state before continuing')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database - save both ideal_state and state from profile (for assembly compatibility)
      const stateField = getCategoryStateField(categoryKey)
      const stateValue = fullProfile?.[stateField] || ''
      
      const { error: updateError } = await supabase
        .from('vision_new_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          ideal_state: freeFlowText.trim(),
          clarity_keys: stateValue ? [stateValue] : [],
          contrast_flips: []
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      // Clear draft from localStorage after successful save
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch (_) { /* ignore */ }

      // Navigate to next category or assembly
      if (nextCategory) {
        router.push(`/life-vision/new/category/${nextCategory.key}`)
      } else {
        router.push('/life-vision/new/assembly')
      }
    } catch (err) {
      console.error('Error saving ideal state:', err)
      setError('Failed to save your vision. Try again or refresh and save again.')
    } finally {
      setIsSaving(false)
    }
  }

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
        {/* Page Hero with Category Navigation */}
        <PageHero
          eyebrow={`Category ${currentIndex + 1} of ${allCategories.length}`}
          title={category.label}
          subtitle={category.description}
        >
          {/* Category Grid */}
          <div className="mb-6">
            <CategoryGrid
              categories={categoriesWithout}
              selectedCategories={[categoryKey]}
              completedCategories={completedCategoryKeys}
              onCategoryClick={(key: string) => router.push(`/life-vision/new/category/${key}`)}
              mode="completion"
              layout="12-column"
              withCard={true}
              className="!bg-black/40 backdrop-blur-sm"
            />
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

        {/* Inspiration Questions */}
        {inspirationQuestions.length > 0 && (
          <Card variant="elevated" className="p-6">
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
        <Card variant="elevated" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <label className="block">
              <span className="text-lg font-semibold text-white mb-2 block">
                Your Dream Life in {category.label}
              </span>
              <span className="text-sm text-neutral-400 block">
                Write freely about your ideal state. No structure required—just let it flow!
              </span>
            </label>
            
            {/* VIVA Starter / Regenerate Button */}
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
              ) : freeFlowText.trim().length >= 50 || completedCategoryKeys.includes(categoryKey) ? (
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
          
          {/* Streaming indicator */}
          {isGeneratingStarter && (
            <div className="mb-3 p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/30">
              <p className="text-sm text-secondary-400 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                VIVA is creating a draft based on your profile... Feel free to edit as it appears!
              </p>
            </div>
          )}
          
          <RecordingTextarea
            value={freeFlowText}
            onChange={(value) => setFreeFlowText(value)}
            placeholder={`Describe your dream ${category.label.toLowerCase()} life...\n\nWhat does it look like? How does it feel? What are you doing? Who are you with?`}
            className="min-h-[300px] w-full"
            rows={12}
          />
          <p className="text-xs text-neutral-500 mt-2">
            {freeFlowText.trim().split(/\s+/).filter(Boolean).length} words
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
            disabled={!freeFlowText.trim() || isSaving}
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
    </Container>
  )
}
