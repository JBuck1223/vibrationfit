'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, BookOpen, ChevronRight, Image as ImageIcon, PenLine, Play, Plus, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_CARD, PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'
import { getSection } from '@/lib/app-shell/sections'
import { useActiveVisionSummary, useManifestationsSnapshot } from '@/components/dashboard/widgets/queries'
import { getStoryKindLabel } from '@/lib/stories/types'
import { useStoriesFromVision } from './queries'

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Vision root: the Life Vision the member is living from, the manifestations
 * they are calling in, and the stories they made from that vision.
 */
export function VisionHome() {
  const pathname = usePathname()
  const section = getSection('vision')
  const { data: vision, isLoading: visionLoading } = useActiveVisionSummary()
  const { data: board, isLoading: boardLoading } = useManifestationsSnapshot()
  const { data: stories = [] } = useStoriesFromVision()

  const softPill =
    'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[15px] font-medium text-white transition-colors hover:border-white/30'
  const greenPill =
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#39FF14] px-5 text-[15px] font-semibold text-black shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-transform active:scale-[0.98]'

  return (
    <div className="space-y-6 md:space-y-8">
      <nav aria-label="Vision" className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 scrollbar-hide md:mx-0 md:px-0">
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

      {/* The Life Vision */}
      <section className={cn(GLASS_CARD, 'p-4 md:p-5')} aria-label="Life Vision">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.14)] text-[#39FF14]">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/55">Life Vision</p>
            <h2 className="text-lg font-semibold leading-tight text-white">
              {visionLoading ? ' ' : vision ? vision.title : 'Write the life you choose'}
            </h2>
            <p className="mt-1 text-sm text-white/65">
              {vision
                ? `Active since ${shortDate(vision.committedAt)}${vision.lastRefinedAt ? ` · refined ${shortDate(vision.lastRefinedAt)}` : ''}`
                : visionLoading
                  ? ' '
                  : 'Twelve areas of your life, in your own words, with VIVA helping you shape them.'}
            </p>
          </div>
        </div>
        <div className="mt-4 min-h-11">
          {visionLoading ? null : vision ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {vision.hasAudio ? (
                <Link href="/audio" className={greenPill}>
                  <Play className="h-4 w-4" />
                  Play My Vision
                </Link>
              ) : null}
              <Link href={`/life-vision/${vision.id}`} className={vision.hasAudio ? softPill : greenPill}>
                <BookOpen className="h-4 w-4" />
                Read My Vision
              </Link>
              <Link href="/life-vision/update" className={softPill}>
                <PenLine className="h-4 w-4" />
                Update
              </Link>
            </div>
          ) : (
            <Link href="/life-vision/start" className={cn(greenPill, 'w-full sm:w-auto')}>
              Start My Life Vision
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Manifestations */}
      <section aria-labelledby="vision-manifestations">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 id="vision-manifestations" className="text-base font-semibold text-white">Manifestations</h3>
            {board ? (
              <p className="text-sm text-white/60">
                {board.active} active · {board.actualized} actualized
              </p>
            ) : null}
          </div>
          <Link href="/manifestations" className="flex items-center gap-1 text-sm text-white/75 hover:text-white">
            Open board <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {boardLoading ? (
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 w-28 shrink-0 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : board && board.items.length > 0 ? (
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0">
            {board.items.slice(0, 10).map((item) => (
              <li key={item.id} className="shrink-0">
                <Link
                  href={`/manifestations/${item.id}`}
                  className="group relative block h-28 w-28 overflow-hidden rounded-2xl border border-white/[0.12] md:h-32 md:w-32"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.name ?? ''} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  {item.name ? (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-6 text-[11px] font-medium leading-tight text-white line-clamp-2">
                      {item.name}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link
                href="/manifestations/new"
                className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/25 bg-white/[0.04] text-sm text-white/80 transition-colors hover:border-white/45 hover:text-white md:h-32 md:w-32"
              >
                <Plus className="h-5 w-5" />
                Add
              </Link>
            </li>
          </ul>
        ) : (
          <Link href="/manifestations/new" className={cn(GLASS_CARD, 'flex items-center gap-4 px-5 py-4 transition-colors hover:border-[#39FF14]/60')}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.14)] text-[#39FF14]">
              <ImageIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">Add your first creation</span>
              <span className="block text-sm text-white/65">An image of something you are calling in.</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/40" />
          </Link>
        )}
      </section>

      {/* Stories made from the Life Vision (they also live under Tool Box) */}
      {stories.length > 0 ? (
        <section aria-labelledby="vision-stories">
          <div className="mb-3 flex items-center justify-between">
            <h3 id="vision-stories" className="text-base font-semibold text-white">Made from your Life Vision</h3>
            <Link href="/story" className="flex items-center gap-1 text-sm text-white/75 hover:text-white">
              All stories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {stories.map((story) => (
              <li key={story.id}>
                <Link href={`/story/${story.id}`} className={cn(GLASS_CARD, 'flex items-center gap-3 !rounded-[20px] px-4 py-3 transition-colors hover:border-[#39FF14]/60')}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-white">{story.title || 'Untitled'}</span>
                    <span className="mt-0.5 block text-xs text-white/55">
                      {getStoryKindLabel(story.metadata)}
                      {story.word_count ? ` · ${story.word_count.toLocaleString()} words` : ''}
                      {` · ${shortDate(story.created_at)}`}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
