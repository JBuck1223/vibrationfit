import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, storageQuotaGb } = await req.json()
    if (!userId || typeof storageQuotaGb !== 'number') {
      return NextResponse.json({ error: 'userId and storageQuotaGb required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    // Get admin user for audit trail
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    
    // Insert storage grant into user_storage table
    const { error } = await supabase
      .from('user_storage')
      .insert({
        user_id: userId,
        quota_gb: storageQuotaGb,
        granted_at: new Date().toISOString(),
        metadata: {
          admin_action: true,
          adjusted_by: adminUser?.id,
          reason: 'Admin storage adjustment'
        }
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    console.log('✅ Storage quota granted:', { userId, storageQuotaGb })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


