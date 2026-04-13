import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { resetStuck } from '@/lib/cinematic/queue-runner'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  try {
    const result = await resetStuck(id)
    return NextResponse.json({ success: true, reset: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
