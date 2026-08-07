'use client'

import Link from 'next/link'
import { Container, Stack } from '@/lib/design-system/components'
import {
  ANTARCTICA_BOOKS,
  ANTARCTICA_LINKS,
  ANTARCTICA_PDFS,
  ANTARCTICA_SUPPLIES,
  ANTARCTICA_WEEK1_DAYS,
} from '@/lib/life-explorer/antarctica-resources'

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
            Parent guides, journals, and verified links from the Life Explorer PDF pack. No invented
            URLs.
          </p>
        </div>

        <Section title="Printable PDFs">
          <ul className="space-y-2">
            {ANTARCTICA_PDFS.map((pdf) => (
              <li key={pdf.title}>
                <a
                  href={pdf.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#39FF14] underline underline-offset-2 hover:text-[#5FFF3E]"
                >
                  {pdf.title}
                </a>
                <p className="text-sm text-neutral-400 mt-0.5">{pdf.why_selected}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Week 1 arc">
          <ul className="space-y-3">
            {ANTARCTICA_WEEK1_DAYS.map((day) => (
              <li key={day.day} className="rounded-xl border border-[#2a2a2a] p-3">
                <p className="text-white font-medium">
                  Day {day.day} — {day.title}
                </p>
                <p className="text-sm text-[#00FFFF] mt-1">{day.essential_question}</p>
                <p className="text-sm text-neutral-400 mt-1">{day.focus}</p>
                {day.core_book && (
                  <p className="text-xs text-neutral-500 mt-1">Read-aloud: {day.core_book}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Books">
          <ul className="space-y-2">
            {ANTARCTICA_BOOKS.map((book) => (
              <li key={book.title} className="text-neutral-200">
                <span className="text-white font-medium">{book.title}</span>
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
