/**
 * Admin Users API
 * 
 * GET /api/admin/users - Get list of users (with optional role filter)
 * Includes intensive enrollment data for admin visibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, field, value } = await request.json()
    if (!userId || !field) {
      return NextResponse.json({ error: 'Missing userId or field' }, { status: 400 })
    }

    const allowedFields = ['timezone']
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: `Field '${field}' is not editable` }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('user_accounts')
      .update({ [field]: value || null })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin (database-driven)
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Use service role client for admin queries (bypasses RLS)
    const adminDb = createAdminClient()

    // Get query params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')?.trim()

    // Build query from user_accounts (include phone for session participant lookup)
    let query = adminDb
      .from('user_accounts')
      .select('id, email, first_name, last_name, full_name, role, profile_picture_url, timezone, phone')
      .order('full_name', { ascending: true })

    // Filter by role if specified
    if (role) {
      if (role === 'admin') {
        query = query.in('role', ['admin', 'super_admin'])
      } else {
        query = query.eq('role', role)
      }
    }

    // Optional search (for participant lookup: name or email)
    if (search && search.length >= 2) {
      const term = `%${search}%`
      query = query.or(
        `email.ilike.${term},full_name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`
      ).limit(25)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Fetch intensive enrollment data from intensive_checklist (source of truth)
    let intensiveMap: Record<string, { 
      active_status: string | null
      active_id: string | null
      completed_count: number
      total_count: number 
    }> = {}

    const { data: checklists } = await adminDb
      .from('intensive_checklist')
      .select('id, user_id, status, intensive_id, created_at')
      .order('created_at', { ascending: false })

    if (checklists) {
      for (const cl of checklists) {
        if (!cl.user_id) continue

        if (!intensiveMap[cl.user_id]) {
          intensiveMap[cl.user_id] = {
            active_status: null,
            active_id: null,
            completed_count: 0,
            total_count: 0,
          }
        }

        intensiveMap[cl.user_id].total_count++

        if (cl.status === 'completed') {
          intensiveMap[cl.user_id].completed_count++
        }

        if (
          (cl.status === 'pending' || cl.status === 'in_progress') &&
          !intensiveMap[cl.user_id].active_status
        ) {
          intensiveMap[cl.user_id].active_status = cl.status
          intensiveMap[cl.user_id].active_id = cl.intensive_id
        }
      }
    }

    // Fetch token balances and storage quotas for all users in parallel
    const userIds = (users || []).map(u => u.id)
    
    const tokenBalancePromises = userIds.map(uid =>
      Promise.resolve(adminDb.rpc('get_user_token_balance', { p_user_id: uid }).single())
        .then(({ data }) => ({ uid, balance: (data as { total_active?: number } | null)?.total_active || 0 }))
        .catch(() => ({ uid, balance: 0 }))
    )

    const storageQuotaPromises = userIds.map(uid =>
      Promise.resolve(adminDb.from('user_storage').select('quota_gb').eq('user_id', uid))
        .then(({ data }) => ({ uid, quota: (data || []).reduce((sum: number, row: any) => sum + (row.quota_gb || 0), 0) }))
        .catch(() => ({ uid, quota: 0 }))
    )

    const [tokenResults, storageResults] = await Promise.all([
      Promise.all(tokenBalancePromises),
      Promise.all(storageQuotaPromises),
    ])

    const tokenMap: Record<string, number> = {}
    for (const t of tokenResults) tokenMap[t.uid] = t.balance

    const storageMap: Record<string, number> = {}
    for (const s of storageResults) storageMap[s.uid] = s.quota

    // Merge intensive data, token balances, and storage quotas into users
    const enrichedUsers = (users || []).map(u => ({
      ...u,
      is_admin: u.role === 'admin' || u.role === 'super_admin',
      tokens_remaining: tokenMap[u.id] || 0,
      storage_quota_gb: storageMap[u.id] || 0,
      intensive_active_status: intensiveMap[u.id]?.active_status || null,
      intensive_active_id: intensiveMap[u.id]?.active_id || null,
      intensive_completed_count: intensiveMap[u.id]?.completed_count || 0,
      intensive_total_count: intensiveMap[u.id]?.total_count || 0,
    }))

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
