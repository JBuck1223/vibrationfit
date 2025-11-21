// /src/lib/viva/context-detector.ts
// Intelligently determine what context to load based on user intent

export type ContextNeeds = {
  profile: 'full' | 'minimal' | 'none'  // minimal = just name
  vision: 'full' | 'section' | 'none'   // section = specific category only
  assessment: 'full' | 'none'
  journeyState: boolean
  sectionKey?: string  // If vision='section', which one?
}

/**
 * Analyze user's message to determine minimal context needed
 * This saves database queries AND tokens on first message
 */
export function detectContextNeeds(userMessage: string, isInitialGreeting: boolean): ContextNeeds {
  const msg = userMessage.toLowerCase()
  
  // ============================================================================
  // 1. MINIMAL CONTEXT (just name) - Save ~1500 tokens!
  // ============================================================================
  const minimalPhrases = [
    'hi', 'hello', 'hey', 'yo', 'sup', 'greetings',
    'good morning', 'good afternoon', 'good evening',
    'how are you', 'how\'s it going',
    'tell me a joke', 'joke', 'fun fact',
    'thank you', 'thanks', 'ok', 'cool', 'great',
    'bye', 'goodbye', 'see you', 'later'
  ]
  
  if (isInitialGreeting || minimalPhrases.some(phrase => msg === phrase || msg.startsWith(phrase))) {
    return {
      profile: 'minimal',   // Just name for greeting
      vision: 'none',       // Don't load vision
      assessment: 'none',   // Don't load assessment
      journeyState: false   // Don't count tables
    }
  }
  
  // ============================================================================
  // 2. PROFILE ONLY - Save ~1200 tokens!
  // ============================================================================
  const profilePhrases = [
    'my profile', 'my info', 'my account', 'about me',
    'my name', 'my email', 'my preferences',
    'who am i', 'tell me about myself'
  ]
  
  if (profilePhrases.some(phrase => msg.includes(phrase))) {
    return {
      profile: 'full',
      vision: 'none',
      assessment: 'none',
      journeyState: false
    }
  }
  
  // ============================================================================
  // 3. JOURNEY STATE ONLY - Save ~1800 tokens!
  // ============================================================================
  const journeyPhrases = [
    'how am i doing', 'my progress', 'my stats',
    'how many', 'my count', 'my journey'
  ]
  
  if (journeyPhrases.some(phrase => msg.includes(phrase))) {
    return {
      profile: 'minimal',
      vision: 'none',
      assessment: 'none',
      journeyState: true
    }
  }
  
  // ============================================================================
  // 4. SPECIFIC VISION SECTION - Save ~1500 tokens!
  // ============================================================================
  const visionCategories = {
    'health': ['health', 'fitness', 'body', 'exercise', 'diet', 'wellness'],
    'relationships': ['relationship', 'love', 'partner', 'family', 'friends', 'social'],
    'career': ['career', 'work', 'job', 'business', 'professional'],
    'finance': ['money', 'finance', 'financial', 'wealth', 'income', 'budget'],
    'personal_growth': ['growth', 'learning', 'education', 'self-improvement', 'skills'],
    'spirituality': ['spiritual', 'faith', 'purpose', 'meaning', 'meditation'],
    'creativity': ['creative', 'art', 'music', 'hobby', 'passion'],
    'environment': ['home', 'space', 'environment', 'living'],
    'contribution': ['contribution', 'giving', 'impact', 'legacy', 'service'],
    'adventure': ['adventure', 'travel', 'exploration', 'experience'],
    'fun': ['fun', 'play', 'joy', 'entertainment', 'leisure'],
    'time': ['time', 'schedule', 'routine', 'balance'],
    'energy': ['energy', 'vitality', 'vibration', 'frequency'],
    'mindset': ['mindset', 'thoughts', 'beliefs', 'mental']
  }
  
  for (const [category, keywords] of Object.entries(visionCategories)) {
    if (keywords.some(keyword => msg.includes(keyword))) {
      // Check if they're asking about vision specifically
      const visionIndicators = ['vision', 'section', 'category', 'my', 'help', 'work on', 'improve']
      if (visionIndicators.some(indicator => msg.includes(indicator))) {
        return {
          profile: 'minimal',
          vision: 'section',
          sectionKey: category,
          assessment: 'none',
          journeyState: false
        }
      }
    }
  }
  
  // ============================================================================
  // 5. ASSESSMENT FOCUS - Save ~1500 tokens!
  // ============================================================================
  const assessmentPhrases = [
    'my assessment', 'my results', 'my answers',
    'what did i say', 'my responses', 'quiz'
  ]
  
  if (assessmentPhrases.some(phrase => msg.includes(phrase))) {
    return {
      profile: 'minimal',
      vision: 'none',
      assessment: 'full',
      journeyState: false
    }
  }
  
  // ============================================================================
  // 6. FULL VISION CONTEXT
  // ============================================================================
  const visionPhrases = [
    'my vision', 'life vision', 'complete vision',
    'master vision', 'overview', 'all sections',
    'full picture', 'everything'
  ]
  
  if (visionPhrases.some(phrase => msg.includes(phrase))) {
    return {
      profile: 'full',
      vision: 'full',
      assessment: 'full',
      journeyState: true
    }
  }
  
  // ============================================================================
  // 7. DEFAULT: SMART CONTEXT (profile + vision summary)
  // ============================================================================
  // If we can't determine intent, load reasonable defaults
  return {
    profile: 'full',
    vision: 'full',      // Load full vision (but we'll cache it)
    assessment: 'none',  // Skip assessment unless needed
    journeyState: false  // Skip journey state unless needed
  }
}

/**
 * Calculate estimated token savings from context optimization
 */
export function estimateContextSavings(needs: ContextNeeds): {
  tokens_saved: number
  db_queries_saved: number
  description: string
} {
  let tokens = 0
  let queries = 0
  let parts: string[] = []
  
  if (needs.profile === 'none' || needs.profile === 'minimal') {
    tokens += 200
    queries += 0 // We still fetch minimal profile
    if (needs.profile === 'none') queries += 1
    parts.push('profile')
  }
  
  if (needs.vision === 'none') {
    tokens += 1500
    queries += 1
    parts.push('full vision')
  } else if (needs.vision === 'section') {
    tokens += 1200
    parts.push('other vision sections')
  }
  
  if (needs.assessment === 'none') {
    tokens += 500
    queries += 2 // assessment_results + assessment_responses
    parts.push('assessment')
  }
  
  if (!needs.journeyState) {
    tokens += 100
    queries += 3 // vision count + journal count + vision board count
    parts.push('journey stats')
  }
  
  return {
    tokens_saved: tokens,
    db_queries_saved: queries,
    description: parts.length > 0 
      ? `Skipped: ${parts.join(', ')}` 
      : 'Full context loaded'
  }
}




