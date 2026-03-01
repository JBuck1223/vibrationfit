import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await userSupabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin' && adminAccount?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, storageQuotaGb } = await req.json()
    if (!userId || typeof storageQuotaGb !== 'number') {
      return NextResponse.json({ error: 'userId and storageQuotaGb required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('user_storage')
      .insert({
        user_id: userId,
        quota_gb: storageQuotaGb,
        metadata: {
          admin_action: true,
          granted_by: user.id,
          reason: 'Admin storage adjustment'
        }
      })

    if (error) {
      console.error('Failed to grant storage:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Storage quota granted:', { userId, storageQuotaGb, grantedBy: user.id })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
