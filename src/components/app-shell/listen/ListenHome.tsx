'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Library, Loader2, Music2, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSection } from '@/lib/app-shell/sections'
import { useThemeImage } from '../ThemeProvider'
import { ContinueListening } from '../home/ContinueListening'
import { useRecentListenItems, useVisionAudioSets } from './queries'
import { usePlayAudioSet } from './usePlayAudioSet'

function relative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Listen root: consume only. Play the vision from the hero, pick a sub-tab,
 * reach for a vision set, or go back to what you had on.
 */
export function ListenHome() {
  const pathname = usePathname()
  const section = getSection('listen')
  const { data: sets = [], isLoading: setsLoading } = useVisionAudioSets()
  const { data: recent = [] } = useRecentListenItems()
  const { playSet, loadingId, isCurrent, isPlaying } = usePlayAudioSet()
  const setArt = useThemeImage('studio.life-vision')
  const cardArt = [useThemeImage('card.1'), useThemeImage('card.3'), useThemeImage('card.4'), useThemeImage('card.5')]

  const primary = sets[0] ?? null
  const primaryPlaying = primary ? isCurrent(primary.id) && isPlaying : false

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="flex min-h-[48vh] flex-col justify-end pb-2 pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          Life Vision
        </p>
        <h2 className="max-w-xl text-[44px] font-extrabold leading-[0.98] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[60px]">
          Play Your
          <br />
          Life Vision
        </h2>
        <p className="mt-3 max-w-md text-base text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-lg">
          Immerse yourself in the life you&apos;re consciously creating.
        </p>
        <div className="mt-5 h-12">
          {setsLoading ? null : primary ? (
            <button
              type="button"
              onClick={() => void playSet(primary.id, primary.visionTitle, 'vision', 'life_vision')}
              className="btn btn-primary !py-3 !px-6 text-[15px]"
            >
              {loadingId === primary.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : primaryPlaying ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {primaryPlaying ? 'Pause My Vision' : 'Play My Vision'}
            </button>
          ) : (
            <Link href="/life-vision/audio" className="btn btn-primary !py-3 !px-6 text-[15px]">
              Create My Vision Audio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <nav aria-label="Listen" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {[{ label: 'Life Vision', href: '/listen' }, ...section.tabs.filter((t) => t.href !== '/listen')].map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]'
                  : 'glass-chrome rounded-full text-white/80 hover:text-white',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Life Vision Sets</h3>
          <Link href="/audio" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {setsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[200px] animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="glass-panel flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-white/70">Generate audio for your Life Vision and your sets appear here.</p>
            <Link href="/life-vision/audio" className="btn btn-outline !py-2 !px-4 text-sm">
              Create vision audio
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set, i) => {
              const current = isCurrent(set.id)
              const art = setArt ?? cardArt[i % cardArt.length]
              return (
                <li key={set.id} className="glass-panel group relative overflow-hidden">
                  <div className="relative h-28">
                    {art && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,22,0.95)] to-transparent" />
                    <button
                      type="button"
                      onClick={() => void playSet(set.id, set.visionTitle, 'vision', 'life_vision')}
                      aria-label={current && isPlaying ? 'Pause' : 'Play'}
                      className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#39FF14] text-black shadow-[0_6px_20px_rgba(57,255,20,0.35)] transition-transform active:scale-95"
                    >
                      {loadingId === set.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : current && isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="px-4 pb-4 pt-2">
                    <p className="truncate text-[15px] font-semibold text-white">{set.name || set.visionTitle}</p>
                    <p className="text-xs text-white/60">
                      {set.name ? set.visionTitle : 'Full vision'} · {relative(set.createdAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Recently made</h3>
          </div>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {recent.map((item, i) => {
              const Icon = item.kind === 'song' ? Music2 : Library
              const art = item.artwork ?? cardArt[(i + 1) % cardArt.length]
              return (
                <li key={`${item.kind}-${item.id}`} className="w-[150px] shrink-0">
                  <Link href={item.href} className="glass-panel block overflow-hidden transition-colors hover:border-[#39FF14]/60">
                    <div className="relative h-[110px]">
                      {art && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-[#39FF14]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="text-[11px] text-white/55">{item.kind === 'song' ? 'Song' : 'Story'} · {relative(item.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <ContinueListening />
    </div>
  )
}
