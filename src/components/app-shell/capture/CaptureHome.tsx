'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, ArrowUp, BookOpen, Calendar, Camera, ChevronRight, DollarSign, FileText, Mic } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      <nav aria-label="Capture" className="flex gap-2 pt-2">
        {section.tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 rounded-full border px-3 py-2 text-center text-sm font-medium transition-colors',
                active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'glass-chrome rounded-full text-white/80 hover:text-white',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <section className="pb-1 pt-1">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">Daily Paper</p>
          <span className="glass-chrome ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/85">
            <Calendar className="h-3.5 w-3.5" />
            {todayLabel}
          </span>
        </div>
        <h2 className="text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[40px]">
          {paper ? 'Your Paper is Done' : 'Start Your Daily Paper'}
        </h2>
        <p className="mt-2 max-w-xl text-base text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-lg">
          {paper ? 'Come back to it any time today, or add to your journal.' : 'Clear your mind, raise your vibration, and set your intentions for the day.'}
        </p>
        <div className="mt-4 h-12">
          {paperLoading ? null : (
            <Link href={paper ? `/daily-paper/${paper.id}` : '/daily-paper/new'} className="btn btn-primary !py-3 !px-6 text-[15px]">
              {paper ? 'Open Today’s Paper' : 'Start Today’s Paper'}
              <ArrowRight className="ml-2 h-4 w-4" />
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
              <Link href={href} className="glass-panel flex h-full flex-col gap-3 p-4 transition-colors hover:border-[#39FF14]/60">
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
          <div className="glass-panel p-5 text-sm text-white/70">Your first capture shows up here.</div>
        ) : (
          <ul className="space-y-3">
            {recent.map((entry, i) => {
              const Icon = KIND_ICON[entry.kind]
              const art = entry.image ?? fallbackArt[i % fallbackArt.length]
              return (
                <li key={`${entry.kind}-${entry.id}`}>
                  <Link href={entry.href} className="glass-panel flex items-center gap-4 p-3 pr-4 transition-colors hover:border-[#39FF14]/60">
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

      <section data-section="viva" className="glass-panel border-[#BF00FF]/50 p-3">
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
          <span className="text-xs text-white/50">Opens a conversation with your coach</span>
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
