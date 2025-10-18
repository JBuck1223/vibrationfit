// /src/lib/services/assessmentService.ts
// Client-side service for assessment operations

import { AssessmentResult, AssessmentResponse, AssessmentCategory } from '@/types/assessment'

export interface AssessmentProgress {
  overall: {
    total: number
    answered: number
    percentage: number
  }
  categories: Record<string, {
    total: number
    answered: number
    percentage: number
  }>
  is_complete: boolean
}

export interface AssessmentWithDetails {
  assessment: AssessmentResult
  responses: AssessmentResponse[] | null
  insights: any[] | null
}

// ============================================================================
// Assessment CRUD
// ============================================================================

/**
 * Create a new assessment
 */
export async function createAssessment(
  profileVersionId?: string,
  assessmentVersion: number = 1
): Promise<{ assessment: AssessmentResult }> {
  const response = await fetch('/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_version_id: profileVersionId,
      assessment_version: assessmentVersion
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create assessment')
  }

  return response.json()
}

/**
 * Fetch all assessments for current user
 */
export async function fetchAssessments(): Promise<{ assessments: AssessmentResult[] }> {
  const response = await fetch('/api/assessment')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch assessments')
  }

  return response.json()
}

/**
 * Fetch a specific assessment by ID
 */
export async function fetchAssessment(
  assessmentId: string,
  options: {
    includeResponses?: boolean
    includeInsights?: boolean
  } = {}
): Promise<AssessmentWithDetails> {
  const params = new URLSearchParams({
    id: assessmentId,
    ...(options.includeResponses && { includeResponses: 'true' }),
    ...(options.includeInsights && { includeInsights: 'true' })
  })

  const response = await fetch(`/api/assessment?${params}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch assessment')
  }

  return response.json()
}

/**
 * Update assessment (status, notes, etc.)
 */
export async function updateAssessment(
  assessmentId: string,
  updates: {
    status?: 'not_started' | 'in_progress' | 'completed'
    notes?: string
  }
): Promise<{ assessment: AssessmentResult }> {
  const response = await fetch('/api/assessment', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: assessmentId,
      ...updates
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update assessment')
  }

  return response.json()
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(assessmentId: string): Promise<void> {
  const response = await fetch(`/api/assessment?id=${assessmentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete assessment')
  }
}

// ============================================================================
// Response Management
// ============================================================================

/**
 * Save or update a response
 */
export async function saveResponse(responseData: {
  assessment_id: string
  question_id: string
  question_text: string
  category: AssessmentCategory
  response_value: number
  response_text: string
  response_emoji?: string
  green_line: 'above' | 'neutral' | 'below'
  is_custom_response?: boolean
  ai_score?: number
  ai_green_line?: 'above' | 'neutral' | 'below'
}): Promise<{ response: AssessmentResponse }> {
  console.log('Sending to API:', responseData)
  
  const response = await fetch('/api/assessment/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(responseData)
  })

  console.log('API response status:', response.status)
  console.log('API response ok:', response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API error response:', errorText)
    
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { error: errorText }
    }
    
    throw new Error(errorData.error || 'Failed to save response')
  }

  return response.json()
}

/**
 * Fetch responses for an assessment
 */
export async function fetchResponses(
  assessmentId: string,
  category?: AssessmentCategory
): Promise<{ responses: AssessmentResponse[] }> {
  const params = new URLSearchParams({ assessmentId })
  if (category) {
    params.append('category', category)
  }

  const response = await fetch(`/api/assessment/responses?${params}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch responses')
  }

  return response.json()
}

/**
 * Delete a response
 */
export async function deleteResponse(
  assessmentId: string,
  questionId: string
): Promise<void> {
  const params = new URLSearchParams({
    assessmentId,
    questionId
  })

  const response = await fetch(`/api/assessment/responses?${params}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete response')
  }
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Get assessment progress
 */
export async function fetchAssessmentProgress(
  assessmentId: string
): Promise<AssessmentProgress> {
  const response = await fetch(`/api/assessment/progress?assessmentId=${assessmentId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch progress')
  }

  const data = await response.json()
  return {
    overall: data.overall,
    categories: data.categories,
    is_complete: data.is_complete
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Complete an assessment (mark as completed)
 */
export async function completeAssessment(assessmentId: string): Promise<{ assessment: AssessmentResult }> {
  return updateAssessment(assessmentId, { status: 'completed' })
}

/**
 * Get the user's latest assessment
 */
export async function fetchLatestAssessment(
  options: {
    includeResponses?: boolean
    includeInsights?: boolean
  } = {}
): Promise<AssessmentWithDetails | null> {
  const { assessments } = await fetchAssessments()
  
  if (!assessments || assessments.length === 0) {
    return null
  }

  // Get the most recent assessment
  const latest = assessments[0]
  return fetchAssessment(latest.id, options)
}

/**
 * Check if user has any assessments
 */
export async function hasAssessments(): Promise<boolean> {
  const { assessments } = await fetchAssessments()
  return assessments && assessments.length > 0
}

/**
 * Get assessment completion percentage
 */
export function getCompletionPercentage(assessment: AssessmentResult): number {
  return assessment.overall_percentage || 0
}

/**
 * Check if assessment is completed
 */
export function isAssessmentComplete(assessment: AssessmentResult): boolean {
  return assessment.status === 'completed'
}

/**
 * Get Green Line status color
 */
export function getGreenLineColor(status: 'above' | 'transition' | 'below'): string {
  switch (status) {
    case 'above':
      return '#199D67' // Primary Green
    case 'transition':
      return '#FFB701' // Energy Yellow
    case 'below':
      return '#D03739' // Contrast Red
    default:
      return '#666666' // Gray
  }
}

/**
 * Get Green Line status label
 */
export function getGreenLineLabel(status: 'above' | 'transition' | 'below'): string {
  switch (status) {
    case 'above':
      return 'Above Green Line'
    case 'transition':
      return 'In Transition'
    case 'below':
      return 'Below Green Line'
    default:
      return 'Unknown'
  }
}

