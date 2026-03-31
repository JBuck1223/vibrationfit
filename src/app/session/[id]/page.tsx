'use client'

/**
 * Video Session Page
 *
 * Authenticated host:  pre-call → in-call → post-call
 * Authenticated user:  pre-call → (waiting for host) → in-call → post-call
 * Guest (no auth):     lobby (collect email) → pre-call → (waiting) → in-call → post-call
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionLobby } from '@/components/video/SessionLobby'
import { PreCallCheck } from '@/components/video/PreCallCheck'
import { WaitingRoom } from '@/components/video/WaitingRoom'
import { VideoCall } from '@/components/video/VideoCall'
import { PostCallSummary } from '@/components/video/PostCallSummary'
import { 
  Container, 
  Stack,
  PageHero,
  Card, 
  Button, 
  Spinner,
} from '@/lib/design-system/components'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import type { VideoSession, VideoSessionParticipant, CallSettings, JoinSessionResponse } from '@/lib/video/types'

type SessionWithParticipants = VideoSession & { participants?: VideoSessionParticipant[] }

type PageState = 'loading' | 'error' | 'lobby' | 'pre-call' | 'waiting' | 'in-call' | 'post-call'

interface GuestSessionInfo {
  id: string
  title: string
  description?: string
  scheduled_at: string
  scheduled_duration_minutes: number
  status: string
  session_type: string
  host_name: string
}

export default function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params?.id as string
  const supabase = createClient()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [session, setSession] = useState<SessionWithParticipants | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSessionInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [hostName, setHostName] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('Participant')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [wasRecording, setWasRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isGuestJoin, setIsGuestJoin] = useState(false)
  const [initialGuestEmail, setInitialGuestEmail] = useState<string>('')

  useEffect(() => {
    const emailFromUrl = searchParams?.get('email') || ''
    if (emailFromUrl) setInitialGuestEmail(emailFromUrl)
  }, [searchParams])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        setUserId(user?.id)

        if (user) {
          const response = await fetch(`/api/video/sessions/${sessionId}`)
          const data = await response.json()

          if (response.ok) {
            setSession(data.session)
            setIsHost(data.is_host)

            const host = data.session.participants?.find((p: { is_host: boolean }) => p.is_host)
            if (host?.name) setHostName(host.name)

            const profileResponse = await fetch('/api/profile')
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              setUserName(profileData.full_name || profileData.email || 'Participant')
            }

            setPageState('pre-call')
            return
          }

          // Authenticated endpoint failed — fall through to guest flow
        }

        setIsGuestJoin(true)
        const guestRes = await fetch(`/api/video/sessions/${sessionId}/guest-join`)
        const guestData = await guestRes.json()

        if (!guestRes.ok) {
          setError(guestData.error || 'Session not found')
          setPageState('error')
          return
        }

        setGuestSession(guestData.session)
        setHostName(guestData.session.host_name)
        if (guestData.participant?.name) {
          setUserName(guestData.participant.name)
        }
        if (guestData.participant?.email) {
          setInitialGuestEmail(prev => prev || guestData.participant.email)
        }
        setPageState('lobby')
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load session')
        setPageState('error')
      }
    }

    if (sessionId) init()
  }, [sessionId, supabase.auth])

  const joinSessionAuthenticated = useCallback(async (): Promise<JoinSessionResponse> => {
    const response = await fetch(`/api/video/sessions/${sessionId}/join`, {
      method: 'POST',
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to join session')
    }

    const joinData = data as JoinSessionResponse
    setToken(joinData.token)
    setRoomUrl(joinData.room_url)
    setSession(joinData.session)
    setIsHost(joinData.is_host)
    return joinData
  }, [sessionId])

  const joinSessionGuest = useCallback(async (): Promise<JoinSessionResponse> => {
    const response = await fetch(`/api/video/sessions/${sessionId}/guest-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName, email: userEmail }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to join session')
    }

    const joinData = data as JoinSessionResponse
    setToken(joinData.token)
    setRoomUrl(joinData.room_url)
    setSession(joinData.session)
    setIsHost(false)
    return joinData
  }, [sessionId, userName, userEmail])

  const handleLobbyReady = (guestInfo?: { name: string; email: string }) => {
    if (guestInfo) {
      setUserName(guestInfo.name)
      setUserEmail(guestInfo.email)
    }
    setPageState('pre-call')
  }

  const handlePreCallReady = async (settings: CallSettings) => {
    setCallSettings(settings)
    try {
      let joinData: JoinSessionResponse
      if (isGuestJoin) {
        joinData = await joinSessionGuest()
      } else {
        joinData = await joinSessionAuthenticated()
      }

      // Non-host: if session isn't live yet, wait for the host to start
      if (!joinData.is_host && joinData.session.status !== 'live') {
        setPageState('waiting')
      } else {
        setPageState('in-call')
      }
    } catch (err) {
      console.error('Error joining session:', err)
      setError(err instanceof Error ? err.message : 'Failed to join session')
      setPageState('error')
    }
  }

  const handleSessionLive = useCallback(() => {
    setPageState('in-call')
  }, [])

  const handleLeave = async (stats?: { durationSeconds: number; wasRecording: boolean }) => {
    if (stats) {
      setCallDuration(stats.durationSeconds)
      setWasRecording(stats.wasRecording)
    }

    try {
      const res = await fetch(`/api/video/sessions/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
      }
    } catch {}

    setPageState('post-call')
  }

  const handlePostCallClose = () => {
    if (!isAuthenticated) {
      window.close()
      router.push('/')
    } else if (session?.session_type === 'alignment_gym') {
      router.push('/alignment-gym')
    } else {
      router.push('/sessions')
    }
  }

  const handleScheduleFollowUp = () => {
    router.push('/admin/sessions/new')
  }

  const handleViewRecording = () => {
    if (session?.recording_url) {
      window.open(session.recording_url, '_blank')
    }
  }

  const handleSaveNotes = async (notes: string) => {
    try {
      await fetch(`/api/video/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_notes: notes }),
      })
    } catch (err) {
      console.error('Error saving notes:', err)
    }
  }

  const handleCallError = (error: Error) => {
    console.error('Call error:', error)
    setError(error.message)
    setPageState('error')
  }

  const handleCancel = () => {
    if (!isAuthenticated) {
      router.push('/')
    } else if (session?.session_type === 'alignment_gym') {
      router.push('/alignment-gym')
    } else {
      router.push('/sessions')
    }
  }

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-white text-sm md:text-base">Loading session...</p>
        </div>
      </div>
    )
  }

  // Error
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-black">
        <Container size="md">
          <Stack gap="lg">
            <PageHero
              eyebrow="VIDEO SESSION"
              title="Unable to Join"
              subtitle={error || 'There was a problem loading this session.'}
            >
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isAuthenticated ? 'Back to Sessions' : 'Go Home'}
              </Button>
            </PageHero>

            <Card className="p-4 md:p-6 lg:p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">Session Error</h2>
              <p className="text-sm md:text-base text-neutral-400 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCancel}>
                  {isAuthenticated ? 'Back to Sessions' : 'Go Home'}
                </Button>
              </div>
            </Card>
          </Stack>
        </Container>
      </div>
    )
  }

  // Lobby
  if (pageState === 'lobby') {
    const lobbySession = session || guestSession
    return (
      <SessionLobby
        title={lobbySession?.title || 'Your Session'}
        description={lobbySession?.description}
        hostName={!isHost ? hostName || undefined : undefined}
        scheduledAt={lobbySession?.scheduled_at}
        durationMinutes={lobbySession?.scheduled_duration_minutes}
        sessionType={session?.session_type || guestSession?.session_type}
        isGuest={isGuestJoin}
        initialName={userName !== 'Participant' ? userName : undefined}
        initialEmail={initialGuestEmail || undefined}
        onReady={handleLobbyReady}
        onCancel={handleCancel}
      />
    )
  }

  // Pre-call check
  if (pageState === 'pre-call') {
    const title = session?.title || guestSession?.title
    const showHostName = !isHost ? hostName || undefined : undefined

    return (
      <PreCallCheck
        sessionTitle={title}
        hostName={showHostName}
        onReady={handlePreCallReady}
        onCancel={handleCancel}
      />
    )
  }

  // Waiting for host
  if (pageState === 'waiting') {
    const waitSession = session || guestSession
    return (
      <WaitingRoom
        sessionId={sessionId}
        sessionTitle={waitSession?.title}
        hostName={!isHost ? hostName || undefined : undefined}
        scheduledAt={waitSession?.scheduled_at}
        onSessionLive={handleSessionLive}
        onCancel={handleCancel}
      />
    )
  }

  // In call
  if (pageState === 'in-call' && token && roomUrl) {
    return (
      <VideoCall
        roomUrl={roomUrl}
        token={token}
        userName={userName}
        userId={userId}
        sessionId={sessionId}
        sessionTitle={session?.title}
        sessionType={session?.session_type}
        isHost={isHost}
        initialSettings={callSettings || undefined}
        onLeave={handleLeave}
        onError={handleCallError}
        memberUserId={
          isHost && session?.session_type === 'one_on_one'
            ? session.participants?.find(p => !p.is_host)?.user_id
            : undefined
        }
      />
    )
  }

  // Post call
  if (pageState === 'post-call' && session) {
    return (
      <PostCallSummary
        session={session}
        duration={callDuration}
        wasRecording={wasRecording}
        isHost={isHost}
        onClose={handlePostCallClose}
        onScheduleFollowUp={isHost ? handleScheduleFollowUp : undefined}
        onViewRecording={session.recording_url ? handleViewRecording : undefined}
        onSaveNotes={isHost ? handleSaveNotes : undefined}
      />
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
