'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  Container,
  Stack,
  Inline,
  Text,
  Spinner,
  DeleteConfirmationDialog,
  IntensiveStepCompleteModal,
} from '@/lib/design-system/components'
import { BarChart3, Eye, ArrowLeft, RefreshCw, Trash2, CalendarDays } from 'lucide-react'
import { fetchAssessments, fetchAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult, AssessmentResponse } from '@/types/assessment'
import ResultsSummary from '@/app/assessment/components/ResultsSummary'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'

export default function IntensiveAssessmentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const routeAssessmentId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined)

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null)
  const [otherAssessments, setOtherAssessments] = useState<AssessmentResult[]>([])
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [assessmentCompletedAt, setAssessmentCompletedAt] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()

  useEffect(() => {
    if (assessmentCompletedAt) setStepCompleted(assessmentCompletedAt)
    return () => setStepCompleted(null)
  }, [assessmentCompletedAt, setStepCompleted])

  useEffect(() => {
    async function load() {
      if (!routeAssessmentId) {
        setError('Assessment not found.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { getActiveIntensiveClient } = await import('@/lib/intensive/utils-client')
        const intensiveData = await getActiveIntensiveClient()

        if (intensiveData) {
          if (intensiveData.assessment_completed) {
            setAssessmentCompletedAt(intensiveData.assessment_completed_at || intensiveData.created_at)
          } else {
            const { markIntensiveStep } = await import('@/lib/intensive/checklist')
            const success = await markIntensiveStep('assessment_completed')
            
            if (success) {
              setAssessmentCompletedAt(new Date().toISOString())
              setShowStepCompleteModal(true)
            }
          }
        }

        const { assessments } = await fetchAssessments()
        const targetAssessment = assessments.find((a) => a.id === routeAssessmentId)

        if (!targetAssessment) {
          setError('Assessment not found.')
          return
        }

        setSelectedAssessment(targetAssessment)

        const siblings = assessments.filter((a) => a.id !== routeAssessmentId)
        setOtherAssessments(sortAssessments(siblings))

        if (targetAssessment.status === 'completed') {
          try {
            const { responses } = await fetchAssessment(targetAssessment.id, { includeResponses: true })
            setResponses(responses || [])
          } catch (responseError) {
            console.warn('Unable to load assessment responses:', responseError)
          }
        } else {
          setResponses([])
        }
      } catch (err) {
        console.error('Failed to load assessments:', err)
        setError('Unable to load assessment results. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [routeAssessmentId])

  const formatDate = (value?: Date | string | null) => {
    if (!value) return 'Not recorded'
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatStartDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return

    setDeletingId(assessmentToDelete)
    try {
      const response = await fetch(`/api/assessment/${assessmentToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete assessment')
      }

      router.push('/intensive/assessment')
    } catch (err) {
      console.error('Failed to delete assessment:', err)
      alert('Failed to delete assessment. Please try again.')
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setAssessmentToDelete(null)
    }
  }

  const sortAssessments = (items: AssessmentResult[]) => {
    const toTimestamp = (value?: Date | string | null) => {
      if (!value) return 0
      if (value instanceof Date) return value.getTime()
      return new Date(value).getTime()
    }

    return [...items].sort((a, b) => {
      const aDate = toTimestamp(a.completed_at ?? a.updated_at ?? a.created_at)
      const bDate = toTimestamp(b.completed_at ?? b.updated_at ?? b.created_at)
      return bDate - aDate
    })
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !selectedAssessment) {
    return (
      <Container size="xl" className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Text size="lg" className="mb-3 font-semibold text-white">
            We couldn&apos;t find that assessment
          </Text>
          <p className="mb-6 text-neutral-400">
            {error ?? 'Use the dashboard to navigate back.'}
          </p>
          <Inline gap="sm" className="justify-center">
            <Button variant="primary" onClick={() => router.push('/intensive/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Inline>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {selectedAssessment.status === 'completed' ? (
          <ResultsSummary 
            assessment={selectedAssessment} 
            responses={responses}
          />
        ) : (
          <Card className="p-8 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
            <Text size="lg" className="mb-2 font-semibold text-white">
              Assessment In Progress
            </Text>
            <p className="text-neutral-400">
              Complete this assessment to unlock detailed insights and a Green Line breakdown.
            </p>
          </Card>
        )}

        {showHistory && (
          <Card className="p-6 mt-6 md:mt-8">
            <Stack gap="md">
              <Inline className="items-center justify-between">
                <Text size="lg" className="font-semibold text-white">
                  Assessment History
                </Text>
                <Badge variant="info">
                  {otherAssessments.length} {otherAssessments.length === 1 ? 'Assessment' : 'Assessments'}
                </Badge>
              </Inline>

              {otherAssessments.length === 0 ? (
                <Text size="sm" className="text-neutral-400">
                  This is your only assessment so far.
                </Text>
              ) : (
                <Stack gap="sm">
                  {otherAssessments.map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => router.push(`/intensive/assessment/${assessment.id}/results`)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        assessment.is_active
                          ? 'border-primary-500 bg-primary-500/10 hover:border-primary-400'
                          : assessment.is_draft
                            ? 'border-secondary-500 bg-secondary-500/10 hover:border-secondary-400'
                            : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      <Inline className="items-center justify-between">
                        <Text size="sm" className="font-semibold text-white">
                          Assessment #{assessment.id.slice(-6)}
                        </Text>
                        <Badge variant={assessment.is_draft ? 'warning' : assessment.is_active ? 'primary' : 'success'}>
                          {assessment.is_draft ? 'Draft' : assessment.is_active ? 'Most Recent' : 'Completed'}
                        </Badge>
                      </Inline>
                      <Text size="xs" className="mt-1 text-neutral-400">
                        Updated {formatDate(assessment.updated_at)}
                      </Text>
                    </button>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        )}

        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false)
            setAssessmentToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          itemName="assessment"
          isDeleting={deletingId !== null}
        />
      </Stack>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="assessment"
      />
    </Container>
  )
}
