'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, PageLayout, Button, Card, Badge, ProgressBar } from '@/lib/design-system/components'
import { ArrowLeft, Calendar, BarChart3, Eye, Download, RefreshCw, Trash2, Copy } from 'lucide-react'
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
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [])

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

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return
    }

    setDeleting(assessmentId)
    try {
      const response = await fetch(`/api/assessment?id=${assessmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete assessment')
      }

      // Remove from local state
      setAssessments(prev => prev.filter(a => a.id !== assessmentId))
      
      // Clear selection if deleted assessment was selected
      if (selectedAssessment?.id === assessmentId) {
        const remainingAssessments = assessments.filter(a => a.id !== assessmentId)
        setSelectedAssessment(remainingAssessments.length > 0 ? remainingAssessments[0] : null)
      }
    } catch (err) {
      setError('Failed to delete assessment')
      console.error('Error deleting assessment:', err)
    } finally {
      setDeleting(null)
    }
  }

  const copyAssessmentId = (assessmentId: string) => {
    navigator.clipboard.writeText(assessmentId)
    // You could add a toast notification here
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
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-[#39FF14] mx-auto mb-4" />
            <div className="text-neutral-400">Loading your assessments...</div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="text-center py-16">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={loadAssessments} variant="primary">
              Try Again
            </Button>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Assessment Results</h1>
            <p className="text-neutral-400">
              View and analyze your vibrational assessment results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assessment List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Assessments</h2>
              
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-4">No assessments yet</p>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push('/assessment')}
                  >
                    Take Your First Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAssessment?.id === assessment.id
                          ? 'border-[#39FF14] bg-[#39FF14]/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => setSelectedAssessment(assessment)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-300">
                              {formatDate(assessment.created_at)}
                            </span>
                          </div>
                          <Badge variant={getStatusColor(assessment.status)}>
                            {getStatusLabel(assessment.status)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-neutral-400 mb-2">
                          Assessment ID: {assessment.id.substring(0, 8)}...
                        </div>
                        
                        {assessment.status === 'completed' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-300">Score</span>
                              <span className="text-white font-medium">
                                {assessment.total_score}/{assessment.max_possible_score}
                              </span>
                            </div>
                            <ProgressBar
                              value={assessment.overall_percentage || 0}
                              variant="primary"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyAssessmentId(assessment.id)
                          }}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          Copy ID
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAssessment(assessment.id)
                          }}
                          disabled={deleting === assessment.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          {deleting === assessment.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Assessment Details */}
          <div className="lg:col-span-2">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAssessmentId(selectedAssessment.id)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
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
                  <ResultsSummary assessment={selectedAssessment} />
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
                    Select an Assessment
                  </h3>
                  <p className="text-neutral-400">
                    Choose an assessment from the list to view its results
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </PageLayout>
  )
}
