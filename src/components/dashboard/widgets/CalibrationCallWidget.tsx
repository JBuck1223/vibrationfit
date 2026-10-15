'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Apple, Calendar, CalendarDays, Clock, Video } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { useDashboard } from '../DashboardContext'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function CalibrationCallWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const session = server.calibrationCall?.session
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!session?.scheduled_at) return
    const scheduled = new Date(session.scheduled_at).getTime()
    const update = () => {
      const diff = Math.max(0, scheduled - Date.now())
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      })
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [session?.scheduled_at])

  if (!session) return null

  const tz = server.userTimezone ?? undefined
  const dateLabel = mounted && session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: tz })
    : ''
  const timeLabel = mounted && session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz, timeZoneName: 'short' })
    : ''

  const absoluteJoin = typeof window !== 'undefined' ? `${window.location.origin}${session.join_link}` : session.join_link

  const addToApple = () => {
    if (!session.scheduled_at) return
    const start = new Date(session.scheduled_at)
    const end = new Date(start.getTime() + 45 * 60 * 1000)
    const title = session.title || 'Calibration Call'
    const desc = `Your 1-on-1 vision calibration session. Join: ${absoluteJoin}`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vibration Fit//Calibration Call//EN',
      'BEGIN:VEVENT',
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${title.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
      `DESCRIPTION:${desc.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
      `URL:${absoluteJoin}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'Calibration-Call.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const googleUrl = session.scheduled_at
    ? (() => {
        const start = new Date(session.scheduled_at)
        const end = new Date(start.getTime() + 45 * 60 * 1000)
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title || 'Calibration Call')}&dates=${icsDate(start)}/${icsDate(end)}&details=${encodeURIComponent(`Your 1-on-1 vision calibration session. Join: ${absoluteJoin}`)}`
      })()
    : null

  const hasCountdown = countdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0)

  return (
    <WidgetFrame {...chrome} title="Calibration Call" icon={Video} accent="#00FFFF">
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-neutral-400">Your 1-on-1 vision calibration session</p>
          {session.scheduled_at ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-200">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-secondary-500" />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-secondary-500" />
                {timeLabel}
              </span>
            </div>
          ) : null}
          {hasCountdown ? (
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
              {[
                [countdown.days, 'd'],
                [countdown.hours, 'h'],
                [countdown.minutes, 'm'],
              ].map(([v, u]) => (
                <span key={u} className="rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-2 py-1 text-secondary-500">
                  <span className="font-bold">{v}</span>
                  {u}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:items-end">
          <Button variant="primary" size="sm" asChild>
            <Link href={session.join_link}>
              <Video className="mr-1.5 h-4 w-4" />
              {session.id ? 'Join call' : 'View details'}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <button type="button" onClick={addToApple} className="inline-flex items-center gap-1 text-secondary-500 underline-offset-2 hover:underline">
              <Apple className="h-3.5 w-3.5" />
              Apple Calendar
            </button>
            {googleUrl ? (
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary-500 underline-offset-2 hover:underline">
                <Calendar className="h-3.5 w-3.5" />
                Google Calendar
              </a>
            ) : null}
          </div>
          <p className="text-[11px] text-neutral-500">Join up to 10 minutes early.</p>
        </div>
      </div>
    </WidgetFrame>
  )
}
