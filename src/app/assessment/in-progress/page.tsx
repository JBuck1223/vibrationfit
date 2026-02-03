// /src/app/assessment/page.tsx
// Main assessment flow page

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Spinner, Card, Container, Stack, PageHero } from '@/lib/design-system/components'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { assessmentQuestions, filterQuestionsByProfile, categoryMetadata } from '@/lib/assessment/questions'
import { AssessmentQuestion, AssessmentOption, AssessmentCategory } from '@/types/assessment'
import { VISION_CATEGORIES, visionToAssessmentKey } from '@/lib/design-system/vision-categories'
import {
  saveResponse,
  fetchAssessmentProgress,
  completeAssessment,
  fetchAssessment,
  AssessmentProgress
} from '@/lib/services/assessmentService'
import ResultsSummary from '../components/ResultsSummary'

export default function AssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const routeAssessmentId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined)
  
  // State
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, number>>(new Map())
  const [progress, setProgress] = useState<AssessmentProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customResponse, setCustomResponse] = useState('')
  const [customResponseTexts, setCustomResponseTexts] = useState<Map<string, string>>(new Map())
  const [customResponseScores, setCustomResponseScores] = useState<Map<string, number>>(new Map())
  const [isScoring, setIsScoring] = useState(false)
  const [justSelectedCustom, setJustSelectedCustom] = useState(false)
  const [customResponseSubmitted, setCustomResponseSubmitted] = useState(false)
  const [customResponseScore, setCustomResponseScore] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Get assessment categories in the correct order (all categories, including empty ones)
  const assessmentCategoriesOrder = VISION_CATEGORIES
    .filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')
    .map(cat => cat.key)


  // Reorder assessmentQuestions to match VISION_CATEGORIES order
  // Convert vision keys to assessment keys for lookup
  const orderedAssessmentQuestions = assessmentCategoriesOrder
    .map(visionKey => {
      const assessmentKey = visionToAssessmentKey(visionKey)
      return assessmentQuestions.find(cat => cat.category === assessmentKey)
    })
    .filter(Boolean) as typeof assessmentQuestions

  // Get current category and questions
  const currentCategory = orderedAssessmentQuestions[currentCategoryIndex]
  const currentCategoryWithMetadata = currentCategory ? {
    ...currentCategory,
    ...categoryMetadata[currentCategory.category]
  } : null
  
  const filteredQuestions = profile 
    ? filterQuestionsByProfile(currentCategory?.questions || [], profile)
    : currentCategory?.questions || []
  const currentQuestion = filteredQuestions[currentQuestionIndex]
  
  // Debug logging for conditional logic
  if (currentCategory?.category === 'love' && profile) {
    console.log('Love category - Profile data:', {
      relationship_status: profile.relationship_status,
      has_children: profile.has_children,
      employment_type: profile.employment_type
    })
    console.log('Love category - Total questions:', currentCategory.questions.length)
    console.log('Love category - Filtered questions:', filteredQuestions.length)
  }
  
  
  // If current category has no questions, skip to next category with questions
  if (currentCategoryWithMetadata && filteredQuestions.length === 0) {
    // This will be handled in the useEffect
  }
  
  // Load custom response text when navigating to a question
  useEffect(() => {
    
    if (currentQuestion && customResponseTexts.has(currentQuestion.id)) {
      const savedText = customResponseTexts.get(currentQuestion.id) || ''
      const savedScore = customResponseScores.get(currentQuestion.id) || 3
      setCustomResponse(savedText)
      setCustomResponseScore(savedScore)
      setShowCustomInput(true)
      setCustomResponseSubmitted(true) // Show as submitted for existing responses
    } else if (currentQuestion && !justSelectedCustom) {
      setCustomResponse('')
      setCustomResponseScore(null)
      setShowCustomInput(false)
      setCustomResponseSubmitted(false) // Reset success state for new questions
    }
  }, [currentQuestion, customResponseTexts])
  
  // Handle justSelectedCustom flag separately
  useEffect(() => {
    if (justSelectedCustom) {
      console.log('User just selected custom option, keeping input visible')
      setJustSelectedCustom(false)
    }
  }, [justSelectedCustom])
  
  // Calculate total question number
  let totalQuestionNumber = 0
  for (let i = 0; i < currentCategoryIndex; i++) {
    const catQuestions = profile
      ? filterQuestionsByProfile(orderedAssessmentQuestions[i].questions, profile)
      : orderedAssessmentQuestions[i].questions
    totalQuestionNumber += catQuestions.length
  }
  totalQuestionNumber += currentQuestionIndex + 1

  // Calculate total questions
  let totalQuestions = 0
  for (const cat of orderedAssessmentQuestions) {
    const catQuestions = profile
      ? filterQuestionsByProfile(cat.questions, profile)
      : cat.questions
    totalQuestions += catQuestions.length
  }

  // Initialize assessment
  useEffect(() => {
    async function initialize() {
      if (!routeAssessmentId) {
        setLoadError('Assessment not found.')
        setIsLoading(false)
        return
      }

      setLoadError(null)

      try {
        let profileData: any = null

        // Fetch profile for conditional logic
        try {
          const profileRes = await fetch('/api/profile')
          if (profileRes.ok) {
            const { profile: profilePayload } = await profileRes.json()
            profileData = profilePayload
            setProfile(profilePayload)
          }
        } catch (profileError) {
          console.warn('Unable to fetch profile for assessment filters:', profileError)
        }

        // Check if user is in intensive mode
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const { data: intensiveData } = await supabase
              .from('intensive_purchases')
              .select('id')
              .eq('user_id', user.id)
              .in('completion_status', ['pending', 'in_progress'])
              .maybeSingle()
            
            if (intensiveData) {
              setIsIntensiveMode(true)
            }
          }
        } catch (intensiveError) {
          console.warn('Unable to check intensive mode:', intensiveError)
        }

        // Verify assessment exists and load responses
        const { assessment, responses } = await fetchAssessment(routeAssessmentId, { includeResponses: true })
        if (!assessment) {
          setLoadError('Assessment not found.')
          return
        }

        if (assessment.status === 'completed') {
          setIsComplete(true)
        }

        setAssessmentId(routeAssessmentId)

        // Load progress metrics
        try {
          const progressData = await fetchAssessmentProgress(routeAssessmentId)
          setProgress(progressData)
        } catch (progressError) {
          console.warn('Unable to load assessment progress:', progressError)
        }

        if (responses) {
          const responseMap = new Map<string, number>()
          const customTexts = new Map<string, string>()
          const customScores = new Map<string, number>()

          responses.forEach(response => {
            const displayScore = response.is_custom_response
              ? 0
              : response.response_value === 0
                ? 0
                : Math.round(response.response_value / 2)

            responseMap.set(response.question_id, displayScore)

            if (response.is_custom_response && response.response_text) {
              customTexts.set(response.question_id, response.response_text)
              const userScore = response.custom_response_value
                ? Math.round(response.custom_response_value / 2)
                : 3
              customScores.set(response.question_id, userScore)
            }
          })

          setResponses(responseMap)
          setCustomResponseTexts(customTexts)
          setCustomResponseScores(customScores)

          // Try to restore saved position first
          const savedPosition = loadCurrentPosition(routeAssessmentId)
          let foundPosition = false

          const profileForFilter = profileData || profile

          if (savedPosition) {
            const cat = orderedAssessmentQuestions[savedPosition.categoryIndex]
            if (cat) {
              const catQuestions = profileForFilter
                ? filterQuestionsByProfile(cat.questions, profileForFilter)
                : cat.questions

              if (savedPosition.questionIndex < catQuestions.length) {
                setCurrentCategoryIndex(savedPosition.categoryIndex)
                setCurrentQuestionIndex(savedPosition.questionIndex)
                foundPosition = true
              }
            }
          }

          // If no saved position, find the first unanswered question
          if (!foundPosition) {
            for (let catIndex = 0; catIndex < orderedAssessmentQuestions.length && !foundPosition; catIndex++) {
              const cat = orderedAssessmentQuestions[catIndex]
              const catQuestions = profileForFilter
                ? filterQuestionsByProfile(cat.questions, profileForFilter)
                : cat.questions

              for (let qIndex = 0; qIndex < catQuestions.length; qIndex++) {
                const question = catQuestions[qIndex]
                if (!responseMap.has(question.id)) {
                  setCurrentCategoryIndex(catIndex)
                  setCurrentQuestionIndex(qIndex)
                  foundPosition = true
                  break
                }
              }
            }
          }

          // If all questions are answered, mark as complete
          if (!foundPosition) {
            setCurrentCategoryIndex(0)
            setCurrentQuestionIndex(0)
          }
        } else {
          setResponses(new Map())
        }
      } catch (error) {
        console.error('Failed to initialize assessment:', error)
        setLoadError('Unable to load your assessment. Please return to the assessment hub and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [routeAssessmentId])

  // Save current position to localStorage
  const saveCurrentPosition = () => {
    if (assessmentId) {
      const position = {
        assessmentId,
        categoryIndex: currentCategoryIndex,
        questionIndex: currentQuestionIndex,
        timestamp: Date.now()
      }
      localStorage.setItem('assessment-position', JSON.stringify(position))
      console.log('Saved position:', position)
    }
  }

  // Load current position from localStorage
  const loadCurrentPosition = (currentAssessmentId: string) => {
    try {
      const saved = localStorage.getItem('assessment-position')
      console.log('Loading saved position:', saved)
      if (saved) {
        const position = JSON.parse(saved)
        console.log('Parsed position:', position)
        console.log('Current assessment ID:', currentAssessmentId)
        console.log('Position assessment ID:', position.assessmentId)
        console.log('Time check:', Date.now() - position.timestamp < 24 * 60 * 60 * 1000)
        
        // Only restore if it's for the same assessment and not too old (24 hours)
        if (position.assessmentId === currentAssessmentId && 
            Date.now() - position.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Restoring position:', { categoryIndex: position.categoryIndex, questionIndex: position.questionIndex })
          return { categoryIndex: position.categoryIndex, questionIndex: position.questionIndex }
        } else {
          console.log('Position not restored - assessment mismatch or expired')
        }
      } else {
        console.log('No saved position found')
      }
    } catch (error) {
      console.error('Failed to load saved position:', error)
    }
    return null
  }

  // Handle option selection
  const handleSelect = async (option: AssessmentOption) => {
    if (!assessmentId || isSaving) return

    console.log('Option selected:', option.text, 'isCustom:', option.isCustom)

    // Handle custom response option
    if (option.isCustom) {
      console.log('Custom option selected, showing input')
      // Optimistically highlight the custom option (value 0) while showing input
      setResponses(prev => new Map(prev).set(currentQuestion.id, 0))
      setShowCustomInput(true)
      setJustSelectedCustom(true)
      saveCurrentPosition() // Save position when custom input is shown
      return
    }

    setIsSaving(true)
    try {
      // Update local state immediately for better UX
      setResponses(prev => new Map(prev).set(currentQuestion.id, option.value))

      // Use 1-5 scale directly for database storage
      // No conversion needed - database now accepts 1-5 values
      const dbValue = option.value // 0, 1, 2, 3, 4, 5
      
      // For custom responses, we'll use custom_response_value for the actual calculation
      const customScore = option.value === 0 ? 0 : undefined
      
      // Debug logging
      console.log('🔍 Saving response with data:', {
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        response_value: dbValue,
        response_text: option.text,
        category: currentQuestion.category
      })

      // Save response to database
      await saveResponse({
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        category: currentQuestion.category,
        response_value: dbValue,
        response_text: option.text,
        response_emoji: option.emoji,
        green_line: option.greenLine as 'above' | 'neutral' | 'below',
        is_custom_response: option.value === 0,
        custom_response_value: customScore,
        custom_green_line: option.value === 0 ? 'neutral' : undefined
      })

      // Refresh progress (do not auto-advance; require explicit Next click)
      const progressData = await fetchAssessmentProgress(assessmentId)
      setProgress(progressData)

      saveCurrentPosition() // Save position after successful response

    } catch (error) {
      console.error('Failed to save response:', error)
      // Revert local state on error
      setResponses(prev => {
        const newMap = new Map(prev)
        newMap.delete(currentQuestion.id)
        return newMap
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle custom response submission with user's 1-5 score
  const handleCustomResponse = async () => {
    if (!assessmentId || !customResponse.trim() || !customResponseScore || isSaving) return

    setIsSaving(true)
    try {
      // Use 1-5 scale directly for database compatibility
      const dbScore = customResponseScore // 1, 2, 3, 4, 5
      
      // Determine green line status based on score
      const greenLine = customResponseScore >= 4 ? 'above' : customResponseScore <= 2 ? 'below' : 'neutral'

      console.log('Custom response submission:', { 
        score: customResponseScore, 
        dbScore, 
        greenLine, 
        questionId: currentQuestion.id 
      })

      // Save response with user's score
      const saveData = {
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        category: currentQuestion.category,
        response_value: 0, // Keep 0 for "None of these specifically resonate" option
        response_text: customResponse,
        response_emoji: '🤔',
        green_line: greenLine as 'above' | 'neutral' | 'below',
        is_custom_response: true,
        custom_response_value: dbScore, // Store user's score in custom_response_value field for calculations
        custom_green_line: greenLine as 'above' | 'neutral' | 'below'
      }
      
      console.log('Saving response data:', saveData)
      
      try {
        const saveResult = await saveResponse(saveData)
        console.log('Save result:', saveResult)
      } catch (saveError) {
        console.error('Save error details:', saveError)
        throw saveError
      }

      // Update local state - keep 0 to show "None of these specifically resonate" is selected
      setResponses(prev => new Map(prev).set(currentQuestion.id, 0))
      console.log('Updated local state with 0 (None of these specifically resonate selected)')
      
      // Store the custom response text and score for this question
      setCustomResponseTexts(prev => new Map(prev).set(currentQuestion.id, customResponse))
      setCustomResponseScores(prev => new Map(prev).set(currentQuestion.id, customResponseScore))
      
      // Show success message and keep input visible
      setShowCustomInput(true)
      setCustomResponse(customResponse) // Keep the text visible
      setCustomResponseSubmitted(true)

      // Refresh progress
      const progressData = await fetchAssessmentProgress(assessmentId)
      setProgress(progressData)

    } catch (error) {
      console.error('Failed to save response:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      // Next question in current category
      setCurrentQuestionIndex(prev => {
        const newIndex = prev + 1
        // Save position after state update
        setTimeout(() => saveCurrentPosition(), 0)
        return newIndex
      })
    } else if (currentCategoryIndex < orderedAssessmentQuestions.length - 1) {
      // Next category
      setCurrentCategoryIndex(prev => {
        const newIndex = prev + 1
        setCurrentQuestionIndex(0)
        // Save position after state update
        setTimeout(() => saveCurrentPosition(), 0)
        return newIndex
      })
    } else {
      // Assessment complete
      handleComplete()
    }
  }

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Previous question in current category
      setCurrentQuestionIndex(prev => {
        const newIndex = prev - 1
        // Save position after state update
        setTimeout(() => saveCurrentPosition(), 0)
        return newIndex
      })
    } else if (currentCategoryIndex > 0) {
      // Previous category
      const prevCategoryIndex = currentCategoryIndex - 1
      const prevCategory = orderedAssessmentQuestions[prevCategoryIndex]
      const prevQuestions = profile
        ? filterQuestionsByProfile(prevCategory.questions, profile)
        : prevCategory.questions
      
      setCurrentCategoryIndex(prevCategoryIndex)
      setCurrentQuestionIndex(prevQuestions.length - 1)
      // Save position after state update
      setTimeout(() => saveCurrentPosition(), 0)
    }
  }

  // Complete assessment
  const handleComplete = async () => {
    if (!assessmentId) return

    try {
      await completeAssessment(assessmentId)
      
      // Redirect to results page - intensive step will be marked there
      router.push(`/assessment/${assessmentId}/results`)
    } catch (error) {
      console.error('Failed to complete assessment:', error)
    }
  }

  // Generate vision from results
  const handleGenerateVision = () => {
    router.push(`/life-vision/create?assessmentId=${assessmentId}`)
  }

  // View detailed results
  const handleViewDetails = () => {
    router.push(`/assessment/${assessmentId}/results`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner variant="primary" size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">We couldn&apos;t load this assessment</h2>
            <p className="text-neutral-400 mb-6">
              {loadError}
            </p>
            <Button variant="primary" onClick={() => router.push('/assessment')}>
              Return to Assessment Hub
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (isComplete && assessmentId && progress) {
    // Show results summary
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <ResultsSummary
            assessment={{
              id: assessmentId,
              user_id: '',
              status: 'completed',
              total_score: Object.values(progress.categories).reduce((sum, cat) => sum + (cat.answered * 10), 0),
              max_possible_score: totalQuestions * 10,
              overall_percentage: progress.overall.percentage,
              category_scores: Object.entries(progress.categories).reduce((acc, [key, val]) => ({
                ...acc,
                [key]: val.answered * 10
              }), {}),
              green_line_status: {},
              started_at: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            } as any}
          />
        </div>
      </div>
    )
  }

  const isFirstQuestion = currentCategoryIndex === 0 && currentQuestionIndex === 0
  const selectedValue = responses.get(currentQuestion.id)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <PageHero
          title="Vibrational Assessment"
          subtitle="Discover your current state across all 12 life categories"
        />

        {/* Overall Progress Bar - Full Width */}
        {progress && (
          <div className="mb-6">
            <div className="bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-300">
                  Overall Progress
                </span>
                <span className="text-2xl font-bold text-[#39FF14]">
                  {progress.overall.percentage}%
                </span>
              </div>
              
              <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#39FF14] transition-all duration-500"
                  style={{ width: `${progress.overall.percentage}%` }}
                />
              </div>
              
              <div className="mt-2 text-xs text-neutral-400 text-center">
                {progress.overall.answered} of {progress.overall.total} questions answered
              </div>
            </div>

            {/* VIVA Tip */}
            <div className="mt-4 bg-secondary-500/10 border border-secondary-500/30 rounded-xl p-4">
              <p className="text-xs text-neutral-300 leading-relaxed text-center">
                <span className="font-semibold text-secondary-500">VIVA's Tip:</span> Answer honestly based on your current reality, not where you want to be. This helps VIVA create your most aligned life vision.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-700">
                <h3 className="text-sm font-semibold text-neutral-300 mb-4">
                  Categories
                </h3>
                
                <div className="space-y-2">
                  {assessmentCategoriesOrder.map((categoryKey, index) => {
                    const assessmentKey = visionToAssessmentKey(categoryKey)
                    const cat = assessmentQuestions.find(c => c.category === assessmentKey)
                    const visionCat = VISION_CATEGORIES.find(v => v.key === categoryKey)
                    const Icon = visionCat?.icon
                    const categoryProgress = progress?.categories[assessmentKey]
                    const isComplete = categoryProgress && categoryProgress.percentage === 100
                    const isCurrent = currentCategoryIndex === index
                    const hasQuestions = cat && cat.questions && cat.questions.length > 0
                    

                    return (
                      <button
                        key={categoryKey}
                        onClick={() => {
                          if (hasQuestions) {
                            setCurrentCategoryIndex(index)
                            setCurrentQuestionIndex(0)
                            // Save position after state update
                            setTimeout(() => saveCurrentPosition(), 0)
                          }
                        }}
                        disabled={!hasQuestions}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg transition-all
                          ${!hasQuestions 
                            ? 'bg-neutral-800 border-2 border-neutral-700 opacity-50 cursor-not-allowed'
                            : isCurrent 
                            ? 'bg-primary-500/20 border-2 border-primary-500' 
                            : isComplete
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : 'bg-neutral-700 border-2 border-neutral-600 hover:border-neutral-500'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                          ${!hasQuestions
                            ? 'bg-neutral-800 text-neutral-600'
                            : isComplete 
                            ? 'bg-neutral-700/50 border border-[#39FF14] text-[#39FF14] hover:bg-neutral-600/50 hover:border-[#39FF14]/80' 
                            : isCurrent
                              ? 'bg-[#39FF14]/30 text-[#39FF14]'
                              : 'bg-neutral-700 text-neutral-400'
                          }
                        `}>
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : Icon ? (
                            <Icon className="w-4 h-4" />
                          ) : null}
                        </div>

                        {/* Category Name */}
                        <div className="flex-1 text-left min-w-0">
                          <div className={`
                            text-sm font-medium truncate
                            ${!hasQuestions 
                              ? 'text-neutral-500'
                              : isCurrent ? 'text-[#39FF14]' : isComplete ? 'text-white' : 'text-neutral-300'}
                          `}>
                            {visionCat?.label || categoryKey}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {!hasQuestions 
                              ? 'Coming Soon'
                              : categoryProgress 
                                ? `${categoryProgress.answered}/${categoryProgress.total}`
                                : 'Not started'
                            }
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card with Category Header Inside */}
            <Card variant="elevated" className="p-8">
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-700">
                {currentCategoryWithMetadata && (() => {
                  const visionCat = VISION_CATEGORIES.find(v => v.key === currentCategoryWithMetadata.category)
                  const Icon = visionCat?.icon
                  return (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center">
                        {Icon && <Icon className="w-6 h-6 text-neutral-400" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {currentCategoryWithMetadata.title}
                        </h2>
                        <p className="text-sm text-neutral-400">
                          {currentCategoryWithMetadata.description}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Question Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[#39FF14]">
                    Question {totalQuestionNumber} of {totalQuestions}
                  </span>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {currentQuestion.text}
                </h3>
                
                <p className="text-sm text-neutral-400">
                  Choose the response that most honestly describes your current state
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedValue === option.value
                  
                  let borderColor = 'border-neutral-600'
                  let hoverBorderColor = 'hover:border-neutral-500'
                  
                  if (isSelected) {
                    borderColor = 'border-[#39FF14]'
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelect(option)}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-200
                        ${borderColor} ${hoverBorderColor}
                        ${isSelected 
                          ? 'bg-neutral-700/50 scale-[1.02]' 
                          : 'bg-neutral-800/30 hover:bg-neutral-700/30'
                        }
                        text-left relative group
                      `}
                    >

                      <div className="flex items-center gap-4">
                        {/* Option Text */}
                        <span className={`
                          flex-1 text-base
                          ${isSelected ? 'text-white font-medium' : 'text-neutral-300'}
                        `}>
                          {option.text}
                        </span>

                        {/* Check Icon */}
                        {isSelected && (
                          <CheckCircle className="flex-shrink-0 w-5 h-5 text-[#39FF14]" />
                        )}
                      </div>
                    </button>
                  )
                })}

              </div>

              {/* Custom Response Input */}
              {showCustomInput && (
                <div className="mt-6 p-6 bg-neutral-800/50 border-2 border-primary-500/30 rounded-xl">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Share your own response:
                  </h4>
                  
                  {customResponseSubmitted ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                          <span className="text-[#39FF14] font-semibold">Response Submitted Successfully!</span>
                        </div>
                        <p className="text-sm text-neutral-300">
                          Your custom response has been saved with a score of {customResponseScore}/5. You can continue to the next question.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-neutral-900 border border-neutral-600 rounded-lg">
                        <p className="text-white text-sm leading-relaxed">
                          {customResponse}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={customResponse}
                        onChange={(e) => setCustomResponse(e.target.value)}
                        placeholder="Type response here..."
                        className="w-full p-4 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 resize-none"
                        rows={4}
                        disabled={isSaving}
                      />
                      
                      {/* 1-5 Score Selector */}
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-white mb-3">
                          How do you feel about this? (Select 1-5)
                        </h5>
                        <div className="flex gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => setCustomResponseScore(score)}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                customResponseScore === score
                                  ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                                  : 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
                              }`}
                              disabled={isSaving}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-neutral-400">
                          <span>1 - I feel terrible</span>
                          <span>5 - I feel amazing</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => {
                            setShowCustomInput(false)
                            setCustomResponse('')
                            setCustomResponseSubmitted(false)
                            setCustomResponseScore(null)
                          }}
                          className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        
                        <Button
                          onClick={handleCustomResponse}
                          loading={isSaving}
                          disabled={!customResponse.trim() || !customResponseScore || isSaving}
                          className="px-6"
                        >
                          {isSaving ? 'Saving...' : 'Submit Response'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion || isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-neutral-400">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length} in this category
              </div>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={selectedValue === undefined || selectedValue === null}
              >
                {currentCategoryIndex === orderedAssessmentQuestions.length - 1 &&
                currentQuestionIndex === filteredQuestions.length - 1
                  ? 'Complete Assessment'
                  : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  )
}

