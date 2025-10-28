'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge, AutoResizeTextarea, Text } from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight, ChevronDown, User, TrendingUp, RefreshCw } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { deleteSavedRecording, getRecordingsForCategory } from '@/lib/storage/indexed-db-recording'

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
  const [transcript, setTranscript] = useState('')
  const [content, setContent] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [editingSummary, setEditingSummary] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaMessage, setVivaMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [promptSuggestions, setPromptSuggestions] = useState<{
    peakExperiences: string
    whatFeelsAmazing: string
    whatFeelsBad: string
  } | null>(null)
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
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // VIVA prompt generation loading messages
  const promptLoadingMessages = [
    "VIVA is analyzing your profile...",
    "Understanding your assessment insights...",
    "Crafting personalized prompts for you...",
    "Weaving your unique story into guidance...",
    "Almost ready with powerful questions..."
  ]

  // Cycle through loading messages every 2.5 seconds
  useEffect(() => {
    if (loadingPrompts) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % promptLoadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    } else {
      // Reset to first message when loading stops
      setLoadingMessageIndex(0)
    }
  }, [loadingPrompts, promptLoadingMessages.length])

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

      // Check for existing transcript and summary in refinements table
      const { data: refinements } = await supabase
        .from('refinements')
        .select('*')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (refinements) {
        const savedTranscript = refinements.transcript || ''
        const savedSummary = refinements.ai_summary || ''
        
        // Populate both transcript and content with existing transcript
        setTranscript(savedTranscript)
        setContent(savedTranscript)
        setAiSummary(savedSummary)
      }

      // Load profile and assessment data for personalized prompts
      await loadPromptSuggestions(user.id)

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const loadPromptSuggestions = async (userId: string) => {
    try {
      // Map category keys to profile story fields
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
      
      // Get active profile (or latest if no active)
      const { data: activeProfile } = await supabase
        .from('user_profiles')
        .select('id, *')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single()

      const { data: fallbackProfile } = activeProfile 
        ? { data: null }
        : await supabase
          .from('user_profiles')
          .select('id, *')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

      const profile = activeProfile || fallbackProfile
      const profileId = profile?.id || null

      // Store full profile for detailed display
      setFullProfile(profile)

      // Get latest assessment
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('id, *, assessment_responses(*)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      const assessmentId = assessment?.id || null
      
      // Store full assessment for detailed display
      setFullAssessment(assessment)

      const profileStory = profile?.[storyField] || ''
      // category_scores stores raw points (0-35: 5 points each x 7 questions), convert to percentage
      const categoryScoreRaw = assessment?.category_scores?.[categoryKey]
      const categoryScore = categoryScoreRaw !== undefined && categoryScoreRaw !== null 
        ? Math.round((categoryScoreRaw / 35) * 100) 
        : undefined
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []

      // Store data for display
      setProfileData({
        story: profileStory,
        hasStory: profileStory.trim().length > 0
      })

      setAssessmentData({
        score: categoryScore,
        responses: categoryResponses,
        hasData: categoryScore !== undefined || categoryResponses.length > 0
      })

      // Check for cached prompts first
      // Build query with proper NULL handling
      let cacheQuery = supabase
        .from('prompt_suggestions_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('category_key', categoryKey)

      if (profileId) {
        cacheQuery = cacheQuery.eq('profile_id', profileId)
      } else {
        cacheQuery = cacheQuery.is('profile_id', null)
      }

      if (assessmentId) {
        cacheQuery = cacheQuery.eq('assessment_id', assessmentId)
      } else {
        cacheQuery = cacheQuery.is('assessment_id', null)
      }

      const { data: cached } = await cacheQuery.single()

      if (cached?.suggestions) {
        // Use cached prompts
        setPromptSuggestions(cached.suggestions as {
          peakExperiences: string
          whatFeelsAmazing: string
          whatFeelsBad: string
        })
        setLoadingPrompts(false)
        return
      }

      // If we have any data, generate AI prompts with ALL profile and assessment data
      if (profileStory.trim().length > 10 || categoryScore !== undefined || categoryResponses.length > 0 || profile || assessment) {
        setLoadingPrompts(true)
        try {
          const response = await fetch('/api/viva/prompt-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryKey,
              categoryLabel: category.label,
              profileData: profile || null,
              assessmentData: {
                categoryScore,
                overallScore: assessment?.overall_percentage,
                greenLineStatus: assessment?.green_line_status,
                allCategoryScores: assessment?.category_scores || {},
                responses: categoryResponses
              }
            })
          })

          if (response.ok) {
            const aiSuggestions = await response.json()
            setPromptSuggestions(aiSuggestions)

            // Cache the prompts with profile_id and assessment_id
            try {
              // First, try to find existing cache entry
              let query = supabase
                .from('prompt_suggestions_cache')
                .select('id')
                .eq('user_id', userId)
                .eq('category_key', categoryKey)

              if (profileId) {
                query = query.eq('profile_id', profileId)
              } else {
                query = query.is('profile_id', null)
              }

              if (assessmentId) {
                query = query.eq('assessment_id', assessmentId)
              } else {
                query = query.is('assessment_id', null)
              }

              const { data: existing } = await query.maybeSingle()

              const cacheData = {
                user_id: userId,
                category_key: categoryKey,
                profile_id: profileId || null,
                assessment_id: assessmentId || null,
                suggestions: aiSuggestions,
                updated_at: new Date().toISOString()
              }

              if (existing?.id) {
                // Update existing
                const { error: updateError } = await supabase
                  .from('prompt_suggestions_cache')
                  .update({
                    suggestions: aiSuggestions,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existing.id)

                if (updateError) {
                  console.error('Error updating cached prompts:', updateError)
                }
              } else {
                // Insert new
                const { error: insertError } = await supabase
                  .from('prompt_suggestions_cache')
                  .insert(cacheData)

                if (insertError) {
                  console.error('Error inserting cached prompts:', insertError)
                }
              }
            } catch (cacheErr) {
              // Non-critical error - log but don't fail
              console.error('Error caching prompts:', cacheErr)
            }
          } else {
            // Fallback to basic prompts
            const fallbackPrompts = generatePromptSuggestions(categoryKey, category.label, profile, assessment)
            setPromptSuggestions(fallbackPrompts)
          }
        } catch (err) {
          console.error('Error generating AI prompts:', err)
          // Fallback to basic prompts
          const fallbackPrompts = generatePromptSuggestions(categoryKey, category.label, profile, assessment)
          setPromptSuggestions(fallbackPrompts)
        } finally {
          setLoadingPrompts(false)
        }
      } else {
        // No data, use default prompts
        setPromptSuggestions(generatePromptSuggestions(categoryKey, category.label, profile, assessment))
      }
    } catch (err) {
      console.error('Error loading prompt suggestions:', err)
      // Non-critical, continue without personalized prompts
      setLoadingPrompts(false)
    }
  }

  const generatePromptSuggestions = (
    categoryKey: string,
    categoryLabel: string,
    profile: any,
    assessment: any
  ): { peakExperiences: string; whatFeelsAmazing: string; whatFeelsBad: string } => {
    // Map category keys to profile story fields
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
    
    // Get category-specific assessment responses
    const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []
    // category_scores stores raw points (0-35: 5 points each x 7 questions), convert to percentage
    const categoryScoreRaw = assessment?.category_scores?.[categoryKey]
    const categoryScore = categoryScoreRaw !== undefined && categoryScoreRaw !== null 
      ? Math.round((categoryScoreRaw / 35) * 100) 
      : undefined
    
    // Build context string for peak experiences
    let peakContext = ''
    if (profileStory && profileStory.trim().length > 30) {
      // Extract a meaningful snippet from their profile story (first sentence or ~100 chars)
      const firstSentence = profileStory.split(/[.!?]\s+/)[0].trim()
      const snippet = firstSentence.length > 120 
        ? firstSentence.substring(0, 120).trim() + '...'
        : firstSentence
      
      // Use a more natural reference
      peakContext = `I can see from your profile that ${snippet.toLowerCase()}. Based on this, `
    } else if (categoryScore !== undefined) {
      if (categoryScore >= 80) {
        peakContext = `I can see from your assessment that you're thriving in ${categoryLabel.toLowerCase()} with a ${categoryScore}% score. `
      } else if (categoryScore >= 60) {
        peakContext = `Based on your assessment, you have moderate alignment in ${categoryLabel.toLowerCase()} (${categoryScore}% score). `
      }
    }
    
    // Build context for what feels amazing
    let amazingContext = ''
    if (categoryResponses.length > 0) {
      const highScoringResponses = categoryResponses.filter((r: any) => (r.response_value || 0) >= 4)
      if (highScoringResponses.length > 0) {
        amazingContext = 'Based on your current situation, '
      }
    }
    if (categoryScore !== undefined && categoryScore >= 70) {
      amazingContext = 'Based on your current situation, you\'re in a strong position. '
    }
    
    // Build context for what feels bad
    let badContext = ''
    if (categoryResponses.length > 0) {
      const lowScoringResponses = categoryResponses.filter((r: any) => (r.response_value || 0) <= 2)
      if (lowScoringResponses.length > 0) {
        badContext = 'Based on your current situation, '
      }
    }
    if (categoryScore !== undefined && categoryScore < 60) {
      badContext = 'Based on your current situation, '
    }

    return {
      peakExperiences: peakContext 
        ? `${peakContext}Let's think about some peak experiences that you've had around ${categoryLabel.toLowerCase()}. Describe one or more experiences that you would deem to have been peak moments in your life.`
        : `I can see from your profile in ${categoryLabel.toLowerCase()} that you... Let's think about some peak experiences that you've had around this. Describe one or more experiences that you would deem to have been peak moments in your life.`,
      whatFeelsAmazing: amazingContext
        ? `${amazingContext}What feels like it's going really well right now? If you have any clarity on what you do want in this area, let it fly!`
        : `Based on your current situation, what feels like it's going really well right now? If you have any clarity on what you do want in this area, let it fly!`,
      whatFeelsBad: badContext
        ? `${badContext}What feels off right now? Anything frustrating? What's not working? Don't hold back—vent it out!`
        : `Based on your current situation, what feels off right now? Anything frustrating? What's not working? Don't hold back—vent it out!`
    }
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    console.log('🎯 Category page: handleRecordingSaved called', { url, transcriptLength: transcript.length, type, updatedTextLength: updatedText.length })
    setTranscript(transcript)
    setContent(updatedText)
    console.log('✅ Category page: State updated with transcript and content')

    // Auto-save transcript to refinements table when recording is saved
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        // Check if refinement already exists
        const { data: existing } = await supabase
          .from('refinements')
          .select('id')
          .eq('category', categoryKey)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing?.id) {
          // Update existing refinement with new transcript
          await supabase
            .from('refinements')
            .update({
              transcript: updatedText // Use updatedText which includes transcript
            })
            .eq('id', existing.id)
          console.log('✅ Auto-saved transcript to existing refinement')
        } else {
          // Create new refinement with transcript
          await supabase.from('refinements').insert({
            user_id: user.id,
            category: categoryKey,
            transcript: updatedText
          })
          console.log('✅ Auto-saved transcript to new refinement')
        }
      } catch (error) {
        console.error('Failed to auto-save transcript:', error)
        // Non-critical, continue even if save fails
      }
    }

    // Clear any saved recordings from IndexedDB for this category (successful upload means we don't need backups)
    try {
      const savedRecordings = await getRecordingsForCategory(categoryKey)
      for (const recording of savedRecordings) {
        await deleteSavedRecording(recording.id)
      }
      console.log('✅ Cleared IndexedDB backups after successful upload')
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
      // Non-critical, don't fail the save
    }
  }

  const handleProcessWithVIVA = async () => {
    // Use content if it exists (contains transcript + any manual edits), otherwise use transcript
    // Content will have the full text including any edits the user made
    const textToProcess = content.trim() || transcript.trim()
    if (!textToProcess) return

    setIsProcessing(true)
    setVivaStage('evaluating')
    setVivaMessage('')
    setError(null)

    try {
      const response = await fetch('/api/viva/category-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          transcript: textToProcess,
          categoryName: category.label
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('No response stream available')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
            continue // Skip empty lines or lines that don't start with 'data: '
          }

          try {
            // Extract JSON after 'data: '
            const jsonStr = trimmedLine.slice(6).trim()
            if (!jsonStr) continue // Skip if no JSON data
            
            const data = JSON.parse(jsonStr)
            
            if (data.type === 'progress') {
              setVivaStage(data.stage)
              setVivaMessage(data.message)
            } else if (data.type === 'complete') {
              if (data.summary) {
                // Only save to database when user explicitly clicks "Process with VIVA"
                // Don't auto-save on text changes - wait for explicit button click
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  // Update existing refinement or create new one
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
                        transcript: textToProcess,
                        ai_summary: data.summary
                      })
                      .eq('id', existing.id)
                  } else {
                    await supabase.from('refinements').insert({
                      user_id: user.id,
                      category: categoryKey,
                      transcript: textToProcess,
                      ai_summary: data.summary
                    })
                  }
                }
                // Set summary first, then clear processing state to avoid blank screen
                setAiSummary(data.summary)
                setVivaStage('')
                setVivaMessage('')
                setIsProcessing(false)
              }
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (parseError) {
            console.error('Error parsing stream data:', parseError, 'Line:', trimmedLine)
            // Continue processing other lines even if one fails
          }
        }
      }
    } catch (err) {
      console.error('Error processing with VIVA:', err)
      setError(err instanceof Error ? err.message : 'Failed to process')
      setVivaStage('')
      setVivaMessage('')
      setIsProcessing(false)
    }
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
    setEditedSummary('')
  }

  const handleAddToTranscript = () => {
    // Add the summary to the original transcript so user can add more
    // Use transcript as base since that's what was originally processed
    const originalTranscript = transcript.trim() || content.trim()
    const newContent = originalTranscript 
      ? `${originalTranscript}\n\n--- Additional Reflection ---\n\n${aiSummary}`
      : aiSummary
    setContent(newContent)
    setTranscript('') // Clear transcript so it doesn't conflict
    setAiSummary('') // Clear summary to return to input mode
    setEditingSummary(false) // Make sure we're not in edit mode
    setEditedSummary('')
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
      {/* VIVA Prompt Loading Overlay */}
      {loadingPrompts && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="text-center space-y-6 max-w-md px-4">
            {/* VIVA Logo Spinner */}
            <div className="flex justify-center">
              <Spinner size="lg" variant="branded" />
            </div>
            
            {/* Animated Loading Message */}
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-white text-center break-words hyphens-auto">
                {promptLoadingMessages[loadingMessageIndex]}
              </h3>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="w-full mx-auto">
              <div className="bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-sm text-neutral-400">
              Generating personalized prompts based on your data...
            </p>
          </div>
        </div>
      )}

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

      {/* Prompt Guidance Card */}
      {!aiSummary && (
        <Card className="mb-6 border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#00FFFF]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-[#00FFFF] mb-2">Let's Get Clear...</h3>
                <p className="text-sm md:text-base text-neutral-400 leading-relaxed">
                  Explore peak experiences, what feels amazing, and what feels off. Contrast creates clarity!
                </p>
              </div>
            </div>

            {promptSuggestions && (
              <>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#00FFFF]/10">
                  <Text size="sm" className="text-neutral-300 flex-1">
                    These prompts were custom generated for you based on your profile and assessment data by VIVA.
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      // Clear cache and regenerate prompts
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return

                      // Delete cached prompts for this category
                      const profile = fullProfile
                      const assessment = fullAssessment
                      const profileId = profile?.id || null
                      const assessmentId = assessment?.id || null

                      // Build query to find and delete cache entry
                      let deleteQuery = supabase
                        .from('prompt_suggestions_cache')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('category_key', categoryKey)

                      if (profileId) {
                        deleteQuery = deleteQuery.eq('profile_id', profileId)
                      } else {
                        deleteQuery = deleteQuery.is('profile_id', null)
                      }

                      if (assessmentId) {
                        deleteQuery = deleteQuery.eq('assessment_id', assessmentId)
                      } else {
                        deleteQuery = deleteQuery.is('assessment_id', null)
                      }

                      await deleteQuery

                      // Regenerate prompts
                      setLoadingPrompts(true)
                      try {
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

                        const response = await fetch('/api/viva/prompt-suggestions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            categoryKey,
                            categoryLabel: category.label,
                            profileData: profile || null,
                            assessmentData: {
                              categoryScore,
                              overallScore: assessment?.overall_percentage,
                              greenLineStatus: assessment?.green_line_status,
                              allCategoryScores: assessment?.category_scores || {},
                              responses: categoryResponses
                            }
                          })
                        })

                        if (response.ok) {
                          const aiSuggestions = await response.json()
                          setPromptSuggestions(aiSuggestions)
                          
                          // Update cache with new prompts
                          try {
                            const { data: existingCache } = await supabase
                              .from('prompt_suggestions_cache')
                              .select('id')
                              .eq('user_id', user.id)
                              .eq('category_key', categoryKey)
                              .maybeSingle()

                            const cacheData = {
                              user_id: user.id,
                              category_key: categoryKey,
                              profile_id: profileId,
                              assessment_id: assessmentId,
                              suggestions: aiSuggestions,
                              updated_at: new Date().toISOString()
                            }

                            if (existingCache) {
                              await supabase
                                .from('prompt_suggestions_cache')
                                .update(cacheData)
                                .eq('id', existingCache.id)
                            } else {
                              await supabase
                                .from('prompt_suggestions_cache')
                                .insert(cacheData)
                            }
                          } catch (cacheError) {
                            console.error('Error caching prompts:', cacheError)
                          }
                        }
                      } catch (err) {
                        console.error('Error regenerating prompts:', err)
                      } finally {
                        setLoadingPrompts(false)
                      }
                    }}
                    disabled={loadingPrompts}
                    className="flex-shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`} />
                    Regenerate Prompts
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Peak Experiences */}
                <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg p-4">
                  <h4 className="text-sm md:text-base font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                    Peak Experiences
                  </h4>
                  <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                    {promptSuggestions?.peakExperiences || `Let's think about some peak experiences that you've had around ${category.label.toLowerCase()}. Describe one or more experiences that you would deem to have been peak moments in your life.`}
                  </p>
                </div>

                {/* What Feels Amazing */}
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-4">
                  <h4 className="text-sm md:text-base font-semibold text-[#39FF14] mb-2 uppercase tracking-wide">
                    What Feels Amazing
                  </h4>
                  <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                    {promptSuggestions?.whatFeelsAmazing || `Based on your current situation, what feels like it's going really well right now? If you have any clarity on what you do want in this area, let it fly!`}
                  </p>
                </div>

                {/* What Feels Bad or Missing */}
                <div className="bg-[#FFB701]/10 border border-[#FFB701]/30 rounded-lg p-4">
                  <h4 className="text-sm md:text-base font-semibold text-[#FFB701] mb-2 uppercase tracking-wide">
                    What Feels Off Or Missing
                  </h4>
                  <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                    {promptSuggestions?.whatFeelsBad || `Based on your current situation, what feels off right now? Anything frustrating? What's not working? Don't hold back—vent it out!`}
                  </p>
                </div>
              </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Recording/Input Card */}
      {!aiSummary && (
        <Card className="mb-8">
          <div>
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Share your vision for {category.label.toLowerCase()}
              </h2>
              <p className="text-neutral-400 text-sm">
                Speak naturally about what you envision in this area of your life. 
                Your authentic voice will be captured and transformed into a resonant summary by VIVA.
              </p>
            </div>

            <RecordingTextarea
              value={content}
              onChange={(value) => setContent(value)}
              rows={10}
              placeholder="Write about your vision or click the microphone/video icon to record!"
              allowVideo={true}
              storageFolder="lifeVision"
              category={categoryKey}
              onRecordingSaved={handleRecordingSaved}
              transcriptOnly={true}
            />

            {/* Submit Button - Shows when there's content */}
            {(content.trim() || transcript.trim()) && !isProcessing && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleProcessWithVIVA}
                  disabled={!content.trim() && !transcript.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process with VIVA
                </Button>
              </div>
            )}
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
                  className="w-full"
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
                    <div 
                      className="text-neutral-200 whitespace-pre-wrap"
                    >
                      {aiSummary}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleEditSummary}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Edit this summary
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleAddToTranscript}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Add to my transcript
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
