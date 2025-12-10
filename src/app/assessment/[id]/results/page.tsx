'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Container,
  Stack,
  Inline,
  Text,
  PageHero,
} from '@/lib/design-system/components'
import { BarChart3, Eye, Plus, ArrowLeft, History, RefreshCw } from 'lucide-react'
import { fetchAssessments, fetchAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult, AssessmentResponse } from '@/types/assessment'
import ResultsSummary from '../../components/ResultsSummary'

export default function AssessmentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const routeAssessmentId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined)

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null)
  const [otherAssessments, setOtherAssessments] = useState<AssessmentResult[]>([])
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

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
      <Container size="xl" className="py-12">
        <Stack gap="sm" className="items-center text-center text-neutral-400">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          <p>Loading assessment results...</p>
        </Stack>
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
            {error ?? 'Use the assessment hub to browse all of your drafts and completions.'}
          </p>
          <Inline gap="sm" className="justify-center">
            <Button variant="outline" onClick={() => router.push('/assessment')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessment Hub
            </Button>
            <Button variant="primary" onClick={() => router.push('/assessment/history')}>
              View Assessment History
            </Button>
          </Inline>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="">
      <PageHero
        title="Assessment Results"
        subtitle="Review your vibrational alignment scores and insights."
        actions={[
          <button
            key="back"
            onClick={() => router.push('/assessment')}
            className="inline-flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment Hub
          </button>,
          ...(otherAssessments.length > 0
            ? [
                <Button
                  key="history"
                  variant={showHistory ? 'primary' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowHistory((prev) => !prev)}
                >
                  <History className="h-4 w-4" />
                  {showHistory ? 'Hide History' : 'Show History'}
                </Button>,
              ]
            : []),
          <Button
            key="new"
            variant="primary"
            size="sm"
            onClick={() => router.push('/assessment')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Start New Assessment
          </Button>,
        ]}
        className="mb-6 md:mb-8"
      />

      <Stack gap="lg">
          <Card className="p-6 md:p-8">
            <Stack gap="md">
              <Stack gap="sm">
                <Inline gap="sm" className="flex-wrap items-center">
                  <Text size="lg" className="text-white font-semibold">
                    Assessment #{selectedAssessment.id.slice(-6)}
                  </Text>
                  {selectedAssessment.is_draft && <Badge variant="warning">Draft</Badge>}
                  {selectedAssessment.is_active && !selectedAssessment.is_draft && (
                    <Badge variant="primary">Most Recent</Badge>
                  )}
                  {!selectedAssessment.is_draft && !selectedAssessment.is_active && (
                    <Badge variant="success">Completed</Badge>
                  )}
                </Inline>
                <div className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-2">
                  <div>
                    Started:{' '}
                    <span className="text-neutral-200">{formatDate(selectedAssessment.started_at)}</span>
                  </div>
                  <div>
                    Updated:{' '}
                    <span className="text-neutral-200">{formatDate(selectedAssessment.updated_at)}</span>
                  </div>
                  <div>
                    Status:{' '}
                    <span className="text-neutral-200 capitalize">
                      {selectedAssessment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    Completed:{' '}
                    <span className="text-neutral-200">
                      {selectedAssessment.completed_at ? formatDate(selectedAssessment.completed_at) : 'Not yet'}
                    </span>
                  </div>
                </div>
              </Stack>

              <Inline gap="sm" className="flex-wrap justify-start">
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
              </Inline>
            </Stack>
          </Card>

          {selectedAssessment.status === 'completed' ? (
            <ResultsSummary assessment={selectedAssessment} responses={responses} />
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
        </Stack>

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
                  This is your only assessment so far. Start a new one to compare your progress.
                </Text>
              ) : (
                <Stack gap="sm">
                  {otherAssessments.map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => router.push(`/assessment/${assessment.id}/results`)}
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
    </Container>
  )
}

