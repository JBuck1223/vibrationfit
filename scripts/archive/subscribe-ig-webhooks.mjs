// One-off: subscribe all active IG accounts to the app's webhooks
// (messages + comments). Safe to re-run; subscribing twice is a no-op.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: accounts, error } = await supabase
  .from('meta_accounts')
  .select('id, username, access_token')
  .eq('platform', 'instagram')
  .eq('is_active', true)

if (error) {
  console.error('DB error:', error.message)
  process.exit(1)
}

for (const account of accounts) {
  // Check current subscription state first
  const checkRes = await fetch(
    `https://graph.instagram.com/v21.0/me/subscribed_apps?access_token=${account.access_token}`
  )
  const check = await checkRes.json()
  const before = checkRes.ok ? JSON.stringify(check.data ?? check) : `error: ${check.error?.message}`

  const subRes = await fetch(
    `https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=messages,comments,messaging_postbacks&access_token=${account.access_token}`,
    { method: 'POST' }
  )
  const sub = await subRes.json()

  console.log(`@${account.username}`)
  console.log(`  before: ${before}`)
  console.log(`  subscribe: ${subRes.ok ? JSON.stringify(sub) : `FAILED: ${sub.error?.message}`}`)
}
