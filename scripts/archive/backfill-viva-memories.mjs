/**
 * Backfill VIVA memory items from existing coach sessions.
 *
 * The coach route's background memory extraction was broken (empty Cookie
 * header on the HTTP self-call), so no memories were ever saved. This script
 * replays every existing coach session through the same extraction prompt
 * and populates viva_memory_items.
 *
 * Usage: node scripts/database/backfill-viva-memories.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local manually (no dotenv dependency needed)
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Keep in sync with src/lib/viva/memory-extractor.ts
const MEMORY_EXTRACTION_PROMPT = `You are VIVA's memory system. After a coaching interaction, you extract DURABLE insights worth remembering for future conversations.

Rules:
- Only extract what would be useful in 2+ weeks
- Never store temporary emotions ("they felt sad today") — store the PATTERN ("tends to feel stuck when alone on weekends")
- Never store the literal conversation — store the INSIGHT
- Prefer updating existing knowledge over creating redundant entries
- Be concise: each memory should be one clear sentence
- Confidence: 0.3 = hunch, 0.5 = likely, 0.7 = clear signal, 0.9 = explicitly stated

Types:
- preference: how they like to be supported ("feels most supported when VIVA listens first")
- pattern: recurring behaviors or cycles ("dips around money when business investment feels unclear")
- trigger: what reliably takes them below the line ("conflict with partner about household responsibilities")
- desire: what they deeply want ("wants to feel financially free before 40")
- voice_style: how VIVA should speak to them ("responds to warm directness, not coddling")
- life_context: important life facts that persist ("has two kids under 5", "works remote")
- coaching_note: what works when coaching them ("responds well to bridge-back statements")

Categories (only if clearly relevant, otherwise null):
fun, health, travel, love, family, social, home, work, money, stuff, giving, spirituality

Return JSON:
{
  "memories": [
    {"type": "...", "category": "..." or null, "content": "...", "confidence": 0.0-1.0}
  ]
}

If nothing worth remembering, return: {"memories": []}
No markdown fences. JSON only.`

const VALID_TYPES = ['preference', 'pattern', 'trigger', 'desire', 'voice_style', 'life_context', 'coaching_note']
const VALID_CATEGORIES = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']

function contentSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let overlap = 0
  for (const word of wordsA) if (wordsB.has(word)) overlap++
  return overlap / Math.max(wordsA.size, wordsB.size)
}

async function extractFromConversation(conversationText, existingMemories) {
  const contextNote = existingMemories.length > 0
    ? `\n\nExisting memories about this person (don't duplicate these):\n${existingMemories.map(m => `- ${m}`).join('\n')}\n\n`
    : ''

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: MEMORY_EXTRACTION_PROMPT },
        { role: 'user', content: `${contextNote}Conversation:\n\n${conversationText}` },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const cleaned = (data.choices?.[0]?.message?.content || '{}')
    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)

  return (parsed.memories || [])
    .filter(m => m.content && VALID_TYPES.includes(m.type))
    .map(m => ({
      type: m.type,
      category: VALID_CATEGORIES.includes(m.category) ? m.category : null,
      content: String(m.content).slice(0, 500),
      confidence: Math.min(1, Math.max(0, m.confidence || 0.5)),
    }))
}

async function main() {
  // Coach sessions plus master-assistant chats — both carry durable member context
  const { data: sessions, error } = await supabase
    .from('conversation_sessions')
    .select('id, user_id, created_at, mode')
    .in('mode', ['coach', 'master', 'master_assistant'])
    .order('created_at', { ascending: true })

  if (error) throw error
  console.log(`Found ${sessions.length} coach sessions${DRY_RUN ? ' (dry run)' : ''}`)

  // Existing memory content per user, so extraction stays deduplicated
  const memoryCache = new Map()

  let totalSaved = 0
  let totalSkipped = 0

  for (const session of sessions) {
    const { data: messages } = await supabase
      .from('ai_conversations')
      .select('role, message')
      .eq('conversation_id', session.id)
      .order('created_at', { ascending: true })

    if (!messages || messages.length < 2) {
      console.log(`  ${session.id}: skipped (${messages?.length || 0} messages)`)
      continue
    }

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'MEMBER' : 'VIVA'}: ${m.message}`)
      .join('\n\n')
      .slice(0, 24000)

    if (!memoryCache.has(session.user_id)) {
      const { data: existing } = await supabase
        .from('viva_memory_items')
        .select('type, content, confidence, id')
        .eq('user_id', session.user_id)
      memoryCache.set(session.user_id, existing || [])
    }
    const userMemories = memoryCache.get(session.user_id)

    let extracted
    try {
      extracted = await extractFromConversation(conversationText, userMemories.map(m => m.content))
    } catch (err) {
      console.error(`  ${session.id}: extraction failed —`, err.message)
      continue
    }

    let saved = 0
    let skipped = 0
    for (const memory of extracted) {
      const duplicate = userMemories.find(
        e => e.type === memory.type && contentSimilarity(e.content, memory.content) > 0.7
      )
      if (duplicate) {
        skipped++
        continue
      }
      if (!DRY_RUN) {
        const { error: insertError } = await supabase.from('viva_memory_items').insert({
          user_id: session.user_id,
          type: memory.type,
          category: memory.category,
          content: memory.content,
          confidence: memory.confidence,
          source_conversation_id: session.id,
        })
        if (insertError) {
          console.error(`  ${session.id}: insert failed —`, insertError.message)
          continue
        }
      }
      userMemories.push(memory)
      saved++
    }

    totalSaved += saved
    totalSkipped += skipped
    console.log(`  ${session.id}: ${messages.length} msgs → ${extracted.length} extracted, ${saved} saved, ${skipped} dupes`)
  }

  console.log(`\nDone. Saved ${totalSaved} memories (${totalSkipped} duplicates skipped).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
