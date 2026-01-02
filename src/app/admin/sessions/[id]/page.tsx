'use client'

/**
 * Admin Session Detail Page
 * 
 * View and manage a specific video session.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Video, 
  Calendar,
  Clock,
  User,
  Users,
  Play,
  Trash2,
  ArrowLeft,
  Copy,
  Check,
  Mail,
  ExternalLink,
  FileText,
  Download,
  Send,
  X
} from 'lucide-react'
import { 
  Container, 
  Stack,
  PageHero, 
  Button, 
  Card,
  Badge,
  Spinner,
  Textarea
} from '@/lib/design-system/components'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { getSessionTypeLabel, getSessionStatusLabel, isSessionJoinable, formatDuration } from '@/lib/video/types'

type SessionWithDetails = VideoSession & {
  participants?: VideoSessionParticipant[]
}

export default function AdminSessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.id as string

  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailPreview, setEmailPreview] = useState<{
    to: string
    subject: string
    htmlBody: string
    participantName: string
  } | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Fetch session
  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/video/sessions/${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session')
      }

      setSession(data.session)
      setNotes(data.session.host_notes || '')
    } catch (err) {
      console.error('Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId, fetchSession])

  // Copy join link
  const copyJoinLink = async () => {
    const link = `${window.location.origin}/session/${sessionId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Save notes
  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await fetch(`/api/video/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_notes: notes }),
      })
    } catch (err) {
      console.error('Error saving notes:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  // Delete session
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const response = await fetch(`/api/video/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/sessions')
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  // Open email modal and fetch preview
  const openEmailModal = async () => {
    setShowEmailModal(true)
    setLoadingEmail(true)
    setEmailSent(false)
    
    try {
      const response = await fetch(`/api/video/sessions/${sessionId}/resend-invite`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load email preview')
      }
      
      setEmailPreview(data)
    } catch (err) {
      console.error('Error loading email preview:', err)
      setEmailPreview(null)
    } finally {
      setLoadingEmail(false)
    }
  }

  // Send the invitation email
  const sendInvitation = async () => {
    setSendingEmail(true)
    
    try {
      const response = await fetch(`/api/video/sessions/${sessionId}/resend-invite`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }
      
      setEmailSent(true)
    } catch (err) {
      console.error('Error sending invitation:', err)
      alert(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setSendingEmail(false)
    }
  }

  // Close email modal
  const closeEmailModal = () => {
    setShowEmailModal(false)
    setEmailPreview(null)
    setEmailSent(false)
  }

  // Status badge styling
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
    completed: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

  // Error state
  if (error || !session) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="VIDEO SESSIONS"
            title="Session Not Found"
            subtitle={error || 'The session you are looking for does not exist.'}
          >
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/sessions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </PageHero>
        </Stack>
      </Container>
    )
  }

  const scheduledDate = new Date(session.scheduled_at)
  const joinable = isSessionJoinable(session)
  const participant = session.participants?.find(p => !p.is_host)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* PageHero */}
        <PageHero
          eyebrow="VIDEO SESSIONS"
          title={session.title}
          subtitle={`${getSessionTypeLabel(session.session_type)} · ${session.scheduled_duration_minutes} minutes`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Badge className={`${statusStyles[session.status]} border`}>
              {session.status === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
              )}
              {getSessionStatusLabel(session.status)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/sessions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </div>
        </PageHero>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          {(joinable || session.status === 'live') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/session/${sessionId}`)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Join Session
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={copyJoinLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            {/* Session Details */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-medium text-white mb-4">Session Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Date</p>
                    <p className="text-sm md:text-base text-white">
                      {scheduledDate.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
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
                      {scheduledDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Duration</p>
                    <p className="text-sm md:text-base text-white">{session.scheduled_duration_minutes} min</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Participants</p>
                    <p className="text-sm md:text-base text-white">{session.participants?.length || 0}</p>
                  </div>
                </div>
              </div>

              {session.description && (
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-2">Description</p>
                  <p className="text-sm md:text-base text-neutral-300">{session.description}</p>
                </div>
              )}
            </Card>

            {/* Notes */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-medium text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Session Notes
              </h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this session..."
                rows={4}
                className="bg-neutral-800 border-neutral-700 mb-4"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </Card>

            {/* Recording */}
            {session.recording_url && (
              <Card className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-medium text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Recording
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(session.recording_url!, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Recording
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Participant */}
            <Card className="p-4 md:p-6">
              <h2 className="text-base md:text-lg font-medium text-white mb-4">Participant</h2>
              
              {participant ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-secondary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-white font-medium truncate">
                      {participant.name || 'Unnamed'}
                    </p>
                    {participant.email && (
                      <p className="text-xs md:text-sm text-neutral-500 truncate">
                        {participant.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm">No participant yet</p>
                </div>
              )}

              {participant?.attended && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <Badge variant="success">Attended</Badge>
                  {participant.duration_seconds && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Duration: {formatDuration(participant.duration_seconds)}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-4 md:p-6">
              <h2 className="text-base md:text-lg font-medium text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyJoinLink}
                  className="w-full justify-start"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Join Link
                </Button>

                {participant?.email && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openEmailModal}
                    className="w-full justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Invitation
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(session.daily_room_url, '_blank')}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Daily.co
                </Button>

                {session.status !== 'live' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    className="w-full justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Session
                  </Button>
                )}
              </div>
            </Card>

            {/* Room Info */}
            <Card className="p-4 md:p-6">
              <h2 className="text-xs md:text-sm font-medium text-neutral-400 mb-3">Technical Details</h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-neutral-500">Room:</span>
                  <span className="text-neutral-300 ml-2 font-mono break-all">{session.daily_room_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Recording:</span>
                  <span className="text-neutral-300 ml-2">
                    {session.enable_recording ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Waiting Room:</span>
                  <span className="text-neutral-300 ml-2">
                    {session.enable_waiting_room ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Email Invitation Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeEmailModal}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-700 rounded-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-800">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">
                    {emailSent ? 'Invitation Sent!' : 'Resend Invitation'}
                  </h2>
                  {emailPreview && !emailSent && (
                    <p className="text-sm text-neutral-400 mt-1">
                      To: {emailPreview.to}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeEmailModal}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-auto p-4 md:p-6">
                {loadingEmail ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : emailSent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Email Sent Successfully
                    </h3>
                    <p className="text-neutral-400">
                      The invitation has been sent to {emailPreview?.to}
                    </p>
                  </div>
                ) : emailPreview ? (
                  <div className="space-y-4">
                    {/* Subject Preview */}
                    <div className="p-3 bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">Subject</p>
                      <p className="text-sm text-white">{emailPreview.subject}</p>
                    </div>
                    
                    {/* Email Preview */}
                    <div className="border border-neutral-700 rounded-lg overflow-hidden">
                      <div className="bg-neutral-800 px-3 py-2 text-xs text-neutral-400">
                        Email Preview
                      </div>
                      <iframe
                        srcDoc={emailPreview.htmlBody}
                        className="w-full h-[400px] bg-white"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-red-400">Failed to load email preview</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-neutral-800">
                {emailSent ? (
                  <Button variant="primary" size="sm" onClick={closeEmailModal}>
                    Done
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={closeEmailModal}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={sendInvitation}
                      disabled={sendingEmail || !emailPreview}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500"
                    >
                      {sendingEmail ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}
