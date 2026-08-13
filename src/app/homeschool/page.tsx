import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Stack } from '@/lib/design-system/components'

export const metadata: Metadata = {
  title: 'Homeschool | Vibration Fit',
  description:
    'Vibration Fit Homeschool — a curiosity-driven, AI-assisted homeschool program built around Life Explorer.',
}

const LE = '/homeschool/life-explorer'

const DAILY_FLOW = [
  {
    step: 1,
    title: 'Morning Appreciation',
    href: LE,
    what: 'Snap a photo of the morning appreciation journal entry — a drawing plus a couple of sentences. It files itself into the portfolio.',
  },
  {
    step: 2,
    title: "Today's adventure",
    href: LE,
    what: 'One AI-generated lesson, built from the top question on the Wonder Wall. The lesson screen is the teacher guide — hook, story mission, hands-on activity, artifact, celebration.',
  },
  {
    step: 3,
    title: 'Log it on the Calendar',
    href: `${LE}/calendar`,
    what: 'When the lesson wraps, one tap logs the day: what happened, photos of what got made. This is the Florida-compliant daily record — no second system to maintain.',
  },
  {
    step: 4,
    title: 'Steer tomorrow',
    href: `${LE}/wonder`,
    what: 'New questions go up on the Wonder Wall; answered ones migrate to Learned. The lead explorer reorders the Up Next queue and tomorrow’s lesson is built from it.',
  },
]

const SURFACES = [
  {
    title: 'Today (Expedition home)',
    href: LE,
    what: 'The daily hub: next-step spotlight, morning appreciation, the steering console, and the story so far.',
    when: 'Open this first, every school day.',
  },
  {
    title: 'Wonder Wall',
    href: `${LE}/wonder`,
    what: 'Three boards — What I Know, What I Wonder, What I Learned — in the child’s exact words. Snap a photo of a physical wall and AI reads the stickies onto the boards.',
    when: 'Day one of every expedition, then whenever curiosity strikes.',
  },
  {
    title: 'Storybooks',
    href: `${LE}/books`,
    what: 'Original, fully illustrated picture books starring the Life Explorers cast — generated about whatever the child wonders, at reading level or as a read-aloud.',
    when: 'Whenever a wonder deserves its own book.',
  },
  {
    title: 'Calendar',
    href: `${LE}/calendar`,
    what: 'The daily activity log with photos and videos — the single compliance record and the way days get tracked.',
    when: 'End of every learning day.',
  },
  {
    title: 'Learning Map',
    href: `${LE}/map`,
    what: 'Skill ladders (math and reading), expedition history, the journey feed of everything created, and one-click Florida binder reports.',
    when: 'Weekly check, and before the annual evaluation.',
  },
  {
    title: 'Expedition Resources',
    href: `${LE}/resources`,
    what: 'The current expedition’s verified books, videos, and supply list — plus the three print layers.',
    when: 'Sunday planning and expedition launch.',
  },
  {
    title: 'How Life Explorer Works',
    href: `${LE}/overview`,
    what: 'The pedagogy in one page: Life Categories, the learning cycle, the Fun Contract, the two ladders, and compliance.',
    when: 'Read once — especially for co-parents and evaluators.',
  },
]

const PRINT_LAYERS = [
  {
    title: 'Expedition Kit',
    href: '/api/life-explorer/print/kit',
    when: 'Once, when an expedition launches',
    what: 'Explorer passport, Wonder Wall board headers, expedition map, experiment sheets, completion certificate.',
  },
  {
    title: 'Weekly Explorer Packet',
    href: '/api/life-explorer/print/week',
    when: 'Sundays, with the materials forecast',
    what: 'Five field-notes day pages, decodable reading cards at the current rung, rotating sight-word cards, expedition vocabulary cards.',
  },
  {
    title: "Today's lesson sheet",
    href: null,
    when: 'Only when a lesson calls for one',
    what: 'A recording sheet for experiments. The print button appears on the lesson page itself when needed.',
  },
]

const MORE_LINKS = [
  {
    title: 'Portfolio',
    href: `${LE}/portfolio`,
    note: 'Every artifact and demonstration, organized as evaluation-ready evidence.',
  },
  {
    title: 'Progress',
    href: `${LE}/progress`,
    note: 'Skill-by-skill academic tracking (calm, not grades).',
  },
  {
    title: 'Ocean Adventures',
    href: '/homeschool/oliver-ocean-adventures',
    note: 'A finished static unit from before Life Explorer — kept as an archive.',
  },
]

export default function HomeschoolHubPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Container size="lg" className="px-4 md:px-6 py-12 md:py-16">
        <Stack gap="lg">
          {/* Hero */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#39FF14]/80">
              Vibration Fit Homeschool
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-white">
              School that feels like the life you choose
            </h1>
            <p className="mt-3 max-w-3xl text-neutral-400 leading-relaxed">
              The program is <strong className="text-white">Life Explorer</strong>: learning is
              organized into multi-week <strong className="text-white">Expeditions</strong> driven
              by what the child actually wonders. Every day, AI writes one fresh lesson from the
              top question on the Wonder Wall, the parent facilitates it in under ten minutes of
              prep, and the finished day logs itself into a Florida-compliant record. No day
              numbers, no packets of busywork — one adventure at a time, steered by curiosity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={LE}
                className="rounded-xl bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
              >
                Open Life Explorer
              </Link>
              <Link
                href={`${LE}/overview`}
                className="rounded-xl border border-[#2a2a2a] px-5 py-2.5 text-sm text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* Daily flow */}
          <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
            <h2 className="text-lg font-semibold text-white">A school day, start to finish</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {DAILY_FLOW.map((s) => (
                <Link
                  key={s.step}
                  href={s.href}
                  className="group rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-4 hover:border-[#39FF14]/50 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#39FF14]/15 text-sm font-bold text-[#39FF14]">
                    {s.step}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white group-hover:text-[#39FF14] transition-colors">
                    {s.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{s.what}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Surface map */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Everything in the program</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SURFACES.map((s) => (
                <Link
                  key={s.href + s.title}
                  href={s.href}
                  className="group rounded-2xl border border-[#222] bg-[#111] p-5 hover:border-[#39FF14]/50 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-white group-hover:text-[#39FF14] transition-colors">
                      {s.title}
                    </p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#00FFFF]">
                      {s.when}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-neutral-400 leading-relaxed">{s.what}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Print system */}
          <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
            <h2 className="text-lg font-semibold text-white">
              Printing — three layers, designed to sip ink
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Everything printable is generated on demand and brand-styled for minimal ink. The
              teacher guide is never printed — the lesson screen is the teacher guide.
            </p>
            <ul className="mt-4 space-y-3">
              {PRINT_LAYERS.map((layer) => (
                <li key={layer.title} className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{layer.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-[#00FFFF]">
                      {layer.when}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">{layer.what}</p>
                  {layer.href && (
                    <a
                      href={layer.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center rounded-lg bg-[#39FF14] px-4 py-2 text-xs font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
                    >
                      Open &amp; print
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* More */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">More</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MORE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-4 hover:border-[#444] transition-colors"
                >
                  <p className="text-sm font-medium text-white">{l.title}</p>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{l.note}</p>
                </Link>
              ))}
            </div>
          </section>
        </Stack>
      </Container>
    </div>
  )
}
