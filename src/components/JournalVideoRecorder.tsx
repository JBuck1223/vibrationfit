'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Video, X, SwitchCamera, Square, Loader2, Check, Play } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { uploadRecording } from '@/lib/services/recordingService'

interface JournalVideoRecorderProps {
  onVideoSaved: (url: string, blob: Blob) => void
  onClose: () => void
  onUploadProgress?: (progress: number, status: string, fileName: string, fileSize: number) => void
}

export function JournalVideoRecorder({
  onVideoSaved,
  onClose,
  onUploadProgress
}: JournalVideoRecorderProps) {
  const [step, setStep] = useState<'choose' | 'recording' | 'preview'>('choose')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      setError(null)
      setFacingMode(mode)
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: mode
        },
        audio: true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStep('recording')
      
      // Start countdown before recording
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

      // Start recording
      startRecording(stream)
    } catch (err: any) {
      console.error('Error starting camera:', err)
      
      let errorMessage = 'Failed to access camera/microphone.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission denied. Please allow camera/microphone access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.'
      }
      
      setError(errorMessage)
      setStep('choose')
    }
  }

  const startRecording = (stream: MediaStream) => {
    const mimeType = 'video/webm;codecs=vp9,opus'
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
    })

    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      
      const url = URL.createObjectURL(blob)
      setRecordedUrl(url)
      
      stopCamera()
      setStep('preview')
    }

    mediaRecorder.start(1000)
    setIsRecording(true)
    setDuration(0)

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    stopCamera()
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    await startCamera(newMode)
  }

  const handleSave = async () => {
    if (!recordedBlob) return

    try {
      setIsUploading(true)
      
      const fileName = `video-${Date.now()}.webm`
      const fileSize = recordedBlob.size
      
      if (onUploadProgress) {
        onUploadProgress(0, 'Uploading video...', fileName, fileSize)
      }

      const result = await uploadRecording(recordedBlob, 'journal', fileName)
      
      if (onUploadProgress) {
        onUploadProgress(100, 'Upload complete!', fileName, fileSize)
      }

      onVideoSaved(result.url, recordedBlob)
      
      // Small delay before closing to show success
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload video. Please try again.')
      setIsUploading(false)
    }
  }

  const handleRetake = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    setStep('choose')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-semibold">
          {step === 'choose' && 'Choose Camera'}
          {step === 'recording' && 'Recording Video'}
          {step === 'preview' && 'Preview Video'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          disabled={isUploading}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-10 p-3 bg-red-500/90 rounded-lg text-white text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {step === 'choose' && (
          <div className="flex flex-col gap-4 p-8">
            <Button
              onClick={() => startCamera('user')}
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              <Video className="w-5 h-5 mr-2" />
              Front Camera
            </Button>
            <Button
              onClick={() => startCamera('environment')}
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              <SwitchCamera className="w-5 h-5 mr-2" />
              Back Camera
            </Button>
          </div>
        )}

        {step === 'recording' && (
          <>
            {/* Video Preview */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Countdown Overlay */}
            {countdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-9xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Recording Controls */}
            {!countdown && (
              <>
                {/* Duration Counter */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 rounded-full text-white font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    {formatDuration(duration)}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
                  <Button
                    onClick={switchCamera}
                    variant="ghost"
                    size="lg"
                    className="bg-white/10 hover:bg-white/20"
                  >
                    <SwitchCamera className="w-6 h-6 text-white" />
                  </Button>
                  
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Square className="w-10 h-10 text-white" fill="white" />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'preview' && recordedUrl && (
          <>
            {/* Video Playback */}
            <video
              src={recordedUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain"
            />

            {/* Preview Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-4">
              <Button
                onClick={handleRetake}
                variant="outline"
                size="lg"
                disabled={isUploading}
              >
                Retake
              </Button>
              
              <Button
                onClick={handleSave}
                variant="primary"
                size="lg"
                disabled={isUploading}
                loading={isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Save Video
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

