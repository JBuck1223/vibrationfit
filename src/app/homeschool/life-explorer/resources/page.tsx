'use client'

import Link from 'next/link'
import { Container, Stack } from '@/lib/design-system/components'
import {
  ANTARCTICA_BOOKS,
  ANTARCTICA_LINKS,
  ANTARCTICA_SUPPLIES,
} from '@/lib/life-explorer/antarctica-resources'

const PRINT_LAYERS = [
  {
    title: 'Expedition Kit',
    href: '/api/life-explorer/print/kit',
    when: 'Print once, at launch',
    what: 'Explorer passport, Wonder Wall headers, expedition map, experiment sheets, completion certificate.',
  },
  {
    title: 'Weekly Explorer Packet',
    href: '/api/life-explorer/print/week',
    when: 'Print with the Sunday materials forecast',
    what: "Five field-notes day pages, reading cards at the current rung (they level up automatically), and the expedition word cards.",
  },
  {
    title: "Today's lesson sheet",
    href: null,
    when: 'Only when a lesson needs one',
    what: 'If an experiment needs a recording sheet, the print button appears on the lesson page. Most days need nothing beyond a field-notes page.',
  },
] as const

export default function ResourcesPage() {
  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Antarctica Resources</h2>
          <p className="text-neutral-400 mt-2">
            Printables generated on demand (designed to sip ink), verified books and links, and the
            supply list. The lesson screen is the teacher guide — nothing to print there.
          </p>
        </div>

        <Section title="Print Kit — three layers, nothing wasted">
          <ul className="space-y-4">
            {PRINT_LAYERS.map((layer) => (
              <li key={layer.title} className="rounded-xl border border-[#2a2a2a] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-white font-medium">{layer.title}</p>
                  <span className="text-xs uppercase tracking-wide text-[#00FFFF]">
                    {layer.when}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 mt-1">{layer.what}</p>
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
        </Section>

        <Section title="Our storybooks">
          <p className="text-sm text-neutral-400">
            Skip the buy list — make your own. The Life Explorers star in original, fully
            illustrated picture books about whatever {`he's`} wondering right now, written at his
            reading level (or as a read-aloud).
          </p>
          <Link
            href="/homeschool/life-explorer/books"
            className="mt-3 inline-flex items-center rounded-lg bg-[#39FF14] px-4 py-2 text-xs font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
          >
            Open the bookshelf
          </Link>
        </Section>

        <Section title="Books to borrow or buy">
          <ul className="space-y-2">
            {ANTARCTICA_BOOKS.map((book) => (
              <li key={book.title} className="text-neutral-200">
                {book.url ? (
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium underline underline-offset-2 hover:text-[#39FF14]"
                  >
                    {book.title}
                  </a>
                ) : (
                  <span className="text-white font-medium">{book.title}</span>
                )}
                <p className="text-sm text-neutral-400">{book.why_selected}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Videos & links">
          <ul className="space-y-3">
            {ANTARCTICA_LINKS.map((link) => (
              <li key={link.title} className="rounded-xl border border-[#2a2a2a] p-3">
                <p className="text-white font-medium">{link.title}</p>
                {link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#39FF14] text-sm underline mt-1 inline-block"
                  >
                    Open
                  </a>
                ) : (
                  <p className="text-sm text-amber-300 mt-1">
                    Needs parent-chosen link — not invented by the system.
                  </p>
                )}
                <p className="text-sm text-neutral-400 mt-1">{link.why_selected}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Supply checklist">
          <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-300">
            {ANTARCTICA_SUPPLIES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      </Stack>
    </Container>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      {children}
    </section>
  )
}
