// /src/app/api/leads/route.ts
// Public lead capture API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { triggerEvent } from '@/lib/messaging/events'
import { sendServerConversion } from '@/lib/tracking/server-conversions'
import { createAdminNotification } from '@/lib/admin/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!body.type) {
      return NextResponse.json({ error: 'Lead type is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS for public lead capture
    const supabase = createAdminClient()

    // Create lead record
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        type: body.type,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        message: body.message || null,
        source: body.source || 'website',
        metadata: body.metadata || {},
        
        // Attribution
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_content: body.utm_content || null,
        utm_term: body.utm_term || null,
        referrer: body.referrer || null,
        landing_page: body.landing_page || null,
        
        // Engagement
        visitor_id: body.visitor_id || null,
        session_id: body.session_id || null,
        video_engagement: body.video_engagement || null,
        pages_visited: body.pages_visited || [],
        time_on_site: body.time_on_site || null,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    console.log('✅ Lead created:', lead.id)

    // Server-side conversion events (Meta CAPI, GA4 MP, TikTok Events API)
    sendServerConversion('lead', {
      email: body.email,
      phone: body.phone || undefined,
      firstName: body.first_name || undefined,
      lastName: body.last_name || undefined,
      contentName: body.type,
      eventId: lead.id,
      eventSourceUrl: body.landing_page ? `https://vibrationfit.com${body.landing_page}` : 'https://vibrationfit.com',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      visitorId: body.visitor_id || undefined,
    }).catch((err) => console.error('Server conversion error:', err))

    // Fire event for automation rules and sequence enrollment
    triggerEvent('lead.created', {
      email: body.email,
      phone: body.phone || undefined,
      name: [body.first_name, body.last_name].filter(Boolean).join(' ') || undefined,
      firstName: body.first_name || undefined,
      leadType: body.type,
    }).catch((err) => console.error('triggerEvent error:', err))

    const leadName = [body.first_name, body.last_name].filter(Boolean).join(' ') || body.email
    createAdminNotification({
      type: 'lead_created',
      title: `New Lead: ${leadName}`,
      body: `${body.type} - ${body.email}`,
      metadata: { email: body.email, leadType: body.type, leadId: lead.id },
      link: '/admin/crm/leads',
    }).catch(err => console.error('Admin notification DB error:', err))

    // Send confirmation email
    try {
      const confirmationEmail = getConfirmationEmail(body.type, {
        firstName: body.first_name || 'there',
        email: body.email,
      })

      await sendAndLogEmail({
        to: body.email,
        subject: confirmationEmail.subject,
        textBody: confirmationEmail.textBody,
        from: '"Jordan Buckingham" <jordan@vibrationfit.com>',
        replyTo: 'jordan@vibrationfit.com',
        context: { guestEmail: body.email },
      })

      console.log('[leads] Confirmation email sent to:', body.email)
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError)
      // Don't fail the lead creation if email fails
    }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error in lead capture API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getConfirmationEmail(type: string, data: { firstName: string; email: string }) {
  const { firstName } = data

  switch (type) {
    case 'contact':
      return {
        subject: `Hey ${firstName}, quick note from Jordan`,
        textBody: [
          `Hey ${firstName},`,
          '',
          `Thanks for reaching out -- I wanted to make sure this email actually lands in your inbox and not a spam folder.`,
          '',
          `Could you do me a quick favor and reply to this email with "Got it" so I know you received it? That way I can make sure all my follow-ups reach you.`,
          '',
          `I'll be in touch within 24 hours with a personal response to your message.`,
          '',
          'Talk soon,',
          'Jordan',
          'https://vibrationfit.com',
        ].join('\n'),
      }

    case 'demo':
      return {
        subject: `${firstName}, your VibrationFit demo is next`,
        textBody: [
          `Hey ${firstName},`,
          '',
          `Really glad you're interested in seeing VibrationFit in action. I'm going to personally walk you through everything -- your Life Vision, VIVA coaching, vision boards, the works.`,
          '',
          `Before we schedule, quick favor: can you reply to this email with "Got it" so I know my emails are landing in your primary inbox? I want to make sure you get the calendar link when I send it.`,
          '',
          `I'll follow up shortly to find a time that works for you.`,
          '',
          'Talk soon,',
          'Jordan',
          'https://vibrationfit.com',
        ].join('\n'),
      }

    case 'intensive_intake':
      return {
        subject: `${firstName}, your Activation Intensive application`,
        textBody: [
          `Hey ${firstName},`,
          '',
          `Thank you for applying to the 72-Hour Activation Intensive. I review every application personally and I'll be in touch within 24 hours.`,
          '',
          `One quick ask: can you reply to this email with "Received" so I know you're getting my messages? The next steps I send are time-sensitive and I need to make sure they reach you.`,
          '',
          `Looking forward to connecting.`,
          '',
          'Jordan',
          'https://vibrationfit.com',
        ].join('\n'),
      }

    case 'assessment':
      return {
        subject: `${firstName}, your Vibration Assessment is underway`,
        textBody: [
          `Hey ${firstName},`,
          '',
          `Welcome to VibrationFit! Your Vibration Assessment measures your alignment across 12 life categories and shows you exactly where you're thriving and where the growth opportunities are.`,
          '',
          `If you need to step away and come back, your progress is saved. Just return to pick up where you left off:`,
          'https://vibrationfit.com/assessment/start',
          '',
          `Quick favor: can you reply with "Got it" so I know this landed in your inbox?`,
          '',
          'Talk soon,',
          'Jordan',
          'https://vibrationfit.com',
        ].join('\n'),
      }

    default:
      return {
        subject: `Hey ${firstName}, quick note from VibrationFit`,
        textBody: [
          `Hey ${firstName},`,
          '',
          `Thanks for reaching out. I got your message and will be in touch soon.`,
          '',
          `Quick favor -- could you reply with "Got it" so I know this landed in your inbox? That helps me make sure you get everything going forward.`,
          '',
          'Talk soon,',
          'Jordan',
          'https://vibrationfit.com',
        ].join('\n'),
      }
  }
}












