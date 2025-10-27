'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

interface AudioTranscriptionButtonProps {
  onTranscribeComplete: (transcript: string) => void
  className?: string
}

export function AudioTranscriptionButton({
  onTranscribeComplete,
  className = ''
}: AudioTranscriptionButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState<string>('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Load audio devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        // Get all audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        
        setAudioDevices(audioInputs)
        
        // Set default to first device if none selected
        setSelectedMic(prev => {
          if (!prev && audioInputs.length > 0) {
            return audioInputs[0].deviceId
          }
          return prev
        })
      } catch (err) {
        console.error('Failed to load audio devices:', err)
      }
    }
    
    loadDevices()
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      setTranscript(null)
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording')
      }

      const constraints = { audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Show countdown
      setCountdown(3)
      await new Promise<void>((resolve) => {
        let count = 3
        const countdownInterval = setInterval(() => {
          count--
          if (count > 0) {
            setCountdown(count)
          } else {
            setCountdown(null)
            clearInterval(countdownInterval)
            resolve()
          }
        }, 1000)
      })

      setIsRecording(true)
      setDuration(0)

      // Determine best supported mime type
      let mimeType = ''
      const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option)) {
          mimeType = option
          break
        }
      }
      
      if (!mimeType) {
        mimeType = 'audio/webm'
      }
      
      mimeTypeRef.current = mimeType
      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Auto-transcribe
        await transcribeAudio(blob)
      }

      mediaRecorder.start(1000)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      setError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData()
      }
      
      setTimeout(() => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop()
        }
      }, 100)
      
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    setError(null)

    try {
      if (blob.size === 0) {
        throw new Error('Recorded audio is empty')
      }

      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Transcription failed')
      }

      const data = await response.json()

      if (!data.transcript) {
        throw new Error('No transcript received')
      }

      setTranscript(data.transcript)
    } catch (err) {
      console.error('Transcription error:', err)
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleKeepTranscript = () => {
    if (transcript) {
      onTranscribeComplete(transcript)
      setTranscript(null)
      setDuration(0)
    }
  }

  const handleReRecord = () => {
    setTranscript(null)
    setDuration(0)
    startRecording()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // If transcript is ready, show it
  if (transcript) {
    return (
      <div className={`bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6 space-y-4 ${className}`}>
        <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
          <p className="text-sm text-neutral-300 mb-2">Transcript:</p>
          <p className="text-white text-sm">{transcript}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleKeepTranscript} variant="primary" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Use This
          </Button>
          <Button type="button" onClick={handleReRecord} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Re-record
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6 ${className}`}>
      {/* Countdown */}
      {countdown !== null && (
        <div className="text-center mb-4">
          <div className="text-8xl font-bold text-primary-500 mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-xl text-white">Get ready to speak...</p>
        </div>
      )}

      {/* Timer */}
      {isRecording && countdown === null && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-lg">{formatDuration(duration)}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex justify-center gap-3">
        {!isRecording && countdown === null ? (
          <Button
            onClick={startRecording}
            variant="primary"
            size="lg"
            className="gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        ) : countdown !== null ? (
          <Button
            variant="secondary"
            size="lg"
            disabled
            className="gap-2"
          >
            Starting in {countdown}...
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="danger" size="lg" className="gap-2">
            <Square className="w-5 h-5" />
            Stop
          </Button>
        )}
      </div>

      {/* Microphone Selector */}
      {!isRecording && countdown === null && audioDevices.length > 0 && (
        <select
          value={selectedMic}
          onChange={(e) => setSelectedMic(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 mt-4 text-sm md:text-base truncate"
          disabled={isRecording}
        >
          {audioDevices.map((device) => {
            const label = device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
            // Truncate long labels for mobile
            const displayLabel = label.length > 40 ? label.substring(0, 37) + '...' : label
            return (
              <option key={device.deviceId} value={device.deviceId}>
                {displayLabel}
              </option>
            )
          })}
        </select>
      )}

      {/* Transcribing */}
      {isTranscribing && (
        <div className="flex items-center justify-center gap-2 text-primary-500 mt-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Transcribing audio...</span>
        </div>
      )}
    </div>
  )
}
