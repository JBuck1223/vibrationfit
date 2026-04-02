'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  ListChecks,
  Play,
  Users,
  Video,
  CheckCircle,
} from 'lucide-react'
import {
  Container,
  Stack,
  PageHero,
  Button,
  Card,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { SessionReplayVideo } from '@/components/video/SessionReplayVideo'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'
import { parseSessionSummary } from '@/lib/video/session-summary'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { formatDuration, isSessionJoinable } from '@/lib/video/types'
import { createClient } from '@/lib/supabase/client'

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
}

type NullableSession = SessionWithParticipants | null

export default function AlignmentGymSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<NullableSession>(null)
  const [userId, setUserId] = useState(null as string | null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null as string | null)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/video/sessions/${sessionId}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not load session')
      }
      const s = data.session as SessionWithParticipants
      if (!isAlignmentGymDirectorySession(s)) {
        setError('This session is not part of the Alignment Gym.')
        setSession(null)
        return
      }
      setSession(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load session')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) fetchSession()
  }, [sessionId, fetchSession])

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error || !session) {
    return (
      <Container size="lg">
        <Stack gap="lg" className="py-10 md:py-14">
          <PageHero
            eyebrow="ALIGNMENT GYM"
            title="Session unavailable"
            subtitle={error || 'We could not load this session.'}
          >
            <Button variant="ghost" size="sm" onClick={() => router.push('/alignment-gym')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Alignment Gym
            </Button>
          </PageHero>
        </Stack>
      </Container>
    )
  }

  const scheduledDate = new Date(session.scheduled_at)
  const attendedCount =
    session.participants?.filter(p => p.attended).length ?? 0
  const userAttended = session.participants?.some(
    p => p.user_id === userId && p.attended
  )
  const hasReplay =
    session.status === 'completed' && Boolean(session.recording_url)
  const isLive = session.status === 'live'
  const canJoin = isSessionJoinable(session) || isLive
  const skip = session.recording_playback_start_seconds ?? 0
  const { intro, bullets } = parseSessionSummary(session.session_summary)
  const hasSummaryContent = Boolean(intro) || bullets.length > 0

  return (
    <Container size="xl">
      <Stack gap="lg" className="py-8 md:py-12">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/alignment-gym')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Alignment Gym
          </Button>
          {userAttended && (
            <Badge variant="success" className="text-xs">
              You attended
            </Badge>
          )}
          {isLive && (
            <Badge variant="success" className="text-xs animate-pulse">
              Live now
            </Badge>
          )}
        </div>

        <PageHero
          eyebrow="ALIGNMENT GYM SESSION"
          title={session.title}
          subtitle={
            session.description?.trim()
              ? session.description
              : `Recorded live session${hasReplay ? ' — replay below.' : '.'}`
          }
        >
          <div className="flex flex-wrap gap-2">
            {canJoin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/session/${session.id}`)}
              >
                <Play className="w-4 h-4 mr-2" />
                {isLive ? 'Join live' : 'Open session room'}
              </Button>
            )}
            {hasReplay && session.recording_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(session.recording_url!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open video file
              </Button>
            )}
          </div>
        </PageHero>

        <div className="flex flex-wrap gap-6 text-sm text-neutral-400">
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
            {scheduledDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500 shrink-0" />
            {scheduledDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            <span className="text-neutral-500">
              ({session.scheduled_duration_minutes} min planned
              {session.actual_duration_seconds
                ? ` · ${formatDuration(session.actual_duration_seconds)} actual`
                : ''}
              )
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500 shrink-0" />
            {attendedCount} attended
          </span>
        </div>

        {hasReplay && session.recording_url && (
          <Card className="p-4 md:p-6 overflow-hidden border-neutral-700 bg-neutral-950">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-secondary-500" />
              <h2 className="text-lg font-semibold text-white">Replay</h2>
            </div>
            {skip > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                Playback starts {formatDuration(skip)} in. Use &quot;Open video file&quot; above if you need the full recording from the start.
              </p>
            )}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
              <SessionReplayVideo
                src={session.recording_url}
                playbackStartSeconds={skip}
                className="w-full h-full"
              />
            </div>
          </Card>
        )}

        {!hasReplay && session.status === 'completed' && (
          <Card className="p-6 border-neutral-700 bg-neutral-900/40">
            <p className="text-neutral-400 text-sm">
              This session is complete but a replay is not available yet. Check back later.
            </p>
          </Card>
        )}

        {(hasSummaryContent || session.host_notes?.trim()) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hasSummaryContent && (
              <Card className="p-6 md:p-8 lg:col-span-2 border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-white">Session recap</h2>
                </div>
                {intro ? (
                  <p className="text-neutral-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap mb-6">
                    {intro}
                  </p>
                ) : null}
                {bullets.length > 0 ? (
                  <ul className="space-y-3">
                    {bullets.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm md:text-base text-neutral-200 leading-relaxed"
                      >
                        <CheckCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : !intro ? (
                  <p className="text-neutral-500 text-sm">
                    A recap will appear here when it is added to this session.
                  </p>
                ) : null}
              </Card>
            )}

            {session.host_notes?.trim() && (
              <Card className="p-6 border-neutral-700">
                <h2 className="text-base font-semibold text-white mb-3">Coach notes</h2>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
                  {session.host_notes}
                </p>
              </Card>
            )}
          </div>
        )}

        {!hasSummaryContent && !session.host_notes?.trim() && hasReplay && (
          <Card className="p-6 border-neutral-700 bg-neutral-900/30">
            <p className="text-sm text-neutral-500">
              Session recap and highlights can be added to this session and will show here for quick review.
            </p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
