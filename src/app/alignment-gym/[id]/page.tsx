'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Play,
  CheckCircle,
  Eye,
  ExternalLink,
  Presentation,
  Sparkles,
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
import { SessionReplayVideo, type SessionReplayVideoHandle } from '@/components/video/SessionReplayVideo'
import { SessionNotes } from '@/components/video/SessionNotes'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { formatDuration, isSessionJoinable } from '@/lib/video/types'
import { createClient } from '@/lib/supabase/client'
import { isAlignmentGymSessionsLocked } from '@/lib/intensive/alignment-gym-access'

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
}

type NullableSession = SessionWithParticipants | null

const SESSION_SLIDE_DECKS: Record<string, { url: string; title: string }> = {
  '256cb678-d743-49f1-95a0-f4c0bf1aceff': {
    url: '/slide-decks/journey-to-conscious-allower.html',
    title: 'The Journey to Conscious Allower Slide Deck',
  },
}

interface KeyPoint {
  text: string
  timestamp_seconds: number
}

interface KeyPointsData {
  summary?: string
  key_points?: KeyPoint[]
  themes?: string[]
}

const PLACEHOLDER_PATTERNS = [
  /^2-3 sentence/i,
  /^write an actual/i,
  /^overview of the session/i,
  /^placeholder/i,
]

function isPlaceholderSummary(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text.trim()))
}

function parseKeyPoints(raw: unknown): KeyPointsData | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  if (!Array.isArray(data.key_points)) return null
  // Handle both old format (string[]) and new format (object[])
  const points = (data.key_points as unknown[]).map((p) => {
    if (typeof p === 'string') return { text: p, timestamp_seconds: 0 }
    if (typeof p === 'object' && p !== null) {
      const obj = p as Record<string, unknown>
      return {
        text: String(obj.text || ''),
        timestamp_seconds: Number(obj.timestamp_seconds) || 0,
      }
    }
    return { text: String(p), timestamp_seconds: 0 }
  })

  const rawSummary = typeof data.summary === 'string' ? data.summary : undefined
  const summary = rawSummary && !isPlaceholderSummary(rawSummary) ? rawSummary : undefined

  return {
    summary,
    key_points: points,
    themes: Array.isArray(data.themes) ? data.themes.map(String) : undefined,
  }
}

function formatTimestampLabel(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AlignmentGymSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string
  const videoRef = useRef<SessionReplayVideoHandle>(null)

  const [session, setSession] = useState<NullableSession>(null)
  const [userId, setUserId] = useState(null as string | null)
  const [sessionsLocked, setSessionsLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null as string | null)
  const [recapOpen, setRecapOpen] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [slidesOpen, setSlidesOpen] = useState(false)

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

  // Credit the replay view once playback actually starts (not on page open),
  // then reflect it in local state so the "Viewed replay" badge shows immediately.
  const handleReplayFirstPlay = useCallback(async () => {
    try {
      const { autoVerifyClient } = await import('@/lib/map/auto-verify-client')
      autoVerifyClient({ activityType: 'alignment_gym' })
    } catch {
      // best-effort MAP verify
    }
    try {
      const res = await fetch(`/api/video/sessions/${sessionId}/replay-viewed`, {
        method: 'POST',
      })
      if (!res.ok) return
      const now = new Date().toISOString()
      setSession(prev => {
        if (!prev || !userId) return prev
        const participants = prev.participants ?? []
        const existing = participants.find(p => p.user_id === userId)
        const updated = existing
          ? participants.map(p =>
              p.user_id === userId && !p.replay_viewed_at
                ? { ...p, replay_viewed_at: now }
                : p,
            )
          : [
              ...participants,
              {
                session_id: prev.id,
                user_id: userId,
                replay_viewed_at: now,
              } as VideoSessionParticipant,
            ]
        return { ...prev, participants: updated }
      })
    } catch {
      // best-effort replay tracking
    }
  }, [sessionId, userId])

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(async ({ data: { user } }) => {
        setUserId(user?.id ?? null)
        if (user) {
          const supabase = createClient()
          setSessionsLocked(await isAlignmentGymSessionsLocked(supabase, user.id))
        }
      })
  }, [])

  useEffect(() => {
    if (sessionsLocked) {
      router.replace('/alignment-gym')
    }
  }, [sessionsLocked, router])


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
  const userParticipant = session.participants?.find(
    p => p.user_id === userId
  )
  const userAttended = userParticipant?.attended ?? false
  const userViewedReplay = !userAttended && Boolean(userParticipant?.replay_viewed_at)
  const hasReplay =
    session.status === 'completed' && Boolean(session.recording_url)
  const isLive = session.status === 'live'
  const canJoin = isSessionJoinable(session) || isLive
  const skip = session.recording_playback_start_seconds ?? 0
  const hasSummaryContent = Boolean(session.session_summary?.trim())
  const hasTranscript = Boolean(session.transcript_text?.trim())
  const keyPointsData = parseKeyPoints(session.transcript_key_points)
  const hasKeyPoints = Boolean(keyPointsData?.key_points?.length)
  const slideDeck = SESSION_SLIDE_DECKS[sessionId]

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
                  ref={videoRef}
                  src={session.recording_url}
                  playbackStartSeconds={skip}
                  className="w-full h-full"
                  onFirstPlay={handleReplayFirstPlay}
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
            {userViewedReplay && (
              <Badge className="text-xs bg-[#00FFFF]/15 text-[#00FFFF] border-[#00FFFF]/30">
                <Eye className="w-3 h-3 mr-1 inline" />
                Viewed replay
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

        {(hasSummaryContent || hasKeyPoints) && (
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
                <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-6">
                  {hasSummaryContent && (
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
                  )}

                  {hasKeyPoints && keyPointsData && (
                    <div className={hasSummaryContent ? 'pt-4 border-t border-neutral-700/50' : ''}>
                      {keyPointsData.summary && (
                        <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-5">
                          {keyPointsData.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[#39FF14]" />
                        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                          Key Moments
                        </h3>
                      </div>

                      <ul className="space-y-3">
                        {keyPointsData.key_points?.map((point, i) => (
                          <li key={i} className="flex items-start gap-3 group/point">
                            {point.timestamp_seconds > 0 && hasReplay ? (
                              <button
                                onClick={() => {
                                  videoRef.current?.seekTo(point.timestamp_seconds)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#39FF14]/10 text-[#39FF14] text-xs font-mono font-medium hover:bg-[#39FF14]/20 transition-colors"
                                title="Jump to this moment"
                              >
                                {formatTimestampLabel(point.timestamp_seconds)}
                              </button>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-[#39FF14] shrink-0 mt-1" />
                            )}
                            <span className="text-sm md:text-base text-neutral-200 leading-relaxed">
                              {point.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {slideDeck && (
          <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] overflow-hidden transition-all duration-300 hover:border-[#444]">
            <button
              type="button"
              onClick={() => setSlidesOpen(o => !o)}
              aria-expanded={slidesOpen}
              className="w-full flex items-center justify-between gap-4 py-6 md:p-8 px-6 text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full bg-[#BF00FF] shrink-0" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <Presentation className="w-5 h-5 text-[#BF00FF] shrink-0" />
                  <h2 className="text-lg md:text-xl font-bold text-white truncate">
                    {slideDeck.title}
                  </h2>
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${slidesOpen ? 'bg-[#BF00FF]/20' : 'bg-neutral-700/50 group-hover:bg-neutral-700'}`}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${slidesOpen ? 'rotate-180 text-[#BF00FF]' : 'text-neutral-400'}`}
                />
              </div>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${slidesOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden min-h-0">
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                  <div
                    className="relative w-full rounded-xl overflow-hidden bg-black border border-neutral-800"
                    style={{ aspectRatio: '16 / 10' }}
                  >
                    <iframe
                      src={slideDeck.url}
                      title={slideDeck.title}
                      className="absolute inset-0 w-full h-full"
                      allow="fullscreen"
                    />
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-neutral-500">
                      Tap the left or right side of the deck, use the arrow buttons, or press the arrow keys to navigate.
                    </p>
                    <a
                      href={slideDeck.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#BF00FF] hover:text-[#BF00FF]/80 underline underline-offset-2 transition-colors duration-300 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open full screen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasTranscript && (
          <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] overflow-hidden transition-all duration-300 hover:border-[#444]">
            <button
              type="button"
              onClick={() => setTranscriptOpen(o => !o)}
              aria-expanded={transcriptOpen}
              className="w-full flex items-center justify-between gap-4 py-6 md:p-8 px-6 text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full bg-[#39FF14] shrink-0" />
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Full transcript
                </h2>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${transcriptOpen ? 'bg-[#39FF14]/20' : 'bg-neutral-700/50 group-hover:bg-neutral-700'}`}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${transcriptOpen ? 'rotate-180 text-[#39FF14]' : 'text-neutral-400'}`}
                />
              </div>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${transcriptOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden min-h-0">
                <div className="px-6 md:px-8 pb-6 md:pb-8 max-h-[min(70vh,40rem)] overflow-y-auto">
                  <p className="text-sm md:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {session.transcript_text}
                  </p>
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

        {!hasSummaryContent &&
          !hasKeyPoints &&
          !session.host_notes?.trim() &&
          !hasTranscript &&
          hasReplay && (
            <Card className="p-6 border-neutral-700 bg-neutral-900/30">
              <p className="text-sm text-neutral-500">
                Session recap and highlights will be auto-generated once the transcript is ready. Check back shortly.
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
