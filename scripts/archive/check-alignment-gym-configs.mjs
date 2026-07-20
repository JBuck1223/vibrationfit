// One-off: inspect Alignment Gym notification configs, templates, and audience segment.
// Run from project root: node scripts/database/check-alignment-gym-configs.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: configs, error: cfgErr } = await supabase
  .from('notification_configs')
  .select('slug, name, category, email_enabled, sms_enabled, segment_id, email_template_slug, sms_template_slug')
  .or('category.eq.alignment_gym,slug.ilike.%alignment%')
if (cfgErr) throw cfgErr
console.log('=== All alignment-related notification configs ===')
console.log(JSON.stringify(configs, null, 2))

const { data: smsTpl, error: smsErr } = await supabase
  .from('sms_templates')
  .select('slug, name, status')
  .ilike('slug', '%alignment%')
if (smsErr) throw smsErr
console.log('\n=== Alignment SMS templates ===')
console.log(JSON.stringify(smsTpl, null, 2))

const { data: emailTpl, error: emErr } = await supabase
  .from('email_templates')
  .select('slug, name, status')
  .ilike('slug', '%alignment%')
if (emErr) throw emErr
console.log('\n=== Alignment email templates ===')
console.log(JSON.stringify(emailTpl, null, 2))

const { data: seg, error: segErr } = await supabase
  .from('blast_segments')
  .select('*')
  .eq('id', 'a0000000-0000-0000-0000-000000000001')
if (segErr) throw segErr
console.log('\n=== Alignment Gym Audience segment ===')
console.log(JSON.stringify(seg, null, 2))
