'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge } from '@/lib/design-system/components'
import { RefreshCw, BarChart3, Eye, Plus, ArrowLeft } from 'lucide-react'
import { fetchAssessments, fetchAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult, AssessmentResponse } from '@/types/assessment'
import ResultsSummary from '../../components/ResultsSummary'

export default function AssessmentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const routeAssessmentId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined)

  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        const { assessments } = await fetchAssessments()
        setAssessments(assessments)

        const targetAssessment = assessments.find(a => a.id === routeAssessmentId)

        if (!targetAssessment) {
          setError('Assessment not found.')
          return
        }

        setSelectedAssessment(targetAssessment)

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

  const sortedAssessments = [...assessments].sort((a, b) => {
    const toTimestamp = (val?: Date | string | null) => {
      if (!val) return 0
      if (val instanceof Date) return val.getTime()
      return new Date(val).getTime()
    }
    const aDate = toTimestamp(a.completed_at ?? a.updated_at ?? a.created_at)
    const bDate = toTimestamp(b.completed_at ?? b.updated_at ?? b.created_at)
    return bDate - aDate
  })

  const otherAssessments = sortedAssessments.filter(a => a.id !== selectedAssessment?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-neutral-400">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
            <p>Loading assessment results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !selectedAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-xl p-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold text-white">We couldn&apos;t find that assessment</h2>
            <p className="mb-6 text-neutral-400">
              {error ?? 'Use the assessment hub to browse all of your drafts and completions.'}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/assessment')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessment Hub
              </Button>
              <Button variant="primary" onClick={() => router.push('/assessment/history')}>
                View Assessment History
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => router.push('/assessment')}
              className="mb-3 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assessment Hub
            </button>
            <h1 className="text-4xl font-bold text-white">Assessment Results</h1>
            <p className="mt-2 text-neutral-400">
              Review your vibrational alignment scores and insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push('/assessment/history')} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Assessment History
            </Button>
            <Button variant="primary" onClick={() => router.push('/assessment')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start New Assessment
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-white">
                      Assessment #{selectedAssessment.id.slice(-6)}
                    </h2>
                    {selectedAssessment.is_draft && (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {selectedAssessment.is_active && !selectedAssessment.is_draft && (
                      <Badge variant="primary">Most Recent</Badge>
                    )}
                    {!selectedAssessment.is_draft && !selectedAssessment.is_active && (
                      <Badge variant="success">Completed</Badge>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm text-neutral-400 sm:grid-cols-2">
                    <span>
                      Started:{' '}
                      <span className="text-neutral-200">
                        {formatDate(selectedAssessment.started_at)}
                      </span>
                    </span>
                    <span>
                      Updated:{' '}
                      <span className="text-neutral-200">
                        {formatDate(selectedAssessment.updated_at)}
                      </span>
                    </span>
                    <span>
                      Status:{' '}
                      <span className="text-neutral-200 capitalize">
                        {selectedAssessment.status.replace('_', ' ')}
                      </span>
                    </span>
                    <span>
                      Completed:{' '}
                      <span className="text-neutral-200">
                        {selectedAssessment.completed_at ? formatDate(selectedAssessment.completed_at) : 'Not yet'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAssessment.status === 'in_progress' ? (
                    <Button
                      variant="primary"
                      className="flex items-center gap-2"
                      onClick={() => router.push(`/assessment/${selectedAssessment.id}/in-progress`)}
                    >
                      <Eye className="h-4 w-4" />
                      Continue Assessment
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => router.push(`/assessment/${selectedAssessment.id}/in-progress`)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Review Questions
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {selectedAssessment.status === 'completed' ? (
              <ResultsSummary assessment={selectedAssessment} responses={responses} />
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                <h3 className="mb-2 text-xl font-semibold text-white">Assessment In Progress</h3>
                <p className="text-neutral-400">
                  Complete this assessment to unlock detailed insights and a Green Line breakdown.
                </p>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Other Assessments</h3>
              {otherAssessments.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  This is your only assessment so far. Start a new one to compare your progress.
                </p>
              ) : (
                <div className="space-y-2">
                  {otherAssessments.map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => router.push(`/assessment/${assessment.id}/results`)}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
                        assessment.is_active
                          ? 'border-primary-500 bg-primary-500/10 hover:border-primary-400'
                          : assessment.is_draft
                            ? 'border-secondary-500 bg-secondary-500/10 hover:border-secondary-400'
                            : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">
                          Assessment #{assessment.id.slice(-6)}
                        </span>
                        <Badge variant={assessment.is_draft ? 'warning' : assessment.is_active ? 'primary' : 'success'}>
                          {assessment.is_draft ? 'Draft' : assessment.is_active ? 'Most Recent' : 'Completed'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        Updated {formatDate(assessment.updated_at)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

