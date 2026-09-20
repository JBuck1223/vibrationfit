import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { importSchema } from './schema'
import { sectionText } from './sections'

export async function importScript(request: Request, personal = false) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Provide valid JSON' }, { status: 400 })
  }
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid import' }, { status: 400 })
  const input = parsed.data
  const { data: id, error } = await createAdminClient().rpc('import_admin_script_v2', {
    p_request_id: input.request_id,
    p_script_id: input.script_id || null,
    p_title: input.title,
    p_group_id: input.group_id || null,
    p_base_version_id: input.base_version_id || null,
    p_unlock_section_ids: personal ? [] : input.unlock_section_ids,
    p_versions: input.versions.map(version => ({ ...version, content: version.sections ? sectionText(version.sections) : version.content, source: personal ? 'personal' : version.source })),
  })
  if (error) {
    console.error('[Script Studio] Import failed:', error.code)
    const status = error.code === 'P0002' ? 404 : ['22023', '40001', '23514'].includes(error.code) ? 409 : error.code === '23503' ? 400 : 500
    return NextResponse.json({ error: status === 404 ? 'Script not found' : status === 409 ? error.message : status === 400 ? 'Group not found' : 'Unable to save script' }, { status })
  }
  return NextResponse.json({ script_id: id, path: `/admin/scripts?script=${id}` })
}
