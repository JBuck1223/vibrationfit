'use client'

/**
 * Member Sessions Page
 * 
 * Shows video sessions the member is invited to or has attended,
 * plus any pending booking requests awaiting confirmation.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Video, 
  Calendar,
  Clock,
  CheckCircle,
  Play,
  Loader2,
} from 'lucide-react'
import { 
  PageHero, 
  Container, 
  Stack,
  Button, 
  Card,
  Spinner,
  Badge
} from '@/lib/design-system/components'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { getSessionStatusLabel, isSessionJoinable, formatDuration } from '@/lib/video/types'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
}

interface PendingBooking {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: string
}

function formatDateLong(dateString: string, tz: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
  })
}

function formatDateShort(dateString: string, tz: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  })
}

function formatTime(dateString: string, tz: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz,
    timeZoneName: 'short',
  })
}

export default function MemberSessionsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [sessionsRes, bookingsRes, accountRes] = await Promise.all([
        fetch('/api/video/sessions'),
        supabase
          .from('bookings')
          .select('id, title, scheduled_at, duration_minutes, status')
          .in('status', ['pending', 'confirmed'])
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('user_accounts')
          .select('timezone')
          .single(),
      ])

      if (accountRes.data?.timezone) {
        setTz(accountRes.data.timezone)
      }

      const sessionsData = await sessionsRes.json()
      if (!sessionsRes.ok) {
        throw new Error(sessionsData.error || 'Failed to fetch sessions')
      }
      setSessions(sessionsData.sessions || [])

      if (!bookingsRes.error) {
        const confirmedSessionIds = new Set(
          (sessionsData.sessions || []).map((s: SessionWithParticipants) => s.id)
        )
        const bookingsWithoutSessions = (bookingsRes.data || []).filter(
          (b: PendingBooking) => b.status === 'pending'
        )
        setPendingBookings(bookingsWithoutSessions)
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' || s.status === 'waiting' || s.status === 'live'
  ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  
  const pastSessions = sessions.filter(s => 
    s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show'
  ).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const nextSession = upcomingSessions[0]

  const statusColors: Record<string, string> = {
    scheduled: 'text-blue-400',
    waiting: 'text-yellow-400',
    live: 'text-green-400',
    completed: 'text-neutral-400',
    cancelled: 'text-red-400',
    no_show: 'text-orange-400',
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const hasContent = sessions.length > 0 || pendingBookings.length > 0

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="My Sessions"
          subtitle="Your scheduled coaching sessions with your guide"
        >
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => router.push('/intensive/schedule-call')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule a Call
          </Button>
        </PageHero>

        {error && (
          <Card className="p-4 md:p-6 lg:p-8 bg-red-500/10 border-red-500/30 text-center">
            <p className="text-red-400 text-sm md:text-base">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchData} className="mt-4">
              Try Again
            </Button>
          </Card>
        )}

        {!error && !hasContent && (
          <Card className="p-6 md:p-8 lg:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg md:text-xl font-medium text-white mb-2">
              No Sessions Yet
            </h3>
            <p className="text-sm md:text-base text-neutral-400 mb-6">
              You don&apos;t have any scheduled sessions. Check the Activation Intensive to schedule your calibration call.
            </p>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => router.push('/intensive/schedule-call')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule a Call
            </Button>
          </Card>
        )}

        {/* Pending Booking Requests */}
        {pendingBookings.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8 border-yellow-500/30 bg-yellow-500/5">
            <h3 className="text-base md:text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-yellow-400" />
              Pending Requests
            </h3>
            <div className="space-y-3">
              {pendingBookings.map(booking => (
                <div 
                  key={booking.id} 
                  className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm md:text-base text-white font-medium truncate">
                      {booking.title}
                    </h4>
                    <p className="text-xs md:text-sm text-neutral-400">
                      {formatDateShort(booking.scheduled_at, tz)} at {formatTime(booking.scheduled_at, tz)}
                    </p>
                  </div>
                  <Badge variant="warning" className="text-xs flex-shrink-0">
                    Awaiting Confirmation
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Your coach will confirm your session and you&apos;ll receive details to join.
            </p>
          </Card>
        )}

        {/* Next Session Highlight */}
        {nextSession && (
          <Card className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant="premium" className="mb-2">
                  {nextSession.status === 'live' ? 'Live Now' : 'Up Next'}
                </Badge>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {nextSession.title}
                </h2>
              </div>
              {(isSessionJoinable(nextSession) || nextSession.status === 'live') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/session/${nextSession.id}`)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-neutral-300">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>{formatDateLong(nextSession.scheduled_at, tz)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Clock className="w-4 h-4 text-primary-500" />
                <span>{formatTime(nextSession.scheduled_at, tz)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Video className="w-4 h-4 text-primary-500" />
                <span>{nextSession.scheduled_duration_minutes} minutes</span>
              </div>
            </div>

            {nextSession.description && (
              <p className="mt-4 text-neutral-400 text-sm md:text-base">
                {nextSession.description}
              </p>
            )}
          </Card>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 1 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <h3 className="text-base md:text-lg font-medium text-white mb-4">
              Upcoming Sessions
            </h3>
            <div className="space-y-3">
              {upcomingSessions.slice(1).map(session => {
                const joinable = isSessionJoinable(session)
                
                return (
                  <div 
                    key={session.id} 
                    className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base text-white font-medium truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs md:text-sm text-neutral-500">
                        {formatDateShort(session.scheduled_at, tz)} at {formatTime(session.scheduled_at, tz)}
                      </p>
                    </div>
                    {joinable ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Join
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {getSessionStatusLabel(session.status)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <h3 className="text-base md:text-lg font-medium text-white mb-4">
              Past Sessions
            </h3>
            <div className="space-y-3">
              {pastSessions.map(session => (
                <div 
                  key={session.id} 
                  className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/30"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-neutral-800/50 flex items-center justify-center flex-shrink-0">
                    {session.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    ) : (
                      <Video className="w-5 h-5 md:w-6 md:h-6 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm md:text-base text-neutral-300 font-medium truncate">
                      {session.title}
                    </h4>
                    <p className="text-xs md:text-sm text-neutral-500">
                      {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: tz,
                      })}
                      {session.actual_duration_seconds && (
                        <> · {formatDuration(session.actual_duration_seconds)}</>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs ${statusColors[session.status]}`}>
                    {getSessionStatusLabel(session.status)}
                  </span>
                  {session.recording_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          isAlignmentGymDirectorySession(session)
                            ? `/alignment-gym/${session.id}`
                            : `/session/${session.id}/recording`
                        )
                      }
                    >
                      <Video className="w-3 h-3 mr-1" />
                      Recording
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
