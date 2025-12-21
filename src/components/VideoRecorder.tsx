'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Video, Square, Loader2, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/lib/design-system'
import { uploadUserFile, USER_FOLDERS } from '@/lib/storage/s3-storage-presigned'

type StorageFolder = keyof typeof USER_FOLDERS

interface VideoRecorderProps {
  /** Folder to upload to (e.g., 'journalVideoRecordings') */
  storageFolder?: StorageFolder
  /** Max recording duration in seconds (default: 300 = 5 min) */
  maxDuration?: number
  /** Callback when video is saved successfully */
  onVideoSaved?: (url: string, duration: number) => void
  /** Callback for upload progress */
  onProgress?: (progress: number, status: string) => void
  /** Callback when recording starts */
  onRecordingStart?: () => void
  /** Callback when recording stops */
  onRecordingStop?: (blob: Blob) => void
  /** Custom class name */
  className?: string
  /** Whether to use front or back camera on mobile */
  facingMode?: 'user' | 'environment'
  /** Compact mode - smaller UI */
  compact?: boolean
}

export function VideoRecorder({
  storageFolder = 'journalVideoRecordings',
  maxDuration = 300,
  onVideoSaved,
  onProgress,
  onRecordingStart,
  onRecordingStop,
  className = '',
  facingMode = 'user',
  compact = false,
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
    } catch (err) {
      console.error('Failed to access camera:', err)
      setError('Could not access camera. Please allow camera permissions.')
    }
  }, [facingMode])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }, [])

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordingTime(0)
    setError(null)

    // Determine supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        setIsPreviewing(true)
        onRecordingStop?.(blob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      onRecordingStart?.()

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to start recording.')
    }
  }, [maxDuration, onRecordingStart, onRecordingStop])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // Discard recording and go back to camera
  const discardRecording = useCallback(() => {
    setRecordedBlob(null)
    setIsPreviewing(false)
    setRecordingTime(0)
  }, [])

  // Save recording to S3
  const saveRecording = useCallback(async () => {
    if (!recordedBlob) return

    setIsUploading(true)
    setError(null)
    onProgress?.(0, 'Preparing upload...')

    try {
      const fileName = `video-${Date.now()}.webm`
      const file = new File([recordedBlob], fileName, { type: recordedBlob.type })

      onProgress?.(10, 'Uploading video...')
      
      const result = await uploadUserFile(storageFolder, file, undefined, (progress) => {
        onProgress?.(10 + (progress * 0.9), 'Uploading video...')
      })

      onProgress?.(100, 'Upload complete!')
      onVideoSaved?.(result.url, recordingTime)
      
      // Reset state
      setRecordedBlob(null)
      setIsPreviewing(false)
      setRecordingTime(0)
      stopCamera()
    } catch (err) {
      console.error('Failed to upload video:', err)
      setError('Failed to upload video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [recordedBlob, recordingTime, storageFolder, onVideoSaved, onProgress, stopCamera])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [stopCamera])

  // Set up preview video when blob is available
  useEffect(() => {
    if (isPreviewing && recordedBlob && previewVideoRef.current) {
      previewVideoRef.current.src = URL.createObjectURL(recordedBlob)
    }
  }, [isPreviewing, recordedBlob])

  return (
    <div className={`bg-neutral-900 rounded-xl overflow-hidden ${className}`}>
      {/* Camera not started - show start button */}
      {!cameraReady && !isPreviewing && (
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center">
            <Video className="w-8 h-8 text-brand-green" />
          </div>
          <p className="text-neutral-400 text-center">
            Record a video to share your thoughts
          </p>
          <Button onClick={startCamera} variant="primary">
            <Video className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        </div>
      )}

      {/* Camera active - recording view */}
      {cameraReady && !isPreviewing && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full aspect-video bg-black object-cover"
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              REC {formatTime(recordingTime)}
            </div>
          )}

          {/* Max duration warning */}
          {isRecording && recordingTime >= maxDuration - 30 && (
            <div className="absolute top-4 right-4 bg-yellow-500/80 text-black px-3 py-1 rounded-full text-sm">
              {formatTime(maxDuration - recordingTime)} left
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            {!isRecording ? (
              <>
                <Button onClick={stopCamera} variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              </>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <Square className="w-6 h-6 text-white fill-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview mode */}
      {isPreviewing && recordedBlob && (
        <div className="relative">
          <video
            ref={previewVideoRef}
            controls
            playsInline
            className="w-full aspect-video bg-black"
          />
          
          <div className="p-4 flex justify-between items-center gap-4 border-t border-neutral-800">
            <div className="text-sm text-neutral-400">
              Duration: {formatTime(recordingTime)}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={discardRecording} 
                variant="ghost" 
                size="sm"
                disabled={isUploading}
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Retake
              </Button>
              <Button 
                onClick={saveRecording} 
                variant="primary" 
                size="sm"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Save Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

