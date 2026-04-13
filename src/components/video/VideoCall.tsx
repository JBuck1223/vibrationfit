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
  useActiveSpeakerId,
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
  Clock,
  UserCircle,
  VolumeX,
  LayoutGrid,
  Monitor,
  Camera,
} from 'lucide-react'
import { Button, Badge, Card } from '@/lib/design-system/components'
import { SessionChat } from '@/components/video/SessionChat'
import { MemberContextPanel } from '@/components/video/MemberContextPanel'
import type { CallSettings } from '@/lib/video/types'

interface VideoCallProps {
  roomUrl: string
  token: string
  userName: string
  userId?: string
  sessionId?: string
  sessionTitle?: string
  sessionType?: string
  isHost?: boolean
  initialSettings?: CallSettings
  onLeave?: (stats: { durationSeconds: number; wasRecording: boolean }) => void
  onError?: (error: Error) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  memberUserId?: string
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
  sessionType,
  isHost = false,
  initialSettings,
  onLeave,
  onError,
  onRecordingStart,
  onRecordingStop,
  memberUserId,
}: VideoCallProps) {
  const daily = useDaily()
  const localParticipant = useLocalParticipant()
  const participantIds = useParticipantIds({ filter: 'remote' })
  const activeSpeakerId = useActiveSpeakerId({ ignoreLocal: false })
  const meetingState = useMeetingState()
  const { isSharingScreen, screens, startScreenShare, stopScreenShare } = useScreenShare()

  const isGroupSession = sessionType === 'group' || sessionType === 'workshop'
    || sessionType === 'alignment_gym' || sessionType === 'webinar'
  
  // State
  const [cameraEnabled, setCameraEnabled] = useState(initialSettings?.camera ?? true)
  const [micEnabled, setMicEnabled] = useState(initialSettings?.microphone ?? true)
  const [isRecording, setIsRecording] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showMemberPanel, setShowMemberPanel] = useState(sessionType === 'one_on_one' && isHost && !!memberUserId)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hostJoinedNotified, setHostJoinedNotified] = useState(false)
  const [highlightedMessage, setHighlightedMessage] = useState<{ sender_name: string; message: string } | null>(null)

  // Layout: speaker view (one featured) vs grid (all visible)
  type LayoutMode = 'speaker' | 'grid'
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(
    sessionType === 'alignment_gym' ? 'grid' : 'speaker'
  )

  // Camera source picker (host only)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [showDevicePicker, setShowDevicePicker] = useState(false)
  const [activeVideoDeviceId, setActiveVideoDeviceId] = useState<string | null>(null)
  const devicePickerRef = useRef<HTMLDivElement>(null)

  // Stable callback for SessionChat's onHighlightChange so it doesn't tear down Realtime
  const handleHighlightChange = useCallback((msg: { sender_name: string; message: string } | null) => {
    setHighlightedMessage(msg ? { sender_name: msg.sender_name, message: msg.message } : null)
  }, [])

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const joinTrackedRef = useRef(false)

  // Enumerate video input devices for the camera picker (host only)
  useEffect(() => {
    if (!isHost) return
    async function enumerateDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === 'videoinput' && d.deviceId)
        setVideoDevices(cameras)
      } catch {
        // Permissions not yet granted — retry after join
      }
    }
    enumerateDevices()
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices)
    return () => navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices)
  }, [isHost])

  // Close device picker on outside click
  useEffect(() => {
    if (!showDevicePicker) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (devicePickerRef.current && !devicePickerRef.current.contains(e.target as Node)) {
        setShowDevicePicker(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showDevicePicker])

  // After joining, re-enumerate (permissions are now granted and labels available)
  useEffect(() => {
    if (meetingState !== 'joined-meeting' || !isHost) return
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setVideoDevices(devices.filter(d => d.kind === 'videoinput' && d.deviceId))
    }).catch(() => {})
  }, [meetingState, isHost])

  // Switch camera source
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!daily) return
    try {
      await daily.setInputDevicesAsync({ videoDeviceId: deviceId })
      setActiveVideoDeviceId(deviceId)
      if (!cameraEnabled) {
        await daily.setLocalVideo(true)
        setCameraEnabled(true)
      }
      setShowDevicePicker(false)
    } catch (err) {
      console.error('Failed to switch camera:', err)
    }
  }, [daily, cameraEnabled])

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

        // Auto-start recording for the host.
        // Group/workshop sessions use cloud recording with active-speaker layout.
        // 1:1 sessions use raw-tracks (individual files per participant).
        if (isHost) {
          try {
            if (isGroupSession) {
              await daily.startRecording({
                layout: { preset: 'active-participant' },
              })
            } else {
              await daily.startRecording()
            }
          } catch (recErr) {
            console.error('Failed to auto-start recording:', recErr)
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
      } catch (err: any) {
        const message = err?.message || err?.error || err?.errorMsg || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Failed to join call'
        console.error('Error joining call:', message, err)
        setError(message)
        onError?.(new Error(message))
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

  // Audio safety: ensure we stay subscribed to all remote audio tracks.
  // This guards against edge cases where track subscriptions silently drop
  // (e.g., after a network reconnect or when a remote participant toggles their mic).
  useEffect(() => {
    if (!daily || meetingState !== 'joined-meeting') return

    const ensureAudioSubscriptions = () => {
      const participants = daily.participants()
      for (const [id, p] of Object.entries(participants)) {
        if (id === 'local') continue
        const tracks = p?.tracks
        if (tracks?.audio?.subscribed === false) {
          daily.updateParticipant(id, {
            setSubscribedTracks: { audio: true, video: true, screenAudio: true, screenVideo: true },
          })
        }
      }
    }

    ensureAudioSubscriptions()

    daily.on('participant-updated', ensureAudioSubscriptions)
    daily.on('track-started', ensureAudioSubscriptions)

    return () => {
      daily.off('participant-updated', ensureAudioSubscriptions)
      daily.off('track-started', ensureAudioSubscriptions)
    }
  }, [daily, meetingState])

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

  // Toggle layout mode
  const toggleLayout = useCallback(() => {
    setLayoutMode(prev => prev === 'speaker' ? 'grid' : 'speaker')
  }, [])

  const [screenShareError, setScreenShareError] = useState<string | null>(null)

  // Toggle screen share with error handling
  const toggleScreenShare = useCallback(async () => {
    setScreenShareError(null)
    if (isSharingScreen) {
      stopScreenShare()
    } else {
      try {
        await startScreenShare()
      } catch (err: any) {
        const msg = err?.message || err?.errorMsg || String(err)
        console.error('Screen share failed:', msg, err)
        if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
          setScreenShareError('Screen share permission denied. Check your browser settings.')
        } else {
          setScreenShareError(`Screen share failed: ${msg}`)
        }
        setTimeout(() => setScreenShareError(null), 5000)
      }
    }
  }, [isSharingScreen, startScreenShare, stopScreenShare])

  // Start/stop recording (host only)
  const toggleRecording = useCallback(async () => {
    if (!daily || !isHost) return
    if (isRecording) {
      await daily.stopRecording()
    } else {
      // Use active-participant layout (shows whoever is speaking) for all session types
      await daily.startRecording({
        layout: { preset: 'active-participant' },
      })
    }
  }, [daily, isRecording, isHost, sessionType])

  // Mute all remote participants (host only).
  // Uses setAudio only — no permission changes that could brick the call.
  const muteAll = useCallback(() => {
    if (!daily || !isHost) return
    const participants = daily.participants()
    for (const [id] of Object.entries(participants)) {
      if (id === 'local') continue
      daily.updateParticipant(id, { setAudio: false })
    }
  }, [daily, isHost])

  // Unmute a specific participant (host only).
  const allowToSpeak = useCallback((sessionId: string) => {
    if (!daily || !isHost) return
    daily.updateParticipant(sessionId, { setAudio: true })
  }, [daily, isHost])

  // Mute a specific participant (host only).
  const revokeSpeak = useCallback((sessionId: string) => {
    if (!daily || !isHost) return
    daily.updateParticipant(sessionId, { setAudio: false })
  }, [daily, isHost])

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

    const stats = { durationSeconds: callDuration, wasRecording: isRecording }

    if (daily) {
      await daily.leave()
    }
    onLeave?.(stats)
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

  // For group sessions: show the active speaker. For 1:1: show the one remote participant.
  const featuredParticipantId = isGroupSession
    ? (activeSpeakerId && activeSpeakerId !== localParticipant?.session_id
        ? activeSpeakerId
        : participantIds[0])
    : participantIds[0]

  // Determine if anyone is sharing their screen (local or remote)
  const activeScreenShare = screens.length > 0 ? screens[0] : null

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
          <Button variant="primary" onClick={() => onLeave?.({ durationSeconds: 0, wasRecording: false })}>
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
          <Button variant="primary" onClick={() => onLeave?.({ durationSeconds: 0, wasRecording: false })} className="mt-4">
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
          {/* Screen share takes top priority regardless of layout */}
          {activeScreenShare ? (
            <>
              <div className="absolute inset-0">
                <DailyVideo
                  fit="contain"
                  sessionId={activeScreenShare.session_id}
                  type="screenVideo"
                  className="w-full h-full bg-black"
                />
              </div>
              {featuredParticipantId && (
                <div className="absolute top-4 right-4 w-36 md:w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800 z-10">
                  <RemoteParticipantTile participantId={featuredParticipantId} />
                </div>
              )}
              <div className="absolute bottom-4 right-4 w-28 md:w-40 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800 z-10">
                <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} />
              </div>
            </>
          ) : layoutMode === 'grid' && isGroupSession && participantIds.length > 0 ? (
            /* ─── Grid Layout ─── */
            <div className="absolute inset-0 p-2 md:p-3">
              <GridLayout
                localParticipant={localParticipant}
                cameraEnabled={cameraEnabled}
                micEnabled={micEnabled}
                userName={userName}
                participantIds={participantIds}
                activeSpeakerId={activeSpeakerId}
              />
            </div>
          ) : (
            /* ─── Speaker Layout (default) ─── */
            <>
              <div className={`absolute inset-0 ${isGroupSession && participantIds.length > 1 ? 'bottom-24 md:bottom-28' : ''}`}>
                {featuredParticipantId ? (
                  <RemoteParticipantTile participantId={featuredParticipantId} />
                ) : (
                  <EmptyRoomPlaceholder isHost={isHost} waitingSeconds={waitingSeconds} formatDuration={formatDuration} />
                )}
              </div>
              {/* Filmstrip of other participants in speaker view (group sessions, 2+ remote) */}
              {isGroupSession && participantIds.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-24 md:h-28 bg-neutral-900/80 backdrop-blur-sm flex items-center gap-2 px-3 overflow-x-auto z-10">
                  {participantIds
                    .filter(id => id !== featuredParticipantId)
                    .map(id => (
                      <FilmstripTile key={id} participantId={id} isActiveSpeaker={activeSpeakerId === id} />
                    ))
                  }
                  <div className="relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 border-2 border-neutral-700 bg-neutral-800">
                    <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} />
                  </div>
                </div>
              )}
              {/* Self PiP when alone or only one remote participant */}
              {(!isGroupSession || participantIds.length <= 1) && (
                <div className="absolute bottom-4 right-4 w-36 md:w-56 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800 z-10">
                  <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} />
                </div>
              )}
            </>
          )}

          {/* Participants panel */}
          {showParticipants && (
            <div className="absolute top-4 right-4 z-20">
              <ParticipantsPanel 
                localName={userName}
                cameraEnabled={cameraEnabled}
                micEnabled={micEnabled}
                participantIds={participantIds}
                isHost={isHost}
                isGroupSession={isGroupSession}
                onAllowToSpeak={allowToSpeak}
                onRevokeSpeak={revokeSpeak}
                onClose={() => setShowParticipants(false)}
              />
            </div>
          )}
        </div>

        {/* Side Panel — context-aware by session type */}
        
        {/* 1:1 sessions: Member context panel for host */}
        {showMemberPanel && memberUserId && isHost && (
          <div className="hidden md:flex flex-col w-80 flex-shrink-0 border-l border-neutral-800">
            <MemberContextPanel memberUserId={memberUserId} />
          </div>
        )}

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
                onHighlightChange={handleHighlightChange}
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
                onHighlightChange={handleHighlightChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Screen share error toast */}
      {screenShareError && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/20 border-t border-red-500/30 text-center">
          <p className="text-sm text-red-300">{screenShareError}</p>
        </div>
      )}

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

          {/* Layout toggle (group sessions) */}
          {isGroupSession && (
            <button
              onClick={toggleLayout}
              className={`h-12 md:h-14 rounded-full flex items-center justify-center gap-2 transition-all duration-200 px-4 md:px-5 ${
                layoutMode === 'grid'
                  ? 'bg-secondary-500/20 text-secondary-500'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title={layoutMode === 'grid' ? 'Switch to speaker view' : 'Switch to grid view'}
            >
              {layoutMode === 'grid' ? <Monitor className="w-5 h-5 md:w-6 md:h-6" /> : <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />}
              <span className="hidden md:inline text-xs font-medium">
                {layoutMode === 'grid' ? 'Speaker' : 'Grid'}
              </span>
            </button>
          )}

          {/* Camera source picker (host only, multiple cameras) */}
          {isHost && videoDevices.length > 1 && (
            <div className="relative" ref={devicePickerRef}>
              <button
                onClick={() => setShowDevicePicker(prev => !prev)}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  showDevicePicker
                    ? 'bg-accent-500/20 text-accent-500'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                }`}
                title="Switch camera source"
              >
                <Camera className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              {showDevicePicker && (
                <div className="absolute bottom-full mb-2 right-0 w-72 bg-neutral-900/95 backdrop-blur rounded-2xl border border-neutral-700 p-3 shadow-2xl z-30">
                  <p className="text-xs text-neutral-400 font-medium mb-2 px-1">Camera Source</p>
                  <div className="space-y-1">
                    {videoDevices.map((device, idx) => {
                      const isActive = activeVideoDeviceId
                        ? device.deviceId === activeVideoDeviceId
                        : idx === 0
                      return (
                        <button
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-500/20 text-primary-400 font-medium'
                              : 'text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <span className="block truncate">
                            {device.label || `Camera ${idx + 1}`}
                          </span>
                          {device.label.toLowerCase().includes('obs') && (
                            <span className="text-[10px] text-accent-400 mt-0.5 block">OBS Virtual Camera</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2 px-1 leading-relaxed">
                    Use OBS Virtual Camera with Stream Deck for scene switching
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recording (host only — auto-starts, but host can stop/restart) */}
          {isHost && (
            <button
              onClick={toggleRecording}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title={isRecording ? 'Stop recording' : 'Resume recording'}
            >
              {isRecording ? <Square className="w-4 h-4 md:w-5 md:h-5" /> : <Circle className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          )}

          {/* Mute All (host only, group sessions) */}
          {isHost && isGroupSession && participantIds.length > 0 && (
            <button
              onClick={muteAll}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 bg-neutral-700 hover:bg-neutral-600 text-white"
              title="Mute all participants"
            >
              <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
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

          {/* Member context panel toggle (1:1 host only) */}
          {sessionType === 'one_on_one' && isHost && memberUserId && (
            <button
              onClick={() => {
                setShowMemberPanel(!showMemberPanel)
                if (!showMemberPanel) setShowChat(false) // close chat when opening member panel
              }}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                showMemberPanel 
                  ? 'bg-accent-500/20 text-accent-500' 
                  : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title="Member Info"
            >
              <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Chat (only if sessionId is available) */}
          {sessionId && (
            <button
              onClick={() => {
                setShowChat(!showChat)
                if (!showChat) setShowMemberPanel(false) // close member panel when opening chat
              }}
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

// Local video PiP tile (extracted to share between layouts)
function LocalVideoTile({
  localParticipant,
  cameraEnabled,
  userName,
  micEnabled,
}: {
  localParticipant: ReturnType<typeof useLocalParticipant>
  cameraEnabled: boolean
  userName: string
  micEnabled: boolean
}) {
  return (
    <>
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
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">You</span>
        {!micEnabled && <MicOff className="w-3 h-3 text-red-400" />}
      </div>
    </>
  )
}

// Empty room placeholder (no remote participants yet)
function EmptyRoomPlaceholder({
  isHost,
  waitingSeconds,
  formatDuration,
}: {
  isHost: boolean
  waitingSeconds: number
  formatDuration: (s: number) => string
}) {
  return (
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
            <p className="text-neutral-500 text-sm mt-2">Members will appear here when they join</p>
          </>
        ) : (
          <>
            <p className="text-white text-lg font-medium">Waiting for host to join</p>
            <p className="text-neutral-500 text-sm mt-2">The session will begin once the host arrives</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-neutral-800/80 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-neutral-300 text-sm font-mono">{formatDuration(waitingSeconds)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Grid layout for group sessions
function GridLayout({
  localParticipant,
  cameraEnabled,
  micEnabled,
  userName,
  participantIds,
  activeSpeakerId,
}: {
  localParticipant: ReturnType<typeof useLocalParticipant>
  cameraEnabled: boolean
  micEnabled: boolean
  userName: string
  participantIds: string[]
  activeSpeakerId: string | null
}) {
  const totalTiles = participantIds.length + 1
  const cols =
    totalTiles <= 1 ? 1 :
    totalTiles <= 4 ? 2 :
    totalTiles <= 9 ? 3 :
    4

  return (
    <div
      className="w-full h-full grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: '1fr',
      }}
    >
      {/* Local user tile */}
      <div
        className={`relative rounded-xl overflow-hidden bg-neutral-800 border-2 transition-colors ${
          activeSpeakerId === localParticipant?.session_id
            ? 'border-primary-500'
            : 'border-neutral-700'
        }`}
      >
        <LocalVideoTile
          localParticipant={localParticipant}
          cameraEnabled={cameraEnabled}
          userName={userName}
          micEnabled={micEnabled}
        />
      </div>

      {/* Remote participant tiles */}
      {participantIds.map(id => (
        <GridParticipantTile
          key={id}
          participantId={id}
          isActiveSpeaker={activeSpeakerId === id}
        />
      ))}
    </div>
  )
}

// Individual grid tile for a remote participant
function GridParticipantTile({
  participantId,
  isActiveSpeaker,
}: {
  participantId: string
  isActiveSpeaker: boolean
}) {
  const participant = useParticipant(participantId)
  if (!participant) return null

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-neutral-800 border-2 transition-colors ${
        isActiveSpeaker ? 'border-primary-500' : 'border-neutral-700'
      }`}
    >
      {participant.video ? (
        <DailyVideo
          fit="cover"
          sessionId={participantId}
          type="video"
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-900">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-neutral-400">
              {participant.user_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full truncate max-w-[70%]">
          {participant.user_name || 'Participant'}
        </span>
        <div className="flex items-center gap-1">
          {!participant.audio && <MicOff className="w-3 h-3 text-red-400" />}
          {!participant.video && <VideoOff className="w-3 h-3 text-red-400" />}
        </div>
      </div>
    </div>
  )
}

// Filmstrip thumbnail tile (speaker view, group sessions)
function FilmstripTile({
  participantId,
  isActiveSpeaker,
}: {
  participantId: string
  isActiveSpeaker: boolean
}) {
  const participant = useParticipant(participantId)
  if (!participant) return null

  return (
    <div
      className={`relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
        isActiveSpeaker ? 'border-primary-500' : 'border-neutral-700'
      } bg-neutral-800`}
    >
      {participant.video ? (
        <DailyVideo
          fit="cover"
          sessionId={participantId}
          type="video"
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-900">
          <span className="text-lg font-bold text-neutral-400">
            {participant.user_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
        <span className="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded-full truncate max-w-[70%]">
          {participant.user_name || 'Participant'}
        </span>
        {!participant.audio && <MicOff className="w-2.5 h-2.5 text-red-400" />}
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
  isHost,
  isGroupSession,
  onAllowToSpeak,
  onRevokeSpeak,
  onClose,
}: { 
  localName: string
  cameraEnabled: boolean
  micEnabled: boolean
  participantIds: string[]
  isHost: boolean
  isGroupSession: boolean
  onAllowToSpeak: (sessionId: string) => void
  onRevokeSpeak: (sessionId: string) => void
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
          <RemoteParticipantRow
            key={id}
            participantId={id}
            showHostControls={isHost && isGroupSession}
            onAllowToSpeak={onAllowToSpeak}
            onRevokeSpeak={onRevokeSpeak}
          />
        ))}
      </div>
    </div>
  )
}

function RemoteParticipantRow({
  participantId,
  showHostControls,
  onAllowToSpeak,
  onRevokeSpeak,
}: {
  participantId: string
  showHostControls: boolean
  onAllowToSpeak: (sessionId: string) => void
  onRevokeSpeak: (sessionId: string) => void
}) {
  const participant = useParticipant(participantId)
  
  if (!participant) return null

  const hasAudio = !!participant.audio

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
        {showHostControls ? (
          <button
            onClick={() => hasAudio
              ? onRevokeSpeak(participantId)
              : onAllowToSpeak(participantId)
            }
            className={`p-1 rounded-full transition-colors ${
              hasAudio
                ? 'bg-green-500/20 hover:bg-green-500/30'
                : 'bg-neutral-700 hover:bg-neutral-600'
            }`}
            title={hasAudio ? 'Mute' : 'Unmute'}
          >
            {hasAudio ? (
              <Mic className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>
        ) : (
          hasAudio ? (
            <Mic className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-neutral-500" />
          )
        )}
      </div>
    </div>
  )
}

export default VideoCall
