/**
 * Alignment Gym session helpers shared by the gym page and Tribe:
 * "In 3 days" style labels and Add to Apple / Google Calendar.
 */

export interface GymCalendarSession {
  id: string
  title?: string | null
  scheduled_at: string
  scheduled_duration_minutes?: number | null
}

export function gymRelativeTime(dateStr: string, now: Date = new Date()): string {
  const diffMs = new Date(dateStr).getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffMins < 0) return 'Starting soon'
  if (diffMins < 60) return `In ${diffMins} minutes`
  if (diffHours < 24) return `In ${diffHours} hours`
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays} days`
}

const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

function sessionWindow(session: GymCalendarSession) {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + (session.scheduled_duration_minutes || 60) * 60 * 1000)
  const joinLink = `${window.location.origin}/session/${session.id}`
  return { start, end, joinLink, title: session.title || 'The Alignment Gym' }
}

/** Downloads an .ics file the member's calendar app opens. */
export function addGymSessionToAppleCalendar(session: GymCalendarSession) {
  const { start, end, joinLink, title } = sessionWindow(session)
  const desc = `Weekly group coaching session. Join: ${joinLink}`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vibration Fit//Alignment Gym//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${title.replace(/,/g, '\\,').replace(/;/g, '\;')}`,
    `DESCRIPTION:${desc.replace(/,/g, '\\,').replace(/;/g, '\;').replace(/\n/g, '\\n')}`,
    `URL:${joinLink}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Alignment-Gym.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrlForGymSession(session: GymCalendarSession): string {
  const { start, end, joinLink, title } = sessionWindow(session)
  const details = encodeURIComponent(`Weekly group coaching session. Join: ${joinLink}`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatICSDate(start)}/${formatICSDate(end)}&details=${details}`
}
