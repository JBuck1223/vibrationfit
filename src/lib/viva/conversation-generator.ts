// src/lib/viva/conversation-generator.ts
import { ProfileInsights, AssessmentInsights } from './profile-analyzer'

export interface CustomConversation {
  opening: string
  approach: string
  focusAreas: string[]
  encouragement: string
  nextSteps: string
}

/**
 * Generates a custom opening conversation based on profile and assessment insights
 */
export async function generateCustomOpening(
  profileInsights: ProfileInsights, 
  assessmentInsights: AssessmentInsights
): Promise<CustomConversation> {
  
  const prompt = `
You are VIVA, a personal vibrational coach who has just analyzed a user's profile and assessment data. Generate a custom, personalized opening conversation.

PROFILE INSIGHTS:
- Strengths: ${profileInsights.strengths.join(', ')}
- Challenges: ${profileInsights.challenges.join(', ')}
- Values: ${profileInsights.values.join(', ')}
- Lifestyle: ${profileInsights.lifestyle}
- Priorities: ${profileInsights.priorities.join(', ')}
- Emotional State: ${profileInsights.emotionalState}
- Readiness: ${profileInsights.readiness}

ASSESSMENT INSIGHTS:
- Overall Vibration: ${assessmentInsights.overallVibration}
- Green Line Status: ${assessmentInsights.greenLineStatus}
- Overall Score: ${assessmentInsights.overallScore}%
- Strong Categories: ${assessmentInsights.strongCategories.join(', ')}
- Growth Areas: ${assessmentInsights.growthAreas.join(', ')}

PERSONAL STORIES (if available):
- Romance: ${profileInsights.personalStory.romance ? 'Has story' : 'No story'}
- Family: ${profileInsights.personalStory.family ? 'Has story' : 'No story'}
- Career: ${profileInsights.personalStory.career ? 'Has story' : 'No story'}
- Money: ${profileInsights.personalStory.money ? 'Has story' : 'No story'}

RULES:
1. Acknowledge their specific strengths and successes
2. Validate their assessment results with specific details
3. Be encouraging and personalized - use their actual data
4. Set clear expectations for the vision building process
5. Mention the category-by-category approach
6. Mention the refinement process
7. Keep it conversational and warm
8. Be specific about what you see in their data
9. Use vibrational language (alignment, actualization, conscious creation)
10. Keep it 3-4 sentences, conversational tone

Generate a custom opening conversation that feels like you truly know them:`

  // This would call your LLM API
  const opening = await callLLM('gpt-5', prompt)
  
  return {
    opening,
    approach: generateApproach(profileInsights, assessmentInsights),
    focusAreas: generateFocusAreas(profileInsights, assessmentInsights),
    encouragement: generateEncouragement(profileInsights, assessmentInsights),
    nextSteps: generateNextSteps(profileInsights, assessmentInsights)
  }
}

/**
 * Generates the approach based on user's readiness and assessment
 */
function generateApproach(profileInsights: ProfileInsights, assessmentInsights: AssessmentInsights): string {
  if (assessmentInsights.readinessForVision === 'high') {
    return "Given your strong foundation and clear assessment results, we can dive deep into each category and build a comprehensive vision that reflects your highest aspirations."
  } else if (assessmentInsights.readinessForVision === 'medium') {
    return "With your solid foundation, we'll take a thoughtful approach to each category, building clarity where it exists and exploring possibilities where there's room to grow."
  } else {
    return "We'll start gently, focusing on the areas where you feel most clear, and gradually expand into the categories that need more exploration."
  }
}

/**
 * Generates focus areas based on assessment results
 */
function generateFocusAreas(profileInsights: ProfileInsights, assessmentInsights: AssessmentInsights): string[] {
  const focusAreas = []
  
  // Focus on growth areas
  if (assessmentInsights.growthAreas.length > 0) {
    focusAreas.push(`We'll pay special attention to ${assessmentInsights.growthAreas.join(', ')} where there's room for growth`)
  }
  
  // Leverage strong areas
  if (assessmentInsights.strongCategories.length > 0) {
    focusAreas.push(`We'll build on your strengths in ${assessmentInsights.strongCategories.join(', ')}`)
  }
  
  // Address challenges
  if (profileInsights.challenges.length > 0) {
    focusAreas.push(`We'll address the areas that need attention: ${profileInsights.challenges.join(', ')}`)
  }
  
  return focusAreas
}

/**
 * Generates encouragement based on profile insights
 */
function generateEncouragement(profileInsights: ProfileInsights, assessmentInsights: AssessmentInsights): string {
  if (profileInsights.strengths.length > 0) {
    return `You've built an impressive foundation with ${profileInsights.strengths[0]}${profileInsights.strengths.length > 1 ? ` and ${profileInsights.strengths.length - 1} other strengths` : ''}. This gives us a solid platform to build your vision from.`
  } else if (assessmentInsights.overallScore >= 70) {
    return `Your assessment shows you're in a strong position with a ${assessmentInsights.overallScore}% overall score. This is the perfect time to create a vision that matches your potential.`
  } else {
    return `Every great vision starts with where you are right now. Your assessment gives us a clear starting point to build something amazing.`
  }
}

/**
 * Generates next steps based on readiness
 */
function generateNextSteps(profileInsights: ProfileInsights, assessmentInsights: AssessmentInsights): string {
  if (assessmentInsights.readinessForVision === 'high') {
    return "Ready to dive in? We'll go category by category, building out each section of your life vision, then circle back to ensure everything is congruent and aligned."
  } else {
    return "We'll start with the categories where you feel most clear, then gradually explore the areas that need more attention. Don't worry - there's a refinement process where we can fine-tune everything."
  }
}

/**
 * Placeholder for LLM API call
 * Replace with your actual OpenAI/Anthropic API call
 */
async function callLLM(model: string, prompt: string): Promise<string> {
  // This would be replaced with actual API call
  // For now, return a placeholder
  return "I can see from your profile that a lot of things are going really well, and this is validated by your assessment! With this information, we're set up perfectly to build a compelling life vision. We generally go category by category, independently building out each section. Then we circle back and ensure every category is congruent. And don't worry, there's a refinement process that happens after the initial build where we can fine-tune the details. Ready to get started?"
}
