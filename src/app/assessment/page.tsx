'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, PageHero, StatusBadge, DeleteConfirmationDialog, Container, Stack, Spinner, Text, Inline, IntensiveCompletionBanner } from '@/lib/design-system/components'
import { fetchAssessments, deleteAssessment, createAssessment, fetchAssessmentProgress, AssessmentProgress } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
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
  Eye,
  HelpCircle,
  Plus
} from 'lucide-react'

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
      // Use centralized intensive check (source of truth: intensive_checklist.status)
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIsIntensiveMode(true)
        
        // Check if assessment step is completed (data is already in intensiveData)
        if (intensiveData.assessment_completed) {
          setIsIntensiveCompleted(true)
          setIntensiveCompletedAt(intensiveData.assessment_completed_at || intensiveData.created_at)
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

        {/* Hero */}
        <PageHero
          eyebrow={isIntensiveMode || isIntensiveCompleted ? "ACTIVATION INTENSIVE • STEP 4 OF 14" : undefined}
          title="Vibration Assessment"
          subtitle="Track your progress and measure your alignment across all 12 life categories."
        >
          {/* Action Buttons - Only for non-intensive users */}
          {!isIntensiveMode && !isIntensiveCompleted && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/assessment/new')}
                className="w-full sm:w-auto"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                How It Works
              </Button>
            </div>
          )}
        </PageHero>

        {/* Take New Assessment Card */}
        {!incompleteAssessment && !isIntensiveMode && !isIntensiveCompleted && (
          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex flex-col items-center gap-3 md:gap-4 mb-4 md:mb-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#1F1F1F]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2">Ready for a New Assessment?</h2>
                <p className="text-sm text-neutral-400 max-w-2xl mx-auto">
                  Take a new assessment to measure your current alignment and track your progress over time.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleCreateAssessment}
                variant="primary" 
                size="md"
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Starting Assessment...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Take New Assessment
                  </>
                )}
              </Button>
            </div>
            {errorMessage && (
              <p className="text-sm text-red-400 text-center mt-4">{errorMessage}</p>
            )}
          </Card>
        )}

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
