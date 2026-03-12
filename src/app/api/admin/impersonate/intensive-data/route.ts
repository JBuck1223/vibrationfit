import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

/**
 * Returns intensive dashboard data for the impersonated user.
 * Client components can't query another user's data via RLS,
 * so this endpoint proxies those queries through the service role.
 */
export async function GET(request: NextRequest) {
  const result = await verifyAdminAccess()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const cookieStore = await cookies()
  const targetUserId = cookieStore.get('vf-impersonate-uid')?.value
  if (!targetUserId) {
    return NextResponse.json({ error: 'No impersonation active' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Fetch user account data (Step 1: settings check)
  const { data: accountData } = await adminClient
    .from('user_accounts')
    .select('first_name, last_name, email, phone, profile_picture_url, updated_at')
    .eq('id', targetUserId)
    .single()

  // Fetch active intensive checklist
  const { data: checklistData } = await adminClient
    .from('intensive_checklist')
    .select('*')
    .eq('user_id', targetUserId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch assessments
  const { data: assessments } = await adminClient
    .from('assessment_results')
    .select('id, status, completed_at')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  // Fetch active vision ID
  const { data: activeVision } = await adminClient
    .from('vision_versions')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .is('household_id', null)
    .maybeSingle()

  // Vision board category coverage check
  let visionBoardComplete = checklistData?.vision_board_completed ?? false
  if (!visionBoardComplete) {
    const { data: visionBoardItems } = await adminClient
      .from('vision_board_items')
      .select('categories')
      .eq('user_id', targetUserId)
      .eq('status', 'active')

    if (visionBoardItems && visionBoardItems.length > 0) {
      const covered = new Set<string>()
      visionBoardItems.forEach(item => {
        if (item.categories && Array.isArray(item.categories)) {
          item.categories.forEach((cat: string) => covered.add(cat))
        }
      })
      const LIFE_CATEGORIES = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']
      visionBoardComplete = LIFE_CATEGORIES.every(cat => covered.has(cat))
    }
  }

  // Journal entry check
  let hasJournalEntry = checklistData?.first_journal_entry ?? false
  if (!hasJournalEntry) {
    const { count } = await adminClient
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
    hasJournalEntry = (count || 0) > 0
  }

  // Get target user auth info for email
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(targetUserId)

  return NextResponse.json({
    accountData,
    checklistData: checklistData ? {
      ...checklistData,
      vision_board_completed: visionBoardComplete || checklistData.vision_board_completed,
      first_journal_entry: hasJournalEntry || checklistData.first_journal_entry,
    } : null,
    assessments: assessments || [],
    activeVisionId: activeVision?.id || null,
    userEmail: targetUser?.email || null,
  })
}
