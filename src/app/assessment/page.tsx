'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, PageHero, StatusBadge, DeleteConfirmationDialog, Container, Stack, Spinner } from '@/lib/design-system/components'
import { fetchAssessments, deleteAssessment, createAssessment, fetchAssessmentProgress, AssessmentProgress } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { 
  PlayCircle, 
  Trash2, 
  BarChart3, 
  PlusCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  CalendarDays 
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
  }, [])

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

  const handleStartNew = async () => {
    try {
      setErrorMessage(null)
      setIsCreating(true)
      const { assessment } = await createAssessment()
      router.push(`/assessment/${assessment.id}/in-progress`)
    } catch (error: any) {
      console.error('Failed to create assessment:', error)
      const message =
        error?.message ||
        (error instanceof Error ? error.message : 'Failed to start new assessment. Please try again.')
      setErrorMessage(message)
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <PageHero
          title="Assessment Hub"
          subtitle="Manage your life assessments and track your progress across 12 key life areas."
        />

        {/* In-Progress Assessment Section */}
        {incompleteAssessment && (
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

        {/* Start New Assessment Section */}
        <Card variant="elevated" className="p-4 md:p-6">
          <div className="flex flex-col items-center gap-3 md:gap-4 mb-4 md:mb-6 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-5 h-5 md:w-6 md:h-6 text-[#1F1F1F]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-1 md:mb-2">
                Start New Assessment
              </h2>
              <p className="text-xs md:text-sm text-neutral-400">
                {incompleteAssessment
                  ? 'Complete or delete your current assessment to begin another Vibrational Assessment.'
                  : 'Begin your journey of self-discovery across 12 life areas.'
                }
              </p>
            </div>
          </div>

          <div className="bg-secondary-500/10 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
            <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-3 text-secondary-500">What You'll Get:</h3>
            <ul className="space-y-2 text-xs md:text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-secondary-500 flex-shrink-0" />
                84 personalized questions across 12 life areas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-secondary-500 flex-shrink-0" />
                Detailed analysis of where you stand vs. the Green Line
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-secondary-500 flex-shrink-0" />
                Personalized insights and recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-secondary-500 flex-shrink-0" />
                Progress tracking over time
              </li>
            </ul>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 md:p-4 text-xs md:text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <Button 
            onClick={handleStartNew}
            variant="secondary" 
            size="md"
            className="w-full"
            loading={isCreating}
            disabled={Boolean(incompleteAssessment) || isCreating}
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            {incompleteAssessment ? 'Finish Current Assessment First' : 'Start New Assessment'}
          </Button>
        </Card>

        {/* Previous Assessments Section */}
        {completedAssessments.length > 0 && (
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

        {/* Empty State */}
        {assessments.length === 0 && (
          <Card variant="default" className="text-center p-8 md:p-12">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-neutral-700 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-sm md:text-base text-neutral-400 mb-4 md:mb-6">
              Start your first assessment to see how you vibrate across 12 life areas.
            </p>
            <Button 
              onClick={handleStartNew}
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Start Your First Assessment
            </Button>
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
        itemType="assessment"
        isLoading={deletingId === assessmentToDelete}
      />
    </Container>
  )
}