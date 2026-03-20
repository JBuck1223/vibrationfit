// Send email to a specific lead
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { to, subject, htmlBody, textBody, senderId } = body
    const sender = getSenderById(senderId || DEFAULT_CRM_SENDER.id)

    if (!to || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        { error: 'Email address, subject, and body are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
    }

    // Look up referral link for this recipient
    const adminClient = createAdminClient()
    const { data: referralRow } = await adminClient
      .from('referral_participants')
      .select('referral_code')
      .eq('email', to)
      .eq('is_active', true)
      .maybeSingle()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
    const extraVars: Record<string, string> = {}
    if (referralRow?.referral_code) {
      extraVars.referralLink = `${siteUrl}/offer/launch?ref=${referralRow.referral_code}`
    }

    function applyVars(text: string): string {
      let result = text
      for (const [key, value] of Object.entries(extraVars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      }
      return result
    }

    const finalSubject = applyVars(subject)
    const finalTextBody = applyVars(textBody || htmlBody?.replace(/<[^>]*>/g, '') || '')
    const finalHtmlBody = htmlBody ? applyVars(htmlBody) : undefined

    await sendAndLogEmail({
      to,
      subject: finalSubject,
      from: sender.from,
      ...(finalHtmlBody ? { htmlBody: finalHtmlBody } : {}),
      textBody: finalTextBody,
      replyTo: sender.email,
      context: { guestEmail: to },
    })

    // Update lead status to 'contacted' if currently 'new'
    const { data: lead } = await adminClient
      .from('leads')
      .select('status')
      .eq('id', id)
      .single()

    if (lead?.status === 'new') {
      await adminClient
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', id)
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error: unknown) {
    console.error('Error sending email to lead:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
