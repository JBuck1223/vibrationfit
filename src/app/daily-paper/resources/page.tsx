'use client'

import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { Download, Heart, Target, Sparkles, PartyPopper, FileText, PenLine } from 'lucide-react'
import Link from 'next/link'
import { useInShell } from '@/lib/app-shell/shell-context'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { cn } from '@/lib/utils'

const HALF_PAGE_PDF =
  'https://media.vibrationfit.com/site-assets/processes/daily-paper/daily-paper-2-per-page.pdf'
const FULL_PAGE_PDF =
  'https://media.vibrationfit.com/site-assets/processes/daily-paper/full-page-daily-paper.pdf'
const DAILY_PAPER_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/resources/daily-paper-1080p.mp4'

const PARTS = [
  {
    icon: Heart,
    color: '#FF6FB5',
    title: 'Gratitude',
    body: 'Starting with what you feel grateful for puts you in the receiving mode for all great things, and sets a positive tone that dominoes into the rest of your day.',
  },
  {
    icon: Sparkles,
    color: '#39FF14',
    title: 'Three aligned actions',
    body: "Three actions for the day keep you on What's Important Now, so you feel the satisfying pull of real progress and WIN at creating your life by choice.",
  },
  {
    icon: PartyPopper,
    color: '#FFB020',
    title: 'Fun promise',
    body: 'Something fun so you stay focused on the fun: a walk, the sunset, a bath, a favorite meal, a project that excites you, anything that feels good.',
  },
]

export default function DailyPaperResourcesPage() {
  const inShell = useInShell()

  if (inShell) {
    // App shell: the same guide as glass cards, with the printables up front.
    return (
      <div className="space-y-4">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.12]">
          <OptimizedVideo url={DAILY_PAPER_VIDEO} context="single" className="w-full" />
        </div>

        <section className={cn(GLASS_CARD, 'p-5')}>
          <h2 className="text-lg font-semibold text-white">What is the Daily Paper?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">
            A simple daily process that sets a positive vibe while you move on purpose toward your desires. It takes about 5 to 15 minutes.
          </p>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          {PARTS.map(({ icon: Icon, color, title, body }, i) => (
            <section key={title} className={cn(GLASS_CARD, 'p-4')}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${color}22` }}>
                  <Icon className="h-[18px] w-[18px]" style={{ color }} aria-hidden />
                </span>
                <span className="text-xs text-white/50">Part {i + 1}</span>
              </div>
              <h3 className="text-[15px] font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{body}</p>
            </section>
          ))}
        </div>

        <section className={cn(GLASS_CARD, 'p-5')} data-tour="daily-paper-resources-print">
          <h2 className="text-lg font-semibold text-white">Prefer pen and paper?</h2>
          <p className="mt-1 text-sm text-white/70">Print a page, write by hand, then add a photo of it with Printed paper when you save.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { href: HALF_PAGE_PDF, title: 'Half page', note: 'Two papers per sheet' },
              { href: FULL_PAGE_PDF, title: 'Full page', note: 'More room to write' },
            ].map((pdf) => (
              <a
                key={pdf.title}
                href={pdf.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-3 transition-colors hover:border-[#39FF14]/50"
              >
                <FileText className="h-6 w-6 shrink-0 text-[#39FF14]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{pdf.title}</span>
                  <span className="block truncate text-xs text-white/55">{pdf.note}</span>
                </span>
                <Download className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
              </a>
            ))}
          </div>
        </section>

        <section className={cn(GLASS_CARD, 'p-5')}>
          <h2 className="text-lg font-semibold text-white">Your story over time</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">
            Looking back at Daily Papers from months or years ago shows how far you've come. They become your story: evidence of the thoughts and feelings that came before your manifestations. Everything you save stays in your account, for your eyes only.
          </p>
        </section>

        <Link
          href="/daily-paper/new"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black transition-transform active:scale-[0.98] md:mx-auto md:w-80"
        >
          <PenLine className="h-4 w-4" /> Create today's paper
        </Link>
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={DAILY_PAPER_VIDEO}
            context="single"
            className="w-full"
          />
        </div>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is the Daily Paper?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The Daily Paper is a magical daily process that helps you establish a positive vibe while intentionally moving in the direction of your desires. It can take anywhere from 5 to 15 minutes to complete.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Read below for more information on what three components are included in the Daily Paper and what makes this process so simple yet magical.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How the Daily Paper Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 1: Gratitude
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The power of gratitude is no secret. Starting with what you feel grateful for puts you in the receiving mode for all great things. It starts your day with a positive mindset that helps domino positive energy into all things.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 2: Aligned Actions
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The feeling of positive movement forward, or progress, is such a satisfying feeling. That’s why the Daily Paper asks for three aligned actions for the day. This helps you hone in on What’s Important Now so you can WIN at intentionally creating your life by choice.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 3: Fun Promise
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Something fun for the day so we can stay focused on the fun! This can be anything that tickles your fancy, like going fishing, taking a walk, watching the sunset, taking a bath, going shopping, getting your nails done, boating, going to a park, eating lunch at your favorite restaurant, cooking a favorite meal, working on a project that excites you, or anything else you can think of that makes you feel good while doing it.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Tracking Your Story
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              It’s so much fun looking back at Daily Paper entries to reminisce the beautiful or difficult days from 1, 3, 5 years ago, or even just a few months ago and see how far you’ve come. This Daily Paper is more than just a way to set your day for greatness. It’s also your story – evidence of what thoughts and feelings were the precursors of different manifestations in your life.
            </p>
            <Text size="sm" className="text-neutral-300">
              There are two ways to track your Daily Papers:
            </Text>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • Print a half-page or full-page Daily Paper below and write by hand, then upload a photo of the completed entry. The half page has two entries per sheet. The full page has one entry with more room to write.
              </p>
              <p>
                • Or if you prefer to type your Daily Paper digitally, you can submit it electronically. All form submissions will be saved to your member account (for your viewing only).
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]" data-tour="daily-paper-resources-print">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Print-ready PDFs
            </Text>
            <p className="text-sm text-neutral-300">
              Choose the layout that fits your flow and keep your notebook aligned with the digital archive.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <a href={HALF_PAGE_PDF} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Half-page PDF
                </a>
              </Button>
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <a href={FULL_PAGE_PDF} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Full-page PDF
                </a>
              </Button>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

