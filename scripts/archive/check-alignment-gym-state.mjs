// One-off: inspect current Alignment Gym sessions + reminder jobs before scheduling new ones.
// Run from project root: node scripts/database/check-alignment-gym-state.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: sessions, error } = await supabase
  .from('video_sessions')
  .select('id, title, description, status, scheduled_at, host_user_id, test_mode, hidden_from_users, scheduled_duration_minutes')
  .eq('session_type', 'alignment_gym')
  .order('scheduled_at', { ascending: false })
  .limit(12)
if (error) throw error
console.log('=== Recent alignment_gym sessions ===')
for (const s of sessions) {
  const et = new Date(s.scheduled_at).toLocaleString('en-US', { timeZone: 'America/New_York' })
  console.log(`${s.id} | ${s.scheduled_at} (ET: ${et}) | ${s.status} | host=${s.host_user_id} | test=${s.test_mode} | hidden=${s.hidden_from_users} | dur=${s.scheduled_duration_minutes} | "${s.title}"`)
}

const { data: configs, error: cfgErr } = await supabase
  .from('notification_configs')
  .select('slug, email_enabled, sms_enabled, segment_id, email_template_slug, sms_template_slug')
  .in('slug', ['alignment_gym_day_before_email', 'alignment_gym_reminder_1hr_sms'])
if (cfgErr) throw cfgErr
console.log('\n=== Notification configs ===')
console.log(JSON.stringify(configs, null, 2))

const { data: jobs, error: jobErr } = await supabase
  .from('scheduled_messages')
  .select('id, message_type, notification_config_slug, related_entity_id, scheduled_for, status')
  .in('notification_config_slug', ['alignment_gym_day_before_email', 'alignment_gym_reminder_1hr_sms'])
  .gte('scheduled_for', new Date().toISOString())
  .order('scheduled_for')
if (jobErr) throw jobErr
console.log('\n=== Future reminder jobs ===')
for (const j of jobs) {
  console.log(`${j.message_type} | ${j.notification_config_slug} | session=${j.related_entity_id} | fires=${j.scheduled_for} | ${j.status}`)
}
