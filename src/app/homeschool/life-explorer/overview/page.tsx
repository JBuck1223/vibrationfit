import Link from 'next/link'
import { Container, Stack } from '@/lib/design-system/components'

export const metadata = {
  title: 'How Life Explorer Works — Vibration Fit Homeschool',
}

/**
 * The curriculum blueprint as a living page — the one place the system's
 * architecture is explained. Expeditions never repeat this; they link here.
 */
export default function OverviewPage() {
  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link
            href="/homeschool/life-explorer/map"
            className="text-sm text-neutral-400 hover:text-white"
          >
            ← Learning Map
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">How Life Explorer Works</h2>
          <p className="text-neutral-400 mt-2">
            The blueprint behind every expedition — read once, then just explore.
          </p>
        </div>

        <Card title="One idea">
          <p>
            School subjects are artificial. Life isn&apos;t divided into math class and science
            class — it&apos;s divided into things worth being curious about. Life Explorer organizes
            learning through <strong className="text-white">Life Categories</strong> (Travel,
            Health, Family, Money…) explored through{' '}
            <strong className="text-white">Expeditions</strong>: multi-week adventures driven by
            what the child actually wonders.
          </p>
        </Card>

        <Card title="The learning cycle">
          <p className="text-[#00FFFF] text-sm tracking-wide">
            KNOW → WONDER → INVESTIGATE → CREATE → REFLECT → CHOOSE → CONTINUE
          </p>
          <p className="mt-3">
            Every expedition starts with the <strong className="text-white">Wonder Wall</strong>:
            what the child already knows (kept in their exact words, even when wrong — that&apos;s
            how discovery gets measured) and what they wonder. Lessons investigate the wonders,
            end with something made, and close by choosing where curiosity goes next. Answered
            wonders migrate to the Learned board.
          </p>
        </Card>

        <Card title="Every lesson keeps six promises">
          <ul className="space-y-2">
            <li>A hook — never &ldquo;today we will learn about…&rdquo;</li>
            <li>A story mission — the child is the explorer, not the audience</li>
            <li>Embodiment — the body moves before any pencil does</li>
            <li>An artifact — something worth proudly showing someone</li>
            <li>A real choice the child makes</li>
            <li>A celebration close</li>
          </ul>
          <p className="mt-3 text-neutral-400 text-sm">
            Plus the parent guarantees: 5–10 minute prep, a 15-minute low-battery version, a
            sibling tag-along line for every activity, an answer key, and all media in a
            tap-to-play queue.
          </p>
        </Card>

        <Card title="The two ladders">
          <p>
            Math and reading follow explicit, sequential ladders (counting → operations →
            fractions; phonemic awareness → phonics → fluency) that never depend on the
            expedition&apos;s theme. Expeditions supply the joy and the context; the ladders supply
            the sequence. Ten minutes a day, dressed in the expedition&apos;s story world.
          </p>
        </Card>

        <Card title="Printing, minimized">
          <p>
            Three layers, all generated on demand and designed to sip printer ink:
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <strong className="text-white">Expedition Kit</strong> — once per expedition:
              passport, Wonder Wall headers, map, experiment sheets, certificate
            </li>
            <li>
              <strong className="text-white">Weekly Explorer Packet</strong> — with the Sunday
              materials forecast: five field-notes pages plus reading cards at the current rung
            </li>
            <li>
              <strong className="text-white">Lesson sheet</strong> — only when an experiment needs
              a recording sheet
            </li>
          </ul>
          <p className="mt-3 text-neutral-400 text-sm">
            The teacher guide is never printed — the lesson screen is the teacher guide.
          </p>
        </Card>

        <Card title="Compliance without the vibe-kill">
          <p>
            Every completed lesson automatically writes the daily activity log, tags state
            benchmarks, and files evidence into the portfolio. The Florida binder — activity log,
            reading list, portfolio, progress timeline — generates in one click from the Learning
            Map&apos;s Reports tab. Nobody maintains a second system.
          </p>
        </Card>
      </Stack>
    </Container>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="text-neutral-300 text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}
