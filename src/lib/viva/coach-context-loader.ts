/**
 * VIVA Coach Context Loader
 *
 * Fetches targeted personal data for coaching conversations.
 * Loads only what's relevant based on selected categories and intent,
 * rather than dumping everything into the prompt.
 *
 * Used by: /api/viva/chat (mode='coach')
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { CoachContextInput } from './prompts/coach-system-prompt'

export interface LoadCoachContextParams {
  supabase: SupabaseClient
  userId: string
  userName: string
  selectedCategories?: string[]
  userIntent?: string
}

export interface CoachContextResult {
  context: CoachContextInput
  loadTimeMs: number
}

/**
 * Loads all relevant context for a coaching conversation.
 * Runs queries in parallel for speed.
 */
export async function loadCoachContext({
  supabase,
  userId,
  userName,
  selectedCategories,
  userIntent,
}: LoadCoachContextParams): Promise<CoachContextResult> {
  const startTime = Date.now()

  // Run all queries in parallel
  const [
    profileResult,
    visionResult,
    assessmentResult,
    journalResult,
    coachingHistoryResult,
    caseNotesResult,
  ] = await Promise.all([
    // 1. User profile
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),

    // 2. Active vision (for category-specific text)
    loadActiveVision(supabase, userId),

    // 3. Active assessment (green line status + category scores)
    supabase
      .from('assessment_results')
      .select('total_score, overall_percentage, category_scores, green_line_status')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),

    // 4. Recent journal entries (filtered by category if specified)
    loadJournalEntries(supabase, userId, selectedCategories),

    // 5. Past coaching sessions
    supabase
      .from('conversation_sessions')
      .select('id, title, preview_message, category, created_at, last_message_at')
      .eq('user_id', userId)
      .eq('mode', 'coach')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(5),

    // 6. Case notes (synthesized understanding)
    loadCaseNotes(supabase, userId, selectedCategories),
  ])

  const context: CoachContextInput = {
    userName,
    profileData: profileResult.data || null,
    visionData: visionResult,
    assessmentData: assessmentResult.data || null,
    journalEntries: journalResult || [],
    coachingHistory: coachingHistoryResult.data || [],
    caseNotes: caseNotesResult || [],
    selectedCategories,
    userIntent,
  }

  return {
    context,
    loadTimeMs: Date.now() - startTime,
  }
}

/**
 * Loads the user's active vision document.
 * Priority: is_active=true → status='complete' → latest by date
 */
async function loadActiveVision(supabase: SupabaseClient, userId: string) {
  // Try active vision first
  const { data: activeVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeVision) return activeVision

  // Then complete vision
  const { data: completeVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (completeVision) return completeVision

  // Finally latest vision
  const { data: latestVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latestVision || null
}

/**
 * Loads recent journal entries, optionally filtered by category.
 */
async function loadJournalEntries(
  supabase: SupabaseClient,
  userId: string,
  selectedCategories?: string[]
): Promise<any[]> {
  let query = supabase
    .from('journal_entries')
    .select('id, date, title, content, categories, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(10)

  if (selectedCategories && selectedCategories.length > 0) {
    // Filter journal entries that overlap with selected categories
    query = query.overlaps('categories', selectedCategories)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Coach Context] Error loading journal entries:', error)
    return []
  }

  return data || []
}

/**
 * Loads memory items (synthesized understanding) for the user.
 * Uses the viva_memory_items table. Falls back gracefully if table doesn't exist.
 */
async function loadCaseNotes(
  supabase: SupabaseClient,
  userId: string,
  selectedCategories?: string[]
): Promise<any[]> {
  try {
    let query = supabase
      .from('viva_memory_items')
      .select('id, type, content, category, confidence, last_used_at')
      .eq('user_id', userId)
      .gte('confidence', 0.3)
      .order('confidence', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(15)

    if (selectedCategories && selectedCategories.length > 0) {
      query = query.or(
        selectedCategories.map(c => `category.eq.${c}`).join(',') + ',category.is.null'
      )
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return []
      }
      console.error('[Coach Context] Error loading memories:', error)
      return []
    }

    return data || []
  } catch {
    return []
  }
}

/**
 * Loads the last few messages from the most recent coaching session
 * for the given categories, to provide session continuity.
 */
export async function loadLastCoachingSessionMessages(
  supabase: SupabaseClient,
  userId: string,
  category?: string
): Promise<{ sessionId: string; messages: any[] } | null> {
  // Find the most recent coaching session for this category
  let query = supabase
    .from('conversation_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('mode', 'coach')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: sessions } = await query

  if (!sessions || sessions.length === 0) return null

  const sessionId = sessions[0].id

  // Load last 6 messages from that session for continuity context
  const { data: messages } = await supabase
    .from('ai_conversations')
    .select('role, message, created_at')
    .eq('conversation_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (!messages || messages.length === 0) return null

  return {
    sessionId,
    messages: messages.reverse(),
  }
}
