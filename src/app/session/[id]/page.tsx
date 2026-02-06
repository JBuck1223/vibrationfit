'use client'

/**
 * Video Session Page
 * 
 * The main page for joining and participating in a video session.
 * Handles:
 * - Non-authenticated users: Shows session details + login prompt
 * - Authenticated users: Full flow: pre-call check → waiting room → in-call → post-call
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PreCallCheck } from '@/components/video/PreCallCheck'
import { VideoCall } from '@/components/video/VideoCall'
import { WaitingRoom } from '@/components/video/WaitingRoom'
import { PostCallSummary } from '@/components/video/PostCallSummary'
import { 
  Container, 
  Stack,
  PageHero,
  Card, 
  Button, 
  Spinner,
  Input
} from '@/lib/design-system/components'
import { AlertCircle, ArrowLeft, Video, Calendar, Clock, User, LogIn } from 'lucide-react'
import type { VideoSession, CallSettings, JoinSessionResponse } from '@/lib/video/types'

type PageState = 'loading' | 'login-required' | 'error' | 'pre-call' | 'waiting' | 'in-call' | 'post-call'

interface PublicSessionInfo {
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
  const emailFromUrl = searchParams?.get('email') || ''
  const supabase = createClient()

  // State
  const [pageState, setPageState] = useState<PageState>('loading')
  const [publicSession, setPublicSession] = useState<PublicSessionInfo | null>(null)
  const [session, setSession] = useState<VideoSession | null>(null)
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
  
  // Login form state - pre-fill from URL if available
  const [email, setEmail] = useState(emailFromUrl)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSent, setLoginSent] = useState(false)

  // Check auth status and fetch session info
  useEffect(() => {
    const checkAuthAndFetchSession = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        setUserId(user?.id)

        if (user) {
          // User is logged in - fetch full session details
          const response = await fetch(`/api/video/sessions/${sessionId}`)
          const data = await response.json()

          if (!response.ok) {
            setError(data.error || 'Failed to load session')
            setPageState('error')
            return
          }

          setSession(data.session)
          setIsHost(data.is_host)

          // Get host name from participants
          const host = data.session.participants?.find((p: { is_host: boolean }) => p.is_host)
          if (host?.name) {
            setHostName(host.name)
          }

          // Get current user's profile for name
          const profileResponse = await fetch('/api/profile')
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            setUserName(profileData.full_name || profileData.email || 'Participant')
          }

          setPageState('pre-call')
        } else {
          // User is not logged in - fetch public session info
          const response = await fetch(`/api/video/sessions/${sessionId}/public`)
          const data = await response.json()

          if (!response.ok) {
            setError(data.error || 'Session not found')
            setPageState('error')
            return
          }

          setPublicSession(data.session)
          setHostName(data.session.host_name)
          setPageState('login-required')
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load session')
        setPageState('error')
      }
    }

    if (sessionId) {
      checkAuthAndFetchSession()
    }
  }, [sessionId, supabase.auth])

  // Handle magic link login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/session/${sessionId}`,
        },
      })

      if (error) {
        setLoginError(error.message)
      } else {
        setLoginSent(true)
      }
    } catch (err) {
      setLoginError('Failed to send login link')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Join the session (get token)
  const joinSession = useCallback(async () => {
    try {
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

      // Skip waiting room for hosts
      if (joinData.is_host || !session?.enable_waiting_room) {
        setPageState('in-call')
      } else {
        setPageState('waiting')
      }
    } catch (err) {
      console.error('Error joining session:', err)
      setError(err instanceof Error ? err.message : 'Failed to join session')
      setPageState('error')
    }
  }, [sessionId, session?.enable_waiting_room])

  // Handle pre-call ready
  const handlePreCallReady = async (settings: CallSettings) => {
    setCallSettings(settings)
    await joinSession()
  }

  // Handle leaving the call
  const handleLeave = () => {
    setPageState('post-call')
  }

  // Handle post-call close
  const handlePostCallClose = () => {
    router.push('/sessions')
  }

  // Handle scheduling follow-up
  const handleScheduleFollowUp = () => {
    router.push('/admin/sessions/new')
  }

  // Handle viewing recording
  const handleViewRecording = () => {
    if (session?.recording_url) {
      window.open(session.recording_url, '_blank')
    }
  }

  // Handle saving notes
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

  // Handle error during call
  const handleCallError = (error: Error) => {
    console.error('Call error:', error)
    setError(error.message)
    setPageState('error')
  }

  // Cancel/go back
  const handleCancel = () => {
    if (isAuthenticated) {
      router.push('/sessions')
    } else {
      router.push('/')
    }
  }

  // Format session date/time
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSessionTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
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

  // Login required state - show session details and login form
  if (pageState === 'login-required' && publicSession) {
    return (
      <div className="min-h-screen bg-black">
        <Container size="md">
          <Stack gap="lg">
            <PageHero
              eyebrow="VIDEO SESSION"
              title={publicSession.title}
              subtitle={`You're invited to join a session with ${hostName}`}
            />

            {/* Session Details Card */}
            <Card className="p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Date</p>
                    <p className="text-sm md:text-base text-white">
                      {formatSessionDate(publicSession.scheduled_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Time</p>
                    <p className="text-sm md:text-base text-white">
                      {formatSessionTime(publicSession.scheduled_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Duration</p>
                    <p className="text-sm md:text-base text-white">
                      {publicSession.scheduled_duration_minutes} minutes
                    </p>
                  </div>
                </div>
              </div>

              {publicSession.description && (
                <div className="mb-6 p-4 bg-neutral-800/50 rounded-lg">
                  <p className="text-sm md:text-base text-neutral-300">
                    {publicSession.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs text-primary-500">Your Host</p>
                  <p className="text-sm md:text-base text-white font-medium">
                    {hostName}
                  </p>
                </div>
              </div>
            </Card>

            {/* Login Card */}
            <Card className="p-4 md:p-6 lg:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white mb-2">
                  Sign in to Join
                </h2>
                <p className="text-sm md:text-base text-neutral-400">
                  Enter your email to receive a magic link
                </p>
              </div>

              {loginSent ? (
                <div className="text-center p-6 bg-primary-500/10 rounded-xl border border-primary-500/30">
                  <h3 className="text-lg font-medium text-primary-500 mb-2">
                    Check your email
                  </h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    We sent a login link to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Click the link in the email to join the session
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  {loginError && (
                    <p className="text-red-400 text-sm text-center">{loginError}</p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isLoggingIn || !email}
                  >
                    {isLoggingIn ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </Stack>
        </Container>
      </div>
    )
  }

  // Error state
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

  // Pre-call check
  if (pageState === 'pre-call') {
    return (
      <PreCallCheck
        sessionTitle={session?.title}
        hostName={!isHost ? hostName || undefined : undefined}
        onReady={handlePreCallReady}
        onCancel={handleCancel}
      />
    )
  }

  // Waiting room
  if (pageState === 'waiting') {
    return (
      <WaitingRoom
        sessionTitle={session?.title}
        hostName={hostName || undefined}
        scheduledTime={session?.scheduled_at ? new Date(session.scheduled_at) : undefined}
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
        isHost={isHost}
        initialSettings={callSettings || undefined}
        onLeave={handleLeave}
        onError={handleCallError}
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
        onScheduleFollowUp={handleScheduleFollowUp}
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
