/**
 * Admin Users API
 * 
 * GET /api/admin/users - Get list of users (with optional role filter)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/middleware/admin'

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

    // Get query params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // Build query - now includes role column
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('full_name', { ascending: true })

    // Filter by role if specified
    if (role) {
      if (role === 'admin') {
        // Include both admin and super_admin
        query = query.in('role', ['admin', 'super_admin'])
      } else {
        query = query.eq('role', role)
      }
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
