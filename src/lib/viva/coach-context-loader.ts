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
 *
 * Adaptive lens: every source is queried cheaply (small limits, indexed
 * filters), and sources with no data simply produce no prompt section —
 * so each member's context reflects the features they actually use.
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
    dailyPapersResult,
    songsResult,
    visionBoardResult,
    abundanceResult,
    mapResult,
    storiesResult,
  ] = await Promise.all([
    // 1. User profile (profiles are versioned — load the active, non-draft one)
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_draft', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

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

    // 7. Gratitude pulse (recent Daily Papers)
    loadDailyPapers(supabase, userId),

    // 8. Songs (emotional arcs the member set to music)
    loadSongs(supabase, userId, selectedCategories),

    // 9. Vision board (active desires + actualized evidence bank)
    loadVisionBoard(supabase, userId, selectedCategories),

    // 10. Abundance flow (events + goals)
    loadAbundance(supabase, userId),

    // 11. Practice rhythm (active MAP items)
    loadMapItems(supabase, userId),

    // 12. Activation stories
    loadStories(supabase, userId),
  ])

  const context: CoachContextInput = {
    userName,
    profileData: profileResult.data || null,
    visionData: visionResult,
    assessmentData: assessmentResult.data || null,
    journalEntries: journalResult || [],
    coachingHistory: coachingHistoryResult.data || [],
    caseNotes: caseNotesResult || [],
    dailyPapers: dailyPapersResult,
    songs: songsResult,
    visionBoard: visionBoardResult,
    abundance: abundanceResult,
    mapItems: mapResult,
    stories: storiesResult,
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
 * Gratitude pulse: recent Daily Paper entries (gratitude + fun plan).
 */
async function loadDailyPapers(supabase: SupabaseClient, userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('daily_papers')
    .select('entry_date, gratitude, fun_plan')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[Coach Context] Error loading daily papers:', error)
    return []
  }
  return (data || []).filter(p => p.gratitude && p.gratitude.trim().length > 0)
}

/**
 * Songs: emotional transformations the member set to music.
 * song_essence holds emotional_start/destination + core_message; lyrics are
 * the member's own quotable words.
 */
async function loadSongs(
  supabase: SupabaseClient,
  userId: string,
  selectedCategories?: string[]
): Promise<any[]> {
  let query = supabase
    .from('songs')
    .select('title, lyrics, song_essence, life_categories, entity_type, created_at')
    .eq('user_id', userId)
    .not('lyrics', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8)

  if (selectedCategories && selectedCategories.length > 0) {
    query = query.overlaps('life_categories', selectedCategories)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Coach Context] Error loading songs:', error)
    return []
  }

  // Fall back to recent songs when no category-matched songs exist
  if ((!data || data.length === 0) && selectedCategories && selectedCategories.length > 0) {
    const { data: recent } = await supabase
      .from('songs')
      .select('title, lyrics, song_essence, life_categories, entity_type, created_at')
      .eq('user_id', userId)
      .not('lyrics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(4)
    return recent || []
  }

  return data || []
}

/**
 * Vision board: active desires plus actualized items (the evidence bank).
 */
async function loadVisionBoard(
  supabase: SupabaseClient,
  userId: string,
  selectedCategories?: string[]
): Promise<{ active: any[]; actualized: any[] }> {
  let activeQuery = supabase
    .from('vision_board_items')
    .select('name, description, categories, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  if (selectedCategories && selectedCategories.length > 0) {
    activeQuery = activeQuery.overlaps('categories', selectedCategories)
  }

  const [activeResult, actualizedResult] = await Promise.all([
    activeQuery,
    supabase
      .from('vision_board_items')
      .select('name, actualization_story, categories, actualized_at')
      .eq('user_id', userId)
      .eq('status', 'actualized')
      .order('actualized_at', { ascending: false, nullsFirst: false })
      .limit(8),
  ])

  if (activeResult.error) console.error('[Coach Context] Error loading vision board:', activeResult.error)
  if (actualizedResult.error) console.error('[Coach Context] Error loading actualized items:', actualizedResult.error)

  return {
    active: activeResult.data || [],
    actualized: actualizedResult.data || [],
  }
}

/**
 * Abundance flow: recent events (money + value) and goals.
 * The notes are where money beliefs show up.
 */
async function loadAbundance(
  supabase: SupabaseClient,
  userId: string
): Promise<{ events: any[]; totalMoney: number; totalValue: number; goals: any[] } | null> {
  const [eventsResult, goalsResult] = await Promise.all([
    supabase
      .from('abundance_events')
      .select('date, value_type, amount, note, vision_category')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('abundance_goals')
      .select('period_type, period_key, amount')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  if (eventsResult.error) {
    console.error('[Coach Context] Error loading abundance:', eventsResult.error)
    return null
  }

  const events = eventsResult.data || []
  if (events.length === 0) return null

  let totalMoney = 0
  let totalValue = 0
  for (const e of events) {
    if (e.value_type === 'money') totalMoney += Number(e.amount) || 0
    else totalValue += Number(e.amount) || 0
  }

  return {
    events: events.slice(0, 8),
    totalMoney,
    totalValue,
    goals: goalsResult.data || [],
  }
}

/**
 * Practice rhythm: the member's active MAP (weekly alignment practices).
 */
async function loadMapItems(supabase: SupabaseClient, userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_maps')
    .select('title, user_map_items(category, activity_type, label, days_of_week, time_of_day)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[Coach Context] Error loading MAP:', error)
    return []
  }
  return data?.user_map_items || []
}

/**
 * Activation stories the member has created.
 */
async function loadStories(supabase: SupabaseClient, userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('title, content, entity_type, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    // status values may vary; fall back to unfiltered recent stories
    const { data: fallback } = await supabase
      .from('stories')
      .select('title, content, entity_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    return fallback || []
  }
  return data || []
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
