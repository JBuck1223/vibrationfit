'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle, Clock, Globe2 } from 'lucide-react'
import {
  Button,
  Card,
  Checkbox,
  Container,
  Input,
  Select,
  Spinner,
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const TIMEZONE_OPTIONS = [
  { value: 'PT', label: 'Pacific (PT)' },
  { value: 'MT', label: 'Mountain (MT)' },
  { value: 'CT', label: 'Central (CT)' },
  { value: 'ET', label: 'Eastern (ET)' },
  { value: 'GMT', label: 'GMT' },
  { value: 'AEST', label: 'Australian Eastern (AEST)' },
  { value: 'OTHER', label: 'Other (describe below)' },
] as const

const WEEKDAYS = [
  { id: 'Monday', label: 'Monday' },
  { id: 'Tuesday', label: 'Tuesday' },
  { id: 'Wednesday', label: 'Wednesday' },
  { id: 'Thursday', label: 'Thursday' },
  { id: 'Friday', label: 'Friday' },
] as const

const START_TIMES = ['8:00 am', '11:00 am', '5:00 pm', '6:30 pm', '7:00 pm', '8:00 pm'] as const

/** Column-major on md+: col 1 fixed width so Q2 and Q3 second columns line up when stacked. */
const weekdayCheckboxGridClass =
  'grid grid-cols-1 gap-y-2 pt-1 text-left md:w-max md:grid-flow-col md:grid-rows-3 md:grid-cols-[12.5rem_max-content] md:gap-x-6 md:gap-y-2 md:justify-items-start'

/** Two columns on mobile (3 rows); same md+ template as weekdays for column 2 alignment. */
const timeCheckboxGridClass =
  'grid grid-flow-col grid-rows-3 grid-cols-2 gap-x-3 gap-y-2 pt-1 text-left justify-items-start w-max max-w-full md:w-max md:grid-cols-[12.5rem_max-content] md:gap-x-6 md:gap-y-2'

export default function AlignmentGymSchedulingSurveyPage() {
  const supabase = useMemo(() => createClient(), [])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [emailHydrating, setEmailHydrating] = useState(true)

  const [guestEmail, setGuestEmail] = useState('')
  const [timezone, setTimezone] = useState<string>('')
  const [timezoneOther, setTimezoneOther] = useState('')
  const [weekdays, setWeekdays] = useState<Record<string, boolean>>({})
  const [startTimes, setStartTimes] = useState<Record<string, boolean>>({})
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        const user = session?.user
        if (!user) {
          setIsLoggedIn(false)
          return
        }
        setIsLoggedIn(true)
        const { data: account } = await supabase
          .from('user_accounts')
          .select('email')
          .eq('id', user.id)
          .maybeSingle()
        if (cancelled) return
        const e = (account?.email as string | undefined)?.trim() || user.email?.trim() || ''
        if (e) setGuestEmail(e)
      } catch (err) {
        console.error('[survey/alignment-gym] hydrate user', err)
      } finally {
        if (!cancelled) setEmailHydrating(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  function toggleWeekday(id: string, checked: boolean) {
    setWeekdays((prev) => ({ ...prev, [id]: checked }))
  }

  function toggleStartTime(id: string, checked: boolean) {
    setStartTimes((prev) => ({ ...prev, [id]: checked }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const selectedDays = WEEKDAYS.filter((d) => weekdays[d.id]).map((d) => d.id)
    const selectedTimes = START_TIMES.filter((t) => startTimes[t])

    if (!timezone) {
      toast.error('Choose your time zone')
      return
    }
    if (timezone === 'OTHER' && !timezoneOther.trim()) {
      toast.error('Add your time zone')
      return
    }
    if (selectedDays.length === 0) {
      toast.error('Select at least one weekday')
      return
    }
    if (selectedTimes.length === 0) {
      toast.error('Select at least one start time')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/alignment-gym/schedule-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_email: guestEmail.trim() || undefined,
          timezone,
          timezone_other: timezoneOther.trim() || undefined,
          weekdays: selectedDays,
          start_times: selectedTimes,
          website: honeypot,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Something went wrong')
      }
      setSubmitted(true)
      toast.success('Thank you — your preferences are saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Container size="md" className="pt-6 pb-10 md:pt-8 md:pb-12">
        <Card className="p-6 md:p-8 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-500" aria-hidden />
            </div>
          </div>
          <h1 className="text-lg md:text-xl font-semibold text-white">Thank you</h1>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Your reply helps us choose the new Alignment Gym time so we can have your energy in the room with us.
          </p>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="md" className="pt-4 pb-10 md:pt-5 md:pb-12">
      <div className="mb-6 text-center max-w-2xl mx-auto">
        <h1 className="text-lg md:text-xl font-semibold text-white">Alignment Gym scheduling</h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          We are upgrading Alignment Gym into a weekly Life Operating System workout and want to pick a day and time most members can attend live. Please share your preferences below.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="hidden" aria-hidden>
            <label htmlFor="survey-website">Website</label>
            <input
              id="survey-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="sr-only"
            />
          </div>

          <div>
            <label htmlFor="survey-email" className="block text-sm font-medium text-neutral-200 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="survey-email"
                type="email"
                required
                readOnly={isLoggedIn}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@email.com"
                className={isLoggedIn ? 'opacity-80' : undefined}
              />
              {emailHydrating && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden
                >
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              {isLoggedIn
                ? 'Using your account email on file.'
                : 'Required so we can match your reply to your account.'}
            </p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-100">
              <Globe2 className="w-5 h-5 text-secondary-500 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">1. Your time zone</h2>
            </div>
            <p className="text-sm text-neutral-400">
              Examples: PT, MT, CT, ET, GMT, AEST — or choose Other and describe yours.
            </p>
            <Select
              value={timezone}
              onChange={(v) => setTimezone(v)}
              options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              placeholder="Select time zone"
            />
            {timezone === 'OTHER' && (
              <Input
                value={timezoneOther}
                onChange={(e) => setTimezoneOther(e.target.value)}
                placeholder="Your time zone or city"
                className="mt-2"
              />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center max-sm:items-start gap-2 text-neutral-100">
              <CalendarClock className="w-5 h-5 text-secondary-500 shrink-0 max-sm:mt-0.5" aria-hidden />
              <h2 className="text-base font-semibold">2. Weekdays for a 60-minute live session</h2>
            </div>
            <p className="text-sm text-neutral-400">Select all weekdays that usually work for you.</p>
            <div className={weekdayCheckboxGridClass}>
              {WEEKDAYS.map((d) => (
                <Checkbox
                  key={d.id}
                  label={d.label}
                  checked={!!weekdays[d.id]}
                  onCheckedChange={(checked) => toggleWeekday(d.id, checked)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-100">
              <Clock className="w-5 h-5 text-secondary-500 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">3. Start times in your time zone</h2>
            </div>
            <p className="text-sm text-neutral-400">You can pick more than one.</p>
            <div className={timeCheckboxGridClass}>
              {START_TIMES.map((t) => (
                <Checkbox
                  key={t}
                  label={t}
                  checked={!!startTimes[t]}
                  onCheckedChange={(checked) => toggleStartTime(t, checked)}
                />
              ))}
            </div>
          </section>

          <div className="flex justify-center pt-2">
            <Button type="submit" variant="primary" disabled={submitting} className="min-w-[8rem]">
              {submitting ? 'Sending…' : 'Submit'}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  )
}
