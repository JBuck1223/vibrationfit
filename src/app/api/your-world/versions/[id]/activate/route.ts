/** POST: make a saved version the active one. */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setActiveVersion } from '@/lib/your-world/store'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json({ version: await setActiveVersion(supabase, user.id, id) })
  } catch (error) {
    console.error('[YourWorld API] activate error:', error)
    return NextResponse.json({ error: 'Failed to switch versions' }, { status: 500 })
  }
}
