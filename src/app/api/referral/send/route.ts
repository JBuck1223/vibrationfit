import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      referredName,
      referredEmail: rawEmail,
      personalization,
      referrerName: bodyReferrerName,
    } = body

    const referredEmail = rawEmail?.trim()?.toLowerCase()

    if (!referredName?.trim() || !referredEmail || !personalization?.trim()) {
      return NextResponse.json(
        { error: 'Friend\'s name, email, and interest area are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referredEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = body.email?.trim()?.toLowerCase()

    if (!user && !email) {
      return NextResponse.json({ error: 'Authentication or email required' }, { status: 401 })
    }

    let participantQuery = adminDb.from('referral_participants').select('*')
    if (user) {
      participantQuery = participantQuery.eq('user_id', user.id)
    } else {
      participantQuery = participantQuery.eq('email', email!)
    }

    const { data: participant } = await participantQuery.maybeSingle()
    if (!participant) {
      return NextResponse.json({ error: 'Not enrolled in referral program' }, { status: 404 })
    }

    if (referredEmail === participant.email) {
      return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 })
    }

    // Rate limit: 10 emails per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentSends } = await adminDb
      .from('referral_invites')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', participant.id)
      .gte('sent_at', oneDayAgo)

    if ((recentSends || 0) >= 10) {
      return NextResponse.json(
        { error: 'Daily referral email limit reached (10 per day)' },
        { status: 429 }
      )
    }

    // Check for duplicate
    const { data: existingInvite } = await adminDb
      .from('referral_invites')
      .select('id, status')
      .eq('participant_id', participant.id)
      .eq('referred_email', referredEmail)
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'You\'ve already sent a referral to this email' },
        { status: 409 }
      )
    }

    // Load email template
    const { data: template } = await adminDb
      .from('email_templates')
      .select('subject, text_body, html_body')
      .eq('slug', 'referral-warm-intro')
      .eq('status', 'active')
      .maybeSingle()

    const referrerName = bodyReferrerName || participant.display_name || participant.email.split('@')[0]
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
    const referralLink = `${siteUrl}/offer/launch?ref=${participant.referral_code}`

    const vars: Record<string, string> = {
      referrerName: referrerName.trim(),
      firstName: referredName.trim(),
      personalization: personalization.trim(),
      referralLink,
    }

    let subject: string
    let textBody: string

    if (template) {
      subject = template.subject
      textBody = template.text_body || ''
      for (const [key, val] of Object.entries(vars)) {
        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
        textBody = textBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
      }
    } else {
      subject = `${vars.referrerName} thought you might like this`
      textBody = `Hey ${vars.firstName},\n\n${vars.referrerName} mentioned you're into ${vars.personalization}, and suggested I share this with you.\n\nMy partner Vanessa and I just finished building a 72-Hour Activation Intensive. In 3 days you create a written life vision, custom AM/PM audios, a vision board, and a 28-day activation plan to make it stick.\n\nWe're inviting a small group of founding testers in at a big discount in exchange for honest feedback.\n\nDetails are here:\n${vars.referralLink}\n\nIf it feels like a fit, amazing. If not, no worries at all and thanks for taking a look.\n\nJordan`
    }

    const { messageId } = await sendAndLogEmail({
      to: referredEmail,
      subject,
      textBody,
      from: process.env.AWS_SES_FROM_EMAIL || '"Jordan at VibrationFit" <team@vibrationfit.com>',
      context: {
        guestEmail: referredEmail,
      },
    })

    await adminDb.from('referral_invites').insert({
      participant_id: participant.id,
      referred_email: referredEmail,
      referred_name: referredName.trim(),
      personalization: personalization.trim(),
      email_message_id: messageId,
    })

    await adminDb.from('referral_events').insert({
      referrer_id: participant.id,
      event_type: 'referral_sent',
      referred_email: referredEmail,
      metadata: { referredName: referredName.trim(), personalization: personalization.trim() },
    })

    return NextResponse.json({ success: true, messageId })
  } catch (error) {
    console.error('[referral/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
