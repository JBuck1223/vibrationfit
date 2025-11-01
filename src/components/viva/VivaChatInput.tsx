'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, ArrowUp, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VivaChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
  multiline?: boolean // Use textarea for multi-line input
}

/**
 * Standardized VIVA chat input with:
 * - White circle icon with microphone for audio recording
 * - White circle icon with arrow up for submit
 * - Inline audio transcription support
 */
export function VivaChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Share what's on your mind...",
  disabled = false,
  isLoading = false,
  multiline = false,
  className
}: VivaChatInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support audio recording')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setIsRecording(true)

      // Determine best supported mime type
      let mimeType = 'audio/webm'
      const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option)) {
          mimeType = option
          break
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        // Auto-transcribe
        await transcribeAudio(blob)
      }

      mediaRecorder.start(1000) // Collect chunks every second
    } catch (err) {
      console.error('Error starting recording:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const data = await response.json()
      
      if (data.transcript) {
        // Insert transcribed text into input
        onChange(value ? `${value} ${data.transcript}` : data.transcript)
      }
    } catch (err) {
      console.error('Transcription error:', err)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled || isLoading) return
    onSubmit(value)
  }

  const [isFocused, setIsFocused] = useState(false)

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2 items-center", className)}>
      {/* Microphone Button - White Circle */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={disabled || isLoading || isTranscribing}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0",
          "bg-white hover:bg-neutral-100 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isRecording && "bg-red-500 hover:bg-red-600",
          isTranscribing && "bg-blue-500"
        )}
        aria-label={isRecording ? "Stop recording" : "Start audio recording"}
      >
        {isTranscribing ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Mic className={cn("w-5 h-5", isRecording ? "text-white" : "text-neutral-900")} />
        )}
      </button>

      {/* Text Input */}
      {multiline ? (
        <div className="flex-1 relative rounded-lg min-h-[56px]">
          <div className={cn(
            "absolute inset-0 rounded-lg transition-all",
            isFocused && !disabled ? "bg-purple-500 p-[2px]" : ""
          )}>
            <div className="h-full w-full rounded-lg bg-neutral-900">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled || isLoading || isTranscribing}
                rows={1}
                className="w-full h-full bg-transparent border-none rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none disabled:opacity-50 resize-none min-h-[56px] max-h-[200px]"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative rounded-lg">
          <div className={cn(
            "absolute inset-0 rounded-lg transition-all",
            isFocused && !disabled ? "bg-purple-500 p-[2px]" : ""
          )}>
            <div className="h-full w-full rounded-lg bg-neutral-900">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled || isLoading || isTranscribing}
                className="w-full h-full bg-transparent border-none rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button - White Circle */}
      <button
        type="submit"
        disabled={!value.trim() || disabled || isLoading || isTranscribing}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0",
          "bg-white hover:bg-neutral-100 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-neutral-900 animate-spin" />
        ) : (
          <ArrowUp className="w-5 h-5 text-neutral-900" />
        )}
      </button>
    </form>
  )
}

