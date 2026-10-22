'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Heart, MessageCircle, Play, Share2, UsersRound, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      <nav aria-label="Tribe" className="flex gap-2 pt-2">
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
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          Alignment Gym
        </p>
        <h2 className="text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[40px]">
          {next ? next.title : replay ? 'Catch the last session' : 'Train your alignment live'}
        </h2>
        <p className="mt-2 max-w-xl text-base text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-lg">
          {next ? when(next.scheduled_at) : replay ? replay.title : 'Live group sessions with coaching, every week.'}
        </p>
        <div className="mt-4 h-12">
          {gymLoading ? null : next ? (
            <Link href={`/alignment-gym/${next.id}`} className="btn btn-primary !py-3 !px-6 text-[15px]">
              <Video className="mr-2 h-4 w-4" />
              {when(next.scheduled_at) === 'Live now' ? 'Join now' : 'Reserve my spot'}
            </Link>
          ) : replay?.recording_url ? (
            <Link href={`/alignment-gym/${replay.id}`} className="btn btn-primary !py-3 !px-6 text-[15px]">
              <Play className="mr-2 h-4 w-4" />
              Watch the replay
            </Link>
          ) : (
            <Link href="/alignment-gym" className="btn btn-primary !py-3 !px-6 text-[15px]">
              See the schedule
              <ArrowRight className="ml-2 h-4 w-4" />
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
          <Link href="/vibe-tribe" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
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
          <div className="glass-panel flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-white/70">Be the first to share a win, a wobble or a vision today.</p>
            <Link href="/vibe-tribe/new" className="btn btn-outline !py-2 !px-4 text-sm">
              Post to the Tribe
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/vibe-tribe/posts/${post.id}`} className="glass-panel flex gap-3 p-4 transition-colors hover:border-[#39FF14]/60">
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

      <Link href="/referral" className="glass-panel flex items-center gap-4 px-5 py-4 transition-colors hover:border-[#39FF14]/60">
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
