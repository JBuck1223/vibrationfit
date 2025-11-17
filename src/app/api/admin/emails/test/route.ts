// Admin API - Send test emails
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/aws-ses'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (you can add proper admin check here)
    // For now, just check if user exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, email')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // TODO: Uncomment when you add is_admin field
    // if (!profile?.is_admin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    // Get request body
    const body = await request.json()
    const { to, templateData } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      )
    }

    // Generate email content
    const emailContent = generateHouseholdInvitationEmail(templateData)

    // Send email
    await sendEmail({
      to,
      subject: `[TEST] ${emailContent.subject}`,
      htmlBody: emailContent.htmlBody,
      textBody: emailContent.textBody,
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



