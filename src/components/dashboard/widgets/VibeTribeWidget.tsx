'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Plus } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { relativeDay, useAreaStatsQuery, useLatestVibePosts } from './queries'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

export function VibeTribeWidget(chrome: WidgetChromeProps) {
  const { data: posts = [], isLoading } = useLatestVibePosts(isWideWidget(chrome.size) ? 3 : 2)
  const { data: stats } = useAreaStatsQuery('vibe-tribe')
  const needsNudge = (stats?.countLast7 ?? 0) === 0

  return (
    <WidgetFrame
      {...chrome}
      title="Vibe Tribe"
      icon={Heart}
      accent="#BF00FF"
      href="/vibe-tribe"
      hrefLabel="Open"
      loading={isLoading}
    >
      {posts.length === 0 ? (
        <WidgetEmpty
          title="The tribe is quiet right now"
          body="Be the first to share a win or a wobble today."
          action={
            <Button variant="accent" size="sm" asChild>
              <Link href="/vibe-tribe">
                <Plus className="mr-1.5 h-4 w-4" />
                Share
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/vibe-tribe?post=${post.id}`}
                  className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:border-white/15"
                >
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                    {post.user?.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                        {(post.user?.full_name ?? '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-medium text-white">{post.user?.full_name ?? 'Member'}</p>
                      <span className="shrink-0 text-[10px] text-neutral-500">{relativeDay(post.created_at)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-300">{post.content}</p>
                    <p className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
                      {post.vibe_tag ? <span className="capitalize text-accent-500">{post.vibe_tag}</span> : null}
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {post.hearts_count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle className="h-3 w-3" /> {post.comments_count ?? 0}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Button variant="accent" size="sm" asChild>
              <Link href="/vibe-tribe">
                <Plus className="mr-1.5 h-4 w-4" />
                Share a win or wobble
              </Link>
            </Button>
            {needsNudge ? (
              <span className="text-[11px] text-neutral-500">You have not posted this week.</span>
            ) : null}
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
