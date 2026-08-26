/**
 * One-off: pause Antarctica and start Ocean Explorers for Oliver.
 * Run: npx tsx --env-file=.env.local scripts/life-explorer/start-oliver-oceans.ts
 */
import { createClient } from '@supabase/supabase-js'
import { startOliverOceans } from '../../src/lib/life-explorer/seed'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = process.argv[2] || '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a'

async function main() {
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const result = await startOliverOceans(supabase, userId)
  console.log(
    JSON.stringify(
      {
        expedition: result.expedition.title,
        expedition_id: result.expedition.id,
        week_start: result.week_start,
        lesson: result.lesson
          ? { id: result.lesson.id, title: result.lesson.title, number: result.lesson.lesson_number }
          : null,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
