// /src/app/api/leads/route.ts
// Public lead capture API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'

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

    // Send confirmation email
    try {
      const confirmationEmail = getConfirmationEmail(body.type, {
        firstName: body.first_name || 'there',
        email: body.email,
      })

      await sendEmail({
        to: body.email,
        subject: confirmationEmail.subject,
        htmlBody: confirmationEmail.htmlBody,
        textBody: confirmationEmail.textBody,
      })

      console.log('✅ Confirmation email sent to:', body.email)
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
        subject: "We've received your message!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #199D67;">Thanks for reaching out, ${firstName}!</h2>
            <p style="color: #333; line-height: 1.6;">
              We've received your message and will get back to you within 24 hours.
            </p>
            <p style="color: #333; line-height: 1.6;">
              In the meantime, feel free to explore more about VibrationFit:
            </p>
            <div style="margin: 30px 0;">
              <a href="https://vibrationfit.com" style="background-color: #199D67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; display: inline-block;">
                Visit Our Website
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Best,<br>
              Team VibrationFit
            </p>
          </div>
        `,
        textBody: `Thanks for reaching out, ${firstName}!\n\nWe've received your message and will get back to you within 24 hours.\n\nBest,\nTeam VibrationFit`,
      }

    case 'demo':
      return {
        subject: "Let's schedule your VibrationFit demo!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #199D67;">Thanks for your interest, ${firstName}!</h2>
            <p style="color: #333; line-height: 1.6;">
              We're excited to show you VibrationFit! We'll reach out shortly to schedule your personalized demo.
            </p>
            <p style="color: #333; line-height: 1.6;">
              During your demo, we'll cover:
            </p>
            <ul style="color: #333; line-height: 1.8;">
              <li>Creating your Life Vision</li>
              <li>AI-powered guidance</li>
              <li>Tracking your progress</li>
              <li>Vision Board creation</li>
            </ul>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best,<br>
              Jordan<br>
              VibrationFit
            </p>
          </div>
        `,
        textBody: `Thanks for your interest, ${firstName}!\n\nWe're excited to show you VibrationFit! We'll reach out shortly to schedule your personalized demo.\n\nBest,\nJordan\nVibrationFit`,
      }

    case 'intensive_intake':
      return {
        subject: "Your 72-Hour Activation Intensive Application",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #199D67;">Thank you for your interest, ${firstName}!</h2>
            <p style="color: #333; line-height: 1.6;">
              We've received your application for the 72-Hour Activation Intensive.
            </p>
            <p style="color: #333; line-height: 1.6;">
              We'll review your application and reach out within 24 hours to discuss next steps.
            </p>
            <p style="color: #333; line-height: 1.6;">
              This is an intensive, transformative experience designed for those ready to make significant shifts in their lives.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Talk soon,<br>
              Jordan<br>
              VibrationFit
            </p>
          </div>
        `,
        textBody: `Thank you for your interest, ${firstName}!\n\nWe've received your application for the 72-Hour Activation Intensive.\n\nWe'll review your application and reach out within 24 hours to discuss next steps.\n\nTalk soon,\nJordan\nVibrationFit`,
      }

    default:
      return {
        subject: "Thanks for reaching out to VibrationFit!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #199D67;">Thanks, ${firstName}!</h2>
            <p style="color: #333; line-height: 1.6;">
              We've received your message and will be in touch soon.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best,<br>
              Team VibrationFit
            </p>
          </div>
        `,
        textBody: `Thanks, ${firstName}!\n\nWe've received your message and will be in touch soon.\n\nBest,\nTeam VibrationFit`,
      }
  }
}












