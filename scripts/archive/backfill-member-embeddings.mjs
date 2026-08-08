/**
 * Backfill member_embeddings for all existing member content:
 * journal entries, stories, songs, coach/chat messages, active vision sections.
 *
 * Usage: node scripts/database/backfill-member-embeddings.mjs [--dry-run]
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
const EMBED_BATCH = 96

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function embedBatch(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.slice(0, MAX_CHARS)),
    }),
  })
  if (!res.ok) throw new Error(`Embeddings API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data.map(d => d.embedding)
}

async function collectItems() {
  const items = []
  const CATEGORIES = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']

  const { data: journals } = await supabase
    .from('journal_entries')
    .select('id, user_id, title, content, categories, date')
  for (const j of journals || []) {
    const text = [j.title, j.content].filter(Boolean).join('\n')
    if (text.trim().length < 40) continue
    items.push({
      user_id: j.user_id,
      entity_type: 'journal_entry',
      entity_id: j.id,
      category: j.categories?.[0] || null,
      content: text,
      source_date: j.date,
    })
  }

  const { data: stories } = await supabase
    .from('stories')
    .select('id, user_id, title, content, created_at')
  for (const s of stories || []) {
    const text = [s.title, s.content].filter(Boolean).join('\n')
    if (text.trim().length < 40) continue
    items.push({
      user_id: s.user_id,
      entity_type: 'story',
      entity_id: s.id,
      category: null,
      content: text,
      source_date: s.created_at,
    })
  }

  const { data: songs } = await supabase
    .from('songs')
    .select('id, user_id, title, lyrics, song_essence, life_categories, created_at')
    .not('lyrics', 'is', null)
  for (const s of songs || []) {
    const essence = s.song_essence || {}
    const text = [
      s.title ? `Song: ${s.title}` : null,
      essence.core_message ? `Core truth: ${essence.core_message}` : null,
      essence.emotional_start && essence.emotional_destination
        ? `Emotional arc: ${essence.emotional_start} to ${essence.emotional_destination}`
        : null,
      s.lyrics,
    ].filter(Boolean).join('\n')
    if (text.trim().length < 40) continue
    items.push({
      user_id: s.user_id,
      entity_type: 'song',
      entity_id: s.id,
      category: s.life_categories?.[0] || null,
      content: text,
      source_date: s.created_at,
    })
  }

  const { data: messages } = await supabase
    .from('ai_conversations')
    .select('id, user_id, role, message, created_at, context')
  for (const m of messages || []) {
    if (!m.message || m.message.length < 80) continue
    const role = m.role === 'user' ? 'MEMBER' : 'VIVA'
    items.push({
      user_id: m.user_id,
      entity_type: 'coach_message',
      entity_id: m.id,
      category: m.context?.selectedCategories?.[0] || null,
      content: `${role}: ${m.message}`,
      source_date: m.created_at,
    })
  }

  const { data: visions } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('is_active', true)
  for (const v of visions || []) {
    for (const cat of CATEGORIES) {
      const content = v[cat]
      if (!content || String(content).trim().length < 50) continue
      items.push({
        user_id: v.user_id,
        entity_type: 'vision_section',
        entity_id: `${v.id}:${cat}`,
        category: cat,
        content: `Life Vision (${cat}): ${content}`,
        source_date: v.created_at,
      })
    }
  }

  return items
}

async function main() {
  const items = await collectItems()
  console.log(`Collected ${items.length} items`)

  // Skip already-embedded items
  const { data: existing } = await supabase
    .from('member_embeddings')
    .select('entity_type, entity_id')
  const existingKeys = new Set((existing || []).map(e => `${e.entity_type}:${e.entity_id}`))
  const toEmbed = items.filter(i => !existingKeys.has(`${i.entity_type}:${i.entity_id}`))
  console.log(`${toEmbed.length} need embedding (${items.length - toEmbed.length} already done)`)

  if (DRY_RUN || toEmbed.length === 0) return

  let done = 0
  for (let i = 0; i < toEmbed.length; i += EMBED_BATCH) {
    const batch = toEmbed.slice(i, i + EMBED_BATCH)
    const embeddings = await embedBatch(batch.map(b => b.content))
    const rows = batch.map((b, idx) => ({
      user_id: b.user_id,
      entity_type: b.entity_type,
      entity_id: b.entity_id,
      category: b.category,
      content: b.content.slice(0, MAX_CHARS),
      embedding: JSON.stringify(embeddings[idx]),
      source_date: b.source_date,
    }))
    const { error } = await supabase
      .from('member_embeddings')
      .upsert(rows, { onConflict: 'entity_type,entity_id' })
    if (error) {
      console.error(`Batch ${i}: upsert failed —`, error.message)
      continue
    }
    done += rows.length
    console.log(`  ${done}/${toEmbed.length} embedded`)
  }

  console.log(`\nDone. ${done} embeddings created.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
