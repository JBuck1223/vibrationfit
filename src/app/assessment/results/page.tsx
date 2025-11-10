'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge } from '@/lib/design-system/components'
import { BarChart3, RefreshCw, Play, Plus, Eye } from 'lucide-react'
import { fetchAssessments, fetchAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult, AssessmentResponse } from '@/types/assessment'
import ResultsSummary from '../components/ResultsSummary'

export default function AssessmentResultsOverview() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingResponses, setLoadingResponses] = useState(false)

  useEffect(() => {
    loadAssessments()
  }, [])

  useEffect(() => {
    if (!assessments.length) {
      setSelectedAssessmentId(null)
      setSelectedAssessment(null)
      setResponses([])
      return
    }

    if (selectedAssessmentId) {
      const found = assessments.find(a => a.id === selectedAssessmentId)
      if (found) {
        setSelectedAssessment(found)
        loadResponses(found.id, found.status === 'completed')
        return
      }
    }

    // Default to most recent completed, otherwise most recent overall
    const sorted = sortAssessments(assessments)
    const defaultAssessment = sorted.find(a => a.status === 'completed') ?? sorted[0]
    setSelectedAssessmentId(defaultAssessment?.id ?? null)
    setSelectedAssessment(defaultAssessment ?? null)
    if (defaultAssessment) {
      loadResponses(defaultAssessment.id, defaultAssessment.status === 'completed')
    } else {
      setResponses([])
    }
  }, [assessments, selectedAssessmentId])

  const loadAssessments = async () => {
    try {
      setLoading(true)
      setError(null)
      const { assessments } = await fetchAssessments()
      setAssessments(assessments)
    } catch (err) {
      console.error('Failed to load assessments:', err)
      setError('Unable to load your assessments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (assessmentId: string, shouldLoad: boolean) => {
    if (!shouldLoad) {
      setResponses([])
      return
    }

    try {
      setLoadingResponses(true)
      const { responses } = await fetchAssessment(assessmentId, { includeResponses: true })
      setResponses(responses || [])
    } catch (err) {
      console.warn('Unable to load assessment responses:', err)
      setResponses([])
    } finally {
      setLoadingResponses(false)
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

  const sortedAssessments = useMemo(() => sortAssessments(assessments), [assessments])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-neutral-400">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
            <p>Loading your assessments...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-xl p-8 text-center">
            <p className="mb-4 text-red-400">{error}</p>
            <Button variant="primary" onClick={loadAssessments}>
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!sortedAssessments.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-neutral-500" />
            <h2 className="mb-2 text-2xl font-semibold text-white">No Assessments Yet</h2>
            <p className="mb-6 text-neutral-400">
              Start a Vibrational Assessment to see your results and alignment insights here.
            </p>
            <Button variant="primary" onClick={() => router.push('/assessment')}>
              Start Assessment
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const statusBadgeVariant = (assessment: AssessmentResult) => {
    if (assessment.is_draft || assessment.status === 'in_progress') return 'warning'
    if (assessment.is_active) return 'primary'
    return 'success'
  }

  const statusLabel = (assessment: AssessmentResult) => {
    if (assessment.is_draft || assessment.status === 'in_progress') return 'Draft'
    if (assessment.is_active) return 'Most Recent'
    return 'Completed'
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Assessment Results</h1>
            <p className="mt-2 text-neutral-400">
              Review every Vibrational Assessment you have completed and revisit any drafts in progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push('/assessment/history')} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View History
            </Button>
            <Button variant="primary" onClick={() => router.push('/assessment')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start Assessment
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Your Assessments</h3>
              <div className="space-y-3">
                {sortedAssessments.map((assessment) => {
                  const isSelected = assessment.id === selectedAssessmentId
                  return (
                    <button
                      key={assessment.id}
                      onClick={() => setSelectedAssessmentId(assessment.id)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                          : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          Assessment #{assessment.id.slice(-6)}
                        </span>
                        <Badge variant={statusBadgeVariant(assessment)}>{statusLabel(assessment)}</Badge>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-neutral-400">
                        <span>Started: {formatDate(assessment.started_at)}</span>
                        <span>Updated: {formatDate(assessment.updated_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {selectedAssessment ? (
              <>
                <Card className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-white">
                          Assessment #{selectedAssessment.id.slice(-6)}
                        </h2>
                        <Badge variant={statusBadgeVariant(selectedAssessment)}>
                          {statusLabel(selectedAssessment)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-neutral-400 sm:grid-cols-2">
                        <span>
                          Status:{' '}
                          <span className="text-neutral-200 capitalize">
                            {selectedAssessment.status.replace('_', ' ')}
                          </span>
                        </span>
                        <span>
                          Completed:{' '}
                          <span className="text-neutral-200">
                            {selectedAssessment.completed_at
                              ? formatDate(selectedAssessment.completed_at)
                              : 'Not yet'}
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
                          <Play className="h-4 w-4" />
                          Continue
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => router.push(`/assessment/${selectedAssessment.id}/results`)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Open Detailed Results
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
                      Complete this assessment to unlock detailed insights and your Green Line breakdown.
                    </p>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                <h3 className="mb-2 text-xl font-semibold text-white">Select an Assessment</h3>
                <p className="text-neutral-400">
                  Choose an assessment from the list to view its vibrational alignment results.
                </p>
              </Card>
            )}

            {loadingResponses && selectedAssessment?.status === 'completed' && (
              <div className="text-sm text-neutral-500">Refreshing responses…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
