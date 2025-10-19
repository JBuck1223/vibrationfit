'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, PageLayout } from '@/lib/design-system/components'
import { fetchAssessments } from '@/lib/services/assessmentService'
import { AssessmentResult } from '@/types/assessment'
import { CheckCircle, PlayCircle, Clock, BarChart3 } from 'lucide-react'

export default function AssessmentLandingPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const handleStartNew = () => {
    router.push('/assessment/in-progress?new=true')
  }

  const handleViewResults = (assessmentId: string) => {
    router.push(`/assessment/results?id=${assessmentId}`)
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
          <h1 className="text-4xl font-bold mb-4">Life Assessment</h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Discover where you stand across 12 key life areas and get personalized insights 
            to help you move above the Green Line.
          </p>
        </div>

        {/* Continue Assessment Section */}
        {incompleteAssessment && (
          <Card variant="elevated" className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Continue Your Assessment</h2>
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
                    {incompleteAssessment.total_responses || 0} questions answered
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-500 font-medium">Status</p>
                  <p className="text-sm text-neutral-300">In Progress</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleContinueAssessment}
              variant="primary" 
              size="lg"
              className="w-full"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Continue Assessment
            </Button>
          </Card>
        )}

        {/* Start New Assessment Section */}
        <Card variant="elevated" className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
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
            <PlayCircle className="w-5 h-5 mr-2" />
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
                  Review your past assessment results and track your progress
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {completedAssessments.slice(0, 3).map((assessment) => (
                <div 
                  key={assessment.id}
                  className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div>
                    <p className="font-medium">Assessment Completed</p>
                    <p className="text-sm text-neutral-400">
                      Started: {formatDate(assessment.started_at || assessment.created_at)}
                    </p>
                    <p className="text-sm text-neutral-400">
                      Completed: {formatDate(assessment.completed_at)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleViewResults(assessment.id)}
                    variant="ghost"
                    size="sm"
                  >
                    View Results
                  </Button>
                </div>
              ))}
              
              {completedAssessments.length > 3 && (
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
      </Container>
    </PageLayout>
  )
}
