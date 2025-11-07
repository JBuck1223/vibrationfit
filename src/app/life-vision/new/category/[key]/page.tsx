'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge, AutoResizeTextarea, Text } from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight, ChevronDown, User, TrendingUp, RefreshCw, Mic, AlertCircle, Loader2, Video } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { deleteSavedRecording, getRecordingsForCategory, loadSavedRecording, saveRecordingChunks } from '@/lib/storage/indexed-db-recording'

interface VIVAActionCardProps {
  stage: string
  className?: string
}

function VIVAActionCard({ stage, message, className = '' }: VIVAActionCardProps & { message?: string }) {
  const stageData: Record<string, { title: string; defaultDescription: string; icon: typeof Sparkles }> = {
    'evaluating': {
      title: 'Evaluating your input',
      defaultDescription: 'Understanding your vision...',
      icon: Sparkles
    },
    'profile': {
      title: 'Compiling profile information',
      defaultDescription: 'Gathering your background context...',
      icon: Sparkles
    },
    'assessment': {
      title: 'Compiling assessment data',
      defaultDescription: 'Analyzing your alignment insights...',
      icon: Sparkles
    },
    'reasoning': {
      title: 'Reasoning and synthesizing',
      defaultDescription: 'Weaving together your complete picture...',
      icon: Sparkles
    },
    'creating': {
      title: 'Creating your summary',
      defaultDescription: 'Crafting your personalized vision...',
      icon: Sparkles
    }
  }

  const data = stageData[stage] || stageData.evaluating
  const Icon = data.icon
  const description = message || data.defaultDescription

  return (
    <Card className={`${className} border-2 border-primary-500/50 bg-primary-500/10`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{data.title}</h3>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [currentClarity, setCurrentClarity] = useState('')
  const [clarityFromContrast, setClarityFromContrast] = useState('')
  const [contrastFromProfile, setContrastFromProfile] = useState('')
  const [showContrastToggle, setShowContrastToggle] = useState(false)
  const [isFlippingContrast, setIsFlippingContrast] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [editingSummary, setEditingSummary] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaMessage, setVivaMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [fullAssessment, setFullAssessment] = useState<any>(null)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false)
  const [profileData, setProfileData] = useState<{
    story: string
    hasStory: boolean
  } | null>(null)
  const [assessmentData, setAssessmentData] = useState<{
    score?: number
    responses: any[]
    hasData: boolean
  } | null>(null)
  const [savedRecordings, setSavedRecordings] = useState<any[]>([])
  const [transcribingRecordingId, setTranscribingRecordingId] = useState<string | null>(null)

  // Map category keys to profile clarity/contrast fields
  const categoryFieldMap: Record<string, { clarity: string; contrast: string }> = {
    fun: { clarity: 'clarity_fun', contrast: 'contrast_fun' },
    health: { clarity: 'clarity_health', contrast: 'contrast_health' },
    travel: { clarity: 'clarity_travel', contrast: 'contrast_travel' },
    love: { clarity: 'clarity_love', contrast: 'contrast_love' },
    family: { clarity: 'clarity_family', contrast: 'contrast_family' },
    social: { clarity: 'clarity_social', contrast: 'contrast_social' },
    home: { clarity: 'clarity_home', contrast: 'contrast_home' },
    work: { clarity: 'clarity_work', contrast: 'contrast_work' },
    money: { clarity: 'clarity_money', contrast: 'contrast_money' },
    stuff: { clarity: 'clarity_stuff', contrast: 'contrast_stuff' },
    giving: { clarity: 'clarity_giving', contrast: 'contrast_giving' },
    spirituality: { clarity: 'clarity_spirituality', contrast: 'contrast_spirituality' }
  }

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

  // Initialize editedSummary when aiSummary changes
  useEffect(() => {
    if (aiSummary && !editingSummary) {
      setEditedSummary(aiSummary)
    }
  }, [aiSummary])

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

      // Get latest assessment
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('id, *, assessment_responses(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setFullAssessment(assessment)

      // Set profile and assessment data for display
      const categoryStories: Record<string, string> = {
        fun: 'fun_story',
        health: 'health_story',
        travel: 'travel_story',
        love: 'love_story',
        family: 'family_story',
        social: 'social_story',
        home: 'home_story',
        work: 'work_story',
        money: 'money_story',
        stuff: 'stuff_story',
        giving: 'giving_story',
        spirituality: 'spirituality_story'
      }
      const storyField = categoryStories[categoryKey]
      const profileStory = profile?.[storyField] || ''
      const categoryScoreRaw = assessment?.category_scores?.[categoryKey]
      const categoryScore = categoryScoreRaw !== undefined && categoryScoreRaw !== null 
        ? Math.round((categoryScoreRaw / 35) * 100) 
        : undefined
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []

      setProfileData({
        story: profileStory,
        hasStory: profileStory.trim().length > 0
      })

      setAssessmentData({
        score: categoryScore,
        responses: categoryResponses,
        hasData: categoryScore !== undefined || categoryResponses.length > 0
      })

      // Load clarity and contrast fields for this category
      const fields = categoryFieldMap[categoryKey]
      if (fields && profile) {
        const clarityValue = profile[fields.clarity] || ''
        const contrastValue = profile[fields.contrast] || ''
        
        setCurrentClarity(clarityValue)
        setContrastFromProfile(contrastValue)

        // Auto-flip contrast if it exists
        if (contrastValue.trim().length > 0) {
          await flipContrastToClarity(contrastValue)
        }
      }

      // Check for existing summary in refinements table
      const { data: refinements } = await supabase
        .from('refinements')
        .select('ai_summary')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (refinements?.ai_summary) {
        setAiSummary(refinements.ai_summary)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const flipContrastToClarity = async (contrastText: string) => {
    if (!contrastText.trim()) return

    setIsFlippingContrast(true)
    try {
      const response = await fetch('/api/viva/flip-frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text',
          input: contrastText,
          save_to_db: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        setClarityFromContrast(data.clarity_seed || '')
      } else {
        console.error('Failed to flip contrast')
      }
    } catch (err) {
      console.error('Error flipping contrast:', err)
    } finally {
      setIsFlippingContrast(false)
    }
  }


  const handleProcessWithVIVA = async () => {
    // Merge Current Clarity + Clarity from Contrast
    if (!currentClarity.trim() && !clarityFromContrast.trim()) {
      setError('Please provide at least one clarity text to merge')
      return
    }

    setIsProcessing(true)
    setVivaStage('creating')
    setVivaMessage('Merging your clarity statements...')
    setError(null)

    try {
      const response = await fetch('/api/viva/merge-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentClarity: currentClarity.trim(),
          clarityFromContrast: clarityFromContrast.trim(),
          category: categoryKey,
          categoryName: category.label
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to merge clarity')
      }

      const data = await response.json()
      
      if (data.mergedClarity) {
        // Save to database
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase
            .from('refinements')
            .select('id')
            .eq('category', categoryKey)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (existing?.id) {
            await supabase
              .from('refinements')
              .update({
                ai_summary: data.mergedClarity
              })
              .eq('id', existing.id)
          } else {
            await supabase.from('refinements').insert({
              user_id: user.id,
              category: categoryKey,
              ai_summary: data.mergedClarity
            })
          }
        }

        setAiSummary(data.mergedClarity)
        setVivaStage('')
        setVivaMessage('')
      }
    } catch (err) {
      console.error('Error processing with VIVA:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge clarity')
      setVivaStage('')
      setVivaMessage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRegenerate = async () => {
    await handleProcessWithVIVA()
  }

  const handleEditSummary = () => {
    setEditedSummary(aiSummary)
    setEditingSummary(true)
  }

  const handleSaveEditedSummary = async () => {
    setAiSummary(editedSummary)
    setEditingSummary(false)
    
    // Save edited summary to database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase
        .from('refinements')
        .select('id')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        await supabase
          .from('refinements')
          .update({ ai_summary: editedSummary })
          .eq('id', existing.id)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingSummary(false)
    setEditedSummary(aiSummary)
  }

  const handleSaveAndContinue = async () => {
    // Summary is already saved, just continue
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
    }
  }

  const handleContinue = () => {
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
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
    <div className="relative">

      {/* Progress Indicator */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-400">
            Category {currentIndex + 1} of {allCategories.length}
          </span>
          <Badge variant="info">{Math.round(((currentIndex + 1) / allCategories.length) * 100)}%</Badge>
        </div>
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / allCategories.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          {prevCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/life-vision/new/category/${prevCategory.key}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-[#00FFFF]">
              <IconComponent className="w-8 h-8 text-[#00FFFF]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{category.label}</h1>
              <p className="text-neutral-400">{category.description}</p>
            </div>
          </div>
          {nextCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/life-vision/new/category/${nextCategory.key}`)}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Profile & Assessment Data Display - Side-by-side Toggle Dropdowns */}
      {!aiSummary && (fullProfile || fullAssessment) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Profile Details Toggle */}
          {fullProfile && (
            <Card className="border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5 overflow-visible">
              <button
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                className="w-full flex items-center justify-between gap-3 pb-4 border-b border-[#00FFFF]/20"
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
                        { label: 'Lifestyle Category', value: fullProfile?.lifestyle_category },
                        { label: 'Primary Vehicle', value: fullProfile?.primary_vehicle }
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
                        <div className="space-y-3 pt-3 border-t border-[#00FFFF]/10">
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
                className="w-full flex items-center justify-between gap-3 pb-4 border-b border-[#14B8A6]/20"
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
                    <div className="space-y-4 pt-3 border-t border-[#14B8A6]/10">
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

      {/* Let's Get Clear - Three Card-Based Text Blocks */}
      {!aiSummary && (
        <div className="mb-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#00FFFF]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-semibold text-[#00FFFF] mb-2">Let's Get Clear...</h3>
            </div>
          </div>

          {/* Current Clarity Card */}
          <Card className="border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#00FFFF]" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Current Clarity</h4>
                  <p className="text-sm text-neutral-400">From your profile</p>
                </div>
              </div>
              <AutoResizeTextarea
                value={currentClarity}
                onChange={(value) => setCurrentClarity(value)}
                placeholder={`Your current clarity about ${category.label.toLowerCase()} from your profile...`}
                className="w-full bg-neutral-800/50 border-2 border-[#00FFFF]/30 text-white placeholder-neutral-500"
                minHeight={120}
              />
            </div>
          </Card>

          {/* Clarity from Contrast Card */}
          <Card className="border-2 border-[#39FF14]/30 bg-[#39FF14]/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Clarity from Contrast</h4>
                    <p className="text-sm text-neutral-400">Auto-generated from contrast</p>
                  </div>
                </div>
                {isFlippingContrast && (
                  <Spinner size="sm" variant="primary" />
                )}
              </div>
              <AutoResizeTextarea
                value={clarityFromContrast}
                onChange={(value) => setClarityFromContrast(value)}
                placeholder="This will be auto-generated from your contrast text below..."
                className="w-full bg-neutral-800/50 border-2 border-[#39FF14]/30 text-white placeholder-neutral-500"
                minHeight={120}
                disabled={isFlippingContrast}
              />
            </div>
          </Card>

          {/* Contrast from Profile Card (Toggleable) */}
          <Card className="border-2 border-[#FFB701]/30 bg-[#FFB701]/5">
            <div className="space-y-4">
              <button
                onClick={() => setShowContrastToggle(!showContrastToggle)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFB701]/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#FFB701]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Contrast from Profile</h4>
                    <p className="text-sm text-neutral-400">Used to create frequency flip above</p>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-white transition-transform duration-300 ${
                    showContrastToggle ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showContrastToggle && (
                <AutoResizeTextarea
                  value={contrastFromProfile}
                  onChange={(value) => {
                    setContrastFromProfile(value)
                    // Auto-flip when contrast changes
                    if (value.trim().length > 0) {
                      flipContrastToClarity(value)
                    }
                  }}
                  placeholder={`Your contrast text about ${category.label.toLowerCase()} from your profile...`}
                  className="w-full bg-neutral-800/50 border-2 border-[#FFB701]/30 text-white placeholder-neutral-500"
                  minHeight={120}
                />
              )}
            </div>
          </Card>

          {/* Process with VIVA Button */}
          {(currentClarity.trim() || clarityFromContrast.trim()) && (
            <Card className="border-2 border-primary-500/30 bg-primary-500/5">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleProcessWithVIVA}
                disabled={isProcessing}
                loading={isProcessing}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Process with VIVA
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && !aiSummary && (
        <Card className="mb-8 border-2 border-[#D03739]/30 bg-[#D03739]/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D03739] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#D03739] mb-1">Error</h3>
              <Text size="sm" className="text-neutral-300">{error}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* VIVA Processing State */}
      {isProcessing && vivaStage && (
        <VIVAActionCard stage={vivaStage} message={vivaMessage} className="mb-8" />
      )}

      {/* AI Summary Display */}
      {aiSummary && !isProcessing && (
        <Card className="mb-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Your {category.label} Summary</h3>
                <p className="text-sm text-neutral-400">Crafted by VIVA in your voice</p>
              </div>
            </div>

            {editingSummary ? (
              <div className="space-y-4 mb-6">
                <AutoResizeTextarea
                  value={editedSummary}
                  onChange={(value) => setEditedSummary(value)}
                  minHeight={200}
                  className="w-full bg-neutral-800 border-2 border-neutral-700 text-white"
                />
                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSaveEditedSummary}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="prose prose-invert max-w-none mb-6">
                  <div className="bg-neutral-800 rounded-lg p-6">
                    <AutoResizeTextarea
                      value={aiSummary}
                      onChange={(value) => setAiSummary(value)}
                      minHeight={200}
                      className="w-full bg-transparent border-none text-neutral-200 resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isProcessing}
                    className="w-full md:w-auto md:flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveAndContinue}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Save and Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-8 border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </Card>
      )}
    </div>
  )
}
