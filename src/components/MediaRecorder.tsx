'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import {
  saveRecordingChunks,
  loadSavedRecording,
  deleteSavedRecording,
  generateRecordingId,
  isStorageLow,
  clearOldRecordings
} from '@/lib/storage/indexed-db-recording'
import { uploadRecording } from '@/lib/services/recordingService'
import { USER_FOLDERS } from '@/lib/storage/s3-storage-presigned'

interface MediaRecorderProps {
  mode?: 'audio' | 'video'
  onRecordingComplete?: (blob: Blob, transcript?: string, shouldSaveFile?: boolean, s3Url?: string) => void
  onTranscriptComplete?: (transcript: string) => void
  autoTranscribe?: boolean
  maxDuration?: number // in seconds
  className?: string
  showSaveOption?: boolean // Show "Save Recording" checkbox
  recordingId?: string // Optional: ID for IndexedDB persistence
  category?: string // Optional: Category for IndexedDB persistence
  storageFolder?: keyof typeof USER_FOLDERS // S3 folder for uploads
}

export function MediaRecorderComponent({
  mode = 'audio',
  onRecordingComplete,
  onTranscriptComplete,
  autoTranscribe = true,
  maxDuration = 600, // 10 minutes default
  className = '',
  showSaveOption = true,
  recordingId: providedRecordingId,
  category = 'general',
  storageFolder = 'journalAudioRecordings'
}: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [s3Url, setS3Url] = useState<string | null>(null) // S3 URL for streaming playback
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPreparing, setIsPreparing] = useState(false) // For showing preview before countdown
  const [saveRecording, setSaveRecording] = useState(showSaveOption) // Whether to save the actual file (defaults to showSaveOption value)
  const [hasSavedRecording, setHasSavedRecording] = useState(false) // Track if there's a saved recording to resume
  const [previousChunks, setPreviousChunks] = useState<Blob[]>([]) // Chunks from before refresh
  const [previousDuration, setPreviousDuration] = useState(0) // Duration from before refresh

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingIdRef = useRef<string>(providedRecordingId || generateRecordingId(category))
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSaveSizeRef = useRef<number>(0) // Track total size saved for video size-based saves
  const durationRef = useRef<number>(0) // Track duration for auto-save
  const transcriptRef = useRef<string>('') // Track transcript for auto-save

  // Check for saved recording on mount - look by category first, not just by ID
  useEffect(() => {
    const checkForSavedRecording = async () => {
      if (!category) {
        return
      }

      try {
        console.log('🔍 Checking for saved recording:', {
          generatedId: recordingIdRef.current,
          category: category,
          mode: mode
        })
        
        // First, try to load by the generated ID (for consistency)
        let saved = await loadSavedRecording(recordingIdRef.current)
        const chunkCount = saved?.chunks ? saved.chunks.length : 0
        console.log('📋 Load result by ID:', {
          found: !!saved,
          hasChunks: chunkCount > 0,
          chunkCount: chunkCount
        })
        
        // If not found by ID, look for any saved recording in this category
        // This handles the case where page refreshes and ID is regenerated
        if (!saved || !saved.chunks || saved.chunks.length === 0) {
          console.log('🔍 No recording found by ID, searching by category:', category)
          const { getRecordingsForCategory } = await import('@/lib/storage/indexed-db-recording')
          const categoryRecordings = await getRecordingsForCategory(category)
          
          console.log('📊 Category search results:', {
            category: category,
            totalFound: categoryRecordings.length,
            recordings: categoryRecordings.map(r => ({
              id: r.id,
              chunks: r.chunks?.length || 0,
              hasBlob: !!r.blob,
              duration: r.duration,
              timestamp: new Date(r.timestamp).toISOString()
            }))
          })
          
          // Find the most recent in-progress recording (has chunks but no final blob)
          const inProgressRecording = categoryRecordings.find(r => 
            r.chunks && r.chunks.length > 0 && !r.blob
          )
          
          if (inProgressRecording) {
            console.log('✅ Found in-progress recording in category:', {
              id: inProgressRecording.id,
              duration: inProgressRecording.duration,
              chunks: inProgressRecording.chunks.length
            })
            saved = inProgressRecording
            // Update recording ID to match the found recording
            recordingIdRef.current = saved.id
          } else if (categoryRecordings.length > 0) {
            // If no in-progress, use the most recent one (might be completed)
            saved = categoryRecordings[0]
            recordingIdRef.current = saved.id
            console.log('✅ Found most recent recording in category:', {
              id: saved.id,
              hasBlob: !!saved.blob,
              chunks: saved.chunks?.length || 0
            })
          } else {
            console.log('❌ No recordings found in category:', category)
          }
        }

        if (saved && saved.chunks && Array.isArray(saved.chunks) && saved.chunks.length > 0) {
          console.log('🔄 Restoring saved recording:', {
            id: saved.id,
            duration: saved.duration,
            chunks: saved.chunks.length,
            hasBlob: !!saved.blob,
            hasTranscript: !!saved.transcript,
            firstChunkSize: saved.chunks[0]?.size || 0
          })
          
          // Verify chunks are actually Blobs
          const validChunks = saved.chunks.filter(chunk => chunk instanceof Blob)
          if (validChunks.length === 0) {
            console.error('❌ No valid Blob chunks found in saved recording')
            return
          }
          
          if (validChunks.length !== saved.chunks.length) {
            console.warn(`⚠️ Only ${validChunks.length} of ${saved.chunks.length} chunks are valid Blobs`)
          }
          
          setHasSavedRecording(true)
          setDuration(saved.duration || 0)
          durationRef.current = saved.duration || 0
          setPreviousChunks([...validChunks]) // Store previous chunks
          setPreviousDuration(saved.duration || 0) // Store previous duration
          chunksRef.current = validChunks // Use only valid chunks for now
          
          if (saved.blob && saved.blob instanceof Blob && saved.blob.size > 0) {
            // Revoke any existing URL to prevent memory leaks
            if (recordedUrl) {
              URL.revokeObjectURL(recordedUrl)
            }
            
            setRecordedBlob(saved.blob)
            const url = URL.createObjectURL(saved.blob)
            setRecordedUrl(url)
            setHasSavedRecording(false) // Clear this since we have a complete blob - show normal player UI
            
            console.log('✅ Restored completed recording with blob:', {
              blobSize: saved.blob.size,
              blobType: saved.blob.type,
              urlCreated: !!url
            })
          } else {
            console.log('📝 Found in-progress recording - chunks available for restore (no blob)')
          }
          
          if (saved.transcript) {
            setTranscript(saved.transcript)
            transcriptRef.current = saved.transcript
          }
        } else {
          console.log('ℹ️ No saved recording found or invalid chunks:', {
            hasSaved: !!saved,
            hasChunks: !!saved?.chunks,
            isArray: Array.isArray(saved?.chunks),
            chunkCount: saved?.chunks?.length || 0,
            category: category
          })
        }
      } catch (error) {
        console.error('❌ Error checking for saved recording:', error)
      }

      // Clear old recordings on mount (cleanup)
      await clearOldRecordings(24) // Clear recordings older than 24 hours

      // Check storage quota
      const storageLow = await isStorageLow(80)
      if (storageLow) {
        console.warn('⚠️ Browser storage is getting low (>80% used)')
        // Could show user notification here
      }
    }

    checkForSavedRecording()
  }, [category])

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  // Keep refs in sync with state
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    if (recordedBlob) {
      // Update IndexedDB with final blob
      if (recordingIdRef.current) {
        saveRecordingChunks(
          recordingIdRef.current,
          category,
          chunksRef.current,
          durationRef.current,
          mode,
          recordedBlob,
          transcriptRef.current || undefined
        ).catch(err => console.error('Failed to update IndexedDB with blob:', err))
      }
    }
  }, [recordedBlob, category, mode])

  // Auto-save every 30 seconds during recording (or every 20 seconds for video)
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = mode === 'video' ? 20000 : 30000 // 20s for video, 30s for audio
      
      autoSaveTimerRef.current = setInterval(async () => {
        // Check if still recording and have chunks
        if (!isRecording || chunksRef.current.length === 0 || !recordingIdRef.current) {
          return
        }

        try {
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          
          // Track size for video (can use for size-based saves in future if needed)
          if (mode === 'video' && totalSize - lastSaveSizeRef.current >= 10 * 1024 * 1024) {
            lastSaveSizeRef.current = totalSize
          }

          // Always save on time interval (every 20s for video, 30s for audio)
          // This ensures regular backups even if size tracking fails

          await saveRecordingChunks(
            recordingIdRef.current,
            category,
            chunksRef.current,
            durationRef.current, // Use ref for current duration
            mode,
            undefined, // Don't save blob during recording (only chunks)
            transcriptRef.current || undefined // Use ref for current transcript
          )

          console.log(`💾 Auto-saved recording chunks:`, {
            recordingId: recordingIdRef.current,
            chunkCount: chunksRef.current.length,
            duration: durationRef.current,
            totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`
          })
        } catch (error) {
          console.error('❌ Auto-save failed:', error)
        }
      }, interval)

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
        }
      }
    } else {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isPaused, mode, category])

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
      if (mode === 'video') {
        // Wait for React to render the video element
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (videoRef.current) {
          console.log('Setting video srcObject')
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
            console.log('Video playing successfully')
          } catch (playError) {
            console.error('Video play error:', playError)
          }
        } else {
          console.error('Video ref is null!')
        }
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
      // If continuing from previous recording, start duration from previous
      setDuration(previousDuration)
      durationRef.current = previousDuration

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
        // Merge previous chunks with new chunks if continuing from saved recording
        let finalChunks = chunksRef.current
        if (previousChunks.length > 0) {
          console.log('🔄 Merging previous chunks with new recording:', {
            previous: previousChunks.length,
            new: chunksRef.current.length
          })
          finalChunks = [...previousChunks, ...chunksRef.current]
          chunksRef.current = finalChunks
          // Clear previous chunks so they're not used again
          setPreviousChunks([])
          setPreviousDuration(0)
        }
        
        const blob = new Blob(finalChunks, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm' 
        })
        setRecordedBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Save final blob to IndexedDB (with transcript if available)
        if (recordingIdRef.current) {
          await saveRecordingChunks(
            recordingIdRef.current,
            category,
            finalChunks,
            duration,
            mode,
            blob,
            transcript || undefined
          )
          console.log('✅ Saved final recording blob to IndexedDB:', {
            totalChunks: finalChunks.length,
            totalDuration: duration
          })
        }

        // Auto-transcribe if enabled (works for both audio and video)
        let finalTranscript = transcript
        if (autoTranscribe) {
          finalTranscript = await transcribeAudio(blob)
          // Update state so transcript is available when user clicks save button
          if (finalTranscript) {
            setTranscript(finalTranscript)
            transcriptRef.current = finalTranscript
          }
          // Update IndexedDB with transcript
          if (recordingIdRef.current && finalTranscript) {
            await saveRecordingChunks(
              recordingIdRef.current,
              category,
              finalChunks,
              duration,
              mode,
              blob,
              finalTranscript
            )
          }
        }

        // DON'T automatically call onRecordingComplete here
        // Wait for user to explicitly click "Save Recording & Transcript" button
        // This allows them to review the recording and transcript before saving
      }

      mediaRecorder.start(1000) // Collect data every second

      // Start timer (continues from previousDuration if continuing recording)
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          durationRef.current = newDuration
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

  const discardRecording = async () => {
    // Delete S3 file if it exists (uploaded during transcription)
    if (s3Url) {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(s3Url)
        console.log('🗑️ Deleted recording from S3:', s3Url)
      } catch (deleteErr) {
        console.error('❌ Failed to delete recording from S3:', deleteErr)
        // Continue with cleanup even if delete fails
      }
    }
    
    // Revoke local blob URLs
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    
    // Clear from IndexedDB
    if (recordingIdRef.current) {
      await deleteSavedRecording(recordingIdRef.current)
    }
    
    // Reset all state
    setRecordedBlob(null)
    setRecordedUrl(null)
    setS3Url(null)
    setDuration(0)
    setTranscript('')
    chunksRef.current = []
    lastSaveSizeRef.current = 0
    setHasSavedRecording(false)
  }

  // Clear IndexedDB after successful upload (called from parent via onRecordingComplete)
  const clearRecordingFromIndexedDB = async () => {
    if (recordingIdRef.current) {
      await deleteSavedRecording(recordingIdRef.current)
      console.log('✅ Cleared recording from IndexedDB after successful upload')
    }
  }

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    setIsTranscribing(true)
    setError(null)

    try {
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Recording is empty or invalid. Please record again.')
      }

      // 1. Upload to S3 first for immediate storage
      console.log('📤 Uploading recording to S3 for streaming...')
      const folder = storageFolder || (mode === 'video' ? 'journalVideoRecordings' : 'journalAudioRecordings')
      const fileName = `recording-${Date.now()}.webm`
      
      try {
        const uploadResult = await uploadRecording(blob, folder, fileName)
        setS3Url(uploadResult.url)
        console.log('✅ Recording uploaded to S3:', uploadResult.url)
      } catch (uploadErr) {
        console.error('❌ S3 upload failed:', uploadErr)
        // Continue with transcription even if upload fails - we can retry later
        console.warn('⚠️ Continuing without S3 upload - will use local blob')
      }

      // 2. Transcribe the audio
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      console.log('🎙️ Starting transcription:', { size: blob.size, type: blob.type })

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      // Get error details from response if available
      if (!response.ok) {
        let errorMessage = 'Transcription failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || `Server error (${response.status})`
          console.error('❌ Transcription API error:', errorData)
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = `Transcription failed: ${response.statusText || response.status}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.transcript) {
        throw new Error('No transcript received from server')
      }

      const transcriptText = data.transcript || ''
      console.log('✅ Transcription successful:', { length: transcriptText.length })
      
      setTranscript(transcriptText)
      
      if (onTranscriptComplete) {
        onTranscriptComplete(transcriptText)
      }

      return transcriptText
    } catch (err) {
      console.error('❌ Transcription error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to transcribe audio. Please try again.'
      setError(errorMessage)
      return ''
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

          {/* Show recovery option if saved recording found */}
          {hasSavedRecording && !recordedBlob && !isRecording && countdown === null && (
            <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <p className="text-sm text-neutral-300 mb-2">
                📦 Found saved recording ({formatDuration(duration)})
              </p>
              <p className="text-xs text-neutral-400 mb-3">
                Your recording was saved before the page refresh. Continue recording, transcribe what you have, or start fresh.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      // Continue recording - merge old chunks with new recording when done
                      console.log('▶️ Continuing recording - will merge with previous chunks:', {
                        previousChunks: previousChunks.length,
                        previousDuration: previousDuration,
                        currentChunks: chunksRef.current.length
                      })
                      setHasSavedRecording(false)
                      // Don't clear chunksRef here - startRecording() will handle it
                      // previousChunks is already stored in state and will be merged on stop
                      await startRecording()
                    }}
                    variant="primary"
                    size="sm"
                    className="gap-2 flex-1"
                  >
                    <Mic className="w-4 h-4" />
                    Continue Recording
                  </Button>
                  <Button
                    onClick={async () => {
                      // Reconstruct blob from saved chunks (we're in a state where recordedBlob is null)
                      console.log('🎙️ Transcribing saved recording...')
                      
                      const chunksToUse = chunksRef.current.length > 0 
                        ? chunksRef.current 
                        : previousChunks.length > 0 
                          ? previousChunks 
                          : []
                      
                      if (chunksToUse.length === 0) {
                        console.error('❌ No chunks available to transcribe')
                        setError('No recording data found to transcribe')
                        return
                      }
                      
                      const blobToTranscribe = new Blob(chunksToUse, {
                        type: mode === 'video' ? 'video/webm' : 'audio/webm'
                      })
                      
                      if (blobToTranscribe.size === 0) {
                        setError('Recording is empty or invalid')
                        return
                      }
                      
                      // Set the blob state so it displays
                      setRecordedBlob(blobToTranscribe)
                      const url = URL.createObjectURL(blobToTranscribe)
                      setRecordedUrl(url)
                      setHasSavedRecording(false)
                      
                      console.log('✅ Reconstructed blob from chunks:', {
                        blobSize: blobToTranscribe.size,
                        chunksUsed: chunksToUse.length
                      })
                      
                      // Transcribe the blob
                      const transcribed = await transcribeAudio(blobToTranscribe)
                      if (transcribed && onTranscriptComplete) {
                        onTranscriptComplete(transcribed)
                      }
                      
                      console.log('✅ Transcription complete for saved recording:', {
                        blobSize: blobToTranscribe.size,
                        duration: duration,
                        transcriptLength: transcribed?.length || 0
                      })
                    }}
                    variant="secondary"
                    size="sm"
                    className="gap-2 flex-1"
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Transcribe This
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    // Delete the saved recording and start fresh
                    if (recordingIdRef.current) {
                      deleteSavedRecording(recordingIdRef.current).then(() => {
                        setHasSavedRecording(false)
                        chunksRef.current = []
                        setDuration(0)
                        durationRef.current = 0
                        setTranscript('')
                        transcriptRef.current = ''
                        recordingIdRef.current = generateRecordingId(category)
                        console.log('🗑️ Deleted saved recording, ready for new recording')
                      })
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Discard & Start New
                </Button>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {!isRecording && countdown === null && !hasSavedRecording ? (
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
              src={s3Url || recordedUrl || undefined}
              controls
              className="w-full rounded-xl bg-black"
              onError={(e) => {
                console.error('❌ Video player error:', e)
                setError('Unable to play video. The recording file may be corrupted.')
              }}
            />
          ) : (
            <audio
              src={s3Url || recordedUrl || undefined}
              controls
              className="w-full"
              onError={(e) => {
                console.error('❌ Audio player error:', e)
                setError('Unable to play audio. The recording file may be corrupted.')
              }}
            />
          )}

          {/* Transcription */}
          <div className="space-y-2">
            {isTranscribing ? (
              <div className="flex items-center gap-2 text-primary-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Transcribing {mode === 'video' ? 'video' : 'audio'}...</span>
              </div>
            ) : transcript ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400 mb-2">Transcript:</p>
                <p className="text-white whitespace-pre-wrap">{transcript}</p>
              </div>
            ) : (
              <Button
                onClick={async () => {
                  if (!recordedBlob) {
                    setError('No recording available to transcribe')
                    return
                  }
                  
                  if (recordedBlob.size === 0) {
                    setError('Recording is empty or invalid. Please record again.')
                    return
                  }
                  
                  console.log('🎙️ Starting transcription:', {
                    blobSize: recordedBlob.size,
                    blobType: recordedBlob.type
                  })
                  
                  const transcriptResult = await transcribeAudio(recordedBlob)
                  
                  // Update IndexedDB with transcript if we have a recording ID
                  if (recordingIdRef.current && transcriptResult) {
                    await saveRecordingChunks(
                      recordingIdRef.current,
                      category,
                      chunksRef.current,
                      duration,
                      mode,
                      recordedBlob,
                      transcriptResult
                    )
                  }
                }}
                variant="secondary"
                size="sm"
                className="gap-2 w-full"
                disabled={!recordedBlob || recordedBlob.size === 0}
              >
                <Mic className="w-4 h-4" />
                Transcribe {mode === 'video' ? 'Video' : 'Audio'}
              </Button>
            )}
          </div>

          {/* Save Recording Option */}
          {showSaveOption && (
            <div className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg">
              <input
                type="checkbox"
                id="saveRecording"
                checked={saveRecording}
                onChange={(e) => setSaveRecording(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="saveRecording" className="text-sm text-neutral-300 cursor-pointer">
                Save {mode === 'video' ? 'video' : 'audio'} file to cloud storage
                <span className="text-neutral-500 ml-1">
                  ({saveRecording ? 'File will be saved' : 'Only transcript will be saved'})
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <Button
              onClick={() => {
                if (onRecordingComplete) {
                  onRecordingComplete(recordedBlob, transcript || undefined, saveRecording, s3Url || undefined)
                }
              }}
              variant="primary"
              size="sm"
              className="gap-2 w-full sm:w-auto"
              disabled={!transcript}
            >
              <Upload className="w-4 h-4" />
              {showSaveOption 
                ? (saveRecording ? 'Save Recording & Transcript' : 'Use Transcript Only')
                : 'Use Transcript'}
              {!transcript && ' (Transcribe First)'}
            </Button>
            <Button
              onClick={discardRecording}
              variant="ghost"
              size="sm"
              className="gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

