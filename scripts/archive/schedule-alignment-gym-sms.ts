/**
 * One-off script: Schedule Alignment Gym SMS blast for 10am ET (14:00 UTC) on 2026-03-31.
 * Targets Intensive graduates (unlocked) with SMS opt-in.
 *
 * Usage: npx tsx --env-file=.env.local scripts/schedule-alignment-gym-sms.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCHEDULED_FOR = '2026-03-31T14:00:00.000Z' // 10am EDT
const SMS_BODY_TEMPLATE = `Hey {{firstName}}, it's Jordan & Vanessa from Vibration Fit. Quick reminder: our first Alignment Gym starts today at 12 pm ET.

Since you've graduated from the Intensive, you're invited to join us live here at lunch:

https://vibrationfit.com/alignment-gym

Can't wait to see you there!`

async function main() {
  // 1. Get all member accounts with phone + SMS opt-in
  const { data: accounts, error: accountsErr } = await supabase
    .from('user_accounts')
    .select('id, first_name, last_name, email, phone, sms_opt_in')
    .eq('sms_opt_in', true)
    .not('phone', 'is', null)

  if (accountsErr || !accounts?.length) {
    console.error('Failed to fetch accounts:', accountsErr?.message)
    process.exit(1)
  }

  const userIds = accounts.map((a) => a.id)

  // 2. Get Intensive status — only unlocked
  const { data: intensiveRows } = await supabase
    .from('intensive_checklist')
    .select('user_id, status, unlock_completed')
    .in('user_id', userIds)

  const unlockedSet = new Set<string>()
  for (const row of intensiveRows || []) {
    if (row.unlock_completed) unlockedSet.add(row.user_id)
  }

  // 3. Build recipient list: unlocked + has phone + sms_opt_in
  const recipients = accounts.filter((a) => unlockedSet.has(a.id))

  if (recipients.length === 0) {
    console.log('No matching recipients found.')
    process.exit(0)
  }

  console.log(`Found ${recipients.length} recipient(s) matching criteria.`)

  // 5. Create campaign row
  const { data: campaign, error: campaignErr } = await supabase
    .from('messaging_campaigns')
    .insert({
      name: `SMS Blast: Alignment Gym Reminder 2026-03-31`,
      channel: 'sms',
      template_id: null,
      sms_body: SMS_BODY_TEMPLATE,
      audience_filter: { audience: 'members', intensive_status: 'unlocked' },
      audience_count: recipients.length,
      status: 'scheduled',
      sent_count: 0,
      failed_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (campaignErr || !campaign) {
    console.error('Failed to create campaign:', campaignErr?.message)
    process.exit(1)
  }

  console.log(`Created campaign: ${campaign.id}`)

  // 6. Build scheduled_messages rows with personalized body
  const rows = recipients.map((a) => {
    const firstName = a.first_name || a.email?.split('@')[0] || ''
    const body = SMS_BODY_TEMPLATE.replace(/\{\{firstName\}\}/g, firstName)
    return {
      message_type: 'sms',
      recipient_phone: a.phone,
      recipient_name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email,
      recipient_user_id: a.id,
      body,
      scheduled_for: SCHEDULED_FOR,
      status: 'pending',
      related_entity_type: 'campaign',
      related_entity_id: campaign.id,
    }
  })

  // 7. Insert in chunks
  const CHUNK = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error: insertErr } = await supabase.from('scheduled_messages').insert(chunk)
    if (insertErr) {
      console.error(`Failed to insert chunk at offset ${i}:`, insertErr.message)
      await supabase
        .from('messaging_campaigns')
        .update({ status: 'cancelled', error_log: insertErr.message })
        .eq('id', campaign.id)
      process.exit(1)
    }
    inserted += chunk.length
  }

  console.log(`\nDone! Queued ${inserted} SMS message(s) for delivery at ${SCHEDULED_FOR} (10am ET).`)
  console.log(`Campaign ID: ${campaign.id}`)
  console.log(`The cron worker will pick these up at the scheduled time.`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
