'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Heart, MessageCircle, Play, Share2, UsersRound, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { getSection } from '@/lib/app-shell/sections'
import { useGymSessions, useLatestVibePosts } from '@/components/dashboard/widgets/queries'

function when(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  const days = Math.round(diff / 86_400_000)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (Math.abs(diff) < 2 * 60 * 60 * 1000) return 'Live now'
  if (days === 0) return `Today at ${time}`
  if (days === 1) return `Tomorrow at ${time}`
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`
}

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

/**
 * Tribe root: the next live Alignment Gym session (or the last replay) up
 * top, the newest Vibe Tribe posts, and the doors to each community space.
 */
export function TribeHome() {
  const pathname = usePathname()
  const section = getSection('tribe')
  const { data: gym, isLoading: gymLoading } = useGymSessions()
  const { data: posts = [], isLoading: postsLoading } = useLatestVibePosts(3)

  const next = gym?.next ?? null
  const replay = gym?.lastReplay ?? null

  return (
    <div className="space-y-6 md:space-y-8">
      <nav aria-label="Tribe" className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 scrollbar-hide md:mx-0 md:px-0">
        {section.tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-center text-sm font-medium transition-colors md:flex-1',
                active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-[rgba(28,22,38,0.45)] text-white/90 backdrop-blur-xl hover:text-white',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* The next Alignment Gym session as one compact card. */}
      <section className={cn(GLASS_CARD, 'p-4 md:p-5')} aria-label="Alignment Gym">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.14)] text-[#39FF14]">
            <Video className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/55">Alignment Gym</p>
            <h2 className="text-lg font-semibold leading-tight text-white">
              {next ? next.title : replay ? 'Catch the last session' : 'Train your alignment live'}
            </h2>
            <p className="mt-1 text-sm text-white/65">
              {next ? when(next.scheduled_at) : replay ? replay.title : 'Live group sessions with coaching, every week.'}
            </p>
          </div>
        </div>
        <div className="mt-4 h-11">
          {gymLoading ? null : (
            <Link
              href={next ? `/alignment-gym/${next.id}` : replay?.recording_url ? `/alignment-gym/${replay.id}` : '/alignment-gym'}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-transform active:scale-[0.98] md:w-auto md:px-6"
            >
              {next ? (
                <>
                  <Video className="h-4 w-4" />
                  {when(next.scheduled_at) === 'Live now' ? 'Join now' : 'Reserve my spot'}
                </>
              ) : replay?.recording_url ? (
                <>
                  <Play className="h-4 w-4" />
                  Watch the replay
                </>
              ) : (
                <>
                  See the schedule
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <UsersRound className="h-4 w-4 text-[#39FF14]" />
            Vibe Tribe
          </h3>
          <Link href="/vibe-tribe" className="flex items-center gap-1 text-sm text-white/75 hover:text-white">
            Open the feed <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {postsLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className={cn(GLASS_CARD, 'flex flex-col items-start gap-3 p-5')}>
            <p className="text-sm text-white/70">Be the first to share a win, a wobble or a vision today.</p>
            <Link href="/vibe-tribe/new" className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors hover:border-white/30">
              Post to the Tribe
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/vibe-tribe/posts/${post.id}`} className={cn(GLASS_CARD, 'flex gap-3 !rounded-[20px] p-4 transition-colors hover:border-[#39FF14]/60')}>
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                    {post.user?.profile_picture_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs text-white/60">
                      <span className="truncate font-medium text-white/85">{post.user?.full_name ?? 'A member'}</span>
                      {post.vibe_tag && <span className="rounded-full bg-[rgba(57,255,20,0.16)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#39FF14]">{post.vibe_tag}</span>}
                      <span className="ml-auto shrink-0">{ago(post.created_at)}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-white">{post.content}</span>
                    <span className="mt-2 flex items-center gap-3 text-xs text-white/55">
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.hearts_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments_count}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/referral" className={cn(GLASS_CARD, 'flex items-center gap-4 px-5 py-4 transition-colors hover:border-[#39FF14]/60')}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
          <Share2 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-white">Bring someone with you</span>
          <span className="block text-sm text-white/65">Your referral link, earnings and payouts.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-white/40" />
      </Link>
    </div>
  )
}
