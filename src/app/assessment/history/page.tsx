'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { fetchAssessments } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { RefreshCw, BarChart3, PlayCircle } from 'lucide-react'

export default function AssessmentHistoryPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { assessments } = await fetchAssessments()
        setAssessments(assessments)
      } catch (err) {
        console.error('Failed to load assessments:', err)
        setError('Unable to load your assessment history. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatDate = (value?: Date | string | null) => {
    if (!value) return 'Not recorded'
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center gap-4 text-neutral-400 py-20">
          <Spinner variant="primary" size="lg" />
          <p>Loading your assessment history...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <Button onClick={() => router.refresh()} variant="primary">
            Try Again
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Assessment History"
          subtitle="Review every Vibrational Assessment you've completed and resume drafts in progress."
        />

        {sortedAssessments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-neutral-400">No assessments yet. Start your first assessment to see your history here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedAssessments.map((assessment) => {
              const isDraft = assessment.is_draft || assessment.status === 'in_progress'
              const isActive = assessment.is_active && assessment.status === 'completed'

              return (
                <Card
                  key={assessment.id}
                  className={`border-2 transition-all ${
                    isDraft
                      ? 'border-secondary-500/60 bg-secondary-500/10'
                      : isActive
                        ? 'border-primary-500/60 bg-primary-500/10'
                        : 'border-neutral-700 bg-neutral-800/60'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">
                          Assessment #{assessment.id.slice(-6)}
                        </h2>
                        {isDraft && <Badge variant="warning">Draft</Badge>}
                        {isActive && <Badge variant="primary">Most Recent</Badge>}
                        {!isDraft && !isActive && <Badge variant="success">Completed</Badge>}
                      </div>
                      <div className="grid gap-2 text-sm text-neutral-400 sm:grid-cols-2">
                        <span>
                          Started: <span className="text-neutral-200">{formatDate(assessment.started_at)}</span>
                        </span>
                        <span>
                          Updated: <span className="text-neutral-200">{formatDate(assessment.updated_at)}</span>
                        </span>
                        <span>
                          Status: <span className="text-neutral-200 capitalize">{assessment.status.replace('_', ' ')}</span>
                        </span>
                        <span>
                          Completed:{' '}
                          <span className="text-neutral-200">
                            {assessment.completed_at ? formatDate(assessment.completed_at) : 'Not yet'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isDraft ? (
                        <Button
                          variant="primary"
                          onClick={() => router.push(`/assessment/${assessment.id}/in-progress`)}
                          className="flex items-center gap-2"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/assessment/${assessment.id}/results`)}
                          className="flex items-center gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}

