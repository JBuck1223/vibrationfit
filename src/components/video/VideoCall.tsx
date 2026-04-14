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
  Crown,
  ChevronLeft,
  ChevronRight,
  Hand,
  RefreshCw,
  Volume2,
  Lock,
  Unlock,
  Send,
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
  userProfilePic?: string | null
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
  userProfilePic,
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
    isGroupSession ? 'grid' : 'speaker'
  )

  // Grid pagination
  const [currentGridPage, setCurrentGridPage] = useState(0)

  // Mute lock: when active, participants cannot unmute themselves
  const [muteLockActive, setMuteLockActive] = useState(false)

  // Speaker unlock: non-host participants granted temporary speaking rights by the host
  const [isSpeakerUnlocked, setIsSpeakerUnlocked] = useState(false)

  // Hand raise tracking: map of Daily session_id → { name, note, timestamp }
  type RaisedHand = { name: string; note: string; timestamp: number }
  const [raisedHands, setRaisedHands] = useState<Map<string, RaisedHand>>(new Map())
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [handRaiseNote, setHandRaiseNote] = useState('')
  const [showHandRaiseInput, setShowHandRaiseInput] = useState(false)
  const [showRaisedHands, setShowRaisedHands] = useState(false)

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

        // Auto-activate mute lock for group sessions so participants see the
        // locked UI immediately and cannot unmute until the host grants permission.
        if (isHost && isGroupSession) {
          setMuteLockActive(true)
          daily.sendAppMessage({ type: 'mute-lock-state', locked: true }, '*')
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
  // IMPORTANT: Only checks `subscribed === false` (a dropped subscription).
  // Does NOT react to `state === 'off'` — that just means the remote participant
  // has their mic muted, which is normal and does not need re-subscription.
  // Avoids listening to `participant-updated` to prevent cascading loops when
  // the host mutes/unmutes participants (setAudio triggers participant-updated,
  // which would re-trigger this, creating a feedback loop that kills audio).
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

    // Priority host-audio guard: on participant side, immediately re-subscribe
    // if the host (owner) audio track drops. The host track is the most critical —
    // participants must NEVER lose the ability to hear the host.
    const ensureHostAudio = () => {
      if (isHost) return
      const participants = daily.participants()
      for (const [id, p] of Object.entries(participants)) {
        if (id === 'local' || !p.owner) continue
        if (p.tracks?.audio?.subscribed === false) {
          daily.updateParticipant(id, {
            setSubscribedTracks: { audio: true, video: true, screenAudio: true, screenVideo: true },
          })
        }
      }
    }

    ensureAudioSubscriptions()

    // Listen to track lifecycle events — NOT participant-updated
    daily.on('track-started', ensureAudioSubscriptions)
    daily.on('track-stopped', ensureHostAudio)
    daily.on('participant-joined', ensureAudioSubscriptions)

    // Periodic fallback every 5s to catch silent subscription drops
    const periodicCheck = setInterval(ensureAudioSubscriptions, 5000)

    return () => {
      daily.off('track-started', ensureAudioSubscriptions)
      daily.off('track-stopped', ensureHostAudio)
      daily.off('participant-joined', ensureAudioSubscriptions)
      clearInterval(periodicCheck)
    }
  }, [daily, meetingState, isHost])

  // Mute lock enforcement: when active, re-mute any non-host who unmutes.
  // IMPORTANT: Uses ONLY `setAudio: false` which controls the participant's
  // MICROPHONE (outgoing audio). This NEVER touches subscriptions
  // (setSubscribedTracks), so participants can always HEAR the host.
  // Uses a debounced interval instead of participant-updated to avoid
  // feedback loops (setAudio triggers participant-updated which would
  // re-trigger enforcement).
  const muteLockRef = useRef(muteLockActive)
  useEffect(() => { muteLockRef.current = muteLockActive }, [muteLockActive])

  // Track which participant session_ids are currently unlocked to speak (host-side)
  const unlockedSpeakersRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!daily || meetingState !== 'joined-meeting' || !isHost) return

    const enforceMuteLock = () => {
      if (!muteLockRef.current) return
      const participants = daily.participants()
      for (const [id, p] of Object.entries(participants)) {
        if (id === 'local') continue
        if (p.audio && !p.owner && !unlockedSpeakersRef.current.has(id)) {
          daily.updateParticipant(id, { setAudio: false })
        }
      }
    }

    // Poll every 2 seconds — fast enough to catch unmute attempts,
    // but avoids the feedback loops of event-driven enforcement
    const interval = setInterval(enforceMuteLock, 2000)
    return () => clearInterval(interval)
  }, [daily, meetingState, isHost])

  // App message handling: hand raises, mute lock state, audio reset
  useEffect(() => {
    if (!daily || meetingState !== 'joined-meeting') return

    const handleAppMessage = (event: { data: any; fromId: string }) => {
      const { data, fromId } = event

      if (data?.type === 'hand-raise') {
        setRaisedHands(prev => {
          const next = new Map(prev)
          next.set(fromId, { name: data.name || 'Participant', note: data.note || '', timestamp: Date.now() })
          return next
        })
      }

      if (data?.type === 'hand-lower') {
        setRaisedHands(prev => {
          const next = new Map(prev)
          next.delete(fromId)
          return next
        })
      }

      if (data?.type === 'mute-lock-state') {
        if (!isHost) {
          setMuteLockActive(data.locked)
          if (data.locked) {
            // Reset speaker unlock — host re-locked, all speakers revoked
            setIsSpeakerUnlocked(false)
            // Only mute the local MICROPHONE — setLocalAudio controls outgoing
            // audio only. The participant can still HEAR everyone normally.
            daily.setLocalAudio(false)
            setMicEnabled(false)
          }
        }
      }

      if (data?.type === 'audio-reset-request') {
        // Participant received a reset request from host.
        // Re-subscribe to audio one participant at a time (sequential, not all at once)
        // to avoid dropping all audio simultaneously.
        const parts = daily.participants()
        const remoteIds = Object.keys(parts).filter(id => id !== 'local')
        let i = 0
        const resubNext = () => {
          if (i >= remoteIds.length) {
            daily.sendAppMessage({ type: 'audio-reset-ack', name: userName }, '*')
            return
          }
          const id = remoteIds[i]
          daily.updateParticipant(id, {
            setSubscribedTracks: { audio: true, video: true, screenAudio: true, screenVideo: true },
          })
          i++
          setTimeout(resubNext, 200)
        }
        resubNext()
      }

      if (data?.type === 'audio-reset-ack' && isHost) {
        console.log(`Audio reset acknowledged by ${data.name}`)
      }

      // Participant received speaker-unlock from host
      if (data?.type === 'speaker-unlocked' && !isHost) {
        const local = daily.participants()?.local
        if (local && data.targetId === local.session_id) {
          setIsSpeakerUnlocked(true)
        }
      }

      // Participant received speaker-lock from host
      if (data?.type === 'speaker-locked' && !isHost) {
        const local = daily.participants()?.local
        if (local && data.targetId === local.session_id) {
          setIsSpeakerUnlocked(false)
          daily.setLocalAudio(false)
          setMicEnabled(false)
        }
      }
    }

    daily.on('app-message', handleAppMessage as any)

    // When a new participant joins, send them the current mute lock state
    const handleParticipantJoined = (event: any) => {
      if (isHost && muteLockRef.current && event?.participant?.session_id) {
        daily.sendAppMessage(
          { type: 'mute-lock-state', locked: true },
          event.participant.session_id
        )
      }
    }
    daily.on('participant-joined', handleParticipantJoined)

    // Clean up raised hands when someone leaves
    const handleParticipantLeft = (event: any) => {
      if (event?.participant?.session_id) {
        setRaisedHands(prev => {
          const next = new Map(prev)
          next.delete(event.participant.session_id)
          return next
        })
      }
    }
    daily.on('participant-left', handleParticipantLeft)

    return () => {
      daily.off('app-message', handleAppMessage as any)
      daily.off('participant-joined', handleParticipantJoined)
      daily.off('participant-left', handleParticipantLeft)
    }
  }, [daily, meetingState, isHost, userName])

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!daily) return
    const newState = !cameraEnabled
    await daily.setLocalVideo(newState)
    setCameraEnabled(newState)
  }, [daily, cameraEnabled])

  // Toggle microphone (respects mute lock for non-host, allows unlocked speakers)
  const toggleMic = useCallback(async () => {
    if (!daily) return
    if (!micEnabled && muteLockActive && !isHost && !isSpeakerUnlocked) return
    const newState = !micEnabled
    await daily.setLocalAudio(newState)
    setMicEnabled(newState)
  }, [daily, micEnabled, muteLockActive, isHost, isSpeakerUnlocked])

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

  // Unmute a specific participant and grant speaking rights (host only).
  const allowToSpeak = useCallback((participantSessionId: string) => {
    if (!daily || !isHost) return
    unlockedSpeakersRef.current.add(participantSessionId)
    daily.updateParticipant(participantSessionId, { setAudio: true })
    daily.sendAppMessage({ type: 'speaker-unlocked', targetId: participantSessionId }, '*')
  }, [daily, isHost])

  // Mute a specific participant and revoke speaking rights (host only).
  const revokeSpeak = useCallback((participantSessionId: string) => {
    if (!daily || !isHost) return
    unlockedSpeakersRef.current.delete(participantSessionId)
    daily.updateParticipant(participantSessionId, { setAudio: false })
    daily.sendAppMessage({ type: 'speaker-locked', targetId: participantSessionId }, '*')
  }, [daily, isHost])

  // Turn off a remote participant's camera (host only).
  // Uses setVideo only — NEVER touches subscriptions.
  const toggleRemoteVideo = useCallback((participantSessionId: string, videoOn: boolean) => {
    if (!daily || !isHost) return
    daily.updateParticipant(participantSessionId, { setVideo: videoOn })
  }, [daily, isHost])

  // Toggle mute lock: mute everyone's MIC and prevent self-unmuting (host only).
  // ONLY uses setAudio (microphone) — NEVER touches subscriptions (hearing).
  const toggleMuteLock = useCallback(() => {
    if (!daily || !isHost) return
    const newState = !muteLockActive
    setMuteLockActive(newState)

    if (newState) {
      // Revoke all unlocked speakers and mute all remote participants' MICROPHONES
      unlockedSpeakersRef.current.clear()
      const participants = daily.participants()
      for (const [id, p] of Object.entries(participants)) {
        if (id === 'local') continue
        if (!p.owner) {
          daily.updateParticipant(id, { setAudio: false })
          daily.sendAppMessage({ type: 'speaker-locked', targetId: id }, '*')
        }
      }
    }

    // Broadcast mute lock state to all participants
    daily.sendAppMessage({ type: 'mute-lock-state', locked: newState }, '*')
  }, [daily, isHost, muteLockActive])

  // Reset a participant's audio (host only): asks their client to re-subscribe
  const resetParticipantAudio = useCallback((participantSessionId: string) => {
    if (!daily || !isHost) return
    daily.sendAppMessage({ type: 'audio-reset-request' }, participantSessionId)
  }, [daily, isHost])

  // Raise hand with optional note
  const raiseHand = useCallback((note: string = '') => {
    if (!daily) return
    setIsHandRaised(true)
    daily.sendAppMessage({ type: 'hand-raise', name: userName, note }, '*')
  }, [daily, userName])

  // Lower hand
  const lowerHand = useCallback(() => {
    if (!daily) return
    setIsHandRaised(false)
    setHandRaiseNote('')
    setShowHandRaiseInput(false)
    daily.sendAppMessage({ type: 'hand-lower' }, '*')
  }, [daily])

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
                <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} showHostBadge={isHost} />
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
                isHost={isHost}
                currentPage={currentGridPage}
                onPageChange={setCurrentGridPage}
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
                    <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} showHostBadge={isHost} />
                  </div>
                </div>
              )}
              {/* Self PiP when alone or only one remote participant */}
              {(!isGroupSession || participantIds.length <= 1) && (
                <div className="absolute bottom-4 right-4 w-36 md:w-56 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700 bg-neutral-800 z-10">
                  <LocalVideoTile localParticipant={localParticipant} cameraEnabled={cameraEnabled} userName={userName} micEnabled={micEnabled} showHostBadge={isHost} />
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
                onToggleRemoteVideo={toggleRemoteVideo}
                onResetAudio={resetParticipantAudio}
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
                currentUserProfilePic={userProfilePic}
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
                currentUserProfilePic={userProfilePic}
                isHost={isHost}
                onClose={() => setShowChat(false)}
                onHighlightChange={handleHighlightChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Hand raise input popover (above control bar) */}
      {showHandRaiseInput && !isHandRaised && !isHost && (
        <div className="flex-shrink-0 px-4 py-3 bg-neutral-800/95 border-t border-neutral-700">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={handRaiseNote}
              onChange={(e) => setHandRaiseNote(e.target.value)}
              placeholder="Optional note (e.g. I have a question about...)"
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-energy-500/50"
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  raiseHand(handRaiseNote)
                  setShowHandRaiseInput(false)
                }
              }}
            />
            <button
              onClick={() => {
                raiseHand(handRaiseNote)
                setShowHandRaiseInput(false)
              }}
              className="px-4 py-2 bg-energy-500 text-black rounded-full text-sm font-medium hover:bg-energy-400 transition-colors"
            >
              Raise
            </button>
            <button
              onClick={() => { setShowHandRaiseInput(false); setHandRaiseNote('') }}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Raised hands panel (host only) */}
      {showRaisedHands && isHost && raisedHands.size > 0 && (
        <div className="flex-shrink-0 px-4 py-3 bg-neutral-800/95 border-t border-neutral-700">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Hand className="w-4 h-4 text-energy-500" />
              <span className="text-sm font-medium text-white">Raised Hands ({raisedHands.size})</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {Array.from(raisedHands.entries()).map(([sessionId, hand]) => {
                const isUnlocked = unlockedSpeakersRef.current.has(sessionId)
                return (
                  <div key={sessionId} className="bg-neutral-900/80 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Hand className="w-3.5 h-3.5 text-energy-500 flex-shrink-0" />
                      <span className="text-sm text-white font-medium">{hand.name}</span>
                      {isUnlocked && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary-500/20 text-primary-400 rounded-full font-medium">SPEAKING</span>
                      )}
                      <div className="flex-1" />
                      {isUnlocked ? (
                        <button
                          onClick={() => revokeSpeak(sessionId)}
                          className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                        >
                          Mute
                        </button>
                      ) : (
                        <button
                          onClick={() => allowToSpeak(sessionId)}
                          className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full hover:bg-primary-500/30 transition-colors"
                        >
                          Unmute
                        </button>
                      )}
                    </div>
                    {hand.note && (
                      <p className="text-xs text-neutral-400 mt-1 ml-5.5 pl-0.5 italic">&ldquo;{hand.note}&rdquo;</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mute lock notice for participants (hidden when speaker-unlocked) */}
      {muteLockActive && !isHost && !isSpeakerUnlocked && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-center">
          <p className="text-xs text-red-300 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Mics are locked by the host. Raise your hand to request to speak.
          </p>
        </div>
      )}
      {/* Speaker unlocked notice */}
      {isSpeakerUnlocked && !isHost && (
        <div className="flex-shrink-0 px-4 py-2 bg-primary-500/10 border-t border-primary-500/20 text-center">
          <p className="text-xs text-primary-300 flex items-center justify-center gap-1.5">
            <Unlock className="w-3 h-3" />
            You have been granted permission to speak
          </p>
        </div>
      )}

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

          {/* Mic toggle — hidden for locked non-host participants in group sessions */}
          {(isHost || !isGroupSession || !muteLockActive || isSpeakerUnlocked) && (
            <button
              onClick={toggleMic}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                muteLockActive && !isHost && !isSpeakerUnlocked
                  ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                  : micEnabled 
                    ? 'bg-neutral-700 hover:bg-neutral-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={muteLockActive && !isHost && !isSpeakerUnlocked ? 'Mics locked by host' : micEnabled ? 'Mute' : 'Unmute'}
            >
              {muteLockActive && !isHost && !isSpeakerUnlocked ? (
                <Lock className="w-5 h-5 md:w-6 md:h-6" />
              ) : micEnabled ? (
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <MicOff className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          )}

          {/* Screen share — hidden for locked participants in group sessions */}
          {(isHost || !isGroupSession || !muteLockActive || isSpeakerUnlocked) && (
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
          )}

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

          {/* Mute Lock toggle (host only, group sessions — always visible, disabled when empty) */}
          {isHost && isGroupSession && (
            <button
              onClick={toggleMuteLock}
              disabled={participantIds.length === 0 && !muteLockActive}
              className={`h-12 md:h-14 rounded-full flex items-center justify-center gap-2 transition-all duration-200 px-4 md:px-5 ${
                participantIds.length === 0 && !muteLockActive
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : muteLockActive
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title={muteLockActive ? 'Unlock mics (allow participants to unmute)' : 'Lock mics (mute all & prevent unmuting)'}
            >
              {muteLockActive ? <Lock className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
              <span className="hidden md:inline text-xs font-medium">
                {muteLockActive ? 'Unlock Mics' : 'Mute All'}
              </span>
            </button>
          )}

          {/* Hand Raise (all users in group sessions) */}
          {isGroupSession && !isHost && (
            isHandRaised ? (
              <button
                onClick={lowerHand}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 bg-energy-500/20 text-energy-500 animate-pulse"
                title="Lower hand"
              >
                <Hand className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            ) : (
              <button
                onClick={() => setShowHandRaiseInput(prev => !prev)}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  showHandRaiseInput ? 'bg-energy-500/20 text-energy-500' : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                }`}
                title="Raise hand"
              >
                <Hand className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )
          )}

          {/* Raised Hands indicator (host only, group sessions) */}
          {isHost && isGroupSession && (
            <button
              onClick={() => setShowRaisedHands(prev => !prev)}
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                showRaisedHands
                  ? 'bg-energy-500/20 text-energy-500'
                  : raisedHands.size > 0
                    ? 'bg-energy-500/10 text-energy-400'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
              }`}
              title={`Raised hands (${raisedHands.size})`}
            >
              <Hand className="w-5 h-5 md:w-6 md:h-6" />
              {raisedHands.size > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-energy-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {raisedHands.size}
                </span>
              )}
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
  showHostBadge = false,
}: {
  localParticipant: ReturnType<typeof useLocalParticipant>
  cameraEnabled: boolean
  userName: string
  micEnabled: boolean
  showHostBadge?: boolean
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
        <div className="flex items-center gap-1.5">
          {showHostBadge && (
            <span className="flex items-center gap-1 text-[10px] bg-energy-500 text-black px-2 py-0.5 rounded-full font-bold">
              <Crown className="w-2.5 h-2.5" />
              HOST
            </span>
          )}
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">You</span>
        </div>
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

// Grid layout for group sessions with pagination
function GridLayout({
  localParticipant,
  cameraEnabled,
  micEnabled,
  userName,
  participantIds,
  activeSpeakerId,
  isHost,
  currentPage,
  onPageChange,
}: {
  localParticipant: ReturnType<typeof useLocalParticipant>
  cameraEnabled: boolean
  micEnabled: boolean
  userName: string
  participantIds: string[]
  activeSpeakerId: string | null
  isHost: boolean
  currentPage: number
  onPageChange: (page: number) => void
}) {
  const TILES_PER_PAGE = 8 // remote tiles per page (+ 1 local = 9 tiles = 3x3)
  const totalRemote = participantIds.length
  const totalPages = Math.max(1, Math.ceil(totalRemote / TILES_PER_PAGE))
  const page = Math.min(currentPage, totalPages - 1)

  const startIdx = page * TILES_PER_PAGE
  const pageParticipantIds = participantIds.slice(startIdx, startIdx + TILES_PER_PAGE)
  const visibleTiles = pageParticipantIds.length + 1 // +1 for local

  const cols =
    visibleTiles <= 1 ? 1 :
    visibleTiles <= 4 ? 2 :
    visibleTiles <= 9 ? 3 :
    4

  return (
    <div className="w-full h-full flex flex-col">
      {/* Grid */}
      <div
        className="flex-1 grid gap-2 min-h-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: '1fr',
        }}
      >
        {/* Local user tile (always visible on every page) */}
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
            showHostBadge={isHost}
          />
        </div>

        {/* Remote participant tiles for this page */}
        {pageParticipantIds.map(id => (
          <GridParticipantTile
            key={id}
            participantId={id}
            isActiveSpeaker={activeSpeakerId === id}
          />
        ))}
      </div>

      {/* Pagination controls (only if more than one page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-full text-white disabled:text-neutral-600 hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === page ? 'bg-primary-500' : 'bg-neutral-600 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-full text-white disabled:text-neutral-600 hover:bg-neutral-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-neutral-500 ml-1">
            {totalRemote + 1} participants
          </span>
        </div>
      )}
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

  const isOwner = !!participant.owner

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
      {/* Host badge (top-left) */}
      {isOwner && (
        <div className="absolute top-2 left-2 z-10">
          <span className="flex items-center gap-1 text-[10px] bg-energy-500 text-black px-2 py-0.5 rounded-full font-bold shadow-lg">
            <Crown className="w-2.5 h-2.5" />
            HOST
          </span>
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

  const isOwner = !!participant.owner

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
      {isOwner && (
        <div className="absolute top-1 left-1 z-10">
          <span className="flex items-center gap-0.5 text-[8px] bg-energy-500 text-black px-1.5 py-0.5 rounded-full font-bold">
            <Crown className="w-2 h-2" />
            HOST
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
  const isOwner = !!participant.owner

  return (
    <div className="w-full h-full relative">
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
      {isOwner && (
        <div className="absolute top-4 left-4 z-10">
          <span className="flex items-center gap-1 text-xs bg-energy-500 text-black px-3 py-1 rounded-full font-bold shadow-lg">
            <Crown className="w-3 h-3" />
            HOST
          </span>
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
  onToggleRemoteVideo,
  onResetAudio,
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
  onToggleRemoteVideo?: (sessionId: string, videoOn: boolean) => void
  onResetAudio?: (sessionId: string) => void
  onClose: () => void
}) {
  return (
    <div className="w-80 bg-neutral-900/95 backdrop-blur rounded-2xl border border-neutral-700 p-4 max-h-[70vh] overflow-y-auto">
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
        {/* Local user (host indicator) */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800">
          <div className="relative w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-500">
              {localName?.[0]?.toUpperCase()}
            </span>
            {isHost && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-energy-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-black" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-sm truncate">{localName} (You)</p>
              {isHost && (
                <span className="text-[10px] px-1.5 py-0.5 bg-energy-500/20 text-energy-400 rounded-full font-medium flex-shrink-0">HOST</span>
              )}
            </div>
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
            onToggleRemoteVideo={isHost ? onToggleRemoteVideo : undefined}
            onResetAudio={isHost ? onResetAudio : undefined}
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
  onToggleRemoteVideo,
  onResetAudio,
}: {
  participantId: string
  showHostControls: boolean
  onAllowToSpeak: (sessionId: string) => void
  onRevokeSpeak: (sessionId: string) => void
  onToggleRemoteVideo?: (sessionId: string, videoOn: boolean) => void
  onResetAudio?: (sessionId: string) => void
}) {
  const participant = useParticipant(participantId)
  const [resetting, setResetting] = useState(false)
  
  if (!participant) return null

  const hasAudio = !!participant.audio
  const hasVideo = !!participant.video
  const isOwner = !!participant.owner

  // Audio health: check if audio track is in a healthy state
  const audioTrack = participant.tracks?.audio
  const audioHealthy = audioTrack?.state === 'playable' || audioTrack?.state === 'loading'
  const audioSubscribed = audioTrack?.subscribed !== false

  const handleReset = () => {
    setResetting(true)
    onResetAudio?.(participantId)
    setTimeout(() => setResetting(false), 3000)
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800">
      <div className="relative w-8 h-8 rounded-full bg-secondary-500/20 flex items-center justify-center">
        <span className="text-sm font-medium text-secondary-500">
          {participant.user_name?.[0]?.toUpperCase() || '?'}
        </span>
        {isOwner && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-energy-500 rounded-full flex items-center justify-center">
            <Crown className="w-2.5 h-2.5 text-black" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm truncate">{participant.user_name || 'Participant'}</p>
          {isOwner && (
            <span className="text-[10px] px-1.5 py-0.5 bg-energy-500/20 text-energy-400 rounded-full font-medium flex-shrink-0">HOST</span>
          )}
        </div>
        {/* Audio health indicator (host controls) */}
        {showHostControls && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              audioHealthy && audioSubscribed ? 'bg-green-400' :
              audioSubscribed ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span className="text-[10px] text-neutral-500">
              {audioHealthy && audioSubscribed ? 'Audio OK' :
               audioSubscribed ? 'Audio connecting...' :
               'Audio disconnected'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {/* Reset audio button (host only) */}
        {showHostControls && onResetAudio && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className={`p-1 rounded-full transition-colors ${
              resetting ? 'text-primary-400 animate-spin' : 'text-neutral-500 hover:text-white hover:bg-neutral-700'
            }`}
            title="Reset participant's audio"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Camera toggle (host only) */}
        {showHostControls && onToggleRemoteVideo ? (
          <button
            onClick={() => onToggleRemoteVideo(participantId, !hasVideo)}
            className={`p-1 rounded-full transition-colors ${
              hasVideo
                ? 'bg-green-500/20 hover:bg-green-500/30'
                : 'bg-neutral-700 hover:bg-neutral-600'
            }`}
            title={hasVideo ? 'Turn off camera' : 'Request camera on'}
          >
            {hasVideo ? (
              <Video className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <VideoOff className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>
        ) : (
          hasVideo ? (
            <Video className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <VideoOff className="w-3.5 h-3.5 text-neutral-500" />
          )
        )}
        {/* Mic toggle (host controls) / status indicator (non-host) */}
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
