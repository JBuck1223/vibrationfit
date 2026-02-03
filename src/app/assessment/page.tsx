'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, PageHero, StatusBadge, DeleteConfirmationDialog, Container, Stack, Spinner, Text, Inline, IntensiveCompletionBanner } from '@/lib/design-system/components'
import { fetchAssessments, deleteAssessment, createAssessment, fetchAssessmentProgress, AssessmentProgress } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { createClient } from '@/lib/supabase/client'
import { 
  PlayCircle, 
  Trash2, 
  BarChart3, 
  PlusCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  Target,
  BarChart,
  TrendingUp,
  Sparkles,
  Eye
} from 'lucide-react'

// Placeholder video URL - user will replace this later
const ASSESSMENT_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AssessmentHub() {
  const router = useRouter()
  
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<AssessmentProgress | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isIntensiveCompleted, setIsIntensiveCompleted] = useState(false)
  const [intensiveCompletedAt, setIntensiveCompletedAt] = useState<string | null>(null)

  const toTimestamp = (value?: Date | string | null) => {
    if (!value) return 0
    if (value instanceof Date) {
      return value.getTime()
    }
    return new Date(value).getTime()
  }

  const incompleteAssessment = assessments.find(a => a.status === 'in_progress')
  const completedAssessments = assessments.filter(a => a.status === 'completed')
  const sortedCompletedAssessments = [...completedAssessments].sort((a, b) => {
    const aDate = toTimestamp(a.completed_at ?? a.updated_at ?? a.created_at)
    const bDate = toTimestamp(b.completed_at ?? b.updated_at ?? b.created_at)
    return bDate - aDate
  })

  useEffect(() => {
    loadAssessments()
    checkIntensiveCompletion()
  }, [])

  const checkIntensiveCompletion = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check for active intensive purchase
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('id')
        .eq('user_id', user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .maybeSingle()

      if (intensiveData) {
        setIsIntensiveMode(true)
        
        // Check if assessment step is completed
        const { data: checklistData } = await supabase
          .from('intensive_checklist')
          .select('assessment_completed, assessment_completed_at')
          .eq('intensive_id', intensiveData.id)
          .maybeSingle()

        if (checklistData?.assessment_completed) {
          setIsIntensiveCompleted(true)
          setIntensiveCompletedAt(checklistData.assessment_completed_at)
        }
      }
    } catch (error) {
      console.error('Error checking intensive completion:', error)
    }
  }

  useEffect(() => {
    if (!incompleteAssessment && errorMessage) {
      setErrorMessage(null)
    }
  }, [incompleteAssessment, errorMessage])

  useEffect(() => {
    const loadProgress = async () => {
      if (incompleteAssessment) {
        try {
          const progressData = await fetchAssessmentProgress(incompleteAssessment.id)
          setProgress(progressData)
        } catch (error) {
          console.error('Failed to load progress:', error)
        }
      } else {
        setProgress(null)
      }
    }
    loadProgress()
  }, [incompleteAssessment])

  const loadAssessments = async () => {
    try {
      const { assessments } = await fetchAssessments()
      setAssessments(assessments)
    } catch (error) {
      console.error('Failed to load assessments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAssessment = () => {
    if (incompleteAssessment) {
      router.push(`/assessment/${incompleteAssessment.id}/in-progress`)
    }
  }

  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!assessmentToDelete) return

    setDeletingId(assessmentToDelete)
    try {
      await deleteAssessment(assessmentToDelete)
      await loadAssessments() // Reload the list
      setShowDeleteDialog(false)
      setAssessmentToDelete(null)
    } catch (error) {
      console.error('Failed to delete assessment:', error)
      alert('Failed to delete assessment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewResults = (assessmentId: string) => {
    router.push(`/assessment/${assessmentId}/results`)
  }

  const handleCreateAssessment = async () => {
    setIsCreating(true)
    setErrorMessage(null)

    try {
      // First, get the user's active profile to use as the profile_version_id
      const profileResponse = await fetch('/api/profile')
      if (!profileResponse.ok) {
        throw new Error('Failed to get profile. Please create a profile first.')
      }
      
      const profileData = await profileResponse.json()
      
      if (!profileData.profile?.id) {
        throw new Error('No active profile found. Please create a profile first.')
      }
      
      // Create new assessment with the active profile
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_version_id: profileData.profile.id,
          assessment_version: 1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create assessment' }))
        throw new Error(errorData.error || 'Failed to create assessment')
      }

      const data = await response.json()
      
      if (data.assessment?.id) {
        router.push(`/assessment/${data.assessment.id}/in-progress`)
      } else {
        throw new Error('No assessment ID returned from API')
      }
    } catch (err) {
      console.error('Error creating assessment:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create assessment')
    } finally {
      setIsCreating(false)
    }
  }

  const formatStartDate = (date: Date | string) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return `${dateStr} at ${timeStr}`
  }

  if (isLoading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Intensive Completion Banner */}
        {(isIntensiveMode || isIntensiveCompleted) && isIntensiveCompleted && intensiveCompletedAt && (
          <IntensiveCompletionBanner
            stepTitle="Vibration Assessment"
            completedAt={intensiveCompletedAt}
          />
        )}

        {/* Hero with Video */}
        <PageHero
          eyebrow={isIntensiveMode || isIntensiveCompleted ? "ACTIVATION INTENSIVE • STEP 4 OF 14" : undefined}
          title="Vibration Assessment"
          subtitle="Discover where you stand in each area of your life and unlock personalized insights."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={ASSESSMENT_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button - 3 states: Start, Continue, View Results */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {incompleteAssessment ? (
              // State 2: Continue Assessment (in progress)
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleContinueAssessment}
                className="w-full md:w-auto"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Continue Assessment
              </Button>
            ) : sortedCompletedAssessments.length > 0 ? (
              // State 3: View Results (has completed assessment)
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push(`/assessment/${sortedCompletedAssessments[0].id}/results`)}
                className="w-full md:w-auto"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Results
              </Button>
            ) : (
              // State 1: Start Assessment (no assessments)
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCreateAssessment}
                disabled={isCreating}
                className="w-full md:w-auto"
              >
                {isCreating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Starting Assessment...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Start Assessment
                  </>
                )}
              </Button>
            )}
            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
          </div>
        </PageHero>

        {/* In-Progress Assessment Card - Only show for non-intensive users (they need delete option) */}
        {incompleteAssessment && !isIntensiveMode && (
          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex flex-col items-center gap-3 md:gap-4 mb-4 md:mb-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#1F1F1F]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2">Assessment In Progress</h2>
                <div className="flex items-center justify-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">Started:</span>
                  <span>{formatStartDate(incompleteAssessment.started_at || incompleteAssessment.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-500/10 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs md:text-sm text-primary-500 font-medium">Status</p>
                  <p className="text-xs md:text-sm text-neutral-300">In Progress</p>
                </div>
                <div className="text-right">
                  <p className="text-xs md:text-sm text-primary-500 font-medium">Progress</p>
                  <p className="text-xs md:text-sm text-neutral-300">
                    {progress ? `${progress.overall.percentage}%` : '0%'} Complete
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons: Delete + Continue for regular members */}
            <div className="flex flex-row gap-3">
              <Button 
                onClick={() => handleDeleteClick(incompleteAssessment.id)}
                variant="danger" 
                size="md"
                className="flex-1"
                disabled={deletingId === incompleteAssessment.id}
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                {deletingId === incompleteAssessment.id ? 'Deleting...' : 'Delete'}
              </Button>
              <Button 
                onClick={handleContinueAssessment}
                variant="primary" 
                size="md"
                className="flex-1"
              >
                <PlayCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="md:hidden">Continue</span>
                <span className="hidden md:inline">Continue Assessment</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Previous Assessments Section - Hide during and after intensive */}
        {!(isIntensiveMode || isIntensiveCompleted) && completedAssessments.length > 0 && (
          <Card variant="default" className="p-4 md:p-6">
            <div className="flex flex-col items-center gap-3 md:gap-4 mb-4 md:mb-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#1F1F1F]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-1">Previous Assessments</h2>
                <p className="text-xs md:text-sm text-neutral-400">
                  Review your past assessment results and track your progress over time
                </p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {sortedCompletedAssessments.slice(0, 5).map((assessment) => {
                const isActive = assessment.is_active
                return (
                <div 
                  key={assessment.id}
                  className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3 md:p-4 rounded-lg transition-all ${
                    isActive
                      ? 'border border-primary-500 hover:border-primary-400'
                      : 'border border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex-1 min-w-0 w-full lg:w-auto text-center lg:text-left">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3 mb-2">
                      <StatusBadge 
                        status={isActive ? 'active' : 'complete'} 
                        subtle={!isActive}
                        className="uppercase tracking-[0.25em]"
                      />
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-1.5 text-neutral-300 text-xs md:text-sm mb-1">
                      <CalendarDays className="w-4 h-4 text-neutral-500" />
                      <span className="font-medium">Started:</span>
                      <span>{formatStartDate(assessment.started_at || assessment.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-1.5 text-neutral-300 text-xs md:text-sm">
                      <CalendarDays className="w-4 h-4 text-neutral-500" />
                      <span className="font-medium">Completed:</span>
                      <span>{assessment.completed_at ? formatStartDate(assessment.completed_at) : 'Not completed'}</span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 w-full lg:w-auto">
                    <Button 
                      onClick={() => handleDeleteClick(assessment.id)}
                      variant="danger"
                      size="sm"
                      className="flex-1 lg:flex-initial"
                      disabled={deletingId === assessment.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingId === assessment.id ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button 
                      onClick={() => router.push(`/assessment/${assessment.id}`)}
                      variant="ghost"
                      size="sm"
                      className="flex-1 lg:flex-initial"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      See Results
                    </Button>
                  </div>
                </div>
                )
              })}
              
              {completedAssessments.length > 5 && (
                <div className="text-center pt-3 md:pt-4">
                  <Button 
                    onClick={() => router.push('/assessment/history')}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    View All Assessments
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* What is the Assessment? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is the Assessment?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The Vibration Assessment is a comprehensive evaluation that measures your current state across all 12 life categories. It provides you with detailed insights into your strengths, growth areas, and alignment levels.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Unlike a simple quiz, this assessment dives deep into each area of your life to give you actionable data and personalized recommendations for your transformation journey.
            </p>
          </Stack>
        </Card>

        {/* What You'll Discover */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Discover
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Alignment Score
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Get a comprehensive score for each of the 12 life categories, showing where you're thriving and where there's room for growth. See exactly where you stand on the "Green Line" of alignment.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <BarChart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Detailed Insights
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Receive personalized insights for each category, highlighting patterns, strengths, and opportunities. Understand not just your score, but what it means and how to improve.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <TrendingUp className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Growth Recommendations
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Get specific, actionable recommendations for each area of your life. Know exactly what steps to take to move from where you are to where you want to be.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Unique Blueprint
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your assessment results become the foundation for your personalized Life Vision. VIVA uses these insights to guide you toward the life you truly desire.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Why Take the Assessment? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Take the Assessment?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The assessment is your starting point for transformation. It provides the clarity and data you need to create meaningful change. Here's why it's essential:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Baseline Measurement</span> - Establish where you are right now so you can track your progress over time.
              </p>
              <p>
                • <span className="text-white font-semibold">Personalized Insights</span> - VIVA uses your assessment to provide guidance that's specifically tailored to your unique situation and goals.
              </p>
              <p>
                • <span className="text-white font-semibold">Identify Blind Spots</span> - Discover areas of your life that may need attention but weren't on your radar.
              </p>
              <p>
                • <span className="text-white font-semibold">Prioritize Growth</span> - Know which areas to focus on first for maximum impact on your overall alignment and happiness.
              </p>
            </Stack>
          </Stack>
        </Card>

      </Stack>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setAssessmentToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName="assessment"
        isDeleting={deletingId === assessmentToDelete}
      />
    </Container>
  )
}
