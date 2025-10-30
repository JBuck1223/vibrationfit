'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Loader2, X } from 'lucide-react'
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
  onUploadProgress?: (progress: number, status: string, fileName: string, fileSize: number) => void
  transcriptOnly?: boolean // Deprecated: use recordingPurpose instead
  recordingPurpose?: 'quick' | 'transcriptOnly' | 'withFile' // Recording behavior: quick (no S3), transcriptOnly (S3 deleted if discarded), withFile (S3 always kept)
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
  onUploadProgress,
  transcriptOnly = false, // Deprecated
  recordingPurpose = transcriptOnly ? 'transcriptOnly' : 'withFile' // Default based on transcriptOnly for backward compat
}: RecordingTextareaProps) {
  const [showRecorder, setShowRecorder] = useState(false)
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video'>('audio')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className={`space-y-3 ${className}`}>
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
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isUploading}
          className="w-full min-h-[100px] resize-none overflow-hidden"
        />
        
        {/* Recording Buttons */}
        {!showRecorder && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRecordingMode('audio')
                setShowRecorder(true)
              }}
              disabled={disabled || isUploading}
              className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Record video"
              >
                <Video className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center gap-2 text-primary-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving recording and transcript...</span>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {/* Recording Interface */}
      {showRecorder && (
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

      {/* Helper Text */}
      <p className="text-xs text-neutral-400">
        {allowVideo 
          ? 'Type your story or click the microphone/video icon to record.'
          : 'Type your story or click the microphone icon to record audio.'}
      </p>
    </div>
  )
}

