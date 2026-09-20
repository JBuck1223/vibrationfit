import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { data, error } = await createAdminClient().from('admin_script_groups').select('id, name').order('name')
  if (error) return NextResponse.json({ error: 'Unable to load groups' }, { status: 500 })
  return NextResponse.json({ groups: data })
}
export async function POST(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const parsed = z.object({ name: z.string().trim().min(1).max(200) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Provide a group name (up to 200 characters)' }, { status: 400 })
  const { data, error } = await createAdminClient().from('admin_script_groups').insert(parsed.data).select('id, name').single()
  if (error) return NextResponse.json({ error: 'Unable to create group' }, { status: 500 })
  return NextResponse.json({ group: data }, { status: 201 })
}
