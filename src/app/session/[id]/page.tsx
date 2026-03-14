'use client'

/**
 * Video Session Page
 * 
 * The main page for joining and participating in a video session.
 * 
 * Authenticated users (hosts): Full auth flow via /api/video/sessions/[id]/join
 * Everyone else (guests): No auth required. The session link is the credential.
 *   Uses /api/video/sessions/[id]/guest-join to fetch info and get a Daily token.
 * 
 * Flow: pre-call check → in-call → post-call
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionLobby } from '@/components/video/SessionLobby'
import { PreCallCheck } from '@/components/video/PreCallCheck'
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

type PageState = 'loading' | 'error' | 'lobby' | 'pre-call' | 'in-call' | 'post-call'

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
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  // Tracks whether this user is joining as a guest (no auth)
  const [isGuestJoin, setIsGuestJoin] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        setUserId(user?.id)

        if (user) {
          // Authenticated — try the normal session API first (works for hosts & known participants)
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

            // Hosts skip the lobby and go straight to pre-call
            setPageState(data.is_host ? 'pre-call' : 'lobby')
            return
          }

          // If the authenticated endpoint fails (e.g. not an invited participant),
          // fall through to guest flow so the link still works.
        }

        // Guest flow — no auth needed, the link is the credential
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
        setPageState('lobby')
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load session')
        setPageState('error')
      }
    }

    if (sessionId) init()
  }, [sessionId, supabase.auth])

  // Join via the authenticated endpoint (hosts & known users)
  const joinSessionAuthenticated = useCallback(async () => {
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
  }, [sessionId])

  // Join via the guest endpoint (no auth)
  const joinSessionGuest = useCallback(async () => {
    const response = await fetch(`/api/video/sessions/${sessionId}/guest-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName }),
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
  }, [sessionId, userName])

  const handlePreCallReady = async (settings: CallSettings) => {
    setCallSettings(settings)
    try {
      if (isGuestJoin) {
        await joinSessionGuest()
      } else {
        await joinSessionAuthenticated()
      }
      setPageState('in-call')
    } catch (err) {
      console.error('Error joining session:', err)
      setError(err instanceof Error ? err.message : 'Failed to join session')
      setPageState('error')
    }
  }

  const handleLeave = () => {
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

  // Lobby — session info, countdown, and preparation while waiting
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
        onReady={() => setPageState('pre-call')}
        onCancel={handleCancel}
      />
    )
  }

  // Pre-call check — works for both guests and authenticated users
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
