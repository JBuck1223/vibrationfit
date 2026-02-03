'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Loader2, X, Square } from 'lucide-react'
import { Textarea, Button } from '@/lib/design-system/components'
import { MediaRecorderComponent } from './MediaRecorder'
import { uploadAndTranscribeRecording } from '@/lib/services/recordingService'
import { USER_FOLDERS } from '@/lib/storage/s3-storage-presigned'

type UserFolder = keyof typeof USER_FOLDERS

interface RecordingTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
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
}

export function RecordingTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
  allowVideo = false,
  className = '',
  disabled = false,
  onRecordingSaved, // (url: string, transcript: string, type: 'audio' | 'video', updatedText: string, s3Url?: string) => void
  storageFolder = 'journal',
  category,
  instanceId, // Unique identifier for this field
  onUploadProgress,
  transcriptOnly = false, // Deprecated
  recordingPurpose = transcriptOnly ? 'transcriptOnly' : 'transcriptOnly' // Default to transcriptOnly for better UX
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

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  // Auto-resize when value changes
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

  // Quick mode: Start inline recording immediately
  const startQuickRecording = async () => {
    try {
      setUploadError(null)
      
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
      
      // Update audio level in animation frame
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
          : 'audio/webm'
      })
      
      quickMediaRecorderRef.current = mediaRecorder
      quickChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          quickChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Stop audio level monitoring
        if (quickAnimationFrameRef.current) {
          cancelAnimationFrame(quickAnimationFrameRef.current)
        }
        if (quickAudioContextRef.current) {
          quickAudioContextRef.current.close()
        }
        setQuickAudioLevel(0)
        
        // Stop stream
        if (quickStreamRef.current) {
          quickStreamRef.current.getTracks().forEach(track => track.stop())
        }
        
        // Create blob
        const blob = new Blob(quickChunksRef.current, { type: 'audio/webm' })
        
        if (blob.size === 0) {
          setUploadError('Recording failed - no data captured')
          setIsQuickRecording(false)
          setQuickRecordingDuration(0)
          return
        }
        
        // Transcribe
        setIsUploading(true)
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
          const transcript = data.transcript || ''
          
          // Insert transcript into textarea
          const newValue = value 
            ? `${value}\n\n${transcript}`
            : transcript
          onChange(newValue)
        } catch (err) {
          console.error('Quick transcription error:', err)
          setUploadError('Failed to transcribe audio. Please try again.')
        } finally {
          setIsUploading(false)
          setIsQuickRecording(false)
          setQuickRecordingDuration(0)
        }
      }
      
      mediaRecorder.start(1000)
      setIsQuickRecording(true)
      setQuickRecordingDuration(0)
      
      // Start timer
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
    }
  }

  // Quick mode: Stop recording
  const stopQuickRecording = () => {
    if (quickTimerRef.current) {
      clearInterval(quickTimerRef.current)
    }
    
    if (quickMediaRecorderRef.current && isQuickRecording) {
      quickMediaRecorderRef.current.stop()
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

  const resolvedPlaceholder = placeholder ?? 'Type or transcribe audio.'

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-neutral-200">
          {label}
        </label>
      )}

      {/* Text Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            autoResizeTextarea()
          }}
          placeholder={resolvedPlaceholder}
          rows={rows}
          disabled={disabled || isUploading}
          className={`w-full min-h-[100px] resize-none overflow-hidden ${className}`}
        />
        
        {/* Recording Buttons */}
        {!showRecorder && !isQuickRecording && (
          <div className="absolute bottom-3 right-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                // Quick mode: start inline recording immediately
                if (recordingPurpose === 'quick') {
                  startQuickRecording()
                } else {
                  setRecordingMode('audio')
                  setShowRecorder(true)
                }
              }}
              disabled={disabled || isUploading}
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
                disabled={disabled || isUploading}
                className="p-2 bg-neutral-600 hover:bg-white text-white hover:text-neutral-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Record video"
              >
                <Video className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Quick Mode: Inline Recording Indicator */}
        {isQuickRecording && (
          <div className="absolute bottom-3 right-1.5 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              
              {/* Audio Level Bars */}
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
      </div>

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center gap-2 text-primary-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{recordingPurpose === 'quick' ? 'Transcribing...' : 'Saving recording and transcript...'}</span>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {uploadError}
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
            autoTranscribe={false} // Manual transcription - user clicks Transcribe button to avoid timing issues
            maxDuration={600} // 10 minutes
            showSaveOption={recordingPurpose === 'withFile'} // Hide save option if not withFile mode
            category={category || storageFolder} // Use category if provided, else storageFolder
            instanceId={instanceId} // Pass through unique field identifier
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

