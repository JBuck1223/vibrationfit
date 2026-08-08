/**
 * Backfill member_embeddings with profile "current state" snapshots
 * (state_family, state_love, ...) from each member's active profile,
 * routed through the Vercel AI Gateway.
 *
 * Usage: node scripts/database/backfill-profile-state-embeddings.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const DRY_RUN = process.argv.includes('--dry-run')
const MAX_CHARS = 4000
const CATEGORIES = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function embedBatch(texts) {
  const res = await fetch('https://ai-gateway.vercel.sh/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: texts.map(t => t.slice(0, MAX_CHARS)),
    }),
  })
  if (!res.ok) throw new Error(`Embeddings API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data.map(d => d.embedding)
}

async function main() {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_active', true)
    .eq('is_draft', false)
  if (error) throw error

  const items = []
  for (const p of profiles || []) {
    for (const cat of CATEGORIES) {
      const content = p[`state_${cat}`]
      if (!content || String(content).trim().length < 50) continue
      items.push({
        user_id: p.user_id,
        entity_type: 'profile_state',
        entity_id: `${p.id}:${cat}`,
        category: cat,
        content: `Where they are today (${cat}), from their profile: ${content}`.slice(0, MAX_CHARS),
        source_date: p.updated_at || null,
      })
    }
  }

  // Skip items already embedded
  const { data: existing } = await supabase
    .from('member_embeddings')
    .select('entity_id')
    .eq('entity_type', 'profile_state')
  const existingIds = new Set((existing || []).map(e => e.entity_id))
  const toEmbed = items.filter(i => !existingIds.has(i.entity_id))

  console.log(`Profiles: ${profiles?.length} | state snapshots found: ${items.length} | to embed: ${toEmbed.length}`)
  if (DRY_RUN || toEmbed.length === 0) return

  for (let i = 0; i < toEmbed.length; i += 96) {
    const batch = toEmbed.slice(i, i + 96)
    const embeddings = await embedBatch(batch.map(b => b.content))
    const rows = batch.map((b, j) => ({ ...b, embedding: JSON.stringify(embeddings[j]) }))
    const { error: upsertError } = await supabase
      .from('member_embeddings')
      .upsert(rows, { onConflict: 'entity_type,entity_id' })
    if (upsertError) throw upsertError
    console.log(`Embedded ${Math.min(i + 96, toEmbed.length)}/${toEmbed.length}`)
  }
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
