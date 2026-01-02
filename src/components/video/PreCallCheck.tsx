'use client'

/**
 * Pre-Call Check Component
 * 
 * Allows users to test their camera and microphone before joining a call.
 * Shows a preview of their video and audio levels.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import { Button, Card, Badge, Spinner } from '@/lib/design-system/components'
import type { DeviceInfo, CallSettings } from '@/lib/video/types'

interface PreCallCheckProps {
  onReady: (settings: CallSettings) => void
  onCancel?: () => void
  sessionTitle?: string
  hostName?: string
}

export function PreCallCheck({ 
  onReady, 
  onCancel, 
  sessionTitle,
  hostName 
}: PreCallCheckProps) {
  // Device state
  const [cameras, setCameras] = useState<DeviceInfo[]>([])
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<DeviceInfo[]>([])
  
  // Selected devices
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('')
  
  // Toggle state
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  
  // Status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      const videoInputs = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}`, kind: d.kind as 'videoinput' }))
      
      const audioInputs = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}`, kind: d.kind as 'audioinput' }))
      
      const audioOutputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 4)}`, kind: d.kind as 'audiooutput' }))
      
      setCameras(videoInputs)
      setMicrophones(audioInputs)
      setSpeakers(audioOutputs)
      
      // Set default selections
      if (videoInputs.length > 0 && !selectedCamera) {
        setSelectedCamera(videoInputs[0].deviceId)
      }
      if (audioInputs.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioInputs[0].deviceId)
      }
      if (audioOutputs.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(audioOutputs[0].deviceId)
      }
    } catch (err) {
      console.error('Error getting devices:', err)
      setError('Could not access your devices. Please check permissions.')
    }
  }, [selectedCamera, selectedMicrophone, selectedSpeaker])

  // Start media stream
  const startStream = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
        audio: micEnabled ? {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        } : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Set video source
      if (videoRef.current && cameraEnabled) {
        videoRef.current.srcObject = stream
      }

      // Set up audio analyzer
      if (micEnabled) {
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        analyser.fftSize = 256
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Start audio level monitoring
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          animationRef.current = requestAnimationFrame(updateLevel)
        }
        updateLevel()
      }

      // Refresh device list to get labels
      await getDevices()
      setLoading(false)
    } catch (err) {
      console.error('Error accessing media:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permission denied. Please allow camera and microphone access.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect a device.')
        } else {
          setError(`Error: ${err.message}`)
        }
      }
      setLoading(false)
    }
  }, [cameraEnabled, micEnabled, selectedCamera, selectedMicrophone, getDevices])

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setCameraEnabled(prev => !prev)
  }, [])

  // Toggle microphone
  const toggleMic = useCallback(() => {
    setMicEnabled(prev => !prev)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Start stream on mount and when settings change
  useEffect(() => {
    startStream()
  }, [cameraEnabled, micEnabled, selectedCamera, selectedMicrophone])

  // Handle join
  const handleJoin = () => {
    // Stop preview stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    onReady({
      camera: cameraEnabled,
      microphone: micEnabled,
      speaker: true,
      selectedCamera,
      selectedMicrophone,
      selectedSpeaker,
    })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-neutral-900 border-neutral-700">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">Ready to join?</h1>
            {sessionTitle && (
              <p className="text-neutral-400">{sessionTitle}</p>
            )}
            {hostName && (
              <p className="text-sm text-neutral-500">
                Hosted by <span className="text-primary-500">{hostName}</span>
              </p>
            )}
          </div>

          {/* Video Preview */}
          <div className="relative aspect-video bg-neutral-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="w-8 h-8" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <Button variant="secondary" onClick={startStream}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-neutral-400" />
                </div>
              </div>
            )}

            {/* Audio Level Indicator */}
            {micEnabled && !error && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 rounded-full p-2 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-400" />
                  <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-75"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!loading && !error && (
                <>
                  <Badge variant={cameraEnabled ? 'success' : 'secondary'}>
                    {cameraEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                  </Badge>
                  <Badge variant={micEnabled ? 'success' : 'secondary'}>
                    {micEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                cameraEnabled 
                  ? 'bg-neutral-700 hover:bg-neutral-600 text-white' 
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
              }`}
            >
              {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                micEnabled 
                  ? 'bg-neutral-700 hover:bg-neutral-600 text-white' 
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
              }`}
            >
              {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-14 h-14 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center transition-all duration-200"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Device Settings */}
          {showSettings && (
            <div className="space-y-4 p-4 bg-neutral-800 rounded-xl">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Device Settings</h3>
              
              {/* Camera Select */}
              {cameras.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 flex items-center gap-2">
                    <Video className="w-3 h-3" />
                    Camera
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {cameras.map(camera => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Microphone Select */}
              {microphones.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 flex items-center gap-2">
                    <Mic className="w-3 h-3" />
                    Microphone
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMicrophone}
                      onChange={(e) => setSelectedMicrophone(e.target.value)}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {microphones.map(mic => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Speaker Select */}
              {speakers.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 flex items-center gap-2">
                    <Volume2 className="w-3 h-3" />
                    Speaker
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => setSelectedSpeaker(e.target.value)}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {speakers.map(speaker => (
                        <option key={speaker.deviceId} value={speaker.deviceId}>
                          {speaker.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={handleJoin}
              disabled={loading || !!error}
              className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Join Session
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-neutral-500">
            You can change your camera and microphone settings during the call
          </p>
        </div>
      </Card>
    </div>
  )
}

export default PreCallCheck

