// One-time sync to pull historical SMS messages from Twilio
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import twilio from 'twilio'

// Helper function to normalize phone numbers for comparison
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  if (phone.startsWith('+')) {
    return digits.startsWith('1') ? `+${digits}` : phone
  }
  
  return `+${digits}`
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.email === 'buckinghambliss@gmail.com' || 
                    user.email === 'admin@vibrationfit.com' ||
                    user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    const client = twilio(accountSid, authToken)

    console.log('📱 Starting Twilio SMS history sync...')

    // Fetch all messages (both sent and received)
    const messages = await client.messages.list({
      limit: 1000, // Adjust if you have more messages
    })

    console.log(`📥 Found ${messages.length} messages in Twilio`)

    let synced = 0
    let skipped = 0
    let errors = 0

    // Get all profiles and leads for phone matching
    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('user_id, phone')
      .not('phone', 'is', null)

    const { data: leads } = await adminClient
      .from('leads')
      .select('id, phone')
      .not('phone', 'is', null)

    for (const message of messages) {
      try {
        // Check if message already exists
        const { data: existing } = await adminClient
          .from('sms_messages')
          .select('id')
          .eq('twilio_sid', message.sid)
          .single()

        if (existing) {
          skipped++
          continue
        }

        // Determine direction
        const direction = message.from === twilioNumber ? 'outbound' : 'inbound'
        const userPhone = direction === 'inbound' ? message.from : message.to
        const normalizedUserPhone = normalizePhone(userPhone)

        // Find matching user or lead
        let userId: string | null = null
        let leadId: string | null = null

        if (profiles) {
          const matchedProfile = profiles.find(p => 
            normalizePhone(p.phone || '') === normalizedUserPhone
          )
          if (matchedProfile) {
            userId = matchedProfile.user_id
          }
        }

        if (!userId && leads) {
          const matchedLead = leads.find(l => 
            normalizePhone(l.phone || '') === normalizedUserPhone
          )
          if (matchedLead) {
            leadId = matchedLead.id
          }
        }

        // Insert message
        const { error: insertError } = await adminClient
          .from('sms_messages')
          .insert({
            user_id: userId,
            lead_id: leadId,
            from_number: message.from,
            to_number: message.to,
            body: message.body || '',
            direction,
            status: message.status,
            twilio_sid: message.sid,
            created_at: message.dateCreated.toISOString(),
          })

        if (insertError) {
          console.error(`❌ Failed to insert message ${message.sid}:`, insertError)
          errors++
        } else {
          synced++
          if (synced % 10 === 0) {
            console.log(`✅ Synced ${synced} messages...`)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing message ${message.sid}:`, error)
        errors++
      }
    }

    console.log('✅ Twilio SMS history sync complete!')
    console.log(`   Synced: ${synced}`)
    console.log(`   Skipped (already existed): ${skipped}`)
    console.log(`   Errors: ${errors}`)

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      errors,
      total: messages.length,
    })
  } catch (error: any) {
    console.error('❌ SMS history sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync SMS history', details: error.message },
      { status: 500 }
    )
  }
}
