import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface RollingContextObject {
  member_id: string
  focus_category: string
  related_categories: string[]
  current_emotion: string
  vibrational_links: string[]
  session_summary: string
  desired_state: string
  recent_wins: string[]
  top_themes: string[]
  emotional_trends: Array<{
    category: string
    trend: 'rising' | 'stable' | 'declining'
    score: number
  }>
  cross_category_insights: Array<{
    category_a: string
    category_b: string
    connection: string
    strength: number
  }>
  profile_snapshot: {
    lifestyle: string
    values: string[]
    priorities: string[]
  }
}

/**
 * GET /api/viva/context/:user_id
 * Builds the Rolling Context Object (RCO) for VIVA's unified understanding
 * 
 * This endpoint aggregates:
 * - Vision goals across categories
 * - Assessment emotional quality
 * - Journal entries and patterns
 * - Vibrational links between categories
 * - Recent wins and progress
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build the Rolling Context Object
    const context = await buildRollingContext(user.id, supabase)
    
    return NextResponse.json({ context })
    
  } catch (error) {
    console.error('Error building VIVA context:', error)
    return NextResponse.json(
      { error: 'Failed to build context' },
      { status: 500 }
    )
  }
}

/**
 * Builds the complete Rolling Context Object from all relevant data sources
 */
async function buildRollingContext(userId: string, supabase: any): Promise<RollingContextObject> {
  // 1. Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // 2. Get active vision across all categories
  const { data: vision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  // 3. Get active assessment scores
  const { data: assessment } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  // 4. Get recent journal entries (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: recentJournals } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  // 5. Get vibrational links (cross-category connections)
  const { data: vibrationalLinks } = await supabase
    .from('vibrational_links')
    .select('*')
    .eq('user_id', userId)
    .order('strength', { ascending: false })

  // 6. Get recent category states as "recent wins"
  const { data: recentCategoryStates } = await supabase
    .from('vision_new_category_state')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  // 7. Analyze and build context
  const topThemes = extractTopThemes(profile, assessment, recentJournals)
  const relatedCategories = extractRelatedCategories(vibrationalLinks)
  const currentEmotion = extractCurrentEmotion(recentJournals, assessment)
  const desiredState = extractDesiredState(vision, profile)
  const recentWins = extractRecentWins(recentCategoryStates, recentJournals)
  const emotionalTrends = calculateEmotionalTrends(assessment, recentJournals)
  const crossCategoryInsights = buildCrossCategoryInsights(vibrationalLinks)

  return {
    member_id: userId,
    focus_category: 'overview', // Can be set dynamically based on active conversation
    related_categories: relatedCategories,
    current_emotion: currentEmotion,
    vibrational_links: topThemes,
    session_summary: generateSessionSummary(profile, assessment, recentJournals),
    desired_state: desiredState,
    recent_wins: recentWins,
    top_themes: topThemes,
    emotional_trends: emotionalTrends,
    cross_category_insights: crossCategoryInsights,
    profile_snapshot: {
      lifestyle: profile?.lifestyle || 'emerging',
      values: extractValues(profile),
      priorities: extractPriorities(profile, assessment)
    }
  }
}

/**
 * Extracts top themes from profile, assessment, and journal entries
 */
function extractTopThemes(profile: any, assessment: any, journals: any[]): string[] {
  const themes = new Map<string, number>()
  
  // Extract from profile strengths
  if (profile?.strengths) {
    const strengths = Array.isArray(profile.strengths) ? profile.strengths : []
    strengths.forEach((strength: string) => {
      themes.set(strength.toLowerCase(), (themes.get(strength.toLowerCase()) || 0) + 3)
    })
  }
  
  // Extract from journal content
  journals?.forEach(entry => {
    if (entry.content) {
      // Simple keyword extraction (can be enhanced with AI)
      const keywords = ['freedom', 'security', 'creativity', 'balance', 'connection', 
                       'growth', 'adventure', 'stability', 'excitement', 'peace']
      keywords.forEach(keyword => {
        if (entry.content.toLowerCase().includes(keyword)) {
          themes.set(keyword, (themes.get(keyword) || 0) + 1)
        }
      })
    }
  })
  
  // Return top 5 themes
  return Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme)
}

/**
 * Extracts related categories from vibrational links
 */
function extractRelatedCategories(links: any[]): string[] {
  const categories = new Set<string>()
  
  links?.forEach(link => {
    if (link.strength > 0.4) {
      categories.add(link.category_a)
      categories.add(link.category_b)
    }
  })
  
  return Array.from(categories)
}

/**
 * Extracts current emotional state from recent journals and assessments
 */
function extractCurrentEmotion(journals: any[], assessment: any): string {
  // Analyze recent journal tone
  if (journals && journals.length > 0) {
    const recentEntry = journals[0]
    // Simple keyword detection (can be enhanced)
    if (recentEntry.content) {
      const content = recentEntry.content.toLowerCase()
      if (content.includes('stressed') || content.includes('anxious')) return 'anxious'
      if (content.includes('excited') || content.includes('joy')) return 'excited'
      if (content.includes('frustrated') || content.includes('stuck')) return 'frustrated'
      if (content.includes('grateful') || content.includes('happy')) return 'grateful'
    }
  }
  
  // Fall back to assessment overall score
  if (assessment?.overall_score) {
    const score = assessment.overall_score
    if (score >= 80) return 'thriving'
    if (score >= 60) return 'building'
    if (score >= 40) return 'seeking'
    return 'exploring'
  }
  
  return 'neutral'
}

/**
 * Extracts desired state from vision and profile
 */
function extractDesiredState(vision: any, profile: any): string {
  const desires = []
  
  if (vision) {
    // Extract keywords from vision categories
    const visionContent = JSON.stringify(vision).toLowerCase()
    if (visionContent.includes('free') || visionContent.includes('abundant')) desires.push('freedom')
    if (visionContent.includes('healthy') || visionContent.includes('vibrant')) desires.push('vitality')
    if (visionContent.includes('connection') || visionContent.includes('love')) desires.push('connection')
    if (visionContent.includes('creative') || visionContent.includes('expressed')) desires.push('creativity')
  }
  
  return desires.join(' + ') || 'balance and growth'
}

/**
 * Extracts recent wins from category states and journal entries
 */
function extractRecentWins(categoryStates: any[], journals: any[]): string[] {
  const wins: string[] = []
  
  // From category states (V3 system)
  categoryStates?.slice(0, 3).forEach(state => {
    if (state.ai_summary) {
      wins.push(`Created ${state.category || 'vision'}`)
    }
  })
  
  // From journals with positive tone
  journals?.slice(0, 5).forEach(entry => {
    if (entry.content) {
      const content = entry.content.toLowerCase()
      if (content.includes('accomplished') || content.includes('proud') || 
          content.includes('breakthrough') || content.includes('grateful')) {
        wins.push(entry.content.substring(0, 100) + '...')
      }
    }
  })
  
  return wins.slice(0, 5)
}

/**
 * Calculates emotional trends across categories
 */
function calculateEmotionalTrends(assessment: any, journals: any[]): Array<{category: string, trend: 'rising' | 'stable' | 'declining', score: number}> {
  const trends: Array<{category: string, trend: 'rising' | 'stable' | 'declining', score: number}> = []
  
  if (assessment && assessment.category_scores) {
    const categories = ['money', 'health', 'romance', 'family', 'business', 'home', 
                       'spirituality', 'travel', 'social', 'fun', 'possessions', 'giving']
    
    categories.forEach(category => {
      const score = assessment.category_scores[category] || 50
      let trend: 'rising' | 'stable' | 'declining' = 'stable'
      
      if (score >= 70) trend = 'rising'
      else if (score < 50) trend = 'declining'
      
      trends.push({ category, trend, score })
    })
  }
  
  return trends
}

/**
 * Builds cross-category insights from vibrational links
 */
function buildCrossCategoryInsights(links: any[]): Array<{category_a: string, category_b: string, connection: string, strength: number}> {
  return links?.filter(link => link.strength > 0.3).map(link => ({
    category_a: link.category_a,
    category_b: link.category_b,
    connection: link.shared_themes?.join(', ') || 'emotionally linked',
    strength: link.strength
  })) || []
}

/**
 * Generates a session summary for context continuity
 */
function generateSessionSummary(profile: any, assessment: any, journals: any[]): string {
  const parts: string[] = []
  
  if (assessment?.overall_vibration) {
    parts.push(`Overall vibration: ${assessment.overall_vibration}`)
  }
  
  if (journals && journals.length > 0) {
    parts.push(`${journals.length} recent journal entries`)
  }
  
  if (profile?.lifestyle) {
    parts.push(`Lifestyle: ${profile.lifestyle}`)
  }
  
  return parts.join(' | ') || 'Building momentum across life categories'
}

/**
 * Extracts values from profile
 */
function extractValues(profile: any): string[] {
  if (!profile) return []
  
  const values: string[] = []
  
  // Extract from personal stories and strengths
  if (profile.strengths && Array.isArray(profile.strengths)) {
    values.push(...profile.strengths.slice(0, 3))
  }
  
  return values
}

/**
 * Extracts priorities from profile and assessment
 */
function extractPriorities(profile: any, assessment: any): string[] {
  const priorities: string[] = []
  
  // Top categories from assessment
  if (assessment?.category_scores) {
    const topCategories = Object.entries(assessment.category_scores)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)
    
    priorities.push(...topCategories)
  }
  
  return priorities
}
