'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
export function RecentCreations({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ['member-home-creations', userId],
    queryFn: async () => {
      const r = await fetch('/api/member-home/creations')
      if (!r.ok) throw Error('Could not load creations')
      return r.json() as Promise<{
        items: {
          id: string
          title: string
          kind: string
          status: string
          href: string
          at: string
        }[]
        partial: boolean
      }>
    },
    refetchInterval: (q) =>
      q.state.data?.items.some((i) =>
        ['pending', 'processing', 'generating'].includes(i.status),
      )
        ? 15000
        : false,
  })
  if (query.isLoading)
    return (
      <p className="room-notice" aria-busy="true">
        Loading your latest creations…
      </p>
    )
  if (query.isError)
    return (
      <p className="room-notice">
        Your creations couldn’t load.{' '}
        <button className="underline" onClick={() => void query.refetch()}>
          Try again
        </button>
      </p>
    )
  if (!query.data?.items.length && !query.data?.partial) return null
  return (
    <section className="room-panel room-recent">
      <h2>Your latest creations</h2>
      {query.data?.partial && (
        <p className="room-pin-hint">
          Some creations are temporarily unavailable.
        </p>
      )}
      {query.data?.items.map((item) => (
        <Link key={item.id} href={item.href}>
          <span>
            {item.title}
            <small>
              {item.kind} · {item.status.replaceAll('_', ' ')}
            </small>
          </span>
          <ArrowRight size={18} />
        </Link>
      ))}
    </section>
  )
}
