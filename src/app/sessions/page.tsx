'use client'

/**
 * Member Sessions Page
 * 
 * Shows video sessions the member is invited to or has attended.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Video, 
  Calendar,
  Clock,
  CheckCircle,
  Play
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

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
}

export default function MemberSessionsPage() {
  const router = useRouter()
  
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Separate upcoming and past sessions
  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' || s.status === 'waiting' || s.status === 'live'
  ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  
  const pastSessions = sessions.filter(s => 
    s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show'
  ).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  // Get next session
  const nextSession = upcomingSessions[0]

  // Status colors
  const statusColors: Record<string, string> = {
    scheduled: 'text-blue-400',
    waiting: 'text-yellow-400',
    live: 'text-green-400',
    completed: 'text-neutral-400',
    cancelled: 'text-red-400',
    no_show: 'text-orange-400',
  }

  // Loading state
  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
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

        {/* Error State */}
        {error && (
          <Card className="p-4 md:p-6 lg:p-8 bg-red-500/10 border-red-500/30 text-center">
            <p className="text-red-400 text-sm md:text-base">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchSessions} className="mt-4">
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!error && sessions.length === 0 && (
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
                <span>
                  {new Date(nextSession.scheduled_at).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Clock className="w-4 h-4 text-primary-500" />
                <span>
                  {new Date(nextSession.scheduled_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
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
                const scheduledDate = new Date(session.scheduled_at)
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
                        {scheduledDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })} at {scheduledDate.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
              {pastSessions.map(session => {
                const scheduledDate = new Date(session.scheduled_at)
                
                return (
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
                        {scheduledDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
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
                        onClick={() => window.open(session.recording_url!, '_blank')}
                      >
                        <Video className="w-3 h-3 mr-1" />
                        Recording
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
