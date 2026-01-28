// /src/lib/testing/fake-assessment-data.ts
// Generate fake assessment data for testing

import { faker } from '@faker-js/faker'
import { AssessmentQuestion, QuestionOption } from '@/lib/assessment/questions'
import { AssessmentCategory } from '@/types/assessment'

/**
 * Generate a fake response for a single question
 * Randomly selects from available options, excluding custom responses
 */
export function generateFakeQuestionResponse(question: AssessmentQuestion): {
  questionId: string
  questionText: string
  category: AssessmentCategory
  selectedOption: QuestionOption
} {
  // Filter out custom responses (isCustom: true) to avoid complexity
  const regularOptions = question.options.filter(opt => !opt.isCustom)
  
  // Randomly select an option
  const selectedOption = faker.helpers.arrayElement(regularOptions)
  
  return {
    questionId: question.id,
    questionText: question.text,
    category: question.category,
    selectedOption
  }
}

/**
 * Generate fake responses for an array of questions
 */
export function generateFakeAssessmentResponses(questions: AssessmentQuestion[]): Map<string, {
  questionText: string
  category: AssessmentCategory
  selectedOption: QuestionOption
}> {
  const responses = new Map()
  
  questions.forEach(question => {
    const response = generateFakeQuestionResponse(question)
    responses.set(response.questionId, {
      questionText: response.questionText,
      category: response.category,
      selectedOption: response.selectedOption
    })
  })
  
  return responses
}
