"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, PageLayout, Button, getVisionCategoryLabel } from '@/lib/design-system'
import { CategoryProgress } from '@/components/vision/CategoryProgress'
import { DiscoveryQuestion } from '@/components/vision/DiscoveryQuestion'
import { ArrowLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Starting with first 4 categories for testing Discovery Path
const LIFE_CATEGORY_KEYS = ['forward', 'fun', 'travel', 'home']
const LIFE_CATEGORIES = LIFE_CATEGORY_KEYS.map(key => getVisionCategoryLabel(key))

interface DiscoveryState {
  step: number
  aiMessage: string
  question?: {
    text: string
    options: any[]
    multiSelect?: boolean
  }
  questions?: any[] // For step 2 drill-downs
  vision?: string
  patternDetected?: string
}

export default function VisionCreateWithVivaPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [completedCategories, setCompletedCategories] = useState<string[]>([])
  
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [step2Responses, setStep2Responses] = useState<Record<string, string[]>>({})

  // Initialize vision on mount
  useEffect(() => {
    initializeVision()
  }, [])

  // Start discovery when category is set
  useEffect(() => {
    if (currentCategory && visionId) {
      startDiscovery()
    }
  }, [currentCategory, visionId])
  
  const initializeVision = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // CHECK: Profile completion requirement
      // 1) Prefer latest profile version from profile_versions
      let completionPercent = 0

      const { data: latestVersion } = await supabase
        .rpc('get_latest_profile_version', { user_uuid: user.id as any })
        .single()

      if (latestVersion && typeof latestVersion.completion_percentage === 'number') {
        completionPercent = latestVersion.completion_percentage
      } else {
        // 2) Fallback to base user_profiles table if no versions exist
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!profile || profileError) {
          console.error('Profile not found:', profileError)
          alert('Please complete your profile before using Viva. Redirecting to profile creation...')
          router.push('/profile/new')
          return
        }

        // Minimal heuristic for completion if versions are not in use
        const requiredFields = [
          'first_name', 'last_name', 'date_of_birth', 'gender',
          'city', 'state', 'country',
          'relationship_status', 'occupation', 'company'
        ]
        const filledFields = requiredFields.filter(field => profile[field] && String(profile[field]).trim() !== '')
        completionPercent = Math.round((filledFields.length / requiredFields.length) * 100)
      }

      if (completionPercent < 70) {
        alert(`Viva needs more information to create a personalized vision for you.\n\nYour profile is ${completionPercent}% complete. Please complete at least 70% before using Viva.\n\nRedirecting to your profile...`)
        router.push('/profile/edit')
        return
      }

      // SAFEGUARD: Check if user already has a Viva draft vision
      const { data: existingDraft } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('title', 'My Vision (Created with Viva)')
        .eq('status', 'draft')
        .single()

      if (existingDraft) {
        // Reuse existing Viva draft instead of creating a new one
        console.log('Reusing existing Viva draft:', existingDraft.id)
        setVisionId(existingDraft.id)
        
        // Check which categories already have content and start from the first empty one
        const firstEmptyIndex = LIFE_CATEGORY_KEYS.findIndex(key => !existingDraft[key] || existingDraft[key].trim() === '')
        const startIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0
        
        console.log(`Starting at category ${startIndex}: ${LIFE_CATEGORIES[startIndex]}`)
        setCurrentCategory(LIFE_CATEGORIES[startIndex])
        setCurrentCategoryIndex(startIndex)
        
        // Track already completed categories
        const completed = LIFE_CATEGORY_KEYS.filter((key, index) => 
          index < startIndex && existingDraft[key] && existingDraft[key].trim() !== ''
        ).map(key => LIFE_CATEGORIES[LIFE_CATEGORY_KEYS.indexOf(key)])
        setCompletedCategories(completed)
        
        setInitializing(false)
        return
      }

      // No existing draft - create a new one
      // Get the next version number for this user
      const { data: existingVisions } = await supabase
        .from('vision_versions')
        .select('version_number')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersionNumber = existingVisions && existingVisions.length > 0 
        ? (existingVisions[0].version_number || 0) + 1 
        : 1

      // Create ONE Viva draft vision
      const { data: newVision, error } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          version_number: nextVersionNumber,
          title: 'My Vision (Created with Viva)',
          status: 'draft', // Explicitly set as draft
          // Initialize with empty sections for all categories
          forward: '',
          fun: '',
          travel: '',
          home: '',
          family: '',
          romance: '',
          health: '',
          money: '',
          business: '',
          social: '',
          possessions: '',
          giving: '',
          spirituality: '',
          conclusion: ''
        })
        .select()
        .single()

      if (error) {
        console.error('Vision creation FAILED:', error)
        throw error
      }

      console.log('Created new Viva draft:', newVision.id)
      setVisionId(newVision.id)
      
      // Check which categories already have content and start from the first empty one
      const firstEmptyIndex = LIFE_CATEGORY_KEYS.findIndex(key => !newVision[key] || newVision[key].trim() === '')
      const startIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0
      
      setCurrentCategory(LIFE_CATEGORIES[startIndex])
      setCurrentCategoryIndex(startIndex)
    } catch (error) {
      console.error('Error initializing vision:', error)
      router.push('/life-vision')
    } finally {
      setInitializing(false)
    }
  }

  const startDiscovery = async () => {
    setIsLoading(true)
    setDiscoveryState(null)
    
    try {
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          action: 'start'
        })
      })

      const data = await response.json()
      
      if (data.type === 'discovery_question') {
        setDiscoveryState({
          step: data.step,
          aiMessage: data.aiMessage,
          question: data.question
        })
      }
    } catch (error) {
      console.error('Error starting discovery:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep1Submit = async (selections: string[], customInput?: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          action: 'submit_step_1',
          selections,
          customInput
        })
      })

      const data = await response.json()
      
      if (data.type === 'drill_down_questions') {
        setDiscoveryState({
          step: data.step,
          aiMessage: data.aiMessage,
          questions: data.questions
        })
        setStep2Responses({}) // Reset step 2 responses
      }
    } catch (error) {
      console.error('Error submitting step 1:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2QuestionSubmit = (questionKey: string, selections: string[]) => {
    setStep2Responses(prev => ({
      ...prev,
      [questionKey]: selections
    }))
  }

  const handleStep2Complete = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          action: 'submit_step_2',
          selections: step2Responses
        })
      })

      const data = await response.json()
      
      if (data.type === 'rhythm_question') {
        setDiscoveryState({
          step: data.step,
          aiMessage: data.aiMessage,
          question: data.question,
          patternDetected: data.patternDetected
        })
      }
    } catch (error) {
      console.error('Error submitting step 2:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async (selections: string[]) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          action: 'submit_step_3',
          selections
        })
      })

      const data = await response.json()
      
      if (data.type === 'vision_generated') {
        setDiscoveryState({
          step: 4,
          aiMessage: data.aiMessage,
          vision: data.vision
        })
      }
    } catch (error) {
      console.error('Error submitting step 3:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisionApprove = async () => {
    if (!discoveryState?.vision || !currentCategory) return
    
    setIsLoading(true)
    
    try {
      // Get category key from label
      const categoryKey = LIFE_CATEGORY_KEYS[LIFE_CATEGORIES.indexOf(currentCategory)]
      
      if (!categoryKey) {
        console.error('Could not find category key for:', currentCategory)
        return
      }

      // Save vision content directly to vision_versions table
      const { error } = await supabase
        .from('vision_versions')
        .update({
          [categoryKey]: discoveryState.vision
        })
        .eq('id', visionId)

      if (error) {
        console.error('Error saving vision:', error)
        throw error
      }

      console.log(`Saved ${currentCategory} (${categoryKey}) to vision ${visionId}`)

      // Mark category as completed
      setCompletedCategories(prev => [...prev, currentCategory])

      // Move to next category or complete
      const nextIndex = currentCategoryIndex + 1
      if (nextIndex < LIFE_CATEGORIES.length) {
        setCurrentCategoryIndex(nextIndex)
        setCurrentCategory(LIFE_CATEGORIES[nextIndex])
        setDiscoveryState(null)
        setStep2Responses({})
      } else {
        // All categories complete!
        router.push(`/life-vision/${visionId}`)
      }
    } catch (error) {
      console.error('Error approving vision:', error)
      alert('Failed to save vision. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (initializing) {
    return (
      <PageLayout>
        <Container className="py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Viva is Getting Ready</h2>
              <p className="text-neutral-400">Preparing your vision creation journey...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container className="py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/life-vision')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Visions
            </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mt-4">Create with Viva</h1>
            <p className="text-neutral-400 mt-2">Your personal Vibe Assistant will guide you through creating your complete life vision</p>
          </div>

          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Progress Indicator */}
          <CategoryProgress
            totalCategories={LIFE_CATEGORIES.length}
          completedCategories={completedCategories}
            currentCategory={currentCategory || ''}
            allCategories={LIFE_CATEGORIES}
        />

        {/* Main Discovery Interface */}
        <div className="max-w-4xl mx-auto mt-12">
          {isLoading && !discoveryState ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-[#14B8A6] animate-spin mx-auto mb-4" />
              <p className="text-neutral-400">Viva is preparing your questions...</p>
            </div>
          ) : discoveryState ? (
            <div className="space-y-8">
              {/* AI Message */}
              <div className="flex items-start gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="mb-1">
                    <span className="text-sm font-medium text-[#14B8A6]">Viva</span>
                  </div>
                  <div className="text-neutral-100 text-base leading-relaxed whitespace-pre-wrap">
                    {discoveryState.aiMessage}
                  </div>
                  {discoveryState.patternDetected && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6] rounded-full px-4 py-2">
                      <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="text-sm text-[#8B5CF6] font-medium">Pattern: {discoveryState.patternDetected}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 1: Initial Question */}
              {discoveryState.step === 1 && discoveryState.question && (
                <DiscoveryQuestion
                  questionText={discoveryState.question.text}
                  options={discoveryState.question.options}
                  onSubmit={handleStep1Submit}
                  multiSelect={discoveryState.question.multiSelect !== false}
                />
              )}

              {/* Step 2: Drill-Down Questions */}
              {discoveryState.step === 2 && discoveryState.questions && (
                <div className="space-y-8">
                  {discoveryState.questions.map((q: any, index: number) => (
                    <div key={q.questionKey} className="animate-fadeIn">
                      <DiscoveryQuestion
                        questionText={q.text}
                        options={q.options}
                        onSubmit={(selections) => {
                          // Just update local state, don't call API yet
                          setStep2Responses(prev => ({ ...prev, [q.questionKey]: selections }))
                        }}
                        multiSelect={q.multiSelect !== false}
                        showSubmitButton={true} // Show submit button for each question
                      />
                    </div>
                  ))}
                  
                  {/* Continue button after all drill-downs answered */}
                  {Object.keys(step2Responses).length === discoveryState.questions.length && (
                    <div className="flex justify-center mt-8 animate-fadeIn">
                      <Button
                        variant="primary"
                        onClick={handleStep2Complete}
                        disabled={isLoading}
                        className="px-8"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Continue →'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Rhythm Question */}
              {discoveryState.step === 3 && discoveryState.question && (
                <DiscoveryQuestion
                  questionText={discoveryState.question.text}
                  options={discoveryState.question.options}
                  onSubmit={handleStep3Submit}
                  multiSelect={discoveryState.question.multiSelect !== false}
                />
              )}

              {/* Step 4: Vision Display */}
              {discoveryState.step === 4 && discoveryState.vision && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Vision Display */}
                  <div className="bg-gradient-to-br from-[#199D67]/10 to-[#14B8A6]/10 border-2 border-[#199D67] rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#199D67] to-[#14B8A6] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{currentCategory}</h3>
                        <p className="text-sm text-[#199D67]">Your Vision</p>
                      </div>
                    </div>
                    
                    <div className="text-neutral-100 text-base leading-relaxed whitespace-pre-wrap">
                      {discoveryState.vision}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="primary"
                      onClick={handleVisionApprove}
                      disabled={isLoading}
                      className="px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save & Continue ✓
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => startDiscovery()}
                      disabled={isLoading}
                    >
                      Regenerate 🔄
                    </Button>
                  </div>
                  
                  <p className="text-xs text-neutral-500 text-center mt-4">
                    This saves to your Viva draft. All changes update the same draft until you're ready to finalize.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-400">Ready to begin your discovery journey!</p>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  )
}
