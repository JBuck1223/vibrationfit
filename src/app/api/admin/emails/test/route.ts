// Admin API - Send test emails
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'
import { generateSupportTicketCreatedEmail } from '@/lib/email/templates/support-ticket-created'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Get request body
    const body = await request.json()
    const { to, templateId, templateData } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      )
    }

    // Generate email content based on template
    let emailContent: { subject: string; htmlBody: string; textBody: string }
    
    switch (templateId) {
      case 'household-invitation':
        emailContent = await generateHouseholdInvitationEmail(templateData)
        break
      case 'support-ticket-created':
        emailContent = await generateSupportTicketCreatedEmail(templateData)
        break
      default:
        return NextResponse.json(
          { error: 'Unknown template ID' },
          { status: 400 }
        )
    }

    // Send email
    await sendEmail({
      to,
      subject: `[TEST] ${emailContent.subject}`,
      htmlBody: emailContent.htmlBody,
      textBody: emailContent.textBody,
      replyTo: 'team@vibrationfit.com',
    })

    return NextResponse.json({ 
      success: true,
      message: `Test email sent to ${to}` 
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}






