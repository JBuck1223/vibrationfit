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
  useDevices,
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
  Sparkles
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
  
  // State
  const [cameraEnabled, setCameraEnabled] = useState(initialSettings?.camera ?? true)
  const [micEnabled, setMicEnabled] = useState(initialSettings?.microphone ?? true)
  const [screenSharing, setScreenSharing] = useState(false)
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

  // Handle recording events
  useEffect(() => {
    if (!daily) return

    const handleRecordingStarted = () => {
      setIsRecording(true)
      onRecordingStart?.()
    }

    const handleRecordingStopped = () => {
      setIsRecording(false)
      onRecordingStop?.()
    }

    daily.on('recording-started', handleRecordingStarted)
    daily.on('recording-stopped', handleRecordingStopped)

    return () => {
      daily.off('recording-started', handleRecordingStarted)
      daily.off('recording-stopped', handleRecordingStopped)
    }
  }, [daily, onRecordingStart, onRecordingStop])

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

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!daily) return
    if (screenSharing) {
      await daily.stopScreenShare()
    } else {
      await daily.startScreenShare()
    }
    setScreenSharing(!screenSharing)
  }, [daily, screenSharing])

  // Start/stop recording (host only)
  const toggleRecording = useCallback(async () => {
    if (!daily || !isHost) return
    if (isRecording) {
      await daily.stopRecording()
    } else {
      await daily.startRecording()
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
    }

    if (daily) {
      await daily.leave()
    }
    onLeave?.()
  }, [daily, onLeave, sessionId])

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
      className="min-h-screen bg-black flex flex-col"
    >
      {/* Global audio for all participants */}
      <DailyAudio />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sessionTitle && (
              <h1 className="text-white font-medium">{sessionTitle}</h1>
            )}
            {isRecording && (
              <Badge variant="error" className="animate-pulse">
                <Circle className="w-2 h-2 fill-current mr-1" />
                REC
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
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
      </div>

      {/* Highlighted Message Banner (visible to all participants) */}
      {highlightedMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-energy-500/30 to-primary-500/30 backdrop-blur-md border border-energy-500/40 rounded-2xl px-5 py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-energy-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-energy-400 font-semibold uppercase tracking-wider">
                  {highlightedMessage.sender_name}
                </p>
                <p className="text-white text-sm md:text-base mt-0.5 leading-snug">
                  {highlightedMessage.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        <div className="absolute inset-0">
          {remoteParticipantId ? (
            <RemoteParticipantTile participantId={remoteParticipantId} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-16 h-16 text-neutral-600" />
                </div>
                <p className="text-white text-lg">Waiting for participant...</p>
                <p className="text-neutral-500 text-sm mt-1">Share the session link to invite someone</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 md:w-64 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800">
          {localParticipant && cameraEnabled ? (
            <DailyVideo
              automirror
              sessionId={localParticipant.session_id}
              type="video"
              className="w-full h-full object-cover"
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
          <ParticipantsPanel 
            localName={userName}
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            participantIds={participantIds}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {/* Chat panel */}
        {showChat && sessionId && (
          <div className="absolute top-20 right-4 w-80 h-[60vh] max-h-[500px] z-30">
            <SessionChat
              sessionId={sessionId}
              currentUserId={userId}
              currentUserName={userName}
              isHost={isHost}
              onClose={() => setShowChat(false)}
              onHighlightChange={(msg) => setHighlightedMessage(msg ? { sender_name: msg.sender_name, message: msg.message } : null)}
            />
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
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
              screenSharing 
                ? 'bg-primary-500 hover:bg-primary-600 text-black' 
                : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            }`}
            title={screenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {screenSharing ? <ScreenShareOff className="w-5 h-5 md:w-6 md:h-6" /> : <ScreenShare className="w-5 h-5 md:w-6 md:h-6" />}
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
          sessionId={participantId}
          type="video"
          className="w-full h-full object-cover"
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
    <div className="absolute top-20 right-4 w-72 bg-neutral-900/95 backdrop-blur rounded-2xl border border-neutral-700 p-4 z-30">
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
