'use client'

/**
 * VideoCall Component
 * 
 * Main video call interface using Daily.co with daily-react.
 * Provides a beautiful, branded experience for 1:1 coaching calls.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useParticipant,
  useMeetingState,
  useScreenShare,
  DailyVideo,
  DailyAudio,
} from '@daily-co/daily-react'
import DailyIframe from '@daily-co/daily-js'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users,
  Maximize,
  Minimize,
  ScreenShare,
  ScreenShareOff,
  Circle,
  Square,
  X,
  MessageCircle,
  Sparkles,
  Clock
} from 'lucide-react'
import { Button, Badge, Card } from '@/lib/design-system/components'
import { SessionChat } from '@/components/video/SessionChat'
import type { CallSettings } from '@/lib/video/types'

interface VideoCallProps {
  roomUrl: string
  token: string
  userName: string
  userId?: string // Current user's ID for chat
  sessionId?: string // For triggering host-joined notification
  sessionTitle?: string
  isHost?: boolean
  initialSettings?: CallSettings
  onLeave?: () => void
  onError?: (error: Error) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
}

// Main wrapper that provides the Daily context
export function VideoCall(props: VideoCallProps) {
  const [callObject, setCallObject] = useState<ReturnType<typeof DailyIframe.createCallObject> | null>(null)
  const mountedRef = useRef(true)

  // Create call object on mount (client-side only)
  useEffect(() => {
    mountedRef.current = true
    
    // Check for existing instance first (handles StrictMode remounts)
    let co = DailyIframe.getCallInstance()
    if (!co) {
      co = DailyIframe.createCallObject({
        videoSource: props.initialSettings?.selectedCamera,
        audioSource: props.initialSettings?.selectedMicrophone,
      })
    }
    setCallObject(co)

    // Cleanup on unmount - delay to handle StrictMode
    return () => {
      mountedRef.current = false
      // Use setTimeout to allow StrictMode remount before destroying
      setTimeout(() => {
        if (!mountedRef.current) {
          const instance = DailyIframe.getCallInstance()
          if (instance) {
            instance.destroy()
          }
        }
      }, 100)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!callObject) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <DailyProvider callObject={callObject}>
      <VideoCallUI {...props} />
    </DailyProvider>
  )
}

// The actual UI component that uses Daily hooks
function VideoCallUI({
  roomUrl,
  token,
  userName,
  userId,
  sessionId,
  sessionTitle,
  isHost = false,
  initialSettings,
  onLeave,
  onError,
  onRecordingStart,
  onRecordingStop,
}: VideoCallProps) {
  const daily = useDaily()
  const localParticipant = useLocalParticipant()
  const participantIds = useParticipantIds({ filter: 'remote' })
  const meetingState = useMeetingState()
  const { isSharingScreen, screens, startScreenShare, stopScreenShare } = useScreenShare()
  
  // State
  const [cameraEnabled, setCameraEnabled] = useState(initialSettings?.camera ?? true)
  const [micEnabled, setMicEnabled] = useState(initialSettings?.microphone ?? true)
  const [isRecording, setIsRecording] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hostJoinedNotified, setHostJoinedNotified] = useState(false)
  const [highlightedMessage, setHighlightedMessage] = useState<{ sender_name: string; message: string } | null>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const joinTrackedRef = useRef(false)

  // Join the call
  useEffect(() => {
    if (!daily || meetingState !== 'new') return

    const join = async () => {
      try {
        await daily.join({
          url: roomUrl,
          token: token,
          userName: userName,
          startVideoOff: !cameraEnabled,
          startAudioOff: !micEnabled,
        })

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)

        // Track participant join for analytics
        if (sessionId && !joinTrackedRef.current) {
          joinTrackedRef.current = true
          try {
            await fetch(`/api/video/sessions/${sessionId}/participant-stats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'join' }),
            })
            console.log('✅ Participant join tracked')
          } catch (trackErr) {
            console.error('Error tracking participant join:', trackErr)
          }
        }

        // If host joined and we have a sessionId, send notification to participants
        if (isHost && sessionId && !hostJoinedNotified) {
          setHostJoinedNotified(true)
          try {
            const response = await fetch(`/api/video/sessions/${sessionId}/host-joined`, {
              method: 'POST',
            })
            if (response.ok) {
              console.log('✅ Host-joined notification sent to participants')
            } else {
              console.warn('⚠️ Failed to send host-joined notification')
            }
          } catch (notifyErr) {
            console.error('Error sending host-joined notification:', notifyErr)
          }
        }
      } catch (err) {
        console.error('Error joining call:', err)
        setError(err instanceof Error ? err.message : 'Failed to join call')
        onError?.(err instanceof Error ? err : new Error('Failed to join call'))
      }
    }

    join()

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [daily, meetingState, roomUrl, token, userName, cameraEnabled, micEnabled, onError, isHost, sessionId, hostJoinedNotified])

  // Handle recording events — update UI + database
  useEffect(() => {
    if (!daily) return

    const handleRecordingStarted = () => {
      setIsRecording(true)
      onRecordingStart?.()
      // Update DB recording status
      if (sessionId) {
        fetch(`/api/video/sessions/${sessionId}/recording-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'recording' }),
        }).catch(err => console.error('Failed to update recording status:', err))
      }
    }

    const handleRecordingStopped = () => {
      setIsRecording(false)
      onRecordingStop?.()
      // Update DB — Daily.co webhook will handle the rest (processing → S3 upload)
      if (sessionId) {
        fetch(`/api/video/sessions/${sessionId}/recording-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing' }),
        }).catch(err => console.error('Failed to update recording status:', err))
      }
    }

    daily.on('recording-started', handleRecordingStarted)
    daily.on('recording-stopped', handleRecordingStopped)

    return () => {
      daily.off('recording-started', handleRecordingStarted)
      daily.off('recording-stopped', handleRecordingStopped)
    }
  }, [daily, onRecordingStart, onRecordingStop, sessionId])

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!daily) return
    const newState = !cameraEnabled
    await daily.setLocalVideo(newState)
    setCameraEnabled(newState)
  }, [daily, cameraEnabled])

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (!daily) return
    const newState = !micEnabled
    await daily.setLocalAudio(newState)
    setMicEnabled(newState)
  }, [daily, micEnabled])

  // Toggle screen share (uses useScreenShare hook for reliable state)
  const toggleScreenShare = useCallback(() => {
    if (isSharingScreen) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }, [isSharingScreen, startScreenShare, stopScreenShare])

  // Start/stop recording (host only)
  const toggleRecording = useCallback(async () => {
    if (!daily || !isHost) return
    if (isRecording) {
      await daily.stopRecording()
    } else {
      await daily.startRecording({
        layout: {
          preset: 'active-participant',
        },
      })
    }
  }, [daily, isRecording, isHost])

  // Leave call
  const handleLeave = useCallback(async () => {
    // Track participant leave for analytics
    if (sessionId) {
      try {
        await fetch(`/api/video/sessions/${sessionId}/participant-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave' }),
        })
        console.log('✅ Participant leave tracked')
      } catch (trackErr) {
        console.error('Error tracking participant leave:', trackErr)
      }

      // If host is leaving, mark session as completed
      if (isHost) {
        try {
          // Stop recording if still running
          if (isRecording && daily) {
            await daily.stopRecording()
          }
          await fetch(`/api/video/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
              ended_at: new Date().toISOString(),
              actual_duration_seconds: callDuration,
            }),
          })
          console.log('✅ Session marked as completed')
        } catch (err) {
          console.error('Error completing session:', err)
        }
      }
    }

    if (daily) {
      await daily.leave()
    }
    onLeave?.()
  }, [daily, onLeave, sessionId, isHost, isRecording, callDuration])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Track how long we've been waiting for others to join
  const [waitingSeconds, setWaitingSeconds] = useState(0)
  const waitingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (participantIds.length === 0) {
      // Start waiting timer when no remote participants
      if (!waitingIntervalRef.current) {
        setWaitingSeconds(0)
        waitingIntervalRef.current = setInterval(() => {
          setWaitingSeconds(prev => prev + 1)
        }, 1000)
      }
    } else {
      // Stop when someone joins
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current)
        waitingIntervalRef.current = null
      }
    }
    return () => {
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current)
      }
    }
  }, [participantIds.length])

  // Get remote participant
  const remoteParticipantId = participantIds[0]

  // Error state
  if (error || meetingState === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-neutral-900 border-red-500/50 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-neutral-400 mb-6">{error || 'Failed to connect to the call'}</p>
          <Button variant="primary" onClick={onLeave}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  // Joining/connecting state
  if (meetingState === 'new' || meetingState === 'joining-meeting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-white text-lg">Connecting...</p>
          <p className="text-neutral-500 text-sm mt-2">Setting up your video call</p>
        </div>
      </div>
    )
  }

  // Left meeting state
  if (meetingState === 'left-meeting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">You have left the call</p>
          <Button variant="primary" onClick={onLeave} className="mt-4">
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-black flex flex-col overflow-hidden"
    >
      {/* Global audio for all participants */}
      <DailyAudio />

      {/* Header — solid bar, not overlaying video */}
      <div className="flex-shrink-0 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sessionTitle && (
              <h1 className="text-white font-medium text-sm md:text-base truncate">{sessionTitle}</h1>
            )}
            {isRecording && (
              <Badge variant="error" className="animate-pulse">
                <Circle className="w-2 h-2 fill-current mr-1" />
                REC
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Highlighted Message indicator in header */}
            {highlightedMessage && (
              <div className="hidden md:flex items-center gap-2 bg-energy-500/10 border border-energy-500/30 rounded-full px-3 py-1 max-w-xs">
                <Sparkles className="w-3.5 h-3.5 text-energy-500 flex-shrink-0" />
                <p className="text-xs text-white truncate">
                  <span className="text-energy-400 font-medium">{highlightedMessage.sender_name}:</span>{' '}
                  {highlightedMessage.message}
                </p>
              </div>
            )}
            <span className="text-white font-mono text-sm">
              {formatDuration(callDuration)}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Highlighted Message Banner — mobile (below header row) */}
        {highlightedMessage && (
          <div className="md:hidden mt-2 flex items-center gap-2 bg-energy-500/10 border border-energy-500/30 rounded-xl px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 text-energy-500 flex-shrink-0" />
            <p className="text-xs text-white truncate">
              <span className="text-energy-400 font-medium">{highlightedMessage.sender_name}:</span>{' '}
              {highlightedMessage.message}
            </p>
          </div>
        )}
      </div>

      {/* Main Content — video + optional chat side panel */}
      <div className="flex-1 flex min-h-0">
        {/* Video Area */}
        <div className="flex-1 relative min-w-0">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0">
            {remoteParticipantId ? (
              <RemoteParticipantTile participantId={remoteParticipantId} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-5">
                    {isHost ? (
                      <Users className="w-12 h-12 text-neutral-600" />
                    ) : (
                      <div className="relative">
                        <Users className="w-12 h-12 text-neutral-600" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-neutral-400" />
                        </div>
                      </div>
                    )}
                  </div>
                  {isHost ? (
                    <>
                      <p className="text-white text-lg font-medium">No participants yet</p>
                      <p className="text-neutral-500 text-sm mt-2">
                        Members will appear here when they join
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white text-lg font-medium">Waiting for host to join</p>
                      <p className="text-neutral-500 text-sm mt-2">
                        The session will begin once the host arrives
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 bg-neutral-800/80 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-neutral-300 text-sm font-mono">
                          {formatDuration(waitingSeconds)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-36 md:w-56 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800 z-10">
            {localParticipant && cameraEnabled ? (
              <DailyVideo
                automirror
                fit="cover"
                sessionId={localParticipant.session_id}
                type="video"
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-neutral-400">
                    {userName?.[0]?.toUpperCase() || 'Y'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Local participant name */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                You
              </span>
              {!micEnabled && (
                <MicOff className="w-3 h-3 text-red-400" />
              )}
            </div>
          </div>

          {/* Participants panel */}
          {showParticipants && (
            <div className="absolute top-4 right-4 z-20">
              <ParticipantsPanel 
                localName={userName}
                cameraEnabled={cameraEnabled}
                micEnabled={micEnabled}
                participantIds={participantIds}
                onClose={() => setShowParticipants(false)}
              />
            </div>
          )}
        </div>

        {/* Chat Side Panel — sits beside video on desktop, slides up on mobile */}
        {showChat && sessionId && (
          <>
            {/* Desktop: side panel */}
            <div className="hidden md:flex flex-col w-80 flex-shrink-0 border-l border-neutral-800">
              <SessionChat
                sessionId={sessionId}
                currentUserId={userId}
                currentUserName={userName}
                isHost={isHost}
                onClose={() => setShowChat(false)}
                onHighlightChange={(msg) => setHighlightedMessage(msg ? { sender_name: msg.sender_name, message: msg.message } : null)}
              />
            </div>
            {/* Mobile: bottom sheet overlay */}
            <div className="md:hidden fixed inset-x-0 bottom-0 z-40 h-[55vh]">
              <SessionChat
                sessionId={sessionId}
                currentUserId={userId}
                currentUserName={userName}
                isHost={isHost}
                onClose={() => setShowChat(false)}
                onHighlightChange={(msg) => setHighlightedMessage(msg ? { sender_name: msg.sender_name, message: msg.message } : null)}
              />
            </div>
          </>
        )}
      </div>

      {/* Control Bar — solid bar, not overlaying video */}
      <div className="flex-shrink-0 px-4 py-3 bg-neutral-900 border-t border-neutral-800">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              cameraEnabled 
                ? 'bg-neutral-700 hover:bg-neutral-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled ? <Video className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {/* Mic toggle */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              micEnabled 
                ? 'bg-neutral-700 hover:bg-neutral-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSharingScreen 
                ? 'bg-primary-500 hover:bg-primary-600 text-black' 
                : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            }`}
            title={isSharingScreen ? 'Stop sharing' : 'Share screen'}
          >
            {isSharingScreen ? <ScreenShareOff className="w-5 h-5 md:w-6 md:h-6" /> : <ScreenShare className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {/* Recording (host only) */}
          {isHost && (
            <button
              onClick={toggleRecording}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="w-4 h-4 md:w-5 md:h-5" /> : <Circle className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          )}

          {/* Participants */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              showParticipants 
                ? 'bg-primary-500/20 text-primary-500' 
                : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Chat (only if sessionId is available) */}
          {sessionId && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                showChat 
                  ? 'bg-primary-500/20 text-primary-500' 
                  : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title="Live Chat"
            >
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Leave call */}
          <button
            onClick={handleLeave}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 ml-2 md:ml-4"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Remote participant video tile
function RemoteParticipantTile({ participantId }: { participantId: string }) {
  const participant = useParticipant(participantId)
  
  if (!participant) return null

  const hasVideo = participant.video

  return (
    <div className="w-full h-full">
      {hasVideo ? (
        <DailyVideo
          fit="cover"
          sessionId={participantId}
          type="video"
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-900">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-neutral-400">
                {participant.user_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <p className="text-white text-lg">{participant.user_name || 'Participant'}</p>
            <p className="text-neutral-500 text-sm mt-1">Camera off</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Participants panel
function ParticipantsPanel({ 
  localName, 
  cameraEnabled, 
  micEnabled, 
  participantIds,
  onClose 
}: { 
  localName: string
  cameraEnabled: boolean
  micEnabled: boolean
  participantIds: string[]
  onClose: () => void
}) {
  return (
    <div className="w-72 bg-neutral-900/95 backdrop-blur rounded-2xl border border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Participants ({participantIds.length + 1})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-700 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
      
      <div className="space-y-2">
        {/* Local user */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-500">
              {localName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{localName} (You)</p>
          </div>
          <div className="flex items-center gap-1">
            {cameraEnabled ? (
              <Video className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <VideoOff className="w-3.5 h-3.5 text-neutral-500" />
            )}
            {micEnabled ? (
              <Mic className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </div>
        </div>

        {/* Remote participants */}
        {participantIds.map(id => (
          <RemoteParticipantRow key={id} participantId={id} />
        ))}
      </div>
    </div>
  )
}

function RemoteParticipantRow({ participantId }: { participantId: string }) {
  const participant = useParticipant(participantId)
  
  if (!participant) return null

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800">
      <div className="w-8 h-8 rounded-full bg-secondary-500/20 flex items-center justify-center">
        <span className="text-sm font-medium text-secondary-500">
          {participant.user_name?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{participant.user_name || 'Participant'}</p>
      </div>
      <div className="flex items-center gap-1">
        {participant.video ? (
          <Video className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <VideoOff className="w-3.5 h-3.5 text-neutral-500" />
        )}
        {participant.audio ? (
          <Mic className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <MicOff className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </div>
    </div>
  )
}

export default VideoCall
