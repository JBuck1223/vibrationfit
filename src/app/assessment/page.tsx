'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, PageLayout, Badge } from '@/lib/design-system/components'
import { fetchAssessments, deleteAssessment } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { 
  PlayCircle, 
  Trash2, 
  BarChart3, 
  PlusCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react'

export default function AssessmentHub() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [])

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

  const incompleteAssessment = assessments.find(a => a.status === 'in_progress')
  const completedAssessments = assessments.filter(a => a.status === 'completed')

  const handleContinueAssessment = () => {
    if (incompleteAssessment) {
      router.push(`/assessment/in-progress?assessmentId=${incompleteAssessment.id}&resume=true`)
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return
    }

    setDeletingId(assessmentId)
    try {
      await deleteAssessment(assessmentId)
      await loadAssessments() // Reload the list
    } catch (error) {
      console.error('Failed to delete assessment:', error)
      alert('Failed to delete assessment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewResults = (assessmentId: string) => {
    router.push(`/assessment/results?id=${assessmentId}`)
  }

  const handleStartNew = () => {
    router.push('/assessment/in-progress?new=true')
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

  if (isLoading) {
    return (
      <PageLayout>
        <Container size="lg" className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-neutral-400">Loading your assessments...</p>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="lg" className="py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Assessment Hub</h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Manage your life assessments and track your progress across 12 key life areas.
          </p>
        </div>

        {/* In-Progress Assessment Section */}
        {incompleteAssessment && (
          <Card variant="elevated" className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold">Assessment In Progress</h2>
                  <Badge variant="info">Active</Badge>
                </div>
                <p className="text-neutral-400">
                  Assessment ID: <span className="font-mono text-primary-500">{incompleteAssessment.id}</span> Started on {formatDate(incompleteAssessment.started_at || incompleteAssessment.created_at)}
                </p>
              </div>
            </div>
            
            <div className="bg-primary-500/10 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-500 font-medium">Progress</p>
                  <p className="text-sm text-neutral-300">
                    Assessment in progress
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-500 font-medium">Status</p>
                  <p className="text-sm text-neutral-300">In Progress</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleContinueAssessment}
                variant="primary" 
                size="lg"
                className="flex-1"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Continue Assessment
              </Button>
              <Button 
                onClick={() => handleDeleteAssessment(incompleteAssessment.id)}
                variant="danger" 
                size="lg"
                disabled={deletingId === incompleteAssessment.id}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {deletingId === incompleteAssessment.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        )}

        {/* Start New Assessment Section */}
        <Card variant="elevated" className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {incompleteAssessment ? 'Start Fresh Assessment' : 'Start New Assessment'}
              </h2>
              <p className="text-neutral-400">
                {incompleteAssessment 
                  ? 'Begin a new assessment to compare your progress over time'
                  : 'Begin your journey of self-discovery across 12 life areas'
                }
              </p>
            </div>
          </div>

          <div className="bg-secondary-500/10 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 text-secondary-500">What You'll Get:</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
                84 personalized questions across 12 life areas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
                Detailed analysis of where you stand vs. the Green Line
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
                Personalized insights and recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
                Progress tracking over time
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleStartNew}
            variant="secondary" 
            size="lg"
            className="w-full"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            {incompleteAssessment ? 'Start Fresh Assessment' : 'Start New Assessment'}
          </Button>
        </Card>

        {/* Previous Assessments Section */}
        {completedAssessments.length > 0 && (
          <Card variant="default">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Previous Assessments</h2>
                <p className="text-neutral-400">
                  Review your past assessment results and track your progress over time
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {completedAssessments.slice(0, 5).map((assessment) => (
                <div 
                  key={assessment.id}
                  className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">Assessment Completed</p>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <p className="text-sm text-neutral-400">
                      Started: {formatDate(assessment.started_at || assessment.created_at)}
                    </p>
                    <p className="text-sm text-neutral-400">
                      Completed: {assessment.completed_at ? formatDate(assessment.completed_at) : 'Not completed'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewResults(assessment.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      See Results
                    </Button>
                    <Button 
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      variant="danger"
                      size="sm"
                      disabled={deletingId === assessment.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {completedAssessments.length > 5 && (
                <div className="text-center pt-4">
                  <Button 
                    onClick={() => router.push('/assessment/results')}
                    variant="outline"
                    size="sm"
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
          <Card variant="default" className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-neutral-400 mb-6">
              Start your first assessment to begin tracking your progress across 12 life areas.
            </p>
            <Button 
              onClick={handleStartNew}
              variant="primary"
              size="lg"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Start Your First Assessment
            </Button>
          </Card>
        )}
      </Container>
    </PageLayout>
  )
}