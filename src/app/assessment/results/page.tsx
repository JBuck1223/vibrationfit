'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/lib/design-system/components'
import { BarChart3, RefreshCw, Play, Plus, Eye } from 'lucide-react'
import { fetchAssessments, fetchAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import ResultsSummary from '../components/ResultsSummary'

export default function AssessmentResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<any[]>([])

  useEffect(() => {
    loadAssessments()
  }, [])

  // Load responses when selectedAssessment changes
  useEffect(() => {
    if (selectedAssessment && selectedAssessment.status === 'completed') {
      loadResponses(selectedAssessment.id)
    }
  }, [selectedAssessment])

  const loadAssessments = async () => {
    try {
      const { assessments: assessmentData } = await fetchAssessments()
      setAssessments(assessmentData)
      
      // Check for specific assessment ID in URL
      const assessmentIdParam = searchParams.get('id')
      
      if (assessmentIdParam) {
        // Load specific assessment from URL
        const specificAssessment = assessmentData.find(a => a.id === assessmentIdParam)
        if (specificAssessment) {
          setSelectedAssessment(specificAssessment)
          console.log('Loaded specific assessment from URL:', assessmentIdParam)
        } else {
          console.error('Assessment not found:', assessmentIdParam)
          setError('Assessment not found')
        }
      } else {
        // Auto-select the most recent completed assessment
        const completedAssessments = assessmentData.filter(a => a.status === 'completed')
        if (completedAssessments.length > 0) {
          setSelectedAssessment(completedAssessments[0])
        }
      }
    } catch (err) {
      setError('Failed to load assessments')
      console.error('Error loading assessments:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (assessmentId: string) => {
    try {
      const { responses } = await fetchAssessment(assessmentId, { includeResponses: true })
      setResponses(responses || [])
    } catch (err) {
      console.error('Error loading responses:', err)
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'not_started':
        return 'info'
      default:
        return 'info'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'not_started':
        return 'Not Started'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-[#39FF14] mx-auto mb-4" />
            <div className="text-neutral-400">Loading your assessments...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={loadAssessments} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Assessment Results</h1>
          <p className="text-neutral-400">
            View and analyze your vibrational assessment results
          </p>
        </div>
          {/* Assessment Details */}
          {selectedAssessment ? (
              <div className="space-y-6">
                {/* Assessment Header */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Assessment Results
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>Completed {formatDate(selectedAssessment.created_at)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Assessment ID:</span>
                        <code className="text-xs text-neutral-300 bg-neutral-800 px-2 py-1 rounded">
                          {selectedAssessment.id}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/assessment')}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        New Assessment
                      </Button>
                      {selectedAssessment.status === 'in_progress' && (
                        <Button
                          variant="primary"
                          onClick={() => router.push('/assessment')}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Continue Assessment
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedAssessment.status === 'completed' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">
                          {selectedAssessment.total_score}
                        </div>
                        <div className="text-sm text-neutral-400">Total Score</div>
                      </div>
                      <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">
                          {selectedAssessment.overall_percentage}%
                        </div>
                        <div className="text-sm text-neutral-400">Overall</div>
                      </div>
                      <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">
                          {selectedAssessment.max_possible_score}
                        </div>
                        <div className="text-sm text-neutral-400">Max Possible</div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Results Summary */}
                {selectedAssessment.status === 'completed' && (
                  <ResultsSummary assessment={selectedAssessment} responses={responses} />
                )}

                {/* In Progress Assessment */}
                {selectedAssessment.status === 'in_progress' && (
                  <Card className="p-6">
                    <div className="text-center py-8">
                      <BarChart3 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Assessment In Progress
                      </h3>
                      <p className="text-neutral-400 mb-6">
                        Complete your assessment to see detailed results
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => router.push('/assessment')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Continue Assessment
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-6">
                <div className="text-center py-16">
                  <BarChart3 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Assessment Selected
                  </h3>
                  <p className="text-neutral-400 mb-6">
                    Use a URL with an assessment ID or take a new assessment to view results.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/assessment')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Take Assessment
                  </Button>
                </div>
              </Card>
            )}
      </div>
    </div>
  )
}
