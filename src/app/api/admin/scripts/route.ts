import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase/admin'
import { importScript } from '@/lib/script-studio/import'

export async function GET(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const id = new URL(request.url).searchParams.get('script')
  const db = createAdminClient()
  if (id) {
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid script ID' }, { status: 400 })
    const { data, error } = await db.from('admin_script_versions').select('*').eq('script_id', id).order('version_number')
    if (error) return NextResponse.json({ error: 'Unable to load versions' }, { status: 500 })
    return NextResponse.json({ versions: data })
  }
  const { data, error } = await db.from('admin_scripts').select('*').order('sort_order').order('id')
  if (error) return NextResponse.json({ error: 'Unable to load scripts' }, { status: 500 })
  return NextResponse.json({ scripts: data })
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  return importScript(request)
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const parsed = z.object({ script_id: z.uuid(), group_id: z.uuid().nullable(), direction: z.enum(['up', 'down']).optional() }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid script or group' }, { status: 400 })
  const { error } = await createAdminClient().rpc('move_admin_script', {
    p_script_id: parsed.data.script_id,
    p_group_id: parsed.data.group_id,
    p_direction: parsed.data.direction || null,
  })
  if (error) return NextResponse.json({ error: error.code === '40001' ? error.message : 'Unable to move script' }, { status: error.code === 'P0002' ? 404 : error.code === '40001' ? 409 : 400 })
  return NextResponse.json({ success: true })
}
