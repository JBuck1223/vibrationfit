'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, PlayCircle, Users, Video } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { useDashboard } from '../DashboardContext'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { useGymSessions } from './queries'

function useCountdown(iso: string | null | undefined) {
  const [label, setLabel] = useState<string>('')
  useEffect(() => {
    if (!iso) {
      setLabel('')
      return
    }
    const update = () => {
      const diff = new Date(iso).getTime() - Date.now()
      if (diff <= 0) {
        setLabel('Live now')
        return
      }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      if (days > 0) setLabel(`in ${days}d ${hours}h`)
      else if (hours > 0) setLabel(`in ${hours}h ${mins}m`)
      else setLabel(`in ${mins}m`)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [iso])
  return label
}

export function AlignmentGymWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const { data, isLoading } = useGymSessions()
  const next = data?.next ?? null
  const countdown = useCountdown(next?.scheduled_at)
  const live = next?.status === 'live' || countdown === 'Live now'

  const when = next
    ? new Date(next.scheduled_at).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: server.userTimezone ?? undefined,
      })
    : ''

  return (
    <WidgetFrame
      {...chrome}
      title="Alignment Gym"
      icon={Users}
      accent="#14B8A6"
      href="/alignment-gym"
      hrefLabel="Schedule"
      loading={isLoading}
    >
      {!next && !data?.lastReplay ? (
        <WidgetEmpty
          title="No sessions on the calendar"
          body="Live group coaching lands here as soon as the next one is scheduled."
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          {next ? (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                {live ? 'Happening now' : 'Next session'}
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-medium text-white">{next.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {when}
                {countdown ? <span className="text-teal-400">· {countdown}</span> : null}
              </p>
              <Button variant={live ? 'primary' : 'outline'} size="sm" className="mt-3" asChild>
                <Link href={`/session/${next.id}`}>
                  <Video className="mr-1.5 h-4 w-4" />
                  {live ? 'Join now' : 'Session details'}
                </Link>
              </Button>
            </div>
          ) : null}
          {data?.lastReplay ? (
            <Link
              href={`/session/${data.lastReplay.id}`}
              className="mt-auto flex items-center gap-2 text-xs text-neutral-400 hover:text-white"
            >
              <PlayCircle className="h-4 w-4 text-teal-400" />
              <span className="truncate">Replay: {data.lastReplay.title}</span>
            </Link>
          ) : null}
        </div>
      )}
    </WidgetFrame>
  )
}
