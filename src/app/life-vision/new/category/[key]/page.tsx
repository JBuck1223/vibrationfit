'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge, AutoResizeTextarea, Text, Container, Stack, PageHero, CategoryGrid } from '@/lib/design-system/components'
import { ProfileClarityCard, ProfileContrastCard, ClarityFromContrastCard } from '@/lib/design-system/profile-cards'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight, ChevronDown, User, TrendingUp, RefreshCw, Mic, AlertCircle, Loader2, Video } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory, getCategoryFields, getCategoryStoryField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { deleteSavedRecording, getRecordingsForCategory, loadSavedRecording, saveRecordingChunks } from '@/lib/storage/indexed-db-recording'

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const categoryKey = params.key as LifeCategoryKey
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [currentClarity, setCurrentClarity] = useState('')
  const [clarityFromContrast, setClarityFromContrast] = useState('')
  const [contrastFromProfile, setContrastFromProfile] = useState('')
  const [showContrastToggle, setShowContrastToggle] = useState(false)
  const [isFlippingContrast, setIsFlippingContrast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [fullAssessment, setFullAssessment] = useState<any>(null)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false)
  const [showClarityCards, setShowClarityCards] = useState(true) // Control visibility of clarity/contrast cards section
  const [profileData, setProfileData] = useState<{
    story: string
    hasStory: boolean
    clarity: string
    contrast: string
    hasClarityData: boolean
    hasContrastData: boolean
  } | null>(null)
  const [assessmentData, setAssessmentData] = useState<{
    score?: number
    responses: any[]
    hasData: boolean
  } | null>(null)
  const [savedRecordings, setSavedRecordings] = useState<any[]>([])
  const [transcribingRecordingId, setTranscribingRecordingId] = useState<string | null>(null)
  
  // Track completion across all categories for the grid
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  
  // Track completion of individual steps (clarity, imagination)
  const [completedSteps, setCompletedSteps] = useState<{
    clarity: boolean
    imagination: boolean
  }>({
    clarity: false,
    imagination: false
  })

  // No longer needed - using getCategoryFields() from vision-categories

  const category = getVisionCategory(categoryKey)
  if (!category) {
    return <div>Invalid category</div>
  }

  const IconComponent = category.icon

  // Get all categories excluding forward and conclusion
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null

  useEffect(() => {
    loadExistingData()
  }, [categoryKey])

  // Auto-save clarity_keys and contrast_flips when they change
  useEffect(() => {
    const saveClarityAndContrast = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // clarity_keys: Only profile clarity (currentClarity)
      const clarityKeys: string[] = []
      if (currentClarity.trim()) {
        clarityKeys.push(currentClarity.trim())
      }

      // contrast_flips: Only flipped contrast (clarityFromContrast)
      const contrastFlips: string[] = []
      if (clarityFromContrast.trim()) {
        contrastFlips.push(clarityFromContrast.trim())
      }

      // Only save if we have data
      // Note: We do NOT save contrastFromProfile (raw profile contrast) to this table
      if (clarityKeys.length > 0 || contrastFlips.length > 0) {
        const { error } = await supabase
          .from('vision_new_category_state')
          .upsert({
            user_id: user.id,
            category: categoryKey,
            clarity_keys: clarityKeys,
            contrast_flips: contrastFlips
          }, {
            onConflict: 'user_id,category'
          })
        
        // Update completed steps state after successful save
        if (!error && clarityKeys.length > 0) {
          setCompletedSteps(prev => ({
            ...prev,
            clarity: true
          }))
        }
      }
    }

    // Debounce the save
    const timeoutId = setTimeout(saveClarityAndContrast, 1000)
    return () => clearTimeout(timeoutId)
  }, [currentClarity, clarityFromContrast, categoryKey])

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

      // Get active assessment
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('id, *, assessment_responses(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      setFullAssessment(assessment)

      // Set profile and assessment data for display
      const storyField = getCategoryStoryField(categoryKey)
      const profileStory = profile?.[storyField] || ''
      const categoryScoreRaw = assessment?.category_scores?.[categoryKey]
      const categoryScore = categoryScoreRaw !== undefined && categoryScoreRaw !== null 
        ? Math.round((categoryScoreRaw / 35) * 100) 
        : undefined
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []

      // Load clarity and contrast profile fields for this category
      const fields = getCategoryFields(categoryKey)
      const clarityValue = profile?.[fields.clarity] || ''
      const contrastValue = profile?.[fields.contrast] || ''

      setProfileData({
        story: profileStory,
        hasStory: profileStory.trim().length > 0,
        clarity: clarityValue,
        contrast: contrastValue,
        hasClarityData: !!clarityValue,
        hasContrastData: !!contrastValue
      })

      setAssessmentData({
        score: categoryScore,
        responses: categoryResponses,
        hasData: categoryScore !== undefined || categoryResponses.length > 0
      })

      // Check for existing data in vision_new_category_state table (all steps)
      const { data: categoryState } = await supabase
        .from('vision_new_category_state')
        .select('clarity_keys, contrast_flips, ideal_state, blueprint_data')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      // Load existing clarity_keys and contrast_flips
      let hasClarity = false
      if (categoryState?.clarity_keys && Array.isArray(categoryState.clarity_keys)) {
        const keys = categoryState.clarity_keys.filter((k: string) => k && k.trim())
        if (keys.length > 0) {
          // clarity_keys contains profile clarity - set to currentClarity
          setCurrentClarity(keys[0] || '')
          hasClarity = true
        }
      } else if (profile && clarityValue && clarityValue.trim()) {
        // No clarity_keys saved yet, but we have clarity from profile - save it
        const clarityKeys: string[] = [clarityValue.trim()]
        const { error: saveError } = await supabase
          .from('vision_new_category_state')
          .upsert({
            user_id: user.id,
            category: categoryKey,
            clarity_keys: clarityKeys
          }, {
            onConflict: 'user_id,category'
          })
        if (!saveError) {
          setCurrentClarity(clarityValue)
          hasClarity = true
        } else {
          console.error('Error saving profile clarity to category state:', saveError)
        }
      } else if (profile) {
        // No clarity_keys and no profile clarity - just set state
        setCurrentClarity('')
      }
      
      // Also check if we have profile clarity (currentClarity from profile) as a fallback
      // This ensures the step shows as complete even if database sync is delayed
      if (!hasClarity && clarityValue && clarityValue.trim()) {
        hasClarity = true
        setCurrentClarity(clarityValue)
      }

      // Load contrast_flips (flipped contrast) into clarityFromContrast
      if (categoryState?.contrast_flips && Array.isArray(categoryState.contrast_flips)) {
        const flips = categoryState.contrast_flips.filter((f: string) => f && f.trim())
        if (flips.length > 0) {
          setClarityFromContrast(flips.join('\n\n'))
        }
      }

      // Set contrast from profile for display only (not saved to category_state)
      if (profile) {
        setContrastFromProfile(contrastValue || '')
      }
      
      // Set step completion status based on actual data
      setCompletedSteps({
        clarity: hasClarity,
        imagination: !!(categoryState?.ideal_state && categoryState.ideal_state.trim().length > 0)
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

      // Load previously flipped contrast from frequency_flip table
      const { data: existingFlip } = await supabase
        .from('frequency_flip')
        .select('clarity_seed, input_text')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingFlip?.clarity_seed) {
        // Use existing flip from database
        console.log('[Exploration] Found existing frequency flip for', categoryKey)
        setClarityFromContrast(existingFlip.clarity_seed)
        // If we have the original contrast, set it too (for context)
        if (existingFlip.input_text && !contrastValue) {
          setContrastFromProfile(existingFlip.input_text)
          setShowContrastToggle(true)
        }
      }
      // NOTE: Removed automatic frequency flip - user must click button to initiate

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const flipContrastToClarity = async (contrastText: string) => {
    if (!contrastText?.trim()) return

    setIsFlippingContrast(true)
    try {
      const response = await fetch('/api/viva/flip-frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'flip',
          input: contrastText,
          category: categoryKey,
          save_to_db: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const claritySeed = data.items?.[0]?.clarity_seed || ''
        setClarityFromContrast(claritySeed)
      } else {
        console.error('Failed to flip contrast')
      }
    } catch (err) {
      console.error('Error flipping contrast:', err)
    } finally {
      setIsFlippingContrast(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  // Categories without forward and conclusion for the grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )

  // Define the 2 steps for each category
  const categorySteps = [
    { key: 'clarity', label: 'Clarity', path: `/life-vision/new/category/${categoryKey}` },
    { key: 'imagination', label: 'Imagination', path: `/life-vision/new/category/${categoryKey}/imagination` }
  ]

  // Determine current step based on URL
  const currentStepIndex = pathname?.includes('/imagination') ? 1 : 0

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero with Integrated Category Navigation */}
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
                    {/* Step Container */}
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
                      {/* Step Number & Check */}
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

                      {/* Step Label */}
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

      {/* Combined Context Card with Profile, Assessment, and Clarity/Contrast */}
      {(profileData || fullProfile || fullAssessment) && (
        <div>
          <Card className="border-2 border-neutral-700 bg-neutral-800/30">
            <button
              onClick={() => setShowClarityCards(!showClarityCards)}
              className={`w-full flex items-center justify-between gap-3 ${showClarityCards ? 'pb-4 border-b border-neutral-700' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-white">Your {category.label} Context</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">All source data used to build your summary</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                  showClarityCards ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showClarityCards && (
              <div className="pt-6 space-y-6">
                {/* Profile & Assessment Cards - Stack on mobile, side-by-side on desktop */}
                {(fullProfile || fullAssessment) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                <div className="pt-4 space-y-4 max-h-[600px] overflow-y-auto" style={{ display: 'block' }}>
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
                    // Map category to relevant profile fields
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
                                <div key={idx} className={field.label === 'Health Conditions' || field.label === 'Medications' || field.label === 'Partner Name' || field.label === 'Children Ages' || field.label === 'Location' ? 'col-span-2' : ''}>
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

          {/* Assessment Details Toggle */}
          {fullAssessment && (
            <Card className="border-2 border-[#14B8A6]/30 bg-[#14B8A6]/5 overflow-visible">
              <button
                onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}
                className={`w-full flex items-center justify-between gap-3 ${showAssessmentDetails ? 'pb-4 border-b border-[#14B8A6]/20' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#14B8A6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#14B8A6]" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-[#14B8A6]">{category.label} Assessment</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {assessmentData?.score !== undefined 
                        ? `${category.label} Score: ${assessmentData.score}%` 
                        : fullAssessment?.overall_percentage !== undefined
                        ? `Overall: ${fullAssessment.overall_percentage}%`
                        : 'Assessment data'}
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-[#14B8A6] transition-transform duration-300 ${
                    showAssessmentDetails ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {showAssessmentDetails && (
                <div className="pt-4 space-y-4 max-h-[600px] overflow-y-auto" style={{ display: 'block' }}>
                  {/* Category Score */}
                  {assessmentData?.score !== undefined && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-[#14B8A6] uppercase tracking-wide">{category.label} Score</h4>
                      <div className="bg-black/30 rounded-lg p-4 border border-[#14B8A6]/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-neutral-400">Category Score:</span>
                          <span className={`text-2xl font-bold ${
                            assessmentData.score >= 80 ? 'text-[#39FF14]' :
                            assessmentData.score >= 60 ? 'text-[#FFB701]' :
                            'text-[#D03739]'
                          }`}>
                            {assessmentData.score}%
                          </span>
                        </div>
                        {assessmentData.score >= 80 && (
                          <Badge variant="success" className="mt-2">Thriving</Badge>
                        )}
                        {assessmentData.score < 80 && assessmentData.score >= 60 && (
                          <Badge variant="info" className="mt-2">Moderate</Badge>
                        )}
                        {assessmentData.score < 60 && (
                          <Badge variant="warning" className="mt-2">Growth Area</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category-Specific Q&A */}
                  {assessmentData?.responses && assessmentData.responses.length > 0 && (
                    <div className="space-y-4 pt-3">
                      <h4 className="text-sm font-semibold text-[#14B8A6] uppercase tracking-wide">
                        {category.label} Questions & Answers ({assessmentData.responses.length})
                      </h4>
                      <div className="space-y-3">
                        {assessmentData.responses.map((r: any, idx: number) => (
                          <Card key={idx} variant="outlined" className="bg-black/30 border-[#14B8A6]/20">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-neutral-200 flex-1">
                                  {r.question_text}
                                </p>
                                <Badge 
                                  variant={
                                    (r.response_value || 0) >= 4 ? 'success' :
                                    (r.response_value || 0) >= 3 ? 'info' :
                                    (r.response_value || 0) >= 2 ? 'warning' : 'error'
                                  }
                                  className="flex-shrink-0"
                                >
                                  {r.response_value || 0}/5
                                </Badge>
                              </div>
                              <div className="pl-2 border-l-2 border-[#14B8A6]/30">
                                <p className="text-sm text-neutral-300 leading-relaxed">
                                  {r.response_text}
                                </p>
                                {r.green_line && (
                                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                                    r.green_line === 'above' 
                                      ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30' 
                                      : 'bg-[#FFB701]/20 text-[#FFB701] border border-[#FFB701]/30'
                                  }`}>
                                    {r.green_line === 'above' ? 'Above Green Line' : 'Below Green Line'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
                  </div>
                )}

                {/* Clarity, Contrast, and Clarity from Contrast Cards */}
                {profileData && (
                  <div className="space-y-4">
          
          {/* Clarity From Profile (Cyan) */}
          <ProfileClarityCard
            clarityText={profileData.clarity}
            categoryLabel={category.label}
          />
          
          {/* Contrast from Profile (Red) */}
          <ProfileContrastCard
            contrastText={profileData.contrast}
            categoryLabel={category.label}
          />
          
          {/* Clarity from Contrast (Purple) - Full Width */}
          <ClarityFromContrastCard
            clarityFromContrast={clarityFromContrast}
            categoryLabel={category.label}
            hasContrastData={profileData.hasContrastData}
            onGenerateClarity={() => flipContrastToClarity(profileData.contrast)}
            isGenerating={isFlippingContrast}
          />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Let's Get Clear - Three Card-Based Text Blocks */}

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-[#D03739]/30 bg-[#D03739]/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D03739] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#D03739] mb-1">Error</h3>
              <Text size="sm" className="text-neutral-300">{error}</Text>
            </div>
          </div>
        </Card>
      )}


      {/* Continue Button - Clarity step is complete when we have profile clarity */}
      {currentClarity && currentClarity.trim() && (
        <Card className="border-2 border-primary-500/30 bg-primary-500/5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Clarity Step Complete</h3>
                <p className="text-sm text-neutral-400">Your clarity keys have been saved. Continue to the next step.</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push(`/life-vision/new/category/${categoryKey}/imagination`)}
            >
              Save and Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Error Display */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
