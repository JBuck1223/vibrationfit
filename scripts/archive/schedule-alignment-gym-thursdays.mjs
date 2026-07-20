// One-off: schedule 6 weekly Alignment Gym sessions (Thursdays 12-1pm ET,
// starting July 16, 2026) plus their reminder jobs, and restore the missing
// 1-hour SMS notification config/template (repo migration 20260408120000 was
// never applied to production).
//
// Mirrors the exact insert logic from POST /api/video/sessions
// (scheduleAlignmentGymReminders) so the minute cron picks the jobs up.
//
// Run from project root: node scripts/database/schedule-alignment-gym-thursdays.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const HOST_USER_ID = '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a' // Jordan Buckingham
const HOST_NAME = 'Jordan Buckingham'
const SEGMENT_ID = 'a0000000-0000-0000-0000-000000000001' // Alignment Gym Audience
const JOIN_LINK = 'https://vibrationfit.com/alignment-gym'

// Thursdays 12:00 pm ET starting Jul 16, 2026. All dates fall in EDT (UTC-4),
// so noon ET = 16:00 UTC.
const SESSION_DATES_UTC = [
  '2026-07-16T16:00:00.000Z',
  '2026-07-23T16:00:00.000Z',
  '2026-07-30T16:00:00.000Z',
  '2026-08-06T16:00:00.000Z',
  '2026-08-13T16:00:00.000Z',
  '2026-08-20T16:00:00.000Z',
]

// ── Formatting helpers (ported verbatim from src/app/api/video/sessions/route.ts) ──

function formatSessionTime(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  }).formatToParts(date)
  const hour = parts.find(p => p.type === 'hour')?.value || ''
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  const period = (parts.find(p => p.type === 'dayPeriod')?.value || '').toLowerCase()
  const time = minute === '00' ? hour : `${hour}:${minute}`
  return `${time} ${period} ET`
}

function formatSessionDayName(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/New_York' }).format(date)
}

function formatSessionDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  }).format(date)
}

function getEtOffsetMinutes(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', timeZoneName: 'shortOffset', year: 'numeric',
  })
  const offsetStr = fmt.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'GMT-5'
  const match = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(offsetStr)
  if (!match) return -300
  const sign = match[1] === '-' ? -1 : 1
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3] || '0', 10))
}

function previousDayAt9amET(scheduledAt) {
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const sessionEt = Object.fromEntries(dateFmt.formatToParts(scheduledAt).map(p => [p.type, p.value]))
  const noonAnchor = new Date(Date.UTC(+sessionEt.year, +sessionEt.month - 1, +sessionEt.day, 12))
  noonAnchor.setUTCDate(noonAnchor.getUTCDate() - 1)
  const prevEt = Object.fromEntries(dateFmt.formatToParts(noonAnchor).map(p => [p.type, p.value]))
  const probe = new Date(Date.UTC(+prevEt.year, +prevEt.month - 1, +prevEt.day, 12))
  const offsetMin = getEtOffsetMinutes(probe)
  return new Date(Date.UTC(+prevEt.year, +prevEt.month - 1, +prevEt.day, 0, 9 * 60 - offsetMin))
}

// ── 1. Restore missing SMS template + notification config (migration 20260408120000) ──

async function restoreSmsConfig() {
  const { error: tplErr } = await supabase.from('sms_templates').upsert({
    slug: 'alignment-gym-reminder-1hr-sms',
    name: 'Alignment Gym: 1-Hour SMS Reminder',
    description: 'SMS sent 1 hour before each Alignment Gym session. Scheduled per-session from video_sessions.scheduled_at.',
    category: 'reminders',
    status: 'active',
    body: "Hey Vibe Tribe, it's Jordan & Vanessa from Vibration Fit. Quick reminder: Alignment Gym is today at {{sessionTime}}.\nJoin the live session here at lunch:\nhttps://vibrationfit.com/alignment-gym",
    variables: ['sessionTime'],
    triggers: ['Per-session reminder via scheduleAlignmentGymReminders'],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slug' })
  if (tplErr) throw new Error(`sms_templates upsert failed: ${tplErr.message}`)
  console.log('[1/4] SMS template alignment-gym-reminder-1hr-sms upserted')

  const { error: cfgErr } = await supabase.from('notification_configs').upsert({
    slug: 'alignment_gym_reminder_1hr_sms',
    name: 'Alignment Gym 1-Hour SMS Reminder',
    description: 'SMS sent 1 hour before each Alignment Gym session to the Alignment Gym Audience segment. No email.',
    category: 'alignment_gym',
    email_enabled: false,
    sms_enabled: true,
    admin_sms_enabled: false,
    sms_template_slug: 'alignment-gym-reminder-1hr-sms',
    variables: ['sessionTime'],
    segment_id: SEGMENT_ID,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slug' })
  if (cfgErr) throw new Error(`notification_configs upsert failed: ${cfgErr.message}`)
  console.log('[1/4] Notification config alignment_gym_reminder_1hr_sms upserted')
}

// ── 2-4. Sessions, participants, reminder jobs ──

async function main() {
  // Safety: abort if future alignment_gym sessions already exist (avoid duplicates on re-run)
  const { data: existing, error: exErr } = await supabase
    .from('video_sessions')
    .select('id, scheduled_at')
    .eq('session_type', 'alignment_gym')
    .gte('scheduled_at', new Date().toISOString())
  if (exErr) throw exErr
  if (existing.length > 0) {
    console.error('ABORT: future alignment_gym sessions already exist:', existing)
    process.exit(1)
  }

  await restoreSmsConfig()

  const sessionRows = SESSION_DATES_UTC.map(iso => ({
    title: 'The Alignment Gym',
    description: 'Weekly live group coaching session',
    session_type: 'alignment_gym',
    status: 'scheduled',
    scheduled_at: iso,
    scheduled_duration_minutes: 60,
    host_user_id: HOST_USER_ID,
    enable_recording: true,
    enable_waiting_room: false,
    max_participants: 0,
    is_group_session: true,
    test_mode: false,
  }))

  const { data: sessions, error: insErr } = await supabase
    .from('video_sessions')
    .insert(sessionRows)
    .select('id, scheduled_at')
  if (insErr) throw new Error(`video_sessions insert failed: ${insErr.message}`)
  console.log(`[2/4] Created ${sessions.length} sessions`)

  const { error: partErr } = await supabase.from('video_session_participants').insert(
    sessions.map(s => ({ session_id: s.id, user_id: HOST_USER_ID, name: HOST_NAME, is_host: true }))
  )
  if (partErr) throw new Error(`participants insert failed: ${partErr.message}`)
  console.log('[3/4] Host participant rows created')

  const now = new Date()
  const jobs = []
  for (const s of sessions) {
    const scheduledAt = new Date(s.scheduled_at)
    const oneHourBefore = new Date(scheduledAt.getTime() - 60 * 60 * 1000)
    const dayBeforeAt9amEt = previousDayAt9amET(scheduledAt)
    const sessionTime = formatSessionTime(scheduledAt)
    const sessionDate = formatSessionDate(scheduledAt)
    const sessionDayName = formatSessionDayName(scheduledAt)

    if (oneHourBefore > now) {
      jobs.push({
        message_type: 'sms',
        notification_config_slug: 'alignment_gym_reminder_1hr_sms',
        notification_variables: { sessionTime },
        related_entity_type: 'video_session',
        related_entity_id: s.id,
        scheduled_for: oneHourBefore.toISOString(),
        status: 'pending',
        created_by: HOST_USER_ID,
        body: 'notification-job',
      })
    } else {
      console.log(`  Skipping 1hr SMS for ${s.scheduled_at} (fire time in past)`)
    }

    if (dayBeforeAt9amEt > now) {
      jobs.push({
        message_type: 'email',
        notification_config_slug: 'alignment_gym_day_before_email',
        notification_variables: { sessionDate, sessionTime, sessionDayName, joinLink: JOIN_LINK },
        related_entity_type: 'video_session',
        related_entity_id: s.id,
        scheduled_for: dayBeforeAt9amEt.toISOString(),
        status: 'pending',
        created_by: HOST_USER_ID,
        body: 'notification-job',
      })
    } else {
      console.log(`  Skipping day-before email for ${s.scheduled_at} (9am ET day-before already passed)`)
    }
  }

  const { error: jobErr } = await supabase.from('scheduled_messages').insert(jobs)
  if (jobErr) throw new Error(`scheduled_messages insert failed: ${jobErr.message}`)
  console.log(`[4/4] Queued ${jobs.length} reminder jobs`)

  console.log('\n=== Summary ===')
  for (const s of sessions) {
    console.log(`${s.id} | ${formatSessionDate(new Date(s.scheduled_at))} at ${formatSessionTime(new Date(s.scheduled_at))}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
