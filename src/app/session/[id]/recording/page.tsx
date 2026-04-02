'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import {
  Container,
  Stack,
  PageHero,
  Button,
  Card,
  Spinner,
} from '@/lib/design-system/components'
import { SessionRecordingVideo } from '@/components/video/SessionRecordingVideo'
import type { VideoSession } from '@/lib/video/types'
import { formatDuration } from '@/lib/video/types'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'

export default function SessionRecordingPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<VideoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/video/sessions/${sessionId}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not load session')
      }
      const s = data.session as VideoSession
      if (isAlignmentGymDirectorySession(s)) {
        router.replace(`/alignment-gym/${sessionId}`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-black">
        <Container size="md">
          <Stack gap="lg" className="py-12">
            <PageHero
              eyebrow="RECORDING"
              title="Recording unavailable"
              subtitle={error || 'Session not found.'}
            >
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </PageHero>
          </Stack>
        </Container>
      </div>
    )
  }

  if (!session.recording_url) {
    return (
      <div className="min-h-screen bg-black">
        <Container size="md">
          <Stack gap="lg" className="py-12">
            <PageHero
              eyebrow="RECORDING"
              title="No recording yet"
              subtitle="This session does not have a recording URL."
            >
              <Button variant="ghost" size="sm" onClick={() => router.push(`/session/${sessionId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Session
              </Button>
            </PageHero>
          </Stack>
        </Container>
      </div>
    )
  }

  const skip = session.recording_playback_start_seconds ?? 0

  return (
    <div className="min-h-screen bg-black">
      <Container size="lg">
        <Stack gap="lg" className="py-8 md:py-12">
          <PageHero
            eyebrow="SESSION REPLAY"
            title={session.title}
            subtitle={
              skip > 0
                ? `Playback starts ${formatDuration(skip)} into the file. Open the full file below if you need the beginning.`
                : 'Watch the session recording.'
            }
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(session.recording_url!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open full file
              </Button>
            </div>
          </PageHero>

          <Card className="p-4 md:p-6 overflow-hidden border-neutral-700 bg-neutral-950">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
              <SessionRecordingVideo
                src={session.recording_url}
                playbackStartSeconds={skip}
                className="w-full h-full"
              />
            </div>
          </Card>
        </Stack>
      </Container>
    </div>
  )
}
