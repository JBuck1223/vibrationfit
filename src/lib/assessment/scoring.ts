import { AssessmentCategory } from '@/types/assessment'

export type GreenLineResult = 'above' | 'transition' | 'below'

export interface CategoryResult {
  category: AssessmentCategory
  score: number
  maxScore: number
  percentage: number
  greenLine: GreenLineResult
}

export interface AssessmentResults {
  categories: CategoryResult[]
  totalScore: number
  maxPossibleScore: number
  overallPercentage: number
}

const MAX_SCORE_PER_QUESTION = 5

export function getGreenLineStatus(score: number, maxScore: number): GreenLineResult {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  if (pct >= 80) return 'above'
  if (pct >= 60) return 'transition'
  return 'below'
}

export function getGreenLineColor(status: GreenLineResult): string {
  switch (status) {
    case 'above': return '#39FF14'
    case 'transition': return '#FFB701'
    case 'below': return '#FF0040'
  }
}

export function getGreenLineLabel(status: GreenLineResult): string {
  switch (status) {
    case 'above': return 'Above the Green Line'
    case 'transition': return 'In Transition'
    case 'below': return 'Below the Green Line'
  }
}

interface ResponseData {
  value: number
  category: string
  isNotApplicable?: boolean
}

export function calculateResults(
  responses: Map<string, ResponseData>,
  categories: AssessmentCategory[]
): AssessmentResults {
  const categoryResults: CategoryResult[] = categories.map(category => {
    let score = 0
    let answeredCount = 0

    responses.forEach((resp) => {
      if (resp.category === category) {
        if (resp.isNotApplicable) return
        score += resp.value
        answeredCount++
      }
    })

    const maxScore = answeredCount * MAX_SCORE_PER_QUESTION
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    return {
      category,
      score,
      maxScore,
      percentage,
      greenLine: getGreenLineStatus(score, maxScore)
    }
  })

  const totalScore = categoryResults.reduce((sum, c) => sum + c.score, 0)
  const maxPossibleScore = categoryResults.reduce((sum, c) => sum + c.maxScore, 0)
  const overallPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0

  return {
    categories: categoryResults,
    totalScore,
    maxPossibleScore,
    overallPercentage
  }
}
