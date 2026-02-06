'use client'

/**
 * Alignment Gym Page
 * 
 * Weekly live group coaching sessions for VibrationFit graduates.
 * Members can join the next live session or watch replays of past sessions.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Video, 
  Calendar,
  Clock,
  Play,
  Users,
  Trophy,
  Sparkles,
  CheckCircle,
  PlayCircle
} from 'lucide-react'
import { 
  PageHero, 
  Container, 
  Stack,
  Button, 
  Card,
  Spinner,
  Badge,
  TrackingMilestoneCard
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { isSessionJoinable, formatDuration } from '@/lib/video/types'

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
  participant_count?: number
}

interface AttendanceStats {
  totalAttended: number
  currentStreak: number
}

export default function AlignmentGymPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ totalAttended: 0, currentStreak: 0 })

  // Fetch Alignment Gym sessions (group sessions)
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      // Fetch group sessions (Alignment Gym sessions)
      // These are sessions where session_type = 'group' or title contains 'Alignment Gym'
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('video_sessions')
        .select(`
          *,
          participants:video_session_participants(*)
        `)
        .or('session_type.eq.group,title.ilike.%alignment gym%')
        .order('scheduled_at', { ascending: false })

      if (sessionsError) {
        throw new Error(sessionsError.message)
      }

      // Calculate participant counts
      const sessionsWithCounts = (sessionsData || []).map(session => ({
        ...session,
        participant_count: session.participants?.filter((p: VideoSessionParticipant) => p.attended).length || 0
      }))

      setSessions(sessionsWithCounts)

      // Calculate attendance stats for current user
      const attendedSessions = sessionsWithCounts.filter(session => 
        session.participants?.some((p: VideoSessionParticipant) => 
          p.user_id === user.id && p.attended
        )
      )
      
      setAttendanceStats({
        totalAttended: attendedSessions.length,
        currentStreak: calculateStreak(attendedSessions)
      })

    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  // Calculate attendance streak
  const calculateStreak = (attendedSessions: SessionWithParticipants[]): number => {
    if (attendedSessions.length === 0) return 0
    
    // Sort by date descending
    const sorted = [...attendedSessions].sort((a, b) => 
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )
    
    let streak = 0
    const oneWeek = 7 * 24 * 60 * 60 * 1000 // ms in a week
    let lastDate = new Date()
    
    for (const session of sorted) {
      const sessionDate = new Date(session.scheduled_at)
      const gap = lastDate.getTime() - sessionDate.getTime()
      
      // If gap is more than ~2 weeks, streak breaks
      if (gap > oneWeek * 2) break
      
      streak++
      lastDate = sessionDate
    }
    
    return streak
  }

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Separate upcoming and past sessions
  const now = new Date()
  const upcomingSessions = sessions.filter(s => 
    (s.status === 'scheduled' || s.status === 'waiting' || s.status === 'live') &&
    new Date(s.scheduled_at) >= new Date(now.getTime() - 2 * 60 * 60 * 1000) // Include sessions from 2 hours ago
  ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  
  const pastSessions = sessions.filter(s => 
    s.status === 'completed' && s.recording_url
  ).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  // Get next session
  const nextSession = upcomingSessions[0]
  const isLive = nextSession?.status === 'live'
  const canJoin = nextSession && (isLive || isSessionJoinable(nextSession))

  // Format relative time
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 0) return 'Starting soon'
    if (diffMins < 60) return `In ${diffMins} minutes`
    if (diffHours < 24) return `In ${diffHours} hours`
    if (diffDays === 1) return 'Tomorrow'
    return `In ${diffDays} days`
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
          eyebrow="GRADUATE UNLOCKS"
          title="The Alignment Gym"
          subtitle="Weekly live group coaching to keep you calibrated and moving toward your vision"
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrackingMilestoneCard
            label="Sessions Attended"
            mobileLabel="Attended"
            value={attendanceStats.totalAttended}
            theme="primary"
            icon={<Trophy className="w-6 h-6" />}
          />

          <TrackingMilestoneCard
            label="Week Streak"
            mobileLabel="Streak"
            value={attendanceStats.currentStreak}
            theme="secondary"
            icon={<Sparkles className="w-6 h-6" />}
          />

          <TrackingMilestoneCard
            label="Replays Available"
            mobileLabel="Replays"
            value={pastSessions.length}
            theme="neutral"
            icon={<Video className="w-6 h-6" />}
          />
        </div>

        {/* What is Alignment Gym */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-neutral-900 to-neutral-800/50">
          <h3 className="text-lg md:text-xl font-bold text-white mb-8 text-center">
            What is The Alignment Gym?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Weekly Group Coaching</h4>
                <p className="text-sm text-neutral-400">
                  Live sessions with your guide and fellow graduates. Practice tools, get feedback, and stay calibrated.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Ask Anything</h4>
                <p className="text-sm text-neutral-400">
                  Bring your questions, challenges, or wins. Get real-time guidance on applying conscious creation to your life.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Build Your Streak</h4>
                <p className="text-sm text-neutral-400">
                  Attend regularly to maintain momentum and earn badges for 3, 12, and 50+ sessions.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-4 md:p-6 lg:p-8 bg-red-500/10 border-red-500/30 text-center">
            <p className="text-red-400 text-sm md:text-base">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchSessions} className="mt-4">
              Try Again
            </Button>
          </Card>
        )}

        {/* Next Session Highlight */}
        {nextSession ? (
          <Card className={`p-6 md:p-8 ${isLive 
            ? 'bg-gradient-to-br from-green-500/20 to-primary-500/10 border-green-500/40' 
            : 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant={isLive ? 'success' : 'premium'} className={`mb-2 ${isLive ? 'animate-pulse' : ''}`}>
                  {isLive ? (
                    <><span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />Live Now</>
                  ) : (
                    getRelativeTime(nextSession.scheduled_at)
                  )}
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {nextSession.title}
                </h2>
                {nextSession.description && (
                  <p className="text-sm md:text-base text-neutral-400 mt-2">
                    {nextSession.description}
                  </p>
                )}
              </div>
              {canJoin && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push(`/session/${nextSession.id}`)}
                  className={isLive 
                    ? 'bg-gradient-to-r from-green-500 to-primary-500 animate-pulse' 
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                  }
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isLive ? 'Join Live Session' : 'Join Session'}
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
              {nextSession.participant_count && nextSession.participant_count > 0 && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>{nextSession.participant_count} attending</span>
                </div>
              )}
            </div>

            {!canJoin && (
              <p className="mt-4 text-sm text-neutral-500">
                Join link will be available 10 minutes before the session starts.
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              No Upcoming Sessions
            </h3>
            <p className="text-sm md:text-base text-neutral-400">
              The next Alignment Gym session hasn't been scheduled yet. Check back soon!
            </p>
          </Card>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 1 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <h3 className="text-base md:text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
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
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
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
                        {getRelativeTime(session.scheduled_at)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Replays Section */}
        <Card className="p-4 md:p-6 lg:p-8">
          {pastSessions.length === 0 ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-neutral-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                Session Replays
              </h3>
              <p className="text-neutral-400 text-sm">
                No replays available yet. Attend live sessions and recordings will appear here.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 text-center">
                Session Replays
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastSessions.map(session => {
                const scheduledDate = new Date(session.scheduled_at)
                const userAttended = session.participants?.some(
                  (p: VideoSessionParticipant) => p.user_id === userId && p.attended
                )
                
                return (
                  <div 
                    key={session.id} 
                    className="group p-4 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 transition-all cursor-pointer border border-neutral-800 hover:border-neutral-700"
                    onClick={() => window.open(session.recording_url!, '_blank')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-500/20 transition-colors">
                        <PlayCircle className="w-5 h-5 text-secondary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {session.title}
                          </h4>
                          {userAttended && (
                            <span title="You attended">
                              <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          {scheduledDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {session.actual_duration_seconds && (
                            <> · {formatDuration(session.actual_duration_seconds)}</>
                          )}
                          {session.participant_count && session.participant_count > 0 && (
                            <> · {session.participant_count} attended</>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(session.recording_url!, '_blank')
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              </div>
            </>
          )}
        </Card>

      </Stack>
    </Container>
  )
}
