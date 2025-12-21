'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Square, Play, Pause, Trash2, Upload, Loader2, Check, RotateCcw, Scissors, Save, ChevronDown, ChevronUp, SwitchCamera, Maximize, Minimize } from 'lucide-react'
import { Button, Checkbox } from '@/lib/design-system/components'
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
import SimpleLevelMeter from '@/components/SimpleLevelMeter'
import { AudioEditor } from '@/components/AudioEditor'

type RecordingPurpose = 'quick' | 'transcriptOnly' | 'withFile' | 'audioOnly'

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
  instanceId?: string // Optional: Unique identifier for this recorder instance (e.g., field name)
  storageFolder?: keyof typeof USER_FOLDERS // S3 folder for uploads
  recordingPurpose?: RecordingPurpose // 'quick' | 'transcriptOnly' | 'withFile' | 'audioOnly'
  enableEditor?: boolean // Explicitly enable/disable audio editor (default: true, overrides automatic behavior)
  initialFacingMode?: 'user' | 'environment' // Initial camera direction (front/back)
  allowCameraSwitch?: boolean // Show camera switch button for video mode
  fullscreenVideo?: boolean // Make video preview fullscreen during recording
  /**
   * Recording modes:
   * - 'quick': Small snippets (VIVA chat) - No S3, no player, instant transcript, discard immediately
   * - 'transcriptOnly': Long audio (life-vision) - S3 for reliability, delete if discarded
   * - 'withFile': Full recordings (journal) - S3 always, keep file for playback, manual transcription
   * - 'audioOnly': Audio recording with editing - S3 storage, no transcription option
   */
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
  instanceId, // Unique identifier for this instance
  storageFolder = 'journalAudioRecordings',
  recordingPurpose = 'withFile', // Default to full file storage
  enableEditor = true, // Default to enabled (can be overridden)
  initialFacingMode = 'user', // Default to front camera
  allowCameraSwitch = true, // Show camera switch by default for video
  fullscreenVideo = true // Make video fullscreen during recording by default
}: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [s3Url, setS3Url] = useState<string | null>(null) // S3 URL for streaming playback
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPreparing, setIsPreparing] = useState(false) // For showing preview before countdown
  const [saveRecording, setSaveRecording] = useState(showSaveOption) // Whether to save the actual file (defaults to showSaveOption value)
  const [hasSavedRecording, setHasSavedRecording] = useState(false) // Track if there's a saved recording to resume
  const [previousChunks, setPreviousChunks] = useState<Blob[]>([]) // Chunks from before refresh
  const [previousDuration, setPreviousDuration] = useState(0) // Duration from before refresh
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]) // Available microphones
  const [selectedMic, setSelectedMic] = useState<string>('') // Selected microphone ID
  const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false) // Microphone dropdown state
  const micDropdownRef = useRef<HTMLDivElement>(null) // Ref for microphone dropdown
  const [showEditor, setShowEditor] = useState(false) // Show audio editor
  const [showInstructions, setShowInstructions] = useState(false) // Show recording complete instructions
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode) // Camera direction
  const [isFullscreen, setIsFullscreen] = useState(false) // Fullscreen state
  const containerRef = useRef<HTMLDivElement>(null) // Container for fullscreen

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingIdRef = useRef<string>(
    providedRecordingId || generateRecordingId(instanceId ? `${category}-${instanceId}` : category)
  )
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSaveSizeRef = useRef<number>(0) // Track total size saved for video size-based saves
  const durationRef = useRef<number>(0) // Track duration for auto-save
  const transcriptRef = useRef<string>('') // Track transcript for auto-save

  // Close microphone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (micDropdownRef.current && !micDropdownRef.current.contains(event.target as Node)) {
        setIsMicDropdownOpen(false)
      }
    }
    
    if (isMicDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMicDropdownOpen])

  // Load audio devices on mount (for microphone selection)
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop())
        
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
        // Continue without mic selector - will use default
      }
    }
    
    loadDevices()
    
    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
    }
  }, [])

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
        
        // If not found by ID, look for any saved recording in this category (and instance if provided)
        // This handles the case where page refreshes and ID is regenerated
        if (!saved || !saved.chunks || saved.chunks.length === 0) {
          const searchCategory = instanceId ? `${category}-${instanceId}` : category
          console.log('🔍 No recording found by ID, searching by category:', searchCategory)
          const { getRecordingsForCategory } = await import('@/lib/storage/indexed-db-recording')
          let categoryRecordings = await getRecordingsForCategory(category)
          
          // If instanceId is provided, filter to only recordings that match this instance
          if (instanceId) {
            categoryRecordings = categoryRecordings.filter(r => 
              r.id.includes(`${category}-${instanceId}`)
            )
          }
          
          console.log('📊 Category search results:', {
            category: searchCategory,
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
              facingMode: facingMode
            }, 
            audio: selectedMic ? { deviceId: { exact: selectedMic } } : true 
          }
        : { audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }

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
        
        console.log('📦 Created blob:', {
          size: blob.size,
          type: blob.type,
          chunkCount: finalChunks.length
        })
        
        if (blob.size === 0) {
          console.error('❌ Blob is empty!')
          setError('Recording failed - no data captured')
          return
        }
        
        setRecordedBlob(blob)
        
        // Only create blob URL if not in quick mode (no player needed)
        if (recordingPurpose !== 'quick') {
          // Small delay to ensure blob is fully ready
          setTimeout(() => {
            const url = URL.createObjectURL(blob)
            setRecordedUrl(url)
            console.log('🔗 Blob URL created:', url)
          }, 100)
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Save final blob to IndexedDB (skip in quick mode - no need to persist)
        if (recordingIdRef.current && recordingPurpose !== 'quick') {
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

        // Upload to S3 immediately for withFile mode only (needs immediate backup)
        // audioOnly mode will upload on Save button click (user may want to edit/discard first)
        if (recordingPurpose === 'withFile') {
          const folder = storageFolder || (mode === 'video' ? 'journalVideoRecordings' : 'journalAudioRecordings')
          const fileName = `recording-${Date.now()}.webm`
          
          console.log(`📤 ${recordingPurpose} mode: Uploading to S3...`)
          
          uploadRecording(blob, folder, fileName)
            .then((uploadResult) => {
              setS3Url(uploadResult.url)
              console.log('✅ Recording uploaded to S3:', uploadResult.url)
            })
            .catch((uploadErr) => {
              console.error('❌ S3 upload failed:', uploadErr)
              setError('Failed to upload recording. Please try again.')
            })
        }

        // Auto-transcribe ONLY in quick mode (for VIVA chat, etc.)
        // For other modes (withFile, transcriptOnly, audioOnly), user clicks "Transcribe" button manually (if available)
        if (recordingPurpose === 'quick') {
          const finalTranscript = await transcribeAudio(blob)
          // Update state so transcript is available
          if (finalTranscript) {
            setTranscript(finalTranscript)
            transcriptRef.current = finalTranscript
          }
          
          // In quick mode, auto-cleanup blob after transcription (no player needed)
          setRecordedBlob(null)
          // Don't create blob URL - not needed in quick mode
        }

        // DON'T automatically call onRecordingComplete here
        // Wait for user to explicitly click action button
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
    // Delete S3 file based on recording purpose:
    // - 'quick': No S3 file to delete
    // - 'transcriptOnly': Delete S3 file (only needed transcript, not the file)
    // - 'withFile': Keep S3 file (user might want it later even if they discard now)
    if (s3Url && recordingPurpose === 'transcriptOnly') {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(s3Url)
        console.log('🗑️ Deleted transcript-only recording from S3:', s3Url)
      } catch (deleteErr) {
        console.error('❌ Failed to delete recording from S3:', deleteErr)
        // Continue with cleanup even if delete fails
      }
    } else if (s3Url && recordingPurpose === 'withFile') {
      // With-file mode: Don't delete S3 file even if discarded
      // File stays available for potential recovery
      console.log('📦 With-file mode: Keeping S3 file even after discard (available for recovery)')
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

      // Handle different recording purposes:
      // - 'quick': No S3 upload, just transcribe immediately
      // - 'transcriptOnly': S3 upload in parallel (backup), delete if discarded
      // - 'withFile': S3 upload in parallel, keep file always
      
      let uploadPromise: Promise<void> | null = null
      
      if (recordingPurpose === 'quick') {
        // Quick mode: Skip S3 entirely, just transcribe
        console.log('⚡ Quick mode: Transcribing only (no S3 upload)')
      } else {
        // Transcript-only or with-file: Upload to S3 in parallel
        console.log(`📤 ${recordingPurpose === 'transcriptOnly' ? 'Transcript-only' : 'Full file'} mode: Uploading to S3 in parallel...`)
        const folder = storageFolder || (mode === 'video' ? 'journalVideoRecordings' : 'journalAudioRecordings')
        const fileName = `recording-${Date.now()}.webm`
        
        uploadPromise = uploadRecording(blob, folder, fileName)
          .then((uploadResult) => {
            setS3Url(uploadResult.url)
            console.log('✅ Recording uploaded to S3:', uploadResult.url)
          })
          .catch((uploadErr) => {
            console.error('❌ S3 upload failed:', uploadErr)
            // Non-critical - continue without S3 URL
            console.warn('⚠️ S3 upload failed - will use local blob for playback')
          })
          .then(() => {}) as Promise<void>
      }

      // Start transcription immediately (this is what user is waiting for)
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      console.log('🎙️ Transcribing audio...')

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

      // Wait for S3 upload to complete if we started one
      if (uploadPromise) {
        await uploadPromise.catch(() => {
          // Upload failed but transcription succeeded - that's okay
          // User can still use local blob or retry upload later
        })
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

  // Switch between front and back camera
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // If currently recording or preparing, restart with new camera
    if (streamRef.current && (isRecording || isPreparing)) {
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop())
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: newFacingMode
          },
          audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
        })
        
        streamRef.current = newStream
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
          await videoRef.current.play()
        }
        
        // If recording, update the media recorder with new stream
        if (isRecording && mediaRecorderRef.current) {
          // Note: Can't change stream mid-recording, camera switch only works during preview
          console.log('⚠️ Camera switch during recording - will take effect on next recording')
        }
      } catch (err) {
        console.error('Failed to switch camera:', err)
        setError('Failed to switch camera. Please try again.')
        // Revert facing mode
        setFacingMode(facingMode)
      }
    }
  }

  // Toggle fullscreen for video recording
  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      {!recordedBlob && !(recordingPurpose === 'quick' && transcript) && (
        <div className={`bg-neutral-900 border-2 rounded-2xl flex flex-col transition-colors ${
          isRecording 
            ? 'border-[#FF0040]' 
            : 'border-[#39FF14]'
        } ${
          // Compact when idle, expand when engaged
          isRecording || countdown !== null || isPreparing || hasSavedRecording || (mode === 'video' && isRecording)
            ? 'p-6 min-h-[400px] justify-center'
            : 'p-4 justify-start'
        }`}>
          {/* Video Preview */}
          {mode === 'video' && (isRecording || isPreparing) && (
            <div 
              ref={containerRef}
              className={`mb-4 rounded-xl overflow-hidden bg-black relative ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none flex items-center justify-center' : ''
              }`}
            >
              <video
                ref={videoRef}
                className={`object-cover ${
                  isFullscreen 
                    ? 'w-full h-full' 
                    : 'w-full aspect-video'
                }`}
                autoPlay
                muted
                playsInline
              />
              
              {/* Top Controls - Camera Switch & Fullscreen */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                {allowCameraSwitch && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                    title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                )}
                {fullscreenVideo && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Camera indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {facingMode === 'user' ? '🤳 Front' : '📷 Back'}
              </div>
              
              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-9xl font-bold text-white animate-pulse" style={{
                    textShadow: '0 0 40px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.7)'
                  }}>
                    {countdown}
                  </div>
                </div>
              )}

              {/* Fullscreen Recording Controls */}
              {isFullscreen && isRecording && countdown === null && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                  {/* Pause/Resume */}
                  {!isPaused ? (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
                    >
                      <div className="flex gap-1">
                        <div className="w-1.5 h-5 bg-white rounded-sm" />
                        <div className="w-1.5 h-5 bg-white rounded-sm" />
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
                    >
                      <Play className="w-6 h-6 text-white fill-white" />
                    </button>
                  )}
                  
                  {/* Timer */}
                  <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-mono text-lg">{formatDuration(duration)}</span>
                  </div>
                  
                  {/* Stop */}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all"
                  >
                    <div className="w-5 h-5 bg-white rounded-sm" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Countdown with Circular Level Meter (for audio mode) */}
          {countdown !== null && mode === 'audio' && streamRef.current && (
            <div className="mb-4 flex justify-center items-center relative">
              <SimpleLevelMeter stream={streamRef.current} circular />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-red-500 animate-pulse">
                  {countdown}
                </div>
              </div>
            </div>
          )}

          {/* Timer with Circular Level Meter and Controls */}
          {isRecording && countdown === null && streamRef.current && (
            <div className="mb-4 flex justify-center items-center gap-6">
              {/* Pause/Resume Button */}
              {!isPaused ? (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-black rounded-sm" />
                    <div className="w-1 h-4 bg-black rounded-sm" />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Play className="w-5 h-5 text-black fill-black" />
                </button>
              )}
              
              {/* Circular Meter with Timer */}
              <div className="relative flex items-center justify-center">
                <SimpleLevelMeter stream={streamRef.current} circular />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mx-auto mb-1" />
                    <div className="text-white font-mono text-xs">{formatDuration(duration)}</div>
                  </div>
                </div>
              </div>
              
              {/* Stop Button */}
              <button
                type="button"
                onClick={stopRecording}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <div className="w-4 h-4 bg-white rounded-sm" />
              </button>
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
                        recordingIdRef.current = generateRecordingId(instanceId ? `${category}-${instanceId}` : category)
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

          {/* Microphone Selector (when not recording and multiple mics available) */}
          {!isRecording && countdown === null && !hasSavedRecording && audioDevices.length > 1 && (
            <div className="mb-4" ref={micDropdownRef}>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Select Microphone
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMicDropdownOpen(!isMicDropdownOpen)}
                  disabled={isRecording}
                  className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                    selectedMic 
                      ? 'text-white' 
                      : 'text-[#9CA3AF]'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {selectedMic 
                    ? (audioDevices.find(d => d.deviceId === selectedMic)?.label || `Microphone ${selectedMic.slice(0, 8)}...`)
                    : 'Select Microphone'}
                </button>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isMicDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isMicDropdownOpen && !isRecording && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsMicDropdownOpen(false)}
                    />
                    <div className="absolute z-20 w-full bottom-full mb-1 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                      <div className="py-2">
                        {audioDevices.map((device) => {
                          const label = device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
                          const isSelected = device.deviceId === selectedMic
                          return (
                            <button
                              key={device.deviceId}
                              type="button"
                              onClick={() => {
                                setSelectedMic(device.deviceId)
                                setIsMicDropdownOpen(false)
                              }}
                              className={`w-full px-6 py-2 text-left transition-colors ${
                                isSelected
                                  ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                                  : 'text-white hover:bg-[#333]'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {!isRecording && countdown === null && !hasSavedRecording && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={startRecording}
                variant="primary"
                size="sm"
                className="gap-2 w-full md:w-auto"
              >
                {mode === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                Start Recording
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Mode - Just show transcript when ready (no player) */}
      {recordingPurpose === 'quick' && transcript && !isTranscribing && (
        <div className="bg-neutral-900 border-2 border-[#14B8A6]/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-[#14B8A6]" />
            <h3 className="text-lg font-semibold text-[#14B8A6]">Transcript Ready</h3>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-[#14B8A6]/20 mb-4">
            <p className="text-white whitespace-pre-wrap">{transcript}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (onRecordingComplete && recordedBlob) {
                  // Quick mode: Just pass transcript, no file needed
                  onRecordingComplete(recordedBlob, transcript, false, undefined)
                }
                // Auto-cleanup after use
                setRecordedBlob(null)
                setTranscript('')
                setDuration(0)
              }}
              variant="primary"
              size="sm"
              className="gap-2 flex-1"
            >
              <Check className="w-4 h-4" />
              Use This
            </Button>
            <Button
              onClick={discardRecording}
              variant="ghost"
              size="sm"
              className="gap-2 flex-1"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Recorded Media Preview - Hidden in quick mode (no playback needed) */}
      {recordedBlob && recordedUrl && recordingPurpose !== 'quick' && (
        <div className="bg-neutral-900 border-2 border-[#FFB701] rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Recording Complete</h3>

          {/* Instructions - Collapsible toggle for transcriptOnly mode */}
          {recordingPurpose === 'transcriptOnly' ? (
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800/70 transition-colors"
              >
                <span className="text-sm font-semibold text-white">How to use</span>
                {showInstructions ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
              </button>
              {showInstructions && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 font-bold mt-0.5">1.</span>
                    <p className="text-sm text-neutral-300">Click Transcribe to convert speech to text</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 font-bold mt-0.5">2.</span>
                    <p className="text-sm text-neutral-300">Your text will appear in the text field above</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 font-bold mt-0.5">3.</span>
                    <p className="text-sm text-neutral-300">Use the page's Save button to save your changes</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
              <ol className="space-y-2 text-sm text-neutral-300 list-decimal list-inside">
                <li>Listen to your recording using the player below</li>
                {mode === 'audio' && enableEditor && <li>If needed, click "Edit" to trim or remove sections</li>}
                {recordingPurpose !== 'audioOnly' && <li>Click "Transcribe" to convert speech to text (required for saving)</li>}
                {recordingPurpose !== 'audioOnly' && <li>Review the transcript, then click "Save" to keep your recording</li>}
                {recordingPurpose === 'audioOnly' && <li>Click "Save" when you're satisfied with your recording</li>}
              </ol>
            </div>
          )}

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
              key={recordedUrl || s3Url || 'audio-player'} // Force re-mount when URL changes
              src={s3Url || recordedUrl || undefined}
              controls
              className="w-full"
              controlsList="nodownload"
              preload="metadata"
              onError={(e) => {
                const target = e.currentTarget as HTMLAudioElement
                console.error('❌ Audio player error:', {
                  error: e,
                  networkState: target.networkState,
                  readyState: target.readyState,
                  errorCode: target.error?.code,
                  errorMessage: target.error?.message
                })
                console.log('Audio source:', s3Url || recordedUrl)
                console.log('Blob info:', recordedBlob ? { size: recordedBlob.size, type: recordedBlob.type } : 'No blob')
                
                // Only show error if there's actually a source to play
                if ((recordedUrl || s3Url) && target.error) {
                  // Network errors (code 2) are often temporary/can be ignored
                  if (target.error.code !== 2) {
                    setError('Unable to play audio. The recording may need a moment to process.')
                  }
                }
              }}
              onLoadedMetadata={() => {
                // Clear any previous errors when audio loads successfully
                setError(null)
                console.log('✅ Audio loaded successfully')
              }}
              onCanPlayThrough={() => {
                console.log('✅ Audio can play through')
              }}
            />
          )}

          {/* Transcription - Hide for audioOnly mode */}
          {recordingPurpose !== 'audioOnly' && (
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
              ) : null}
            </div>
          )}

          {/* Save Recording Option - Only show for non-withFile, non-audioOnly, and non-transcriptOnly modes */}
          {showSaveOption && recordingPurpose !== 'withFile' && recordingPurpose !== 'audioOnly' && recordingPurpose !== 'transcriptOnly' && (
            <div className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg">
              <Checkbox
                id="saveRecording"
                label={`Save ${mode === 'video' ? 'video' : 'audio'} file to cloud storage`}
                checked={saveRecording}
                onChange={(e) => setSaveRecording(e.target.checked)}
              />
              <span className="text-sm text-neutral-500">
                ({saveRecording ? 'File will be saved' : 'Only transcript will be saved'})
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            {/* transcriptOnly mode: Simplified flow - Transcribe then Done */}
            {recordingPurpose === 'transcriptOnly' ? (
              <>
                {!transcript && !isTranscribing && (
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
                      
                      // For transcriptOnly, the transcript goes to textarea via onTranscriptComplete
                      // Just close the recorder after transcription
                      if (transcriptResult) {
                        console.log('✅ Transcription complete, closing recorder')
                        
                        // Clean up IndexedDB
                        if (recordingIdRef.current) {
                          await deleteSavedRecording(recordingIdRef.current)
                        }
                        
                        // Reset state to close recorder
                        setRecordedBlob(null)
                        setRecordedUrl(null)
                        setS3Url(null)
                        setTranscript('')
                        setDuration(0)
                        chunksRef.current = []
                        durationRef.current = 0
                        transcriptRef.current = ''
                      }
                    }}
                    variant="primary"
                    size="sm"
                    className="gap-2 flex-1"
                    disabled={!recordedBlob || recordedBlob.size === 0 || isUploading}
                  >
                    <Mic className="w-4 h-4" />
                    Transcribe
                  </Button>
                )}
                
                <Button
                  onClick={discardRecording}
                  variant="ghost"
                  size="sm"
                  className="gap-2 flex-1 bg-[rgba(255,0,64,0.1)] text-[#FF0040] border-2 border-[rgba(255,0,64,0.2)] hover:bg-[rgba(255,0,64,0.2)] active:opacity-80"
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </Button>
              </>
            ) : (
              <>
                {/* Transcribe Button (only if not transcribed yet and not audioOnly) */}
                {recordingPurpose !== 'audioOnly' && !transcript && !isTranscribing && (
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
                      
                      // Update IndexedDB with transcript
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
                    variant="primary"
                    size="sm"
                    className="gap-2 basis-[calc(50%-0.375rem)] sm:basis-auto min-w-0"
                    disabled={!recordedBlob || recordedBlob.size === 0 || isUploading}
                  >
                    <Mic className="w-4 h-4" />
                    Transcribe
                  </Button>
                )}

                {/* Edit Recording Button (audio only, enabled) */}
                {mode === 'audio' && enableEditor && !showEditor && (
                  <Button
                    onClick={() => setShowEditor(true)}
                    variant="primary"
                    size="sm"
                    className="gap-2 basis-[calc(50%-0.375rem)] sm:basis-auto min-w-0"
                    disabled={isUploading}
                  >
                    <Scissors className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                
                {/* Save Button (for non-transcriptOnly modes) */}
                <Button
                  onClick={async () => {
                    // For audioOnly mode, upload to S3 first, then call onRecordingComplete
                    if (recordingPurpose === 'audioOnly' && recordedBlob && !s3Url) {
                      setIsUploading(true)
                      setError(null)
                      const folder = storageFolder || 'journalAudioRecordings'
                      const fileName = `recording-${Date.now()}.webm`
                      
                      console.log('📤 audioOnly mode: Uploading to S3...')
                      
                      try {
                        const uploadResult = await uploadRecording(recordedBlob, folder, fileName)
                        setS3Url(uploadResult.url)
                        console.log('✅ Recording uploaded to S3:', uploadResult.url)
                        
                        if (onRecordingComplete) {
                          onRecordingComplete(recordedBlob, transcript || undefined, saveRecording, uploadResult.url)
                        }
                      } catch (uploadErr) {
                        console.error('❌ S3 upload failed:', uploadErr)
                        setError('Failed to upload recording. Please try again.')
                      } finally {
                        setIsUploading(false)
                      }
                    } else {
                      // For other modes, S3 URL already exists or not needed
                      if (onRecordingComplete) {
                        onRecordingComplete(recordedBlob, transcript || undefined, saveRecording, s3Url || undefined)
                      }
                    }
                  }}
                  variant="primary"
                  size="sm"
                  className="gap-2 basis-[calc(50%-0.375rem)] sm:basis-auto min-w-0"
                  disabled={(recordingPurpose === 'audioOnly' ? false : !transcript) || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={discardRecording}
                  variant="ghost"
                  size="sm"
                  className="gap-2 basis-[calc(50%-0.375rem)] sm:basis-auto min-w-0 bg-[rgba(255,0,64,0.1)] text-[#FF0040] border-2 border-[rgba(255,0,64,0.2)] hover:bg-[rgba(255,0,64,0.2)] active:opacity-80"
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Audio Editor - Only for audio mode when enabled */}
      {mode === 'audio' && enableEditor && showEditor && recordedBlob && (
        <AudioEditor
          audioBlob={recordedBlob}
          onSave={async (editedBlob) => {
            console.log('📝 Saving edited audio:', {
              originalSize: recordedBlob?.size,
              editedSize: editedBlob.size,
              editedType: editedBlob.type
            })
            
            // Clear any existing errors
            setError(null)
            
            // Revoke old URL to free memory
            if (recordedUrl) {
              URL.revokeObjectURL(recordedUrl)
            }
            
            // Create new URL for edited blob
            const newUrl = URL.createObjectURL(editedBlob)
            
            // Calculate new duration from edited audio
            const audioContext = new AudioContext()
            const arrayBuffer = await editedBlob.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
            const newDuration = Math.floor(audioBuffer.duration)
            
            // Update state with edited audio and new duration
            setRecordedBlob(editedBlob)
            setRecordedUrl(newUrl)
            setDuration(newDuration)
            durationRef.current = newDuration
            
            // Clear transcript since audio has changed
            setTranscript('')
            transcriptRef.current = ''
            
            // Update chunks ref with edited blob
            chunksRef.current = [editedBlob]
            
            // Close editor first for better UX
            setShowEditor(false)
            
            console.log('✅ Audio updated, new URL created:', newUrl)
            console.log('✅ New duration:', newDuration, 'seconds')
            
            // Save to IndexedDB if we have a recording ID
            if (recordingIdRef.current) {
              try {
                await saveRecordingChunks(
                  recordingIdRef.current,
                  category,
                  [editedBlob],
                  newDuration,
                  mode,
                  editedBlob,
                  ''
                )
                console.log('✅ Saved edited audio to IndexedDB')
              } catch (err) {
                console.error('Failed to save to IndexedDB:', err)
              }
            }
            
            // Don't auto-transcribe after editing - let user click button
            // This gives them a chance to review the edited audio first
            console.log('✅ Audio saved. User can now transcribe manually.')
          }}
          onCancel={() => {
            console.log('❌ Edit cancelled')
            setShowEditor(false)
          }}
        />
      )}
    </div>
  )
}

