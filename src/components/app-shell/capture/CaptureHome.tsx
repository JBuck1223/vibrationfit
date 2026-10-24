'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, ArrowUp, BookOpen, Calendar, Camera, ChevronRight, DollarSign, FileText, Mic } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_CARD, PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'
import { getSection } from '@/lib/app-shell/sections'
import { todayInTimezone, useTodayDailyPaper } from '@/components/dashboard/widgets/queries'
import { useThemeImage } from '../ThemeProvider'
import { useRecentCaptures, type CaptureEntry } from './queries'

const QUICK: { icon: LucideIcon; title: string; body: string; href: string; tone: string }[] = [
  { icon: BookOpen, title: 'New Journal Entry', body: 'Capture what’s on your mind', href: '/journal/new', tone: 'rgba(191,0,255,0.18)' },
  { icon: DollarSign, title: 'Add to Abundance', body: 'Notice and record your wins', href: '/abundance-tracker/new', tone: 'rgba(255,183,1,0.18)' },
  { icon: Mic, title: 'Voice Note', body: 'Quick capture with VIVA', href: '/journal/new?mode=voice', tone: 'rgba(0,255,255,0.14)' },
  { icon: Camera, title: 'Add a Photo', body: 'Capture evidence', href: '/journal/new?mode=photo', tone: 'rgba(57,255,20,0.16)' },
]

const KIND_ICON: Record<CaptureEntry['kind'], LucideIcon> = { journal: BookOpen, paper: FileText, abundance: DollarSign }
const KIND_LABEL: Record<CaptureEntry['kind'], string> = { journal: 'Journal', paper: 'Daily Paper', abundance: 'Abundance' }

function prettyDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Capture root: today's paper first, then the fastest ways to get a thought
 * down, what you captured lately, and a line straight to VIVA.
 */
export function CaptureHome({ timezone }: { timezone: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const section = getSection('capture')
  const today = todayInTimezone(timezone)
  const { data: paper, isLoading: paperLoading } = useTodayDailyPaper(today)
  const { data: recent = [], isLoading: recentLoading } = useRecentCaptures()
  const fallbackArt = [useThemeImage('card.1'), useThemeImage('card.3'), useThemeImage('card.5')]
  const [draft, setDraft] = React.useState('')

  const todayLabel = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  const share = () => {
    const text = draft.trim()
    if (!text) return
    router.push(`/viva?draft=${encodeURIComponent(text)}`)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <nav aria-label="Capture" className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 scrollbar-hide md:mx-0 md:px-0">
        {section.tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(PILL_BASE, 'text-center md:flex-1', active ? PILL_ON : PILL_OFF)}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Today's Daily Paper as one compact card: the top bar names the page. */}
      <section className={cn(GLASS_CARD, 'p-4 md:p-5')} aria-label="Daily Paper">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.14)] text-[#39FF14]">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold leading-tight text-white">
                {paper ? 'Your Paper is Done' : 'Start Your Daily Paper'}
              </h2>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-white/75">
                <Calendar className="h-3.5 w-3.5" />
                {todayLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/65">
              {paper ? 'Come back to it any time today, or add to your journal.' : 'Clear your mind, raise your vibration, and set your intentions for the day.'}
            </p>
          </div>
        </div>
        <div className="mt-4 h-11">
          {paperLoading ? null : (
            <Link
              href={paper ? `/daily-paper/${paper.id}` : '/daily-paper/new'}
              className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98] md:w-auto md:px-6',
                paper ? 'border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.35)]',
              )}
            >
              {paper ? 'Open Today’s Paper' : 'Start Today’s Paper'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Quick Capture</h3>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK.map(({ icon: Icon, title, body, href, tone }) => (
            <li key={title}>
              <Link href={href} className={cn(GLASS_CARD, 'flex h-full flex-col gap-3 !rounded-[20px] p-4 transition-colors hover:border-[#39FF14]/60')}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: tone }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold leading-tight text-white">{title}</span>
                  <span className="mt-1 block text-xs text-white/65">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Recent Entries</h3>
          <Link href="/journal" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className={cn(GLASS_CARD, 'p-5 text-sm text-white/70')}>Your first capture shows up here.</div>
        ) : (
          <ul className="space-y-3">
            {recent.map((entry, i) => {
              const Icon = KIND_ICON[entry.kind]
              const art = entry.image ?? fallbackArt[i % fallbackArt.length]
              return (
                <li key={`${entry.kind}-${entry.id}`}>
                  <Link href={entry.href} className={cn(GLASS_CARD, 'flex items-center gap-4 !rounded-[20px] p-3 pr-4 transition-colors hover:border-[#39FF14]/60')}>
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                      {art && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[#39FF14]">
                        <Icon className="h-3 w-3" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-white">{entry.title}</span>
                      {entry.excerpt && <span className="block truncate text-sm text-white/65">{entry.excerpt}</span>}
                      <span className="mt-0.5 block text-xs text-white/50">
                        {KIND_LABEL[entry.kind]} · {prettyDate(entry.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section data-section="viva" className={cn(GLASS_CARD, '!border-[#BF00FF]/50 p-3')}>
        <label htmlFor="capture-share" className="sr-only">Share with VIVA</label>
        <textarea
          id="capture-share"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              share()
            }
          }}
          rows={2}
          placeholder="Share with VIVA..."
          className="w-full resize-none bg-transparent px-2 pt-1 text-base text-white placeholder:text-white/45 focus:outline-none"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-xs text-white/50">Opens a conversation with your guide</span>
          <button
            type="button"
            onClick={share}
            disabled={!draft.trim()}
            aria-label="Share with VIVA"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BF00FF] text-white transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  )
}
