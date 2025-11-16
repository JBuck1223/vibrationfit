import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { userId, storageQuotaGb } = await req.json()
    if (!userId || typeof storageQuotaGb !== 'number') {
      return NextResponse.json({ error: 'userId and storageQuotaGb required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    
    // Insert storage grant into user_storage table
    // Total storage = sum of all grants for this user
    const { error } = await supabase
      .from('user_storage')
      .insert({
        user_id: userId,
        quota_gb: storageQuotaGb,
        metadata: {
          admin_action: true,
          reason: 'Admin storage adjustment'
        }
      })

    if (error) {
      console.error('Failed to grant storage:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Storage quota granted:', { userId, storageQuotaGb })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


