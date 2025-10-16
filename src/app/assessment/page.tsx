// /src/app/assessment/page.tsx
// Main assessment flow page

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, PageLayout, Button, Spinner, Card } from '@/lib/design-system/components'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { ASSESSMENT_QUESTIONS, filterQuestionsByProfile, getAllCategories } from '@/lib/assessment/questions'
import { AssessmentQuestion, AssessmentOption, AssessmentCategory } from '@/types/assessment'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  createAssessment,
  saveResponse,
  fetchAssessmentProgress,
  completeAssessment,
  fetchAssessments,
  fetchAssessment,
  AssessmentProgress
} from '@/lib/services/assessmentService'
import ResultsSummary from './components/ResultsSummary'

export default function AssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveMode = searchParams.get('intensive') === 'true'
  
  // State
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
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
  const [isScoring, setIsScoring] = useState(false)

  // Get assessment categories in the correct order (matching VISION_CATEGORIES, excluding forward/conclusion)
  const assessmentCategoriesOrder = VISION_CATEGORIES
    .filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')
    .map(cat => cat.key)

  // Reorder ASSESSMENT_QUESTIONS to match VISION_CATEGORIES order
  const orderedAssessmentQuestions = assessmentCategoriesOrder
    .map(key => ASSESSMENT_QUESTIONS.find(cat => cat.category === key))
    .filter(Boolean) as typeof ASSESSMENT_QUESTIONS

  // Get current category and questions
  const currentCategory = orderedAssessmentQuestions[currentCategoryIndex]
  const filteredQuestions = profile 
    ? filterQuestionsByProfile(currentCategory.questions, profile)
    : currentCategory.questions
  const currentQuestion = filteredQuestions[currentQuestionIndex]
  
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
      try {
        // Fetch profile for conditional logic
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const { profile: profileData } = await profileRes.json()
          setProfile(profileData)
        }

        // Check for existing incomplete assessments first
        const { assessments } = await fetchAssessments()
        const incompleteAssessment = assessments.find(a => a.status === 'in_progress')
        
        if (incompleteAssessment) {
          // Resume existing assessment
          setAssessmentId(incompleteAssessment.id)
          const progressData = await fetchAssessmentProgress(incompleteAssessment.id)
          setProgress(progressData)
          
          // Load existing responses
          const { responses } = await fetchAssessment(incompleteAssessment.id, { includeResponses: true })
          if (responses) {
            const responseMap = new Map<string, number>()
            responses.forEach(response => {
              responseMap.set(response.question_id, response.response_value)
            })
            setResponses(responseMap)
            
            // Find the current position (first unanswered question)
            let foundPosition = false
            for (let catIndex = 0; catIndex < orderedAssessmentQuestions.length && !foundPosition; catIndex++) {
              const cat = orderedAssessmentQuestions[catIndex]
              const catQuestions = profile 
                ? filterQuestionsByProfile(cat.questions, profile)
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
        } else {
          // Create new assessment
          const { assessment } = await createAssessment()
          setAssessmentId(assessment.id)
          const progressData = await fetchAssessmentProgress(assessment.id)
          setProgress(progressData)
        }

      } catch (error) {
        console.error('Failed to initialize assessment:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Handle option selection
  const handleSelect = async (option: AssessmentOption) => {
    if (!assessmentId || isSaving) return

    // Handle custom response option
    if (option.isCustom) {
      // Optimistically highlight the custom option (value 0) while showing input
      setResponses(prev => new Map(prev).set(currentQuestion.id, 0))
      setShowCustomInput(true)
      return
    }

    setIsSaving(true)
    try {
      // Update local state immediately for better UX
      setResponses(prev => new Map(prev).set(currentQuestion.id, option.value))

      // Save response to database
      await saveResponse({
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        category: currentQuestion.category,
        response_value: option.value,
        response_text: option.text,
        response_emoji: option.emoji,
        green_line: option.greenLine,
        is_custom_response: false,
        ai_score: undefined,
        ai_green_line: undefined
      })

      // Refresh progress (do not auto-advance; require explicit Next click)
      const progressData = await fetchAssessmentProgress(assessmentId)
      setProgress(progressData)

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

  // Handle custom response submission with AI scoring
  const handleCustomResponse = async () => {
    if (!assessmentId || !customResponse.trim() || isScoring) return

    setIsScoring(true)
    try {
      // AI scores the custom response
      const aiResponse = await fetch('/api/assessment/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.text,
          userResponse: customResponse
        })
      })

      if (!aiResponse.ok) {
        throw new Error('AI scoring failed')
      }

      const { score, greenLine } = await aiResponse.json()

      // Save response with AI score (silently)
      await saveResponse({
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        category: currentQuestion.category,
        response_value: score,
        response_text: customResponse,
        response_emoji: '🤔',
        green_line: greenLine,
        is_custom_response: true,
        ai_score: score,
        ai_green_line: greenLine
      })

      // Update local state
      setResponses(prev => new Map(prev).set(currentQuestion.id, score))

      // Refresh progress
      const progressData = await fetchAssessmentProgress(assessmentId)
      setProgress(progressData)

      // Hide custom input, show success
      setShowCustomInput(false)
      setCustomResponse('')

    } catch (error) {
      console.error('Failed to score custom response:', error)
      // Could show error message to user
    } finally {
      setIsScoring(false)
    }
  }

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      // Next question in current category
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentCategoryIndex < orderedAssessmentQuestions.length - 1) {
      // Next category
      setCurrentCategoryIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      // Assessment complete
      handleComplete()
    }
  }

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Previous question in current category
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentCategoryIndex > 0) {
      // Previous category
      const prevCategoryIndex = currentCategoryIndex - 1
      const prevCategory = orderedAssessmentQuestions[prevCategoryIndex]
      const prevQuestions = profile
        ? filterQuestionsByProfile(prevCategory.questions, profile)
        : prevCategory.questions
      
      setCurrentCategoryIndex(prevCategoryIndex)
      setCurrentQuestionIndex(prevQuestions.length - 1)
    }
  }

  // Complete assessment
  const handleComplete = async () => {
    if (!assessmentId) return

    try {
      await completeAssessment(assessmentId)
      setIsComplete(true)
      
      // If in intensive mode, mark assessment as complete
      if (isIntensiveMode) {
        const { markIntensiveStep } = await import('@/lib/intensive/checklist')
        const success = await markIntensiveStep('assessment_completed')
        
        if (success) {
          // Redirect to intensive dashboard after a moment
          setTimeout(() => {
            router.push('/intensive/dashboard')
          }, 3000)
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
      <PageLayout>
        <Container size="xl" className="py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner variant="primary" size="lg" />
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (isComplete && assessmentId && progress) {
    // Show results summary
    return (
      <PageLayout>
        <Container size="xl" className="py-12">
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
            onGenerateVision={handleGenerateVision}
            onViewDetails={handleViewDetails}
          />
        </Container>
      </PageLayout>
    )
  }

  const isFirstQuestion = currentCategoryIndex === 0 && currentQuestionIndex === 0
  const selectedValue = responses.get(currentQuestion.id)

  return (
    <PageLayout>
      <Container size="xl" className="py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Vibrational Assessment</h1>
          <p className="text-lg text-neutral-400">
            Discover your current state across all 12 life categories
          </p>
        </div>

        {/* Overall Progress Bar - Full Width */}
        {progress && (
          <div className="mb-6">
            <div className="bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-300">
                  Overall Progress
                </span>
                <span className="text-2xl font-bold text-primary-500">
                  {progress.overall.percentage}%
                </span>
              </div>
              
              <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
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
                  {orderedAssessmentQuestions.map((cat, index) => {
                    const categoryKey = cat.category
                    const categoryProgress = progress?.categories[categoryKey]
                    const isComplete = categoryProgress && categoryProgress.percentage === 100
                    const isCurrent = currentCategoryIndex === index
                    const visionCat = VISION_CATEGORIES.find(v => v.key === categoryKey)
                    const Icon = visionCat?.icon

                    return (
                      <button
                        key={cat.category}
                        onClick={() => {
                          setCurrentCategoryIndex(index)
                          setCurrentQuestionIndex(0)
                        }}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg transition-all
                          ${isCurrent 
                            ? 'bg-primary-500/20 border-2 border-primary-500' 
                            : isComplete
                              ? 'bg-neutral-700/50 border-2 border-neutral-600 hover:bg-neutral-700'
                              : 'bg-neutral-700/30 border-2 border-transparent hover:bg-neutral-700/50'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                          ${isComplete 
                            ? 'bg-primary-500 text-white' 
                            : isCurrent
                              ? 'bg-primary-500/30 text-primary-500'
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
                            ${isCurrent ? 'text-primary-500' : isComplete ? 'text-white' : 'text-neutral-300'}
                          `}>
                            {cat.title}
                          </div>
                          {categoryProgress && (
                            <div className="text-xs text-neutral-400">
                              {categoryProgress.answered}/{categoryProgress.total}
                            </div>
                          )}
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
                {(() => {
                  const visionCat = VISION_CATEGORIES.find(v => v.key === currentCategory.category)
                  const Icon = visionCat?.icon
                  return (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center">
                        {Icon && <Icon className="w-6 h-6 text-neutral-400" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {currentCategory.title}
                        </h2>
                        <p className="text-sm text-neutral-400">
                          {currentCategory.description}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Question Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-primary-500">
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
                    borderColor = 'border-primary-500'
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
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full bg-primary-500" />
                      )}

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
                          <CheckCircle className="flex-shrink-0 w-5 h-5 text-primary-500" />
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
                  
                  <textarea
                    value={customResponse}
                    onChange={(e) => setCustomResponse(e.target.value)}
                    placeholder="Type response here..."
                    className="w-full p-4 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 resize-none"
                    rows={4}
                    disabled={isScoring}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => {
                        setShowCustomInput(false)
                        setCustomResponse('')
                      }}
                      className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
                      disabled={isScoring}
                    >
                      Cancel
                    </button>
                    
                    <Button
                      onClick={handleCustomResponse}
                      loading={isScoring}
                      disabled={!customResponse.trim() || isScoring}
                      className="px-6"
                    >
                      {isScoring ? 'Analyzing...' : 'Submit Response'}
                    </Button>
                  </div>
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
                disabled={!selectedValue}
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
      </Container>
    </PageLayout>
  )
}

