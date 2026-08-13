'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container, Stack, PageHero, Card, Badge } from '@/lib/design-system/components'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { CurriculumBrief } from './CurriculumBrief'

const LE = '/homeschool/life-explorer'

type Status = 'current' | 'new' | 'legacy'

const STATUS_STYLE: Record<Status, string> = {
  current: 'bg-[#39FF14]/10 text-[#39FF14]',
  new: 'bg-[#00FFFF]/10 text-[#00FFFF]',
  legacy: 'bg-neutral-500/10 text-neutral-400',
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// The program spine — how the pieces connect
// ---------------------------------------------------------------------------

const SPINE = [
  {
    title: 'Expedition',
    detail: 'A multi-week themed adventure in one Life Category (currently: Antarctica).',
    tech: `${LE} · le_expeditions · packs/antarctica.ts`,
  },
  {
    title: 'Wonder Wall',
    detail: 'Know / Wonder / Learned boards in the child\'s exact words. Photo snap + vision AI extraction.',
    tech: `${LE}/wonder · le_wonder_items · /api/life-explorer/wonder(+/from-photo)`,
  },
  {
    title: 'Steered lesson generation',
    detail: 'Parent orders the Up Next queue; AI writes ONE fresh lesson from the top wonder. Fun Contract validated; expedition pack fallback guarantees a teachable day.',
    tech: 'le_lessons · generate.ts + prompts.ts · /api/life-explorer/steer, /lessons/*',
  },
  {
    title: 'Calendar + evidence',
    detail: 'Completed lessons log the day automatically; photos/videos file as portfolio evidence.',
    tech: `${LE}/calendar · le_activity_logs, le_activity_media, le_learning_evidence`,
  },
  {
    title: 'Reports',
    detail: 'Florida binder (activity log, reading list, portfolio, progress) generated in one click.',
    tech: `${LE}/map · /api/life-explorer/reports/binder · state-standards.ts`,
  },
]

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

const MEMBER_PAGES: Array<{ route: string; role: string; status: Status }> = [
  { route: '/homeschool', role: 'Master hub — the program explained for someone new, with links to every surface', status: 'new' },
  { route: LE, role: 'Today: expedition home, next-step spotlight, morning appreciation, steering console, story so far', status: 'current' },
  { route: `${LE}/wonder`, role: 'Wonder Wall: three boards, photo snap + AI extraction, reorder/edit/delete, snapshots gallery', status: 'current' },
  { route: `${LE}/books`, role: 'Storybooks: AI picture-book builder with the Life Explorers cast + bookshelf', status: 'new' },
  { route: `${LE}/books/[id]`, role: 'Page-turn book reader (cover → pages → The End)', status: 'new' },
  { route: `${LE}/lesson/[id]`, role: 'The lesson bucket: teacher guide + Mission Checklist (prescribed action items) + documents/notes/links + start/end timing — the permanent record of that lesson', status: 'current' },
  { route: `${LE}/lessons`, role: 'Lesson Log: every lesson of the expedition with date, start/end time, time spent, checklist progress, and attachment counts', status: 'new' },
  { route: `${LE}/calendar`, role: 'Daily activity log with media — the compliance record and primary tracking surface', status: 'current' },
  { route: `${LE}/map`, role: 'Learning Map: skill ladders, journey feed, expedition history, reports', status: 'current' },
  { route: `${LE}/resources`, role: 'Expedition resources: print layers, verified books/videos, supplies', status: 'current' },
  { route: `${LE}/overview`, role: 'How Life Explorer works — the pedagogy in one page', status: 'current' },
  { route: `${LE}/profile`, role: 'Student profile (grade, interests, strengths)', status: 'current' },
  { route: `${LE}/portfolio`, role: 'Portfolio of evidence, evaluation-ready', status: 'current' },
  { route: `${LE}/progress`, role: 'Skill-by-skill academic tracking', status: 'current' },
  { route: `${LE}/change`, role: 'Change / launch a new expedition', status: 'current' },
  { route: `${LE}/record`, role: 'Old post-lesson check-in form — superseded by Calendar logging', status: 'legacy' },
  { route: '/homeschool/oliver-ocean-adventures', role: 'Finished static unit from before Life Explorer', status: 'legacy' },
]

const API_ROUTES: Array<{ route: string; role: string; status: Status }> = [
  { route: 'GET /api/life-explorer/lessons/today', role: 'Active context: student, expedition, wonder wall, chapters, today-logged flag', status: 'current' },
  { route: 'POST /api/life-explorer/lessons/generate', role: 'Write today\'s lesson from the top queued wonder (gateway LLM, pack fallback)', status: 'current' },
  { route: 'POST /api/life-explorer/lessons/regenerate', role: 'Skip the current ready lesson and write a fresh one', status: 'current' },
  { route: 'GET /api/life-explorer/lessons', role: 'Lesson Log: all expedition lessons with timing + checklist/attachment counts', status: 'new' },
  { route: 'GET/PATCH /api/life-explorer/lessons/[id]', role: 'Full lesson bucket: guide + items + notes + links + media (seeds checklist on first open)', status: 'current' },
  { route: 'POST /api/life-explorer/lessons/[id]/record', role: 'Status + wall-clock start/finish stamps (feeds tomorrow\'s steering)', status: 'current' },
  { route: '/api/life-explorer/lessons/[id]/items · notes · links · media', role: 'Lesson container CRUD: action items, notes, reference links, uploaded documents/photos', status: 'new' },
  { route: 'POST /api/life-explorer/steer', role: 'Up Next wonder queue + expedition direction (continue/deepen/wrap up)', status: 'current' },
  { route: '/api/life-explorer/wonder', role: 'Wonder Wall CRUD + bulk reorder between boards', status: 'current' },
  { route: 'POST /api/life-explorer/wonder/from-photo', role: 'Vision AI reads stickies off a wall photo into proposals', status: 'current' },
  { route: '/api/life-explorer/evidence', role: 'Portfolio evidence CRUD (incl. wall snapshots with editable dates)', status: 'current' },
  { route: '/api/life-explorer/appreciation', role: 'Morning Appreciation journal photo + note', status: 'current' },
  { route: '/api/life-explorer/activity-log(+/[id])', role: 'Calendar entries with photos/videos', status: 'current' },
  { route: '/api/life-explorer/books', role: 'Storybooks: list + compose (story text, then background illustration)', status: 'new' },
  { route: '/api/life-explorer/books/[id]', role: 'Book + pages (reader/progress polling), retry illustration, delete', status: 'new' },
  { route: '/api/life-explorer/book-characters', role: 'Life Explorers cast: starters auto-seed, custom characters, portraits', status: 'new' },
  { route: 'GET /api/life-explorer/print/kit', role: 'Expedition Kit printable (passport, wall headers, map, experiments, certificate)', status: 'current' },
  { route: 'GET /api/life-explorer/print/week', role: 'Weekly Explorer Packet (day pages, decodable cards at current rung, sight words, vocab)', status: 'current' },
  { route: 'GET /api/life-explorer/print/lesson', role: 'Per-lesson recording sheet, only when the lesson defines one', status: 'current' },
  { route: 'GET /api/life-explorer/forecast', role: 'Sunday materials forecast', status: 'current' },
  { route: 'GET /api/life-explorer/feed', role: 'Journey feed (all photos/videos/artifacts through the year)', status: 'current' },
  { route: 'GET /api/life-explorer/map', role: 'Learning Map data', status: 'current' },
  { route: 'GET /api/life-explorer/progress', role: 'Skill progress data', status: 'current' },
  { route: 'GET /api/life-explorer/reports/binder', role: 'One-click Florida binder', status: 'current' },
  { route: '/api/life-explorer/students · /expeditions · /seed', role: 'Student + expedition setup and seeding', status: 'current' },
  { route: 'POST /api/life-explorer/convert-heic', role: 'Server-side HEIC→JPEG fallback for iPhone photos', status: 'current' },
  { route: 'POST /api/life-explorer/check-in', role: 'Old AI check-in interpreter — superseded by Calendar logging', status: 'legacy' },
]

const TABLES: Array<{ name: string; role: string; status: Status }> = [
  { name: 'le_students', role: 'Student profiles (grade, interests, strengths)', status: 'current' },
  { name: 'le_expeditions', role: 'Expeditions: Life Category, steer state, core resources', status: 'current' },
  { name: 'le_wonder_items', role: 'Wonder Wall stickies: kind, priority (Up Next queue), sort order, flashback review', status: 'current' },
  { name: 'le_lessons', role: 'Generated lessons with the full Fun Contract payload (JSONB) + started_at/completed_at wall-clock stamps', status: 'current' },
  { name: 'le_lesson_items', role: 'The lesson checklist: action items derived from the generated payload + parent-added ones', status: 'new' },
  { name: 'le_lesson_notes + le_lesson_links + le_lesson_media', role: 'Everything inside the lesson bucket: notes, reference links, uploaded documents/photos (lesson- or item-scoped)', status: 'new' },
  { name: 'le_lesson_records', role: 'Completion records that steer the next lesson', status: 'current' },
  { name: 'le_learning_evidence', role: 'Portfolio artifacts (photos, writing, builds) with captured_on dates', status: 'current' },
  { name: 'le_skill_progress', role: 'Ladder rung mastery per skill (drives decodable card difficulty)', status: 'current' },
  { name: 'le_activity_logs + le_activity_media', role: 'Calendar day entries and their photos/videos', status: 'current' },
  { name: 'le_characters', role: 'Life Explorers storybook cast: personality, visual description, portrait', status: 'new' },
  { name: 'le_books + le_book_pages', role: 'Generated picture books: text, illustration prompts, page images', status: 'new' },
]

const CONTENT_SOURCES: Array<{ file: string; role: string }> = [
  { file: 'src/lib/life-explorer/packs/antarctica.ts', role: 'Antarctica expedition pack: fallback lessons, materials, printable definitions' },
  { file: 'src/lib/life-explorer/antarctica-resources.ts', role: 'Curated, verified books/videos/links — never invented by AI' },
  { file: 'src/lib/life-explorer/ladders.ts', role: 'Math + reading scope-and-sequence with grade-aware placement and decodable words' },
  { file: 'src/lib/life-explorer/sight-words.ts', role: '1st-grade sight words (Polk County list), weekly rotation' },
  { file: 'src/lib/life-explorer/prompts.ts', role: 'Lesson composer system/user prompts (Fun Contract rules)' },
  { file: 'src/lib/life-explorer/book-prompts.ts + book-characters.ts', role: 'Storybook composer rules, starter cast, illustration style bible (live copies editable in /admin/ai-models → Tools: life_explorer_storybook_writer + _illustrator)' },
  { file: 'src/lib/life-explorer/book-illustrator.ts', role: 'Character-consistent illustration pipeline (cast lineup sheet → cover → pages, single-reference to prevent character blending)' },
  { file: 'src/lib/life-explorer/print/layout.ts', role: 'Shared ink-minimal print stylesheet and helpers' },
  { file: 'src/lib/life-explorer/state-standards.ts', role: 'Florida benchmark tagging + coverage steering' },
  { file: 'src/lib/life-explorer/flashback.ts', role: 'Spaced-retrieval games over learned wonders' },
]

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-400 mt-1 mb-4">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-4'}>{children}</div>
    </Card>
  )
}

function InventoryTable({
  rows,
  firstCol,
  linkify,
}: {
  rows: Array<{ key: string; role: string; status: Status }>
  firstCol: string
  linkify?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs md:text-sm">
        <thead>
          <tr className="border-b border-[#333] text-left text-neutral-400">
            <th className="py-2 pr-4 font-medium">{firstCol}</th>
            <th className="py-2 pr-4 font-medium">What it does / where it fits</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="text-neutral-300">
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-[#333]/50 align-top">
              <td className="py-2.5 pr-4 font-mono text-[11px] md:text-xs whitespace-nowrap">
                {linkify && r.key.startsWith('/') && !r.key.includes('[') ? (
                  <Link href={r.key} className="text-[#00FFFF] hover:underline">
                    {r.key}
                  </Link>
                ) : (
                  <span className="text-neutral-200">{r.key}</span>
                )}
              </td>
              <td className="py-2.5 pr-4">{r.role}</td>
              <td className="py-2.5">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminHomeschoolPage() {
  const [showBrief, setShowBrief] = useState(false)

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="VIBRATIONFIT EDUCATION"
          title="Homeschool System Inventory"
          subtitle="Everything that has been built for the homeschool program, and where each piece fits in the curriculum"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="premium" className="text-xs">Life Explorer — the daily operating system</Badge>
            <Badge variant="neutral" className="text-xs">Florida F.S. 1002.41 compliant</Badge>
          </div>
        </PageHero>

        <Card className="p-4 md:p-5 border-[#39FF14]/25">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">The member-facing front door is /homeschool</p>
              <p className="text-xs text-neutral-400 mt-1">
                The hub explains the program for co-parents and evaluators; this page is the builder&apos;s map.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/homeschool"
                className="rounded-lg bg-[#39FF14] px-4 py-2 text-xs font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
              >
                Open the hub
              </Link>
              <Link
                href={LE}
                className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-xs text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
              >
                Open Life Explorer
              </Link>
            </div>
          </div>
        </Card>

        {/* Architecture spine */}
        <Section
          title="The program spine"
          subtitle="How a school day flows through the system. Each node lists its page, API routes, and tables."
        >
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-2">
            {SPINE.map((node, i) => (
              <div key={node.title} className="flex flex-1 items-stretch gap-2">
                <div className="flex-1 rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5">
                  <p className="text-sm font-semibold text-[#39FF14]">{node.title}</p>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{node.detail}</p>
                  <p className="text-[10px] font-mono text-neutral-500 mt-2 leading-relaxed break-words">
                    {node.tech}
                  </p>
                </div>
                {i < SPINE.length - 1 && (
                  <div className="hidden lg:flex items-center text-neutral-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Two independent skill ladders (math, reading) run underneath every expedition — the
            expedition supplies joy and context, the ladders supply sequence. Lessons are generated
            one at a time, never pre-built, so steering is always fresh.
          </p>
        </Section>

        <Section title="Member pages" subtitle="Every surface a family touches.">
          <InventoryTable
            firstCol="Route"
            linkify
            rows={MEMBER_PAGES.map((p) => ({ key: p.route, role: p.role, status: p.status }))}
          />
        </Section>

        <Section title="API routes" subtitle="Everything under /api/life-explorer.">
          <InventoryTable
            firstCol="Route"
            rows={API_ROUTES.map((p) => ({ key: p.route, role: p.role, status: p.status }))}
          />
        </Section>

        <Section title="Database tables" subtitle="All le_* tables (Supabase, RLS: created_by + household membership).">
          <InventoryTable
            firstCol="Table"
            rows={TABLES.map((t) => ({ key: t.name, role: t.role, status: t.status }))}
          />
        </Section>

        <Section
          title="Where curriculum content lives in code"
          subtitle="Editable sources of truth — change these files to change the curriculum."
        >
          <div className="space-y-2">
            {CONTENT_SOURCES.map((c) => (
              <div key={c.file} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="shrink-0 font-mono text-[11px] md:text-xs text-[#00FFFF]">{c.file}</span>
                <span className="text-xs md:text-sm text-neutral-300">{c.role}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Original brief, preserved */}
        <Card className="p-0 overflow-hidden">
          <button
            onClick={() => setShowBrief((v) => !v)}
            className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-white/[0.02] transition-colors"
          >
            <div className="text-left">
              <h2 className="text-base md:text-lg font-semibold text-white">
                Original curriculum brief (reference)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                The pre-Life Explorer design document: 36-week Life Category pacing, Green Line
                system, five-phase daily rhythm, FL standards alignment. Kept for reference — the
                live system above supersedes its mechanics.
              </p>
            </div>
            {showBrief ? (
              <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            )}
          </button>
          {showBrief && (
            <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-[#333] pt-6">
              <CurriculumBrief />
            </div>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
