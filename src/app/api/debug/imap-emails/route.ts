// Debug endpoint to check IMAP email syncing and user matching
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Get recent inbound emails
    const { data: inboundEmails, error: emailError } = await adminClient
      .from('email_messages')
      .select('*')
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(20)

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    // For each email, check if we found a matching user
    const emailsWithUserInfo = await Promise.all(
      (inboundEmails || []).map(async (email) => {
        let userInfo = null
        
        if (email.user_id) {
          // User was matched - get their info
          const { data: authUser } = await adminClient.auth.admin.getUserById(email.user_id)
          const { data: profile } = await adminClient
            .from('user_profiles')
            .select('email, first_name, last_name')
            .eq('user_id', email.user_id)
            .single()
          
          userInfo = {
            auth_email: authUser?.user?.email,
            profile_email: profile?.email,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          }
        } else {
          // User wasn't matched - check if a profile exists with this email
          const { data: profile } = await adminClient
            .from('user_profiles')
            .select('user_id, email, first_name, last_name')
            .eq('email', email.from_email)
            .single()
          
          userInfo = {
            profile_exists: !!profile,
            profile_email: profile?.email,
            name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
            issue: profile ? 'User exists but not matched!' : 'No profile found with this email',
          }
        }

        return {
          email_id: email.id,
          from: email.from_email,
          to: email.to_email,
          subject: email.subject,
          user_id: email.user_id,
          guest_email: email.guest_email,
          created_at: email.created_at,
          sent_at: email.sent_at,
          is_reply: email.is_reply,
          imap_message_id: email.imap_message_id,
          userInfo,
        }
      })
    )

    return NextResponse.json({
      total_inbound_emails: inboundEmails?.length || 0,
      emails: emailsWithUserInfo,
      debug_info: {
        imap_configured: !!(process.env.IMAP_HOST && process.env.IMAP_USER),
        imap_host: process.env.IMAP_HOST || 'Not set',
        imap_user: process.env.IMAP_USER || 'Not set',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

