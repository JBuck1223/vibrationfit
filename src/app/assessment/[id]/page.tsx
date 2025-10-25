'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, ProgressBar, Spinner } from '@/lib/design-system/components'
import { fetchAssessments, deleteAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { 
  PlayCircle, 
  Trash2, 
  BarChart3, 
  PlusCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Download,
  Share,
  Calendar,
  Timer,
  Target,
  TrendingUp
} from 'lucide-react'

export default function AssessmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment()
      loadAllAssessments()
    }
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      setIsLoading(true)
      const { assessments } = await fetchAssessments()
      const foundAssessment = assessments.find(a => a.id === assessmentId)
      
      if (!foundAssessment) {
        throw new Error('Assessment not found')
      }
      
      setAssessment(foundAssessment)
    } catch (error) {
      console.error('Error fetching assessment:', error)
      setError('Failed to load assessment')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllAssessments = async () => {
    try {
      const { assessments } = await fetchAssessments()
      setAssessments(assessments)
    } catch (error) {
      console.error('Error loading assessments:', error)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await deleteAssessment(assessmentId)
      
      // Redirect back to assessment list
      router.push('/assessment')
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert('Failed to delete assessment')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'in_progress':
        return 'text-yellow-400'
      default:
        return 'text-neutral-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const calculateDuration = () => {
    if (!assessment?.completed_at) return 'Ongoing'
    const start = new Date(assessment.created_at.toString())
    const end = new Date(assessment.completed_at.toString())
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / 60000)
    return `${diffMins} minutes`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="primary" size="lg" />
          <p className="text-white mt-4">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Assessment not found'}</p>
          <Button onClick={() => router.push('/assessment')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/assessment')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Assessments
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Assessment Dashboard</h1>
                <p className="text-sm text-neutral-400">
                  Completed {formatDate((assessment.completed_at || assessment.created_at)?.toString() || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/assessment/results?id=${assessmentId}`)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Charts
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Assessment link copied to clipboard!')
                }}
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Spinner variant="primary" size="sm" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Assessment Status */}
              <Card className="p-6">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                    assessment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    assessment.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-neutral-500/20 text-neutral-400'
                  }`}>
                    {getStatusIcon(assessment.status)}
                    {assessment.status === 'completed' ? 'Completed' :
                     assessment.status === 'in_progress' ? 'In Progress' :
                     'Unknown'}
                  </div>
                  <h2 className="text-lg font-bold text-white">Assessment #{assessmentId.slice(-6)}</h2>
                </div>
              </Card>

              {/* Assessment Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Assessment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Assessment ID</span>
                    <span className="text-xs text-neutral-500 font-mono">{assessmentId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Started</span>
                    <span className="text-sm text-white">{formatDate(assessment.created_at.toString())}</span>
                  </div>
                  {assessment.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Completed</span>
                      <span className="text-sm text-white">{formatDate(assessment.completed_at.toString())}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Duration</span>
                    <span className="text-sm text-white">{calculateDuration()}</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => router.push(`/assessment/results?id=${assessmentId}`)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Detailed Results
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const dataStr = JSON.stringify(assessment, null, 2)
                      const dataBlob = new Blob([dataStr], {type: 'application/json'})
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `assessment-${assessmentId}.json`
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </Card>

              {/* Assessment History */}
              {assessments.length > 1 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Assessment History</h3>
                  <div className="space-y-2">
                    {assessments.slice(0, 5).map((a) => (
                      <div 
                        key={a.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          a.id === assessmentId ? 'bg-primary-500/20 border border-primary-500' : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                        onClick={() => router.push(`/assessment/${a.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">#{a.id.slice(-6)}</span>
                          <Badge variant={a.status === 'completed' ? 'primary' : 'neutral'} className="text-xs">
                            {a.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatDate(a.created_at.toString())}
                        </p>
                      </div>
                    ))}
                    {assessments.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => router.push('/assessment')}
                      >
                        View All ({assessments.length})
                      </Button>
                    )}
                  </div>
                </Card>
              )}

            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              
              {/* Overall Score */}
              <Card className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Overall Assessment Score</h3>
                  <div className="text-5xl font-bold text-[#39FF14] mb-2">
                    {(assessment as any).overall_score || 'N/A'}
                  </div>
                  <p className="text-neutral-400 mb-6">
                    {((assessment as any).overall_score || 0) >= 80 ? 'Excellent' :
                     ((assessment as any).overall_score || 0) >= 60 ? 'Good' :
                     ((assessment as any).overall_score || 0) >= 40 ? 'Fair' :
                     'Needs Improvement'}
                  </p>
                  <ProgressBar 
                    value={(assessment as any).overall_score || 0} 
                    variant="primary" 
                    className="h-3"
                  />
                </div>
              </Card>

              {/* Category Scores */}
              {assessment.category_scores && Object.keys(assessment.category_scores).length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Category Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(assessment.category_scores).map(([category, score]) => (
                      <div key={category} className="p-4 bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-white capitalize">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-[#39FF14]">{score}%</span>
                        </div>
                        <ProgressBar 
                          value={score as number} 
                          variant="primary" 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendations */}
              {(assessment as any).recommendations && (assessment as any).recommendations.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Recommendations</h3>
                  <div className="space-y-4">
                    {(assessment as any).recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-neutral-800 rounded-lg">
                        <div className="w-8 h-8 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#39FF14] text-sm font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm text-neutral-300">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Raw Data */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Assessment Data</h3>
                <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
                    {JSON.stringify(assessment, null, 2)}
                  </pre>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Assessment</h3>
              <p className="text-neutral-300 mb-6">
                Are you sure you want to delete this assessment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  loading={deleting}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}