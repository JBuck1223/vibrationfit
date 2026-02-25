import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

interface RouteContext { params: Promise<{ id: string }> }

function applyVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: campaign } = await supabase
      .from('messaging_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json({ error: 'Campaign already sent or sending' }, { status: 400 })
    }

    await supabase
      .from('messaging_campaigns')
      .update({ status: 'sending' })
      .eq('id', id)

    const admin = createAdminClient()
    const filter = campaign.audience_filter as Record<string, unknown>
    const source = (filter.source as string) || 'user_profiles'

    // Fetch template
    let subject: string | null = null
    let body = ''
    let textBody: string | null = null

    if (campaign.channel === 'email') {
      const { data: template } = await admin
        .from('email_templates')
        .select('subject, html_body, text_body')
        .eq('id', campaign.template_id)
        .single()

      if (!template) {
        await supabase.from('messaging_campaigns').update({ status: 'draft' }).eq('id', id)
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      subject = template.subject
      body = template.html_body
      textBody = template.text_body
    } else {
      const { data: template } = await admin
        .from('sms_templates')
        .select('body')
        .eq('id', campaign.template_id)
        .single()

      if (!template) {
        await supabase.from('messaging_campaigns').update({ status: 'draft' }).eq('id', id)
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      body = template.body
    }

    // Fetch audience
    interface Recipient {
      email?: string
      phone?: string
      full_name?: string
      first_name?: string
      id?: string
    }
    let recipients: Recipient[] = []

    if (source === 'leads') {
      let query = admin.from('leads').select('id, email, phone, first_name, last_name')
      if (filter.status) query = query.eq('status', filter.status as string)
      if (filter.lead_type) query = query.eq('lead_type', filter.lead_type as string)
      if (campaign.channel === 'sms') query = query.not('phone', 'is', null).eq('sms_opt_in', true)
      if (campaign.channel === 'email') query = query.not('email', 'is', null)
      const { data } = await query
      recipients = (data || []).map((r: any) => ({
        email: r.email,
        phone: r.phone,
        full_name: [r.first_name, r.last_name].filter(Boolean).join(' '),
        first_name: r.first_name,
      }))
    } else {
      let query = admin.from('user_profiles').select('id, email, phone, full_name, first_name')
      if (filter.subscription_status) query = query.eq('subscription_status', filter.subscription_status as string)
      if (filter.role) query = query.eq('role', filter.role as string)
      const { data } = await query
      recipients = (data || []).map((r: any) => ({
        email: r.email,
        phone: r.phone,
        full_name: r.full_name,
        first_name: r.first_name,
        id: r.id,
      }))
    }

    // Queue messages
    let sentCount = 0
    let failedCount = 0
    const now = new Date().toISOString()

    for (const recipient of recipients) {
      try {
        const vars: Record<string, string> = {
          name: recipient.full_name || recipient.first_name || '',
          firstName: recipient.first_name || '',
          email: recipient.email || '',
        }

        await admin.from('scheduled_messages').insert({
          message_type: campaign.channel,
          recipient_email: recipient.email || null,
          recipient_phone: recipient.phone || null,
          recipient_name: recipient.full_name || recipient.first_name || null,
          recipient_user_id: recipient.id || null,
          subject: subject ? applyVariables(subject, vars) : null,
          body: applyVariables(body, vars),
          text_body: textBody ? applyVariables(textBody, vars) : null,
          scheduled_for: now,
          email_template_id: campaign.channel === 'email' ? campaign.template_id : null,
          sms_template_id: campaign.channel === 'sms' ? campaign.template_id : null,
        })

        sentCount++
      } catch {
        failedCount++
      }
    }

    await supabase
      .from('messaging_campaigns')
      .update({
        status: 'sent',
        sent_count: sentCount,
        failed_count: failedCount,
        audience_count: recipients.length,
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      queued: sentCount,
      failed: failedCount,
      total_recipients: recipients.length,
    })
  } catch (err) {
    console.error('Error sending campaign:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
