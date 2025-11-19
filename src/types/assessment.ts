// /src/types/assessment.ts

export type AssessmentCategory =
  | 'money'      // Money / Wealth
  | 'health'     // Health / Vitality
  | 'family'     // Family / Parenting
  | 'love'       // Love / Romance
  | 'social'     // Social / Friends
  | 'work'       // Work / Career
  | 'fun'        // Fun / Recreation
  | 'travel'     // Travel / Adventure
  | 'home'       // Home / Environment
  | 'stuff'      // Stuff / Possessions
  | 'giving'     // Giving / Legacy
  | 'spirituality' // Spirituality

export type ResponseValue = 0 | 1 | 2 | 3 | 4 | 5

export type GreenLineStatus = 'above' | 'neutral' | 'below'

export interface AssessmentOption {
  text: string
  value: ResponseValue | 0
  emoji?: string
  greenLine: GreenLineStatus
  isCustom?: boolean
}

export interface ConditionalLogic {
  field: string
  condition: (value: any) => boolean
}

export interface AssessmentQuestion {
  id: string
  category: AssessmentCategory
  text: string
  options: AssessmentOption[]
  conditionalLogic?: ConditionalLogic
}

export interface CategoryQuestions {
  category: AssessmentCategory
  title: string
  description: string
  icon: string
  questions: AssessmentQuestion[]
}

export interface AssessmentResponse {
  question_id: string
  question_text: string
  response_value: ResponseValue
  response_text: string
  category: AssessmentCategory
  answered_at: Date
  is_custom_response?: boolean
  custom_response_value?: ResponseValue
  custom_green_line?: GreenLineStatus
}

export interface CategoryScore {
  category: AssessmentCategory
  score: number
  maxScore: number
  percentage: number
  status: 'above' | 'transition' | 'below'
}

export interface AssessmentResult {
  id: string
  user_id: string
  profile_version_id?: string
  status: 'in_progress' | 'completed'
  is_active: boolean
  is_draft: boolean
  category_scores: Record<AssessmentCategory, number>
  total_score: number
  max_possible_score: number
  overall_percentage: number
  green_line_status: Record<AssessmentCategory, 'above' | 'transition' | 'below'>
  started_at: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}