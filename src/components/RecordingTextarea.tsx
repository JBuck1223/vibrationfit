'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Video, Loader2, X, Square, Check, Trash2, RotateCcw } from 'lucide-react'
import { Textarea, Button } from '@/lib/design-system/components'
import { VIVALoadingOverlay } from '@/lib/design-system/components/overlays'
import { MediaRecorderComponent } from './MediaRecorder'
import { uploadAndTranscribeRecording } from '@/lib/services/recordingService'
import { uploadUserFile, USER_FOLDERS } from '@/lib/storage/s3-storage-presigned'

type UserFolder = keyof typeof USER_FOLDERS

const AUDIO_FOLDER_MAP: Partial<Record<string, keyof typeof USER_FOLDERS>> = {
  journal: 'journalAudioRecordings',
  visionBoard: 'journalAudioRecordings',
  lifeVision: 'lifeVisionAudioRecordings',
  alignmentPlan: 'alignmentPlanAudioRecordings',
  profile: 'profileAudioRecordings',
  customTracks: 'journalAudioRecordings',
}

type QuickUploadPhase = 'idle' | 'saving' | 'transcribing' | 'done' | 'error' | 'recovered'

const PENDING_TRANSCRIPTION_KEY = 'vf_pending_transcription'

interface PendingTranscription {
  s3Key: string
  s3Url: string
  instanceId?: string
  category?: string
  storageFolder?: string
  startedAt: number
}

function savePendingTranscription(data: PendingTranscription) {
  try {
    const existing = JSON.parse(localStorage.getItem(PENDING_TRANSCRIPTION_KEY) || '[]')
    const filtered = existing.filter((p: PendingTranscription) => p.s3Key !== data.s3Key)
    filtered.push(data)
    localStorage.setItem(PENDING_TRANSCRIPTION_KEY, JSON.stringify(filtered))
  } catch { /* localStorage not available */ }
}

function clearPendingTranscription(s3Key: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(PENDING_TRANSCRIPTION_KEY) || '[]')
    const filtered = existing.filter((p: PendingTranscription) => p.s3Key !== s3Key)
    localStorage.setItem(PENDING_TRANSCRIPTION_KEY, JSON.stringify(filtered))
  } catch { /* localStorage not available */ }
}

function getPendingTranscriptions(instanceId?: string, category?: string): PendingTranscription[] {
  try {
    const all = JSON.parse(localStorage.getItem(PENDING_TRANSCRIPTION_KEY) || '[]')
    return all.filter((p: PendingTranscription) => {
      if (instanceId && p.instanceId === instanceId) return true
      if (category && p.category === category) return true
      return false
    })
  } catch { return [] }
}

async function checkForExistingSidecar(s3Key: string): Promise<{
  found: boolean
  transcript?: string
  duration?: number
}> {
  try {
    const response = await fetch('/api/transcribe-from-s3/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key }),
    })
    if (!response.ok) return { found: false }
    return await response.json()
  } catch {
    return { found: false }
  }
}

interface RecordingTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
  description?: string
  allowVideo?: boolean
  className?: string
  disabled?: boolean
  onRecordingSaved?: (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => Promise<void>
  storageFolder?: 'journal' | 'visionBoard' | 'lifeVision' | 'alignmentPlan' | 'profile' | 'customTracks'
  category?: string // Category for IndexedDB persistence (e.g., 'fun', 'health', 'journal')
  instanceId?: string // Unique identifier for this field (prevents recordings from bleeding across fields)
  onUploadProgress?: (progress: number, status: string, fileName: string, fileSize: number) => void
  transcriptOnly?: boolean // Deprecated: use recordingPurpose instead
  recordingPurpose?: 'quick' | 'transcriptOnly' | 'withFile' | 'audioOnly' // Recording behavior: quick (no S3), transcriptOnly (S3 deleted if discarded), withFile (S3 always kept), audioOnly (S3 storage, no transcription)
  onAudioSaved?: (audioUrl: string, transcript: string) => void
}

export function RecordingTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
  description,
  allowVideo = false,
  className = '',
  disabled = false,
  onRecordingSaved, // (url: string, transcript: string, type: 'audio' | 'video', updatedText: string, s3Url?: string) => void
  storageFolder = 'journal',
  category,
  instanceId, // Unique identifier for this field
  onUploadProgress,
  transcriptOnly = false, // Deprecated
  recordingPurpose = transcriptOnly ? 'transcriptOnly' : 'transcriptOnly', // Default to transcriptOnly for better UX
  onAudioSaved,
}: RecordingTextareaProps) {
  const [showRecorder, setShowRecorder] = useState(false)
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video'>('audio')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Quick mode inline recording state
  const [isQuickRecording, setIsQuickRecording] = useState(false)
  const [quickRecordingDuration, setQuickRecordingDuration] = useState(0)
  const [quickAudioLevel, setQuickAudioLevel] = useState(0)
  const quickMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const quickStreamRef = useRef<MediaStream | null>(null)
  const quickChunksRef = useRef<Blob[]>([])
  const quickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const quickAudioContextRef = useRef<AudioContext | null>(null)
  const quickAnalyserRef = useRef<AnalyserNode | null>(null)
  const quickAnimationFrameRef = useRef<number | null>(null)
  const quickCancelledRef = useRef(false)

  // Two-phase upload state (S3 save + transcription)
  const [quickUploadPhase, setQuickUploadPhase] = useState<QuickUploadPhase>('idle')
  const [quickUploadProgress, setQuickUploadProgress] = useState(0)
  const [quickSavedS3Key, setQuickSavedS3Key] = useState<string | null>(null)
  const [quickSavedS3Url, setQuickSavedS3Url] = useState<string | null>(null)
  const [quickRecordedDuration, setQuickRecordedDuration] = useState(0)
  const quickValueRef = useRef(value)

  // Keep value ref in sync so onstop closure always reads current text
  useEffect(() => { quickValueRef.current = value }, [value])

  // Auto-resize textarea without disrupting scroll position
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Save page scroll position before the reflow
    const scrollY = window.scrollY

    // Collapse to measure true content height, then re-expand
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'

    // Restore scroll position so the page doesn't jump
    window.scrollTo({ top: scrollY, behavior: 'instant' })
  }

  // Auto-resize when value changes (covers typing + transcription)
  useEffect(() => {
    autoResizeTextarea()
  }, [value])

  const handleRecordingComplete = async (blob: Blob, transcript?: string, shouldSaveFile?: boolean) => {
    console.log('📹 RecordingTextarea: handleRecordingComplete called', {
      hasBlob: !!blob,
      hasTranscript: !!transcript,
      shouldSaveFile,
      recordingMode,
      storageFolder
    })

    if (!transcript) {
      console.warn('No transcript provided, skipping save')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      let recordingUrl: string | undefined

      // Prepare the updated text value with transcript
      const newValue = value 
        ? `${value}\n\n${transcript}`
        : transcript

      // NOTE: S3 upload now happens automatically during transcription in MediaRecorder
      // This section is for parent's explicit file save requests (legacy flow)
      if (shouldSaveFile && !transcriptOnly) {
        console.log('📤 Parent requested explicit file upload to S3...')
        
        // Determine the specific subfolder based on recording type and storage folder
        let specificFolder: string
        if (storageFolder === 'lifeVision') {
          specificFolder = recordingMode === 'video' ? 'lifeVisionVideoRecordings' : 'lifeVisionAudioRecordings'
        } else if (storageFolder === 'alignmentPlan') {
          specificFolder = recordingMode === 'video' ? 'alignmentPlanVideoRecordings' : 'alignmentPlanAudioRecordings'
        } else if (storageFolder === 'profile') {
          specificFolder = recordingMode === 'video' ? 'profileVideoRecordings' : 'profileAudioRecordings'
        } else {
          // Default to journal (or other tools can specify their own recording folders)
          specificFolder = recordingMode === 'video' ? 'journalVideoRecordings' : 'journalAudioRecordings'
        }
        
        // Generate file info for progress tracking
        const fileName = `recording-${Date.now()}.${recordingMode === 'video' ? 'webm' : 'webm'}`
        const fileSize = blob.size
        
        const result = await uploadAndTranscribeRecording(
          blob, 
          specificFolder as UserFolder, 
          fileName,
          (progress, status) => {
            onUploadProgress?.(progress, status, fileName, fileSize)
          }
        )
        recordingUrl = result.url
        console.log('✅ Recording uploaded:', recordingUrl)
      } else if (transcriptOnly) {
        console.log('📝 Transcript-only mode: skipping file upload')
      } else {
        console.log('⏭️ Skipping file upload (checkbox unchecked)')
      }

      // Notify parent component (with or without file URL and S3 URL)
      if (onRecordingSaved) {
        console.log('📢 Notifying parent about saved recording with updated text')
        await onRecordingSaved(recordingUrl || '', transcript, recordingMode, newValue)
        console.log('✅ Parent save completed')
        // Note: S3 URL is handled separately in MediaRecorder via onRecordingComplete callback
        // Don't update text field here - parent reload will handle it
      } else {
        console.warn('⚠️ No onRecordingSaved callback provided!')
        // Only update text if no callback (fallback)
        console.log('📝 Updating text field with transcript (no callback)')
        onChange(newValue)
      }
      
      setShowRecorder(false)
    } catch (error) {
      console.error('❌ Failed to process recording:', error)
      setUploadError('Failed to save recording. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTranscriptComplete = (transcript: string) => {
    // Auto-populate textarea with transcript immediately when transcription completes
    // This allows user to see and edit the transcript right away
    const newValue = value
      ? `${value}\n\n${transcript}`
      : transcript
    onChange(newValue)
  }

  // Transcribe from an S3 key (used by onstop and retry)
  const transcribeFromS3 = useCallback(async (s3Key: string, audioUrl: string, isRecovery = false) => {
    setQuickUploadPhase('transcribing')
    setUploadError(null)

    // Persist to localStorage so we can recover if the page is lost
    savePendingTranscription({
      s3Key,
      s3Url: audioUrl,
      instanceId,
      category,
      storageFolder,
      startedAt: Date.now(),
    })

    // Check if the server already completed transcription (sidecar exists)
    const sidecar = await checkForExistingSidecar(s3Key)
    if (sidecar.found && sidecar.transcript) {
      const currentValue = quickValueRef.current
      const newValue = currentValue
        ? `${currentValue}\n\n${sidecar.transcript}`
        : sidecar.transcript
      onChange(newValue)
      onAudioSaved?.(audioUrl, sidecar.transcript)
      clearPendingTranscription(s3Key)
      setQuickUploadPhase(isRecovery ? 'recovered' : 'done')
      return
    }

    const MAX_ATTEMPTS = 2
    const TIMEOUT_MS = 4 * 60 * 1000

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        const response = await fetch('/api/transcribe-from-s3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMsg = 'Transcription failed'
          let retryable = false
          try {
            const errorData = await response.json()
            errorMsg = errorData.error || errorMsg
            retryable = errorData.retryable === true || response.status >= 500
          } catch { /* use default */ }

          if (retryable && attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 2000))
            continue
          }
          throw new Error(errorMsg)
        }

        const data = await response.json()
        const transcript = data.transcript || ''

        const currentValue = quickValueRef.current
        const newValue = currentValue
          ? `${currentValue}\n\n${transcript}`
          : transcript
        onChange(newValue)
        onAudioSaved?.(audioUrl, transcript)

        clearPendingTranscription(s3Key)
        setQuickUploadPhase('done')
        return
      } catch (err: any) {
        clearTimeout(timeoutId)

        const isRetryable =
          err.name === 'AbortError' ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError')

        if (isRetryable && attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }

        console.error('S3 transcription error:', err)
        if (err.name === 'AbortError') {
          setUploadError('Transcription timed out. Your audio is saved -- tap retry.')
        } else {
          setUploadError(err.message || 'Transcription failed. Your audio is saved -- tap retry.')
        }
        setQuickUploadPhase('error')
        return
      }
    }
  }, [onChange, onAudioSaved, instanceId, category, storageFolder])

  const retryTranscription = useCallback(() => {
    if (quickSavedS3Key && quickSavedS3Url) {
      transcribeFromS3(quickSavedS3Key, quickSavedS3Url, true)
    }
  }, [quickSavedS3Key, quickSavedS3Url, transcribeFromS3])

  // Quick mode: Cancel recording without transcription
  const cancelQuickRecording = () => {
    quickCancelledRef.current = true

    if (quickTimerRef.current) {
      clearInterval(quickTimerRef.current)
      quickTimerRef.current = null
    }

    if (quickMediaRecorderRef.current && quickMediaRecorderRef.current.state === 'recording') {
      quickMediaRecorderRef.current.stop()
    } else {
      if (quickAnimationFrameRef.current) {
        cancelAnimationFrame(quickAnimationFrameRef.current)
        quickAnimationFrameRef.current = null
      }
      if (quickAudioContextRef.current) {
        try { quickAudioContextRef.current.close() } catch { /* already closed */ }
        quickAudioContextRef.current = null
      }
      if (quickStreamRef.current) {
        quickStreamRef.current.getTracks().forEach(track => track.stop())
        quickStreamRef.current = null
      }
      setQuickAudioLevel(0)
      setIsQuickRecording(false)
      setIsUploading(false)
      setQuickRecordingDuration(0)
      quickCancelledRef.current = false
    }
  }

  // Quick mode: Start inline recording immediately
  const startQuickRecording = async () => {
    try {
      // Force-reset any stuck state from a previous recording
      quickCancelledRef.current = false
      setIsUploading(false)
      setIsQuickRecording(false)
      setUploadError(null)

      // Clean up any leftover resources from a prior session
      if (quickAnimationFrameRef.current) {
        cancelAnimationFrame(quickAnimationFrameRef.current)
        quickAnimationFrameRef.current = null
      }
      if (quickAudioContextRef.current) {
        try { quickAudioContextRef.current.close() } catch { /* already closed */ }
        quickAudioContextRef.current = null
      }
      if (quickStreamRef.current) {
        quickStreamRef.current.getTracks().forEach(track => track.stop())
        quickStreamRef.current = null
      }
      
      // Request default microphone (no device selection)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      quickStreamRef.current = stream
      
      // Set up audio level monitoring
      const audioContext = new AudioContext()
      quickAudioContextRef.current = audioContext
      
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      quickAnalyserRef.current = analyser
      
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateLevel = () => {
        if (!quickAnalyserRef.current) return
        
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = Math.min(100, (average / 255) * 100)
        setQuickAudioLevel(normalizedLevel)
        
        quickAnimationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm',
        audioBitsPerSecond: 48000
      })
      
      quickMediaRecorderRef.current = mediaRecorder
      quickChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          quickChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        try {
          if (quickAnimationFrameRef.current) {
            cancelAnimationFrame(quickAnimationFrameRef.current)
            quickAnimationFrameRef.current = null
          }
          if (quickAudioContextRef.current) {
            try { quickAudioContextRef.current.close() } catch { /* already closed */ }
            quickAudioContextRef.current = null
          }
          setQuickAudioLevel(0)

          if (quickStreamRef.current) {
            quickStreamRef.current.getTracks().forEach(track => track.stop())
            quickStreamRef.current = null
          }

          if (quickCancelledRef.current) {
            quickCancelledRef.current = false
            return
          }

          const blob = new Blob(quickChunksRef.current, { type: 'audio/webm' })

          if (blob.size === 0) {
            setUploadError('Recording failed - no data captured')
            return
          }

          setIsUploading(true)
          setQuickSavedS3Key(null)
          setQuickSavedS3Url(null)

          // --- Phase 1: Upload to S3 ---
          setQuickUploadPhase('saving')
          setQuickUploadProgress(0)

          const folder = AUDIO_FOLDER_MAP[storageFolder] || 'journalAudioRecordings'
          const fileName = `recording-${Date.now()}.webm`
          const file = new File([blob], fileName, { type: 'audio/webm' })

          let s3Key: string
          let s3Url: string

          try {
            const result = await uploadUserFile(
              folder,
              file,
              undefined,
              (progress) => setQuickUploadProgress(progress)
            )
            s3Key = result.key
            s3Url = result.url
            setQuickSavedS3Key(s3Key)
            setQuickSavedS3Url(s3Url)
          } catch (uploadErr: any) {
            console.error('S3 upload failed, falling back to direct transcription:', uploadErr)

            // Graceful degradation: fall back to direct Whisper transcription
            setQuickUploadPhase('transcribing')
            try {
              const formData = new FormData()
              formData.append('audio', blob, 'recording.webm')
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 4 * 60 * 1000)
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
              if (response.ok) {
                const data = await response.json()
                const transcript = data.transcript || ''
                const currentValue = quickValueRef.current
                const newValue = currentValue ? `${currentValue}\n\n${transcript}` : transcript
                onChange(newValue)
                setQuickUploadPhase('done')
              } else {
                throw new Error('Direct transcription also failed')
              }
            } catch {
              setUploadError('Failed to save or transcribe. Please try again.')
              setQuickUploadPhase('error')
            }
            return
          }

          // --- Phase 2: Transcribe from S3 ---
          await transcribeFromS3(s3Key, s3Url)
        } catch (err) {
          console.error('Unexpected error in onstop handler:', err)
          setUploadError('Something went wrong. Please try again.')
          setQuickUploadPhase('error')
        } finally {
          setIsUploading(false)
          setIsQuickRecording(false)
          setQuickRecordingDuration(0)
        }
      }
      
      mediaRecorder.start(1000)
      setIsQuickRecording(true)
      setQuickRecordingDuration(0)
      
      quickTimerRef.current = setInterval(() => {
        setQuickRecordingDuration(prev => prev + 1)
      }, 1000)
      
    } catch (err: any) {
      console.error('Quick recording error:', err)
      let errorMessage = 'Failed to access microphone.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.'
      }
      
      setUploadError(errorMessage)
      setIsQuickRecording(false)
      setIsUploading(false)
    }
  }

  // Quick mode: Stop recording
  const stopQuickRecording = () => {
    if (quickTimerRef.current) {
      clearInterval(quickTimerRef.current)
      quickTimerRef.current = null
    }

    // Capture duration for time estimates before it resets
    setQuickRecordedDuration(quickRecordingDuration)
    
    if (quickMediaRecorderRef.current && quickMediaRecorderRef.current.state === 'recording') {
      quickMediaRecorderRef.current.stop()
    } else {
      setIsQuickRecording(false)
      setIsUploading(false)
      setQuickRecordingDuration(0)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (quickTimerRef.current) {
        clearInterval(quickTimerRef.current)
      }
      if (quickAnimationFrameRef.current) {
        cancelAnimationFrame(quickAnimationFrameRef.current)
      }
      if (quickAudioContextRef.current) {
        quickAudioContextRef.current.close()
      }
      if (quickStreamRef.current) {
        quickStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // On mount: check for orphaned pending transcriptions and attempt recovery
  useEffect(() => {
    if (recordingPurpose !== 'quick') return

    const pending = getPendingTranscriptions(instanceId, category)
    if (pending.length === 0) return

    const newest = pending.sort((a, b) => b.startedAt - a.startedAt)[0]
    const ageMs = Date.now() - newest.startedAt
    if (ageMs > 24 * 60 * 60 * 1000) {
      clearPendingTranscription(newest.s3Key)
      return
    }

    setQuickSavedS3Key(newest.s3Key)
    setQuickSavedS3Url(newest.s3Url)
    transcribeFromS3(newest.s3Key, newest.s3Url, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss the "recovered" overlay after 3 seconds
  useEffect(() => {
    if (quickUploadPhase !== 'recovered') return
    const timer = setTimeout(() => setQuickUploadPhase('done'), 3000)
    return () => clearTimeout(timer)
  }, [quickUploadPhase])

  const resolvedPlaceholder = placeholder ?? 'Type or transcribe audio.'

  // Dynamic VIVA overlay messages and time estimates based on phase and recording length
  const getOverlayMessages = (): string[] => {
    if (quickUploadPhase === 'recovered') {
      return [
        'VIVA recovered your transcript!',
        'Your recording was already transcribed.',
      ]
    }
    if (quickUploadPhase === 'saving') {
      return [
        'Saving your audio to the cloud...',
        'Almost there...',
      ]
    }
    if (quickRecordedDuration < 60) {
      return [
        'VIVA is turning your voice into text...',
        'Just a few more seconds...',
      ]
    }
    if (quickRecordedDuration < 300) {
      return [
        'VIVA is turning your voice into text...',
        'Processing your recording...',
        'Crafting your transcript...',
      ]
    }
    return [
      'VIVA is turning your voice into text...',
      'Processing a longer recording...',
      'Crafting your transcript...',
      'Hang tight, almost done...',
    ]
  }

  const getEstimatedTime = (): string => {
    if (quickUploadPhase === 'recovered') return 'Transcript restored successfully'
    if (quickUploadPhase === 'saving') return 'Uploading your audio...'
    if (quickRecordedDuration < 60) return 'This usually takes about 10 seconds'
    if (quickRecordedDuration < 180) return 'This usually takes 15-30 seconds'
    if (quickRecordedDuration < 300) return 'This usually takes 30-60 seconds'
    if (quickRecordedDuration < 600) return 'This usually takes 1-2 minutes'
    return 'This may take a few minutes'
  }

  // ~1.5x recording duration for Whisper processing, 10s floor
  const estimatedTranscriptionMs = Math.max(10000, quickRecordedDuration * 1500)

  const isOverlayVisible = quickUploadPhase === 'saving' || quickUploadPhase === 'transcribing' || quickUploadPhase === 'recovered'

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-neutral-200">
          {label}
        </label>
      )}

      {description && (
        <p className="text-sm text-neutral-400">
          {description}
        </p>
      )}

      {/* Text Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          placeholder={resolvedPlaceholder}
          rows={rows}
          disabled={disabled || isUploading}
          className={`w-full min-h-[100px] resize-none overflow-hidden pb-11 pr-10 ${className}`}
        />
        
        {/* Recording Buttons - never disabled by isUploading so clicks can self-heal stuck state */}
        {!showRecorder && !isQuickRecording && !isOverlayVisible && (
          <div className="absolute bottom-3 right-1.5 flex gap-2 p-2">
            <button
              type="button"
              onClick={() => {
                if (recordingPurpose === 'quick') {
                  startQuickRecording()
                } else {
                  setRecordingMode('audio')
                  setShowRecorder(true)
                }
              }}
              disabled={disabled}
              className="p-2 bg-neutral-600 hover:bg-white text-white hover:text-neutral-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Record audio"
            >
              <Mic className="w-4 h-4" />
            </button>
            {allowVideo && (
              <button
                type="button"
                onClick={() => {
                  setRecordingMode('video')
                  setShowRecorder(true)
                }}
                disabled={disabled}
                className="p-2 bg-neutral-600 hover:bg-white text-white hover:text-neutral-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Record video"
              >
                <Video className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Quick Mode: Inline Recording Indicator (while actively recording, before stop) */}
        {isQuickRecording && !isUploading && (
          <div className="absolute bottom-3 left-1.5 right-1.5 flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={cancelQuickRecording}
              className="p-2 bg-neutral-600 hover:bg-neutral-500 text-neutral-300 hover:text-white rounded-full transition-colors"
              title="Cancel recording"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="flex items-center gap-0.5 h-4">
                {[0, 1, 2, 3].map((i) => {
                  const barHeight = Math.min(100, quickAudioLevel + (i * 5))
                  const isActive = barHeight > (i * 25)
                  return (
                    <div
                      key={i}
                      className="w-1 bg-primary-500 rounded-full transition-all duration-100"
                      style={{
                        height: isActive ? `${Math.max(20, barHeight)}%` : '20%',
                        opacity: isActive ? 1 : 0.3
                      }}
                    />
                  )
                })}
              </div>
              <span className="text-xs font-mono text-red-400">
                {Math.floor(quickRecordingDuration / 60)}:{(quickRecordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={stopQuickRecording}
              className="p-2 bg-red-500 hover:bg-red-400 text-white rounded-full transition-colors"
              title="Stop recording"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          </div>
        )}

        {/* VIVA overlay during save/transcribe phases */}
        <VIVALoadingOverlay
          isVisible={isOverlayVisible}
          messages={getOverlayMessages()}
          cycleDuration={4000}
          estimatedTime={getEstimatedTime()}
          showProgressBar={true}
          size="sm"
          progress={quickUploadPhase === 'saving' ? quickUploadProgress : undefined}
          estimatedDuration={quickUploadPhase === 'transcribing' ? estimatedTranscriptionMs : undefined}
        />
      </div>

      {/* Clear button - below the text block */}
      {value && !isQuickRecording && !isUploading && !isOverlayVisible && !disabled && (
        <div className="flex justify-start -mt-1">
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors px-1 py-1 rounded"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      {/* Upload Status - hide during quick recording since overlay handles it */}
      {isUploading && !isQuickRecording && !isOverlayVisible && (
        <div className="flex items-center gap-2 text-primary-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving recording and transcript...</span>
        </div>
      )}

      {/* Error with retry */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{uploadError}</p>
          {quickUploadPhase === 'error' && quickSavedS3Key && (
            <button
              type="button"
              onClick={() => {
                setUploadError(null)
                retryTranscription()
              }}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#39FF14] hover:text-[#39FF14]/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry transcription
            </button>
          )}
        </div>
      )}

      {/* Recording Interface - Only show for non-quick modes */}
      {showRecorder && recordingPurpose !== 'quick' && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRecorder(false)}
            className="absolute top-2 right-2 z-10 p-1 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors"
            title="Close recorder"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <MediaRecorderComponent
            mode={recordingMode}
            onRecordingComplete={handleRecordingComplete}
            onTranscriptComplete={handleTranscriptComplete}
            autoTranscribe={false}
            maxDuration={600}
            showSaveOption={recordingPurpose === 'withFile'}
            category={category || storageFolder}
            instanceId={instanceId}
            recordingPurpose={recordingPurpose}
            storageFolder={
              recordingMode === 'video'
                ? (storageFolder === 'lifeVision' ? 'lifeVisionVideoRecordings' 
                   : storageFolder === 'alignmentPlan' ? 'alignmentPlanVideoRecordings'
                   : storageFolder === 'profile' ? 'profileVideoRecordings'
                   : 'journalVideoRecordings')
                : (storageFolder === 'lifeVision' ? 'lifeVisionAudioRecordings'
                   : storageFolder === 'alignmentPlan' ? 'alignmentPlanAudioRecordings'
                   : storageFolder === 'profile' ? 'profileAudioRecordings'
                   : 'journalAudioRecordings')
            }
          />
        </div>
      )}
    </div>
  )
}

