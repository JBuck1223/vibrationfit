import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { validateFlow } from '@/lib/meta/flow-validation'

export const dynamic = 'force-dynamic'

const PLATFORMS = ['instagram', 'facebook', 'both']
const TRIGGER_TYPES = ['dm_keyword', 'comment_keyword']
const MATCH_TYPES = ['exact', 'contains']

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_automation_rules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load rules' }, { status: 500 })
  }

  return NextResponse.json({ rules: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({})) as {
    account_id?: string | null
    platform?: string
    trigger_type?: string
    keyword?: string
    match_type?: string
    reply_text?: string
    reply_link?: string
    media_id?: string
    public_reply_text?: string
    is_active?: boolean
    flow?: unknown
  }

  const keyword = (body.keyword || '').trim()
  const replyText = (body.reply_text || '').trim()
  const hasFlowSteps = !!(body.flow as { steps?: unknown[] } | null | undefined)?.steps?.length

  if (!keyword) {
    return NextResponse.json({ error: 'A keyword is required' }, { status: 400 })
  }
  if (!replyText && !hasFlowSteps) {
    return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
  }
  const flowError = validateFlow(hasFlowSteps ? body.flow : null)
  if (flowError) {
    return NextResponse.json({ error: flowError }, { status: 400 })
  }
  if (!TRIGGER_TYPES.includes(body.trigger_type || '')) {
    return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
  }
  if (body.platform && !PLATFORMS.includes(body.platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }
  if (body.match_type && !MATCH_TYPES.includes(body.match_type)) {
    return NextResponse.json({ error: 'Invalid match type' }, { status: 400 })
  }

  const replyLink = (body.reply_link || '').trim()
  if (replyLink) {
    try {
      const u = new URL(replyLink)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad protocol')
    } catch {
      return NextResponse.json({ error: 'Reply link must be a valid http(s) URL' }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_automation_rules')
    .insert({
      account_id: body.account_id || null,
      platform: body.platform || 'both',
      trigger_type: body.trigger_type,
      keyword,
      match_type: body.match_type || 'contains',
      reply_text: replyText,
      flow: hasFlowSteps ? body.flow : null,
      reply_link: replyLink || null,
      media_id: (body.media_id || '').trim() || null,
      public_reply_text: (body.public_reply_text || '').trim() || null,
      is_active: body.is_active ?? true,
      created_by: auth.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }

  return NextResponse.json({ rule: data })
}
