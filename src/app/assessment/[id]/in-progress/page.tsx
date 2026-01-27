// /src/app/assessment/[id]/in-progress/page.tsx
// Main assessment flow page

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Button, Spinner, Card, Container, Stack, PageHero, StatusBadge, CategoryCard } from '@/lib/design-system/components'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, CalendarDays, Check, Circle } from 'lucide-react'
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
import ResultsSummary from '../../components/ResultsSummary'
import { generateFakeAssessmentResponses } from '@/lib/testing/fake-assessment-data'

export default function AssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveMode = searchParams.get('intensive') === 'true'
  const params = useParams()
  const routeAssessmentId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined)
  
  // State
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
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
  const [isFilling, setIsFilling] = useState(false)
  const [assessmentResponses, setAssessmentResponses] = useState<any[] | null>(null)

  // Ref for scrolling to question card on mobile
  const questionCardRef = useRef<HTMLDivElement>(null)

  // Get assessment categories in the correct order (all categories, including empty ones)
  const assessmentCategoriesOrder = VISION_CATEGORIES
    .filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')
    .map(cat => cat.key)


  // Reorder assessmentQuestions to match VISION_CATEGORIES order
  const orderedAssessmentQuestions = assessmentCategoriesOrder
    .map(key => assessmentQuestions.find(cat => cat.category === key))
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

        // Verify assessment exists and load responses
        const { assessment, responses } = await fetchAssessment(routeAssessmentId, { includeResponses: true })
        if (!assessment) {
          setLoadError('Assessment not found.')
          return
        }

        if (assessment.status === 'completed') {
          setIsComplete(true)
        }

        setAssessmentData(assessment)
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
    if (!assessmentId) return
    
    // Prevent clicking the same option while it's already being saved
    const currentlySelected = responses.get(currentQuestion.id)
    if (isSaving && currentlySelected === option.value) {
      return
    }

    // Handle custom response option
    if (option.isCustom) {
      // Optimistically highlight the custom option (value 0) while showing input
      setResponses(prev => new Map(prev).set(currentQuestion.id, 0))
      setShowCustomInput(true)
      setJustSelectedCustom(true)
      saveCurrentPosition() // Save position when custom input is shown
      return
    }

    // Hide custom input if switching to a standard option
    if (showCustomInput) {
      setShowCustomInput(false)
      setCustomResponse('')
      setCustomResponseSubmitted(false)
      setCustomResponseScore(null)
    }

    setIsSaving(true)
    
    // Update local state immediately for better UX
    setResponses(prev => new Map(prev).set(currentQuestion.id, option.value))
    
    try {

      // Use 1-5 scale directly for database storage
      // No conversion needed - database now accepts 1-5 values
      const dbValue = option.value // 0, 1, 2, 3, 4, 5
      
      // For custom responses, we'll use custom_response_value for the actual calculation
      const customScore = option.value === 0 ? 0 : undefined

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
      
      await saveResponse(saveData)

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

  // Fill all questions with fake test data (dev mode only)
  const handleFillWithTestData = async () => {
    if (!assessmentId || !profile) {
      console.error('Cannot fill test data: missing assessment ID or profile')
      return
    }

    setIsFilling(true)
    console.log('🧪 Starting to fill assessment with test data...')

    try {
      // Get all questions from all categories, filtered by profile
      const allQuestions: AssessmentQuestion[] = []
      
      for (const category of orderedAssessmentQuestions) {
        const filteredCategoryQuestions = filterQuestionsByProfile(category.questions, profile)
        allQuestions.push(...filteredCategoryQuestions)
      }

      console.log(`📝 Total questions to fill: ${allQuestions.length}`)

      // Generate fake responses for all questions
      const fakeResponses = generateFakeAssessmentResponses(allQuestions)
      console.log(`✅ Generated ${fakeResponses.size} fake responses`)

      // Save each response to the database
      let savedCount = 0
      for (const [questionId, responseData] of fakeResponses.entries()) {
        try {
          await saveResponse({
            assessment_id: assessmentId,
            question_id: questionId,
            question_text: responseData.questionText,
            category: responseData.category,
            response_value: responseData.selectedOption.value,
            response_text: responseData.selectedOption.text,
            response_emoji: responseData.selectedOption.emoji,
            green_line: responseData.selectedOption.greenLine as 'above' | 'neutral' | 'below'
          })

          // Update local state
          setResponses(prev => new Map(prev).set(questionId, responseData.selectedOption.value))
          savedCount++

          // Log progress every 10 questions
          if (savedCount % 10 === 0) {
            console.log(`💾 Saved ${savedCount}/${allQuestions.length} responses...`)
          }
        } catch (error) {
          console.error(`❌ Failed to save response for question ${questionId}:`, error)
        }
      }

      console.log(`✅ Successfully saved ${savedCount}/${allQuestions.length} responses`)

      // Refresh progress
      const progressData = await fetchAssessmentProgress(assessmentId)
      setProgress(progressData)

      console.log('🎉 Test data fill complete!')
      alert(`Successfully filled ${savedCount} questions with test data!`)

    } catch (error) {
      console.error('❌ Error filling test data:', error)
      alert('Failed to fill test data. Check console for details.')
    } finally {
      setIsFilling(false)
    }
  }

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      // Next question in current category
      setCurrentQuestionIndex(prev => {
        const newIndex = prev + 1
        // Save position and scroll to top of card
        setTimeout(() => {
          saveCurrentPosition()
          questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
        return newIndex
      })
    } else if (currentCategoryIndex < orderedAssessmentQuestions.length - 1) {
      // Next category
      setCurrentCategoryIndex(prev => {
        const newIndex = prev + 1
        setCurrentQuestionIndex(0)
        // Save position and scroll to top of card
        setTimeout(() => {
          saveCurrentPosition()
          questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
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
        // Save position and scroll to top of card
        setTimeout(() => {
          saveCurrentPosition()
          questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
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
      // Save position and scroll to top of card
      setTimeout(() => {
        saveCurrentPosition()
        questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    }
  }

  // Complete assessment
  const handleComplete = async () => {
    if (!assessmentId) return

    try {
      await completeAssessment(assessmentId)
      
      // Fetch the completed assessment data (with real scores, green line status, and all responses)
      const completedData = await fetchAssessment(assessmentId, { 
        includeResponses: true,  // ✅ Need responses to show individual questions
        includeInsights: false 
      })
      
      console.log('🔍 Completed assessment data:', {
        assessment: completedData.assessment,
        responsesCount: completedData.responses?.length,
        hasResponses: !!completedData.responses,
        sampleResponse: completedData.responses?.[0]
      })
      
      // Update assessment data with real values
      setAssessmentData(completedData.assessment)
      setAssessmentResponses(completedData.responses)
      setIsComplete(true)
      
      // If in intensive mode, mark assessment as complete
      if (isIntensiveMode) {
        const { markIntensiveStep } = await import('@/lib/intensive/checklist')
        const success = await markIntensiveStep('assessment_completed')
        
        if (success) {
          // Don't auto-redirect - let user see results and navigate manually
          console.log('Assessment completed in intensive mode')
        }
      }
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
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner variant="primary" size="lg" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black">
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
    )
  }

  if (isComplete && assessmentId && assessmentData) {
    // Show results summary with real assessment data and responses
    return (
      <div className="min-h-screen bg-black">
        <ResultsSummary
          assessment={assessmentData}
          responses={assessmentResponses || undefined}
        />
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
        >
          {/* Badge Row */}
          {assessmentData && (
            <div className="text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <StatusBadge 
                  status="draft"
                  label="IN PROGRESS"
                  subtle={true} 
                  className="uppercase tracking-[0.25em]" 
                />
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">Started:</span>
                  <span>{new Date(assessmentData.started_at || assessmentData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {progress && (
                  <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                    <span className="font-medium">Completion:</span>
                    <span className="font-semibold text-[#39FF14]">{progress.overall.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </PageHero>

        {/* Assessment Completion Progress */}
        {progress && (
          <Card>
            <div className="flex flex-col items-center gap-2">
              <span className="text-base font-semibold text-primary-500">{progress.overall.percentage}% Complete</span>
              <div className="w-full bg-neutral-700 rounded-full h-3 border border-neutral-600">
                <div
                  className="h-3 rounded-full transition-all duration-500 bg-primary-500"
                  style={{ width: `${progress.overall.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-neutral-400 mt-1">
                {progress.overall.answered} of {progress.overall.total} questions answered
              </span>
            </div>
          </Card>
        )}

        {/* DEV ONLY: Fill with Test Data Button */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-purple-900/20 border-purple-500/30">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-semibold text-purple-300">
                  DEV MODE
                </div>
                <span className="text-sm text-neutral-300">Quick Testing Tools</span>
              </div>
              <Button
                onClick={handleFillWithTestData}
                disabled={isFilling || !assessmentId || !profile}
                variant="secondary"
                className="!bg-purple-600 hover:!bg-purple-700 !border-purple-500"
              >
                {isFilling ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Filling with test data...
                  </>
                ) : (
                  'Fill with Test Data'
                )}
              </Button>
              <span className="text-xs text-neutral-400 text-center max-w-md">
                Auto-fills all questions with random valid responses for rapid testing
              </span>
            </div>
          </Card>
        )}

        {/* VIVA Tip */}
        <div className="bg-secondary-500/10 border border-secondary-500/30 rounded-xl p-4">
          <p className="text-xs text-neutral-300 leading-relaxed text-center">
            <span className="font-semibold text-secondary-500">VIVA's Tip:</span> Answer honestly based on your current reality, not where you want to be. This helps VIVA create your most aligned life vision.
          </p>
        </div>

        {/* Category Selection Grid */}
        <Card>
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-white mb-1">Select Life Category</h3>
            <p className="text-sm text-neutral-400">
              {progress && `${progress.overall.answered} of ${progress.overall.total} questions answered`}
              {progress && progress.overall.answered > 0 && (() => {
                const completedCount = Object.values(progress.categories).filter(cat => cat.percentage === 100).length
                return (
                  <span className="ml-2 text-[#39FF14]">
                    • {completedCount} complete
                  </span>
                )
              })()}
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-12 gap-1">
            {assessmentCategoriesOrder.map((categoryKey, index) => {
              const cat = assessmentQuestions.find(c => c.category === categoryKey)
              const visionCat = VISION_CATEGORIES.find(v => v.key === categoryKey)
              const categoryProgress = progress?.categories[categoryKey]
              const isComplete = categoryProgress && categoryProgress.percentage === 100
              const isCurrent = currentCategoryIndex === index
              const hasQuestions = cat && cat.questions && cat.questions.length > 0
              
              // Create category object for CategoryCard
              const category = {
                key: categoryKey,
                label: visionCat?.label || categoryKey,
                icon: visionCat?.icon || Circle
              }

              return (
                <div key={categoryKey} className="relative">
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 border-[#39FF14] flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-[#39FF14]" strokeWidth={3} />
                    </div>
                  )}
                  <CategoryCard 
                    category={category}
                    selected={isCurrent}
                    onClick={() => {
                      if (hasQuestions) {
                        setCurrentCategoryIndex(index)
                        setCurrentQuestionIndex(0)
                        setTimeout(() => saveCurrentPosition(), 0)
                      }
                    }}
                    variant="outlined"
                    selectionStyle="border"
                    iconColor={isCurrent ? "#39FF14" : "#FFFFFF"}
                    selectedIconColor="#39FF14"
                    className={isCurrent ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
                  />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Main Question Content - Full Width */}
        <Card ref={questionCardRef} variant="elevated" className="p-8">
          {/* Category Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {currentCategoryWithMetadata && (() => {
              const visionCat = VISION_CATEGORIES.find(v => v.key === currentCategoryWithMetadata.category)
              const Icon = visionCat?.icon
              return (
                <>
                  {Icon && <Icon className="w-6 h-6 text-white" />}
                  <h2 className="text-xl font-bold text-white">
                    {currentCategoryWithMetadata.title}
                  </h2>
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
                      ? 'bg-neutral-700/50' 
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
          <div className="flex-1 flex justify-start">
            <Button
              onClick={handlePrevious}
              disabled={isFirstQuestion || isSaving}
              variant="outline"
              size="sm"
              className="w-24 md:w-auto"
            >
              <ChevronsLeft className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronLeft className="w-4 h-4 flex-shrink-0 hidden md:block" />
              <span className="hidden md:inline">Previous</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-sm text-neutral-400 text-center">
            <span className="md:hidden">{currentCategoryWithMetadata?.title || 'Category'}</span>
            <span className="md:hidden">Question {currentQuestionIndex + 1} of {filteredQuestions.length}</span>
            <span className="hidden md:inline">{currentCategoryWithMetadata?.title || 'Category'} • Question {currentQuestionIndex + 1} of {filteredQuestions.length}</span>
          </div>

          <div className="flex-1 flex justify-end">
            <Button
              onClick={handleNext}
              disabled={selectedValue === undefined || selectedValue === null}
              variant="outline"
              size="sm"
              className="w-24 md:w-auto"
            >
              <span className="hidden md:inline">
                {currentCategoryIndex === orderedAssessmentQuestions.length - 1 &&
                currentQuestionIndex === filteredQuestions.length - 1
                  ? 'Complete'
                  : 'Next'}
              </span>
              <ChevronsRight className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronRight className="w-4 h-4 flex-shrink-0 hidden md:block" />
            </Button>
          </div>
        </div>
      </Stack>
    </Container>
  )
}

