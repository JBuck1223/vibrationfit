'use client'

/**
 * Alignment Gym Page
 * 
 * Weekly live group coaching sessions for VibrationFit graduates.
 * Members can join the next live session or watch replays of past sessions.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
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
  PlayCircle,
  HelpCircle,
  Zap,
  Flame,
  Shield,
  ChevronDown,
  Apple,
} from 'lucide-react'
import { 
  PageHero, 
  Container, 
  Stack,
  Button, 
  Card,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { useAreaStats } from '@/hooks/useAreaStats'
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
  const { stats: practiceStats } = useAreaStats('alignment-gym')
  
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ totalAttended: 0, currentStreak: 0 })
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [whatIsOpen, setWhatIsOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

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

      // Fetch Alignment Gym sessions (dedicated type + legacy group sessions)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('video_sessions')
        .select(`
          *,
          participants:video_session_participants(*)
        `)
        .or('session_type.eq.alignment_gym,session_type.eq.group,title.ilike.%alignment gym%')
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

      // Calculate attendance stats for current user (only Alignment Gym sessions)
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

    // Subscribe to session status changes (e.g. host joins → status becomes 'live')
    const channel = supabase
      .channel('alignment-gym-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_sessions',
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          setSessions(prev => prev.map(s => 
            s.id === updated.id ? { ...s, ...updated } as SessionWithParticipants : s
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSessions, supabase])

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

  // Add to Calendar helpers
  const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const handleAddToAppleCalendar = (session: SessionWithParticipants) => {
    const start = new Date(session.scheduled_at)
    const end = new Date(start.getTime() + (session.scheduled_duration_minutes || 60) * 60 * 1000)
    const title = session.title || 'The Alignment Gym'
    const joinLink = `${window.location.origin}/session/${session.id}`
    const desc = `Weekly group coaching session. Join: ${joinLink}`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VibrationFit//Alignment Gym//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
      `DESCRIPTION:${desc.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')}`,
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

  const getGoogleCalendarUrl = (session: SessionWithParticipants) => {
    const start = new Date(session.scheduled_at)
    const end = new Date(start.getTime() + (session.scheduled_duration_minutes || 60) * 60 * 1000)
    const title = encodeURIComponent(session.title || 'The Alignment Gym')
    const joinLink = `${window.location.origin}/session/${session.id}`
    const details = encodeURIComponent(`Weekly group coaching session. Join: ${joinLink}`)
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatICSDate(start)}/${formatICSDate(end)}&details=${details}`
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

        {/* Alignment Gym Stats */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#14B8A6]/[0.04] via-[#111] to-[#111]">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(20,184,166,0.08)_0%,_transparent_50%)] pointer-events-none" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <Video className="w-4 h-4 text-[#14B8A6]" />
              <h3 className="text-neutral-300 font-medium text-sm tracking-wide uppercase">Alignment Gym</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Current Streak */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Current Streak</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-lg leading-none flex items-center gap-1.5">
                    {(practiceStats?.currentStreak ?? 0) >= 1 && <Flame className="w-4 h-4 text-orange-400" />}
                    {practiceStats?.currentStreak ?? 0}
                    <span className="font-normal text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'week' : 'weeks'}</span>
                  </p>
                  {(practiceStats?.streakFreezeAvailable || practiceStats?.streakFreezeUsedThisWeek) && (
                    <div className="relative ml-auto flex items-center" ref={freezeRef}>
                      <button type="button" className="flex items-center" onClick={() => setFreezeOpen(prev => !prev)}>
                        <Shield className={`w-3.5 h-3.5 cursor-help ${practiceStats?.streakFreezeUsedThisWeek ? 'text-blue-500/40' : 'text-blue-400'}`} />
                      </button>
                      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[100] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                        <p className="text-sm font-semibold text-blue-400 mb-1">
                          Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : 'Available'})</span>
                        </p>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {practiceStats?.streakFreezeUsedThisWeek
                            ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                            : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reps this Week - always visible */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Reps this Week</p>
                <p className="text-white font-semibold text-lg leading-none">{practiceStats?.countLast7 ?? 0}<span className="font-normal text-neutral-500">/1</span></p>
              </div>

              {/* Remaining stats: always visible on sm+, toggled on mobile */}
              {[
                {
                  label: 'Reps this Month',
                  value: <>{practiceStats?.countLast30 ?? 0}<span className="font-normal text-neutral-500">/4</span></>,
                },
                { label: 'Total Attended', value: attendanceStats.totalAttended.toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 ${statsExpanded ? '' : 'hidden'} sm:block`}>
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">{stat.label}</p>
                  <p className="text-white font-semibold text-lg leading-none">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setStatsExpanded(prev => !prev)}
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors sm:hidden"
            >
              {statsExpanded ? 'Show less' : 'View all stats'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* What is Alignment Gym - collapsible */}
        <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] overflow-hidden transition-all duration-300 hover:border-[#444]">
          <button
            type="button"
            onClick={() => setWhatIsOpen(o => !o)}
            aria-expanded={whatIsOpen}
            className="w-full flex items-center justify-between gap-4 py-6 md:p-8 px-6 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-[#39FF14] shrink-0" />
              <h3 className="text-lg md:text-xl font-bold text-white">
                What's The Alignment Gym?
              </h3>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${whatIsOpen ? 'bg-[#39FF14]/20' : 'bg-neutral-700/50 group-hover:bg-neutral-700'}`}>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${whatIsOpen ? 'rotate-180 text-[#39FF14]' : 'text-neutral-400'}`} />
            </div>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${whatIsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card variant="outlined" className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0 mb-4">
                      <Users className="w-6 h-6 text-primary-500" />
                    </div>
                    <h4 className="font-medium text-white mb-2">Weekly Group Coaching</h4>
                    <p className="text-sm text-neutral-400">
                      Live sessions with your guide and fellow graduates. Practice tools, get feedback, and stay calibrated.
                    </p>
                  </Card>
                  <Card variant="outlined" className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center flex-shrink-0 mb-4">
                      <HelpCircle className="w-6 h-6 text-secondary-500" />
                    </div>
                    <h4 className="font-medium text-white mb-2">Ask Anything</h4>
                    <p className="text-sm text-neutral-400">
                      Bring your questions, challenges, or wins. Get real-time guidance on applying conscious creation to your life.
                    </p>
                  </Card>
                  <Card variant="outlined" className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0 mb-4">
                      <Zap className="w-6 h-6 text-accent-500" />
                    </div>
                    <h4 className="font-medium text-white mb-2">Build Your Streak</h4>
                    <p className="text-sm text-neutral-400">
                      Attend regularly to maintain momentum and earn badges for 3, 12, and 50+ sessions.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

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
          <Card 
            className={`p-6 md:p-8 cursor-pointer transition-all hover:scale-[1.01] ${isLive 
              ? 'bg-gradient-to-br from-green-500/20 to-primary-500/10 border-green-500/40' 
              : 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30'
            }`}
            onClick={() => router.push(`/session/${nextSession.id}`)}
          >
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-4">
              <div className="flex-1 min-w-0">
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

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm mt-4">
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

              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/session/${nextSession.id}`)
                  }}
                  className={isLive ? 'animate-pulse' : ''}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isLive ? 'Join Live Session' : 'Join Session'}
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAddToAppleCalendar(nextSession) }}
                    className="inline-flex items-center gap-1.5 text-[#00FFFF] hover:text-[#00FFFF]/80 underline underline-offset-2"
                  >
                    <Apple className="w-4 h-4 flex-shrink-0" />
                    Apple
                  </button>
                  <span className="text-neutral-500">or</span>
                  <a
                    href={getGoogleCalendarUrl(nextSession)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[#00FFFF] hover:text-[#00FFFF]/80 underline underline-offset-2"
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    Google
                  </a>
                </div>
              </div>
            </div>
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
              <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
                {pastSessions.map(session => {
                  const scheduledDate = new Date(session.scheduled_at)
                  const dayNum = scheduledDate.getDate()
                  const monthStr = scheduledDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  const weekday = scheduledDate.toLocaleDateString('en-US', { weekday: 'short' })
                  const userAttended = session.participants?.some(
                    (p: VideoSessionParticipant) => p.user_id === userId && p.attended
                  )

                  return (
                    <div
                      key={session.id}
                      className="cursor-pointer hover:bg-white/[0.03] transition-colors group"
                      onClick={() => router.push(`/alignment-gym/${session.id}`)}
                    >
                      <div className="px-4 py-3.5 md:px-5 md:py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-11 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{weekday}</p>
                            <p className="text-xl font-semibold text-white leading-tight">{dayNum}</p>
                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{monthStr}</p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate mb-0.5">
                              {session.title || 'Alignment Gym'}
                            </p>
                            <p className="text-[13px] text-neutral-400 leading-relaxed truncate">
                              {session.actual_duration_seconds
                                ? formatDuration(session.actual_duration_seconds)
                                : `${session.scheduled_duration_minutes} min`}
                              {session.description ? ` · ${session.description}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {userAttended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/15 text-[10px] font-semibold text-primary-500 tracking-wide uppercase">
                                <CheckCircle className="w-3 h-3" />
                                Attended
                              </span>
                            )}
                            <PlayCircle className="w-5 h-5 text-neutral-600 group-hover:text-primary-500 transition-colors" />
                          </div>
                        </div>
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
