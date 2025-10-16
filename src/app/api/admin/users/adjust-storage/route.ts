import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, storageQuotaGb } = await req.json()
    if (!userId || typeof storageQuotaGb !== 'number') {
      return NextResponse.json({ error: 'userId and storageQuotaGb required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ storage_quota_gb: storageQuotaGb })
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


