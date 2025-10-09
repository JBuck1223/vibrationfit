'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

interface MediaRecorderProps {
  mode?: 'audio' | 'video'
  onRecordingComplete?: (blob: Blob, transcript?: string) => void
  onTranscriptComplete?: (transcript: string) => void
  autoTranscribe?: boolean
  maxDuration?: number // in seconds
  className?: string
}

export function MediaRecorderComponent({
  mode = 'audio',
  onRecordingComplete,
  onTranscriptComplete,
  autoTranscribe = true,
  maxDuration = 600, // 10 minutes default
  className = ''
}: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPreparing, setIsPreparing] = useState(false) // For showing preview before countdown

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  const startRecording = async () => {
    try {
      setError(null)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support media recording. Please use Chrome, Firefox, or Safari.')
      }

      const constraints = mode === 'video' 
        ? { 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }, 
            audio: true 
          }
        : { audio: true }

      console.log('Requesting media access:', mode, constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Media access granted:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label })))
      streamRef.current = stream

      // Show preview for video (but don't start recording yet)
      setIsPreparing(true)
      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Start countdown
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

      // Now start actual recording
      setIsPreparing(false)
      setIsRecording(true)
      setDuration(0)

      const mimeType = mode === 'video' 
        ? 'video/webm;codecs=vp9,opus'
        : 'audio/webm;codecs=opus'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) 
          ? mimeType 
          : mode === 'video' ? 'video/webm' : 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm' 
        })
        setRecordedBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Auto-transcribe if enabled
        if (autoTranscribe && mode === 'audio') {
          await transcribeAudio(blob)
        }

        if (onRecordingComplete) {
          onRecordingComplete(blob)
        }
      }

      mediaRecorder.start(1000) // Collect data every second

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

    } catch (err: any) {
      console.error('Error starting recording:', err)
      
      let errorMessage = 'Failed to access camera/microphone.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission denied. Please allow camera/microphone access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = mode === 'video' 
          ? 'No camera found. Please connect a camera and try again.'
          : 'No microphone found. Please connect a microphone and try again.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings. Trying with default settings...'
        // Retry with simpler constraints
        setTimeout(() => {
          setError(null)
          // Will implement fallback if needed
        }, 2000)
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Stop video preview
      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  const discardRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    setTranscript('')
    chunksRef.current = []
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      setTranscript(data.transcript)
      
      if (onTranscriptComplete) {
        onTranscriptComplete(data.transcript)
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setError('Failed to transcribe audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      {!recordedBlob && (
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6">
          {/* Video Preview */}
          {mode === 'video' && (isRecording || isPreparing) && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black relative">
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                autoPlay
                muted
                playsInline
              />
              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-9xl font-bold text-white mb-4 animate-pulse" style={{
                      textShadow: '0 0 40px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.7)'
                    }}>
                      {countdown}
                    </div>
                    <p className="text-2xl text-white font-semibold" style={{
                      textShadow: '0 0 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      Get ready...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Countdown (for audio mode without video preview) */}
          {countdown !== null && mode === 'audio' && (
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
                <span className="text-neutral-400 text-sm">/ {formatDuration(maxDuration)}</span>
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
                {mode === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
              <>
                {!isPaused ? (
                  <Button
                    onClick={pauseRecording}
                    variant="secondary"
                    size="lg"
                    className="gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={resumeRecording}
                    variant="secondary"
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </Button>
                )}
                <Button
                  onClick={stopRecording}
                  variant="danger"
                  size="lg"
                  className="gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recorded Media Preview */}
      {recordedBlob && recordedUrl && (
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Recording Complete</h3>
            <span className="text-neutral-400 text-sm">{formatDuration(duration)}</span>
          </div>

          {/* Media Player */}
          {mode === 'video' ? (
            <video
              src={recordedUrl}
              controls
              className="w-full rounded-xl bg-black"
            />
          ) : (
            <audio
              src={recordedUrl}
              controls
              className="w-full"
            />
          )}

          {/* Transcription */}
          {mode === 'audio' && (
            <div className="space-y-2">
              {isTranscribing ? (
                <div className="flex items-center gap-2 text-primary-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Transcribing audio...</span>
                </div>
              ) : transcript ? (
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                  <p className="text-sm text-neutral-400 mb-2">Transcript:</p>
                  <p className="text-white whitespace-pre-wrap">{transcript}</p>
                </div>
              ) : autoTranscribe ? null : (
                <Button
                  onClick={() => transcribeAudio(recordedBlob)}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Transcribe Audio
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={discardRecording}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </Button>
            <Button
              onClick={() => {
                if (onRecordingComplete) {
                  onRecordingComplete(recordedBlob, transcript)
                }
              }}
              variant="primary"
              size="sm"
              className="gap-2 flex-1"
            >
              <Upload className="w-4 h-4" />
              Use Recording
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

