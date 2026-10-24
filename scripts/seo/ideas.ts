/**
 * Prints the founder's spoken/typed ideas for SEO pages, captured in /admin/seo.
 * Claude Code runs this before writing or redesigning a page.
 *
 *   npx tsx scripts/seo/ideas.ts                      # all open ideas, grouped by page
 *   npx tsx scripts/seo/ideas.ts vision-board/ideas   # one page (use _general for unassigned)
 *   npx tsx scripts/seo/ideas.ts --all                # include ideas already marked applied
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const includeApplied = args.includes('--all')
const pagePath = args.find(a => !a.startsWith('--'))?.replace(/^\/+|\/+$/g, '')

async function main() {
  const supabase = createClient(url!, key!)
  let query = supabase
    .from('seo_page_ideas')
    .select('id, page_path, transcript, source, applied_at, created_at')
    .order('page_path')
    .order('created_at', { ascending: true })
  if (pagePath) query = query.eq('page_path', pagePath)
  if (!includeApplied) query = query.is('applied_at', null)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  if (!data?.length) {
    console.log(pagePath ? `No ${includeApplied ? '' : 'open '}ideas for /${pagePath}.` : 'No open ideas.')
    return
  }

  let current = ''
  for (const idea of data) {
    if (idea.page_path !== current) {
      current = idea.page_path
      console.log(`\n## /${current}\n`)
    }
    const stamp = new Date(idea.created_at).toISOString().slice(0, 16).replace('T', ' ')
    const flags = [idea.source, idea.applied_at ? 'applied' : 'open'].join(', ')
    console.log(`- [${stamp} · ${flags} · ${idea.id.slice(0, 8)}]\n  ${idea.transcript.replace(/\n/g, '\n  ')}\n`)
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
