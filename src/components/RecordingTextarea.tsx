'use client'

import React, { useState } from 'react'
import { Mic, Video, Loader2, X } from 'lucide-react'
import { Textarea, Button } from '@/lib/design-system/components'
import { MediaRecorderComponent } from './MediaRecorder'
import { uploadAndTranscribeRecording } from '@/lib/services/recordingService'

interface RecordingTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
  allowVideo?: boolean
  className?: string
  disabled?: boolean
}

export function RecordingTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
  allowVideo = false,
  className = '',
  disabled = false
}: RecordingTextareaProps) {
  const [showRecorder, setShowRecorder] = useState(false)
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video'>('audio')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleRecordingComplete = async (blob: Blob, transcript?: string) => {
    if (!transcript) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Upload the recording to S3 and get transcript
      const result = await uploadAndTranscribeRecording(blob, 'evidence')
      
      // Append transcript to existing text
      const newValue = value 
        ? `${value}\n\n--- Recorded on ${new Date().toLocaleDateString()} ---\n${result.transcript}`
        : result.transcript

      onChange(newValue)
      setShowRecorder(false)
    } catch (error) {
      console.error('Failed to process recording:', error)
      setUploadError('Failed to save recording. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTranscriptComplete = (transcript: string) => {
    // Optionally append transcript immediately (before upload completes)
    // This provides faster feedback to the user
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isUploading}
          className="w-full"
        />
        
        {/* Recording Buttons */}
        {!showRecorder && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={() => {
                setRecordingMode('audio')
                setShowRecorder(true)
              }}
              disabled={disabled || isUploading}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Record audio"
            >
              <Mic className="w-4 h-4" />
            </button>
            {allowVideo && (
              <button
                onClick={() => {
                  setRecordingMode('video')
                  setShowRecorder(true)
                }}
                disabled={disabled || isUploading}
                className="p-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            autoTranscribe={recordingMode === 'audio'}
            maxDuration={600} // 10 minutes
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

