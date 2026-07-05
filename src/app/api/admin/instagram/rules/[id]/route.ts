import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { validateFlow } from '@/lib/meta/flow-validation'

export const dynamic = 'force-dynamic'

const PLATFORMS = ['instagram', 'facebook', 'both']
const TRIGGER_TYPES = ['dm_keyword', 'comment_keyword']
const MATCH_TYPES = ['exact', 'contains']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as {
    account_id?: string | null
    platform?: string
    trigger_type?: string
    keyword?: string
    match_type?: string
    reply_text?: string
    reply_link?: string | null
    media_id?: string | null
    public_reply_text?: string | null
    is_active?: boolean
    flow?: unknown
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.keyword !== undefined) {
    const keyword = body.keyword.trim()
    if (!keyword) return NextResponse.json({ error: 'A keyword is required' }, { status: 400 })
    updates.keyword = keyword
  }
  const hasFlowSteps = !!(body.flow as { steps?: unknown[] } | null | undefined)?.steps?.length
  if (body.flow !== undefined) {
    const flowError = validateFlow(hasFlowSteps ? body.flow : null)
    if (flowError) {
      return NextResponse.json({ error: flowError }, { status: 400 })
    }
    updates.flow = hasFlowSteps ? body.flow : null
  }
  if (body.reply_text !== undefined) {
    const replyText = body.reply_text.trim()
    if (!replyText && !hasFlowSteps) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
    }
    updates.reply_text = replyText
  }
  if (body.platform !== undefined) {
    if (!PLATFORMS.includes(body.platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }
    updates.platform = body.platform
  }
  if (body.trigger_type !== undefined) {
    if (!TRIGGER_TYPES.includes(body.trigger_type)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
    }
    updates.trigger_type = body.trigger_type
  }
  if (body.match_type !== undefined) {
    if (!MATCH_TYPES.includes(body.match_type)) {
      return NextResponse.json({ error: 'Invalid match type' }, { status: 400 })
    }
    updates.match_type = body.match_type
  }
  if (body.reply_link !== undefined) {
    const replyLink = (body.reply_link || '').trim()
    if (replyLink) {
      try {
        const u = new URL(replyLink)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad protocol')
      } catch {
        return NextResponse.json({ error: 'Reply link must be a valid http(s) URL' }, { status: 400 })
      }
    }
    updates.reply_link = replyLink || null
  }
  if (body.media_id !== undefined) {
    updates.media_id = (body.media_id || '').trim() || null
  }
  if (body.public_reply_text !== undefined) {
    updates.public_reply_text = (body.public_reply_text || '').trim() || null
  }
  if (body.account_id !== undefined) {
    updates.account_id = body.account_id || null
  }
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_automation_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }

  return NextResponse.json({ rule: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('meta_automation_rules').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
