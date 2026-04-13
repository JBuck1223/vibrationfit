'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Play,
  CheckCircle,
} from 'lucide-react'
import Markdown from 'react-markdown'
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
import { SessionNotes } from '@/components/video/SessionNotes'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'
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
  const [recapOpen, setRecapOpen] = useState(false)

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
  const userAttended = session.participants?.some(
    p => p.user_id === userId && p.attended
  )
  const hasReplay =
    session.status === 'completed' && Boolean(session.recording_url)
  const isLive = session.status === 'live'
  const canJoin = isSessionJoinable(session) || isLive
  const skip = session.recording_playback_start_seconds ?? 0
  const hasSummaryContent = Boolean(session.session_summary?.trim())

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE ALIGNMENT GYM"
          title="Session Replay"
          subtitle={scheduledDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        >
          {hasReplay && session.recording_url && (
            <div className="mx-auto w-full max-w-3xl">
              {skip > 0 && (
                <p className="text-sm text-neutral-500 mb-3 text-center">
                  Playback starts {formatDuration(skip)} in to skip pre-session setup.
                </p>
              )}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
                <SessionReplayVideo
                  src={session.recording_url}
                  playbackStartSeconds={skip}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
          {!hasReplay && session.status === 'completed' && (
            <p className="text-neutral-400 text-sm text-center">
              This session is complete but a replay is not available yet. Check back later.
            </p>
          )}
          {session.actual_duration_seconds && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              {formatDuration(session.actual_duration_seconds)}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
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
          </div>
        </PageHero>

        {hasSummaryContent && (
          <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] overflow-hidden transition-all duration-300 hover:border-[#444]">
            <button
              type="button"
              onClick={() => setRecapOpen(o => !o)}
              aria-expanded={recapOpen}
              className="w-full flex items-center justify-between gap-4 py-6 md:p-8 px-6 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-[#39FF14] shrink-0" />
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Replay Recap
                </h2>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${recapOpen ? 'bg-[#39FF14]/20' : 'bg-neutral-700/50 group-hover:bg-neutral-700'}`}>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${recapOpen ? 'rotate-180 text-[#39FF14]' : 'text-neutral-400'}`}
                />
              </div>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${recapOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                  <Markdown
                    components={{
                      h1: () => null,
                      h2: ({ children }) => (
                        <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4 first:mt-0 border-l-2 border-[#39FF14] pl-4">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-white mt-8 mb-3">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-4 last:mb-0">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">{children}</strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[#00FFFF]/40 pl-4 md:pl-6 my-6 italic text-neutral-400">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-2.5 my-4">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex gap-3 text-sm md:text-base text-neutral-200 leading-relaxed">
                          <CheckCircle className="w-4 h-4 text-[#39FF14] shrink-0 mt-1" />
                          <span>{children}</span>
                        </li>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00FFFF] hover:text-[#00FFFF]/80 underline underline-offset-2 transition-colors duration-300"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {session.session_summary}
                  </Markdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {session.host_notes?.trim() && (
          <Card className="p-6 border-neutral-700">
            <h2 className="text-base font-semibold text-white mb-3">Coach notes</h2>
            <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {session.host_notes}
            </p>
          </Card>
        )}

        {!hasSummaryContent && !session.host_notes?.trim() && hasReplay && (
          <Card className="p-6 border-neutral-700 bg-neutral-900/30">
            <p className="text-sm text-neutral-500">
              Session recap and highlights can be added to this session and will show here for quick review.
            </p>
          </Card>
        )}

        {/* Personal Notes (private) */}
        {userId && (
          <Card className="p-6 border-neutral-700">
            <SessionNotes sessionId={sessionId} />
          </Card>
        )}

      </Stack>
    </Container>
  )
}
