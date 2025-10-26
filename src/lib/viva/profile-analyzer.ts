// src/lib/viva/profile-analyzer.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface ProfileInsights {
  strengths: string[]
  challenges: string[]
  values: string[]
  lifestyle: string
  priorities: string[]
  emotionalState: 'above_green' | 'below_green' | 'mixed'
  readiness: 'high' | 'medium' | 'low'
  household_income?: string
  personalStory: {
    romance: string
    family: string
    career: string
    money: string
    home: string
    health: string
    fun: string
    travel: string
    social: string
    possessions: string
    giving: string
    spirituality: string
  }
}

export interface AssessmentInsights {
  overallVibration: 'high' | 'medium' | 'low'
  greenLineStatus: 'above' | 'below' | 'on'
  strongCategories: string[]
  growthAreas: string[]
  readinessForVision: 'high' | 'medium' | 'low'
  overallScore: number
  categoryScores: Record<string, number>
}

/**
 * Analyzes user profile data to extract key insights for VIVA
 */
export async function analyzeProfile(userId: string, supabase: SupabaseClient): Promise<ProfileInsights> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found')
  }

  return {
    strengths: extractStrengths(profile),
    challenges: extractChallenges(profile),
    values: extractValues(profile),
    lifestyle: determineLifestyle(profile),
    priorities: extractPriorities(profile),
    emotionalState: determineEmotionalState(profile),
    readiness: calculateReadiness(profile),
    household_income: profile.household_income,
    personalStory: extractPersonalStories(profile)
  }
}

/**
 * Analyzes assessment results to understand user's current vibration
 */
export async function analyzeAssessment(userId: string, supabase: SupabaseClient): Promise<AssessmentInsights> {
  const { data: assessment, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !assessment) {
    throw new Error('Assessment not found')
  }

  const score = assessment.overall_percentage || 0
  const categoryScores = assessment.category_scores || {}
  
  return {
    overallVibration: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
    greenLineStatus: assessment.green_line_status || 'mixed',
    strongCategories: Object.entries(categoryScores)
      .filter(([_, score]) => (score as number) >= 80)
      .map(([category, _]) => category),
    growthAreas: Object.entries(categoryScores)
      .filter(([_, score]) => (score as number) < 60)
      .map(([category, _]) => category),
    readinessForVision: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low',
    overallScore: score,
    categoryScores: categoryScores
  }
}

/**
 * Extracts strengths from profile data
 */
function extractStrengths(profile: any): string[] {
  const strengths = []
  
  // Business/Career Success
  if (profile.employment_type === 'Business Owner' && profile.time_in_role === '5-10 years') {
    strengths.push('successful business owner with 5-10 years experience')
  } else if (profile.occupation === 'CEO/President') {
    strengths.push('executive leadership experience')
  }
  
  // Relationship Stability
  if (profile.relationship_status === 'Married' && profile.relationship_length === '10+ years') {
    strengths.push('stable long-term marriage (10+ years)')
  } else if (profile.relationship_status === 'Married') {
    strengths.push('committed relationship')
  }
  
  // Family Life
  if (profile.has_children && profile.number_of_children >= 3) {
    strengths.push(`parenting experience with ${profile.number_of_children} children`)
  } else if (profile.has_children) {
    strengths.push('parenting experience')
  }
  
  // Financial Position
  if (profile.household_income === '100,000-249,999' && profile.assets_equity === '250,000-499,999') {
    strengths.push('strong financial foundation with significant assets')
  } else if (profile.household_income === '100,000-249,999') {
    strengths.push('solid income level')
  }
  
  // Health Consciousness
  if (profile.exercise_frequency && profile.exercise_frequency !== 'never') {
    strengths.push('health-conscious lifestyle with regular exercise')
  }
  
  // Home Stability
  if (profile.living_situation === 'Own' && profile.time_at_location === '3-5 years') {
    strengths.push('stable home ownership')
  }
  
  // Spiritual Practice
  if (profile.spiritual_practice && profile.spiritual_practice !== 'none') {
    strengths.push('established spiritual practice')
  }
  
  // Travel Experience
  if (profile.countries_visited && profile.countries_visited > 5) {
    strengths.push('extensive travel experience')
  }
  
  return strengths
}

/**
 * Extracts challenges from profile data
 */
function extractChallenges(profile: any): string[] {
  const challenges = []
  
  // Financial Stress
  if (profile.consumer_debt && profile.consumer_debt !== 'Under 10,000') {
    challenges.push('debt management')
  }
  
  // Time Constraints
  if (profile.leisure_time_weekly === '0-5' || profile.leisure_time_weekly === '6-10') {
    challenges.push('limited leisure time')
  }
  
  // Work-Life Balance
  if (profile.time_in_role === '5-10 years' && profile.leisure_time_weekly === '0-5') {
    challenges.push('work-life balance')
  }
  
  // Social Connections
  if (profile.close_friends_count === '1-3' || profile.close_friends_count === '0') {
    challenges.push('social connections')
  }
  
  // Health Concerns
  if (profile.exercise_frequency === 'never' || profile.exercise_frequency === 'rarely') {
    challenges.push('physical fitness')
  }
  
  // Spiritual Growth
  if (profile.spiritual_practice === 'none' || !profile.spiritual_practice) {
    challenges.push('spiritual development')
  }
  
  return challenges
}

/**
 * Extracts values from profile data
 */
function extractValues(profile: any): string[] {
  const values = []
  
  // From AI tags
  if (profile.ai_tags && Array.isArray(profile.ai_tags)) {
    values.push(...profile.ai_tags)
  }
  
  // From hobbies
  if (profile.hobbies && Array.isArray(profile.hobbies)) {
    values.push(...profile.hobbies)
  }
  
  // Inferred from lifestyle choices
  if (profile.exercise_frequency && profile.exercise_frequency !== 'never') {
    values.push('health and wellness')
  }
  
  if (profile.spiritual_practice && profile.spiritual_practice !== 'none') {
    values.push('spiritual growth')
  }
  
  if (profile.volunteer_status === 'active' || profile.charitable_giving !== 'none') {
    values.push('service and giving')
  }
  
  return [...new Set(values)] // Remove duplicates
}

/**
 * Determines lifestyle category
 */
function determineLifestyle(profile: any): string {
  const income = profile.household_income
  const assets = profile.assets_equity
  const employment = profile.employment_type
  
  if (employment === 'Business Owner' && income === '100,000-249,999') {
    return 'successful entrepreneur'
  } else if (employment === 'Business Owner') {
    return 'entrepreneur'
  } else if (income === '100,000-249,999') {
    return 'professional'
  } else if (income === '50,000-99,999') {
    return 'comfortable'
  } else {
    return 'building'
  }
}

/**
 * Extracts priorities from profile data
 */
function extractPriorities(profile: any): string[] {
  const priorities = []
  
  // Family priorities
  if (profile.has_children) {
    priorities.push('family and parenting')
  }
  
  // Career priorities
  if (profile.employment_type === 'Business Owner') {
    priorities.push('business growth')
  }
  
  // Health priorities
  if (profile.exercise_frequency && profile.exercise_frequency !== 'never') {
    priorities.push('health and fitness')
  }
  
  // Relationship priorities
  if (profile.relationship_status === 'Married') {
    priorities.push('relationship quality')
  }
  
  // Financial priorities
  if (profile.household_income && profile.household_income !== 'Under 25,000') {
    priorities.push('financial security')
  }
  
  return priorities
}

/**
 * Determines emotional state from profile data
 */
function determineEmotionalState(profile: any): 'above_green' | 'below_green' | 'mixed' {
  // This would ideally come from assessment, but we can infer from profile
  const positiveIndicators = [
    profile.relationship_status === 'Married',
    profile.employment_type === 'Business Owner',
    profile.household_income === '100,000-249,999',
    profile.exercise_frequency && profile.exercise_frequency !== 'never'
  ]
  
  const negativeIndicators = [
    profile.consumer_debt && profile.consumer_debt !== 'Under 10,000',
    profile.leisure_time_weekly === '0-5',
    profile.close_friends_count === '0' || profile.close_friends_count === '1-3'
  ]
  
  const positiveCount = positiveIndicators.filter(Boolean).length
  const negativeCount = negativeIndicators.filter(Boolean).length
  
  if (positiveCount > negativeCount) return 'above_green'
  if (negativeCount > positiveCount) return 'below_green'
  return 'mixed'
}

/**
 * Calculates readiness for vision building
 */
function calculateReadiness(profile: any): 'high' | 'medium' | 'low' {
  let score = 0
  
  // Profile completion
  if (profile.completion_percentage >= 80) score += 3
  else if (profile.completion_percentage >= 60) score += 2
  else if (profile.completion_percentage >= 40) score += 1
  
  // Life stability indicators
  if (profile.relationship_status === 'Married') score += 1
  if (profile.employment_type === 'Business Owner') score += 1
  if (profile.household_income === '100,000-249,999') score += 1
  if (profile.living_situation === 'Own') score += 1
  
  // Self-awareness indicators
  if (profile.ai_tags && profile.ai_tags.length > 0) score += 1
  if (profile.hobbies && profile.hobbies.length > 0) score += 1
  if (profile.spiritual_practice && profile.spiritual_practice !== 'none') score += 1
  
  if (score >= 8) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

/**
 * Analyzes a specific category based on profile and assessment data
 */
export async function analyzeCategory(
  category: string, 
  userId: string, 
  supabase: SupabaseClient
): Promise<{
  categoryInsights: string
  personalizedPrompt: string
  assessmentScore?: number
  hasStory: boolean
  strengths: string[]
  challenges: string[]
}> {
  const profileInsights = await analyzeProfile(userId, supabase)
  const assessmentInsights = await analyzeAssessment(userId, supabase)
  
  // Get category-specific data
  const categoryScore = assessmentInsights.categoryScores[category]
  const personalStory = profileInsights.personalStory[category as keyof ProfileInsights['personalStory']]
  const hasStory = Boolean(personalStory && personalStory.trim().length > 0)
  
  // Extract category-specific strengths and challenges
  const strengths = extractCategoryStrengths(category, profileInsights)
  const challenges = extractCategoryChallenges(category, profileInsights)
  
  // Generate category insights
  const categoryInsights = generateCategoryInsights(category, profileInsights, assessmentInsights, categoryScore, hasStory)
  
  // Generate personalized prompt
  const personalizedPrompt = generatePersonalizedPrompt(category, categoryInsights, strengths, challenges, categoryScore)
  
  return {
    categoryInsights,
    personalizedPrompt,
    assessmentScore: categoryScore,
    hasStory,
    strengths,
    challenges
  }
}

/**
 * Extracts category-specific strengths from profile data
 */
function extractCategoryStrengths(category: string, profileInsights: ProfileInsights): string[] {
  const strengths = []
  
  switch (category) {
    case 'money':
      if (profileInsights.lifestyle === 'successful entrepreneur' || profileInsights.lifestyle === 'professional') {
        strengths.push('strong financial foundation')
      }
      if (profileInsights.household_income === '100,000-249,999') {
        strengths.push('solid income level')
      }
      break
      
    case 'health':
      if (profileInsights.strengths.includes('health-conscious lifestyle')) {
        strengths.push('established wellness routine')
      }
      break
      
    case 'romance':
      if (profileInsights.strengths.includes('stable long-term marriage')) {
        strengths.push('committed long-term relationship')
      }
      break
      
    case 'family':
      if (profileInsights.strengths.includes('parenting experience')) {
        strengths.push('active parenting role')
      }
      break
      
    case 'business':
      if (profileInsights.strengths.includes('successful business owner')) {
        strengths.push('entrepreneurial success')
      }
      break
      
    case 'home':
      if (profileInsights.strengths.includes('stable home ownership')) {
        strengths.push('secure living situation')
      }
      break
      
    case 'spirituality':
      if (profileInsights.strengths.includes('established spiritual practice')) {
        strengths.push('spiritual foundation')
      }
      break
      
    case 'travel':
      if (profileInsights.strengths.includes('extensive travel experience')) {
        strengths.push('worldly perspective')
      }
      break
  }
  
  return strengths
}

/**
 * Extracts category-specific challenges from profile data
 */
function extractCategoryChallenges(category: string, profileInsights: ProfileInsights): string[] {
  const challenges = []
  
  switch (category) {
    case 'money':
      if (profileInsights.challenges.includes('debt management')) {
        challenges.push('debt management')
      }
      break
      
    case 'health':
      if (profileInsights.challenges.includes('physical fitness')) {
        challenges.push('exercise consistency')
      }
      break
      
    case 'social':
      if (profileInsights.challenges.includes('social connections')) {
        challenges.push('building deeper friendships')
      }
      break
      
    case 'business':
      if (profileInsights.challenges.includes('work-life balance')) {
        challenges.push('work-life integration')
      }
      break
      
    case 'spirituality':
      if (profileInsights.challenges.includes('spiritual development')) {
        challenges.push('spiritual growth')
      }
      break
  }
  
  return challenges
}

/**
 * Generates insights about a specific category
 */
function generateCategoryInsights(
  category: string, 
  profileInsights: ProfileInsights, 
  assessmentInsights: AssessmentInsights,
  categoryScore?: number,
  hasStory?: boolean
): string {
  const insights = []
  
  // Assessment-based insights
  if (categoryScore !== undefined) {
    if (categoryScore >= 80) {
      insights.push(`Your assessment shows you're thriving in ${category} with a ${categoryScore}% score`)
    } else if (categoryScore >= 60) {
      insights.push(`Your assessment shows moderate alignment in ${category} with a ${categoryScore}% score`)
    } else {
      insights.push(`Your assessment indicates ${category} is an area for growth with a ${categoryScore}% score`)
    }
  }
  
  // Profile-based insights
  if (hasStory) {
    insights.push(`You've shared personal insights about your ${category} experience`)
  }
  
  // Lifestyle-based insights
  switch (category) {
    case 'money':
      if (profileInsights.lifestyle === 'successful entrepreneur') {
        insights.push('Your entrepreneurial background suggests financial acumen')
      }
      break
    case 'business':
      if (profileInsights.lifestyle === 'successful entrepreneur') {
        insights.push('Your business ownership experience indicates strong professional foundation')
      }
      break
    case 'family':
      if (profileInsights.strengths.includes('parenting experience')) {
        insights.push('Your parenting experience shows family commitment')
      }
      break
  }
  
  return insights.join('. ') + '.'
}

/**
 * Generates personalized prompts based on category analysis (legacy - keeping for backward compatibility)
 */
function generatePersonalizedPrompt(
  category: string,
  categoryInsights: string,
  strengths: string[],
  challenges: string[],
  categoryScore?: number
): string {
  const prompts = []
  
  // Base prompt based on assessment score
  if (categoryScore !== undefined) {
    if (categoryScore >= 80) {
      prompts.push(`I can see you're already thriving in ${category}. What aspects of this area bring you the most joy and fulfillment?`)
    } else if (categoryScore >= 60) {
      prompts.push(`I notice ${category} is an area where you have some alignment but room to grow. What would you like to enhance or expand here?`)
    } else {
      prompts.push(`I see ${category} is an area where you'd like to create more alignment. What would you like to shift or improve?`)
    }
  } else {
    prompts.push(`Let's explore your vision for ${category}. What comes to mind when you think about this area of your life?`)
  }
  
  // Add strength-based prompts
  if (strengths.length > 0) {
    prompts.push(`I can see you have ${strengths.join(' and ')}. How can we build on these strengths to create even more fulfillment?`)
  }
  
  // Add challenge-based prompts
  if (challenges.length > 0) {
    prompts.push(`I notice ${challenges.join(' and ')} might be areas of focus. What would you like to experience instead?`)
  }
  
  // Special prompts for Forward and Conclusion
  if (category === 'forward') {
    return `Based on your profile and assessment, I can see you have a strong foundation. What intention and energy do you want to set for your life vision? What's calling you forward?`
  }
  
  if (category === 'conclusion') {
    return `As we wrap up your vision, how do you want to close and seal this powerful statement? What final affirmation captures your commitment to this life?`
  }
  
  return prompts.join(' ')
}
  
/**
 * Generates conversational prompts for gathering data (2-3 cycles)
 */
export function generateConversationalPrompt(
  category: string,
  profileInsights: ProfileInsights,
  assessmentInsights: AssessmentInsights,
  conversationHistory: string[] = []
): {
  prompt: string
  isComplete: boolean
  nextCycle: number
} {
  const categoryScore = assessmentInsights.categoryScores[category]
  const cycle = conversationHistory.length + 1
  
  // Special handling for Forward and Conclusion
  if (category === 'forward') {
    if (cycle === 1) {
      return {
        prompt: `I can see from your profile that you have ${profileInsights.strengths.slice(0, 2).join(' and ')}. That's a really solid foundation! What's calling you forward in life right now? What feels like it wants to emerge?`,
        isComplete: false,
        nextCycle: 2
      }
    } else if (cycle === 2) {
      return {
        prompt: `That's beautiful. I can also see from your assessment that you're ${assessmentInsights.overallVibration === 'high' ? 'really thriving overall' : 'building momentum'}. What intention do you want to set for this vision we're creating together?`,
        isComplete: false,
        nextCycle: 3
      }
    } else {
      return {
        prompt: `Perfect. Now let's craft that into your opening statement. How do you want to begin this vision? What energy do you want to set?`,
        isComplete: true,
        nextCycle: 0
      }
    }
  }
  
  if (category === 'conclusion') {
    if (cycle === 1) {
      return {
        prompt: `We've built something really powerful together. Looking at all these areas of your life, what feels like the most important thing to remember? What's the essence of this vision?`,
        isComplete: false,
        nextCycle: 2
      }
    } else {
      return {
        prompt: `That's perfect. Now let's seal this vision with a powerful closing statement. How do you want to end this? What final affirmation captures your commitment?`,
        isComplete: true,
        nextCycle: 0
      }
    }
  }
  
  // Regular categories - 3 cycles
  if (cycle === 1) {
    // First cycle - warm, profile-based question
    const profileHook = getProfileHook(category, profileInsights)
    return {
      prompt: profileHook,
      isComplete: false,
      nextCycle: 2
    }
  } else if (cycle === 2) {
    // Second cycle - assessment-based follow-up
    const assessmentHook = getAssessmentHook(category, assessmentInsights, categoryScore)
    return {
      prompt: assessmentHook,
      isComplete: false,
      nextCycle: 3
    }
  } else {
    // Third cycle - vision synthesis
    return {
      prompt: `That's really helpful. Now let's put this together into your vision for ${category}. What does your ideal ${category} look like? How do you want to feel in this area?`,
      isComplete: true,
      nextCycle: 0
    }
  }
}

/**
 * Gets profile-based conversation hooks
 */
function getProfileHook(category: string, profileInsights: ProfileInsights): string {
  switch (category) {
    case 'money':
      if (profileInsights.lifestyle === 'successful entrepreneur') {
        return `I can see you're a successful entrepreneur - that's amazing! Tell me, what's your relationship with money like these days? How does it feel when you think about your financial life?`
      }
      return `I'd love to hear about your relationship with money. What comes up for you when you think about your financial life?`
      
    case 'health':
      if (profileInsights.strengths.includes('health-conscious lifestyle')) {
        return `I can see you're already health-conscious - that's wonderful! What's your relationship with your body and wellness like right now?`
      }
      return `Let's talk about your health and wellness. How are you feeling in your body these days? What's that relationship like?`
      
    case 'romance':
      if (profileInsights.strengths.includes('stable long-term marriage')) {
        return `I can see you have a stable long-term marriage - that's beautiful! What's your relationship like with your partner these days? How does it feel?`
      }
      return `Let's explore your romantic life. What's your relationship with love and partnership like right now?`
      
    case 'family':
      if (profileInsights.strengths.includes('parenting experience')) {
        return `I can see you're a parent - that's such important work! What's your family life like these days? How does it feel to be a parent?`
      }
      return `Let's talk about your family life. What's that area of your life like right now?`
      
    case 'business':
      if (profileInsights.lifestyle === 'successful entrepreneur') {
        return `I can see you're running your own business - that's incredible! What's your relationship with your work like these days? How does it feel?`
      }
      return `Let's explore your work life. What's your relationship with your career or business like right now?`
      
    case 'home':
      if (profileInsights.strengths.includes('stable home ownership')) {
        return `I can see you own your home - that's such a foundation! What's your relationship with your living space like? How does it feel to be there?`
      }
      return `Let's talk about your home and living space. What's that relationship like for you right now?`
      
    case 'spirituality':
      if (profileInsights.strengths.includes('established spiritual practice')) {
        return `I can see you have a spiritual practice - that's beautiful! What's your relationship with spirituality like these days? How does it feel?`
      }
      return `Let's explore your spiritual life. What's your relationship with spirituality or something greater like right now?`
      
    case 'travel':
      if (profileInsights.strengths.includes('extensive travel experience')) {
        return `I can see you've traveled extensively - that's amazing! What's your relationship with travel and adventure like these days?`
      }
      return `Let's talk about travel and adventure. What's your relationship with exploring new places like right now?`
      
    case 'social':
      return `Let's explore your social life. What's your relationship with friends and community like these days? How does it feel?`
      
    case 'fun':
      return `Let's talk about fun and recreation. What's your relationship with play and joy like these days? How does it feel?`
      
    case 'possessions':
      return `Let's explore your relationship with things and possessions. What's that like for you right now? How does it feel?`
      
    case 'giving':
      return `Let's talk about giving and contribution. What's your relationship with service and making a difference like these days?`
      
    default:
      return `Let's explore your ${category} life. What's that area like for you right now? How does it feel?`
  }
}

/**
 * Gets assessment-based conversation hooks
 */
function getAssessmentHook(category: string, assessmentInsights: AssessmentInsights, categoryScore?: number): string {
  if (categoryScore !== undefined) {
    if (categoryScore >= 80) {
      return `I can see from your assessment that you're really thriving in ${category} - that's wonderful! What aspects of this area bring you the most joy? What's working really well?`
    } else if (categoryScore >= 60) {
      return `I can see from your assessment that ${category} is an area where you have some good momentum. What feels aligned here? What would you like to enhance?`
    } else {
      return `I can see from your assessment that ${category} is an area where you'd like to create more alignment. What would you like to shift or improve here?`
    }
  }
  
  return `What would you like to experience more of in your ${category} life? What feels like it wants to emerge here?`
}

/**
 * Extracts personal stories from profile data
 */
function extractPersonalStories(profile: any): ProfileInsights['personalStory'] {
  return {
    romance: profile.romance_partnership_story || '',
    family: profile.family_parenting_story || '',
    career: profile.career_work_story || '',
    money: profile.money_wealth_story || '',
    home: profile.home_environment_story || '',
    health: profile.health_vitality_story || '',
    fun: profile.fun_recreation_story || '',
    travel: profile.travel_adventure_story || '',
    social: profile.social_friends_story || '',
    possessions: profile.possessions_lifestyle_story || '',
    giving: profile.giving_legacy_story || '',
    spirituality: profile.spirituality_growth_story || ''
  }
}
