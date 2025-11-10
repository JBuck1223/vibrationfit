'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Mic, Loader2, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecordingInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  helperText?: string
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  recordingCategory?: string
}

export function RecordingInput({
  label,
  helperText,
  error,
  value,
  onChange,
  placeholder,
  disabled,
  recordingCategory = 'dailyPaperTask',
  className,
  ...rest
}: RecordingInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const resetRecordingState = () => {
    setIsRecording(false)
    setIsTranscribing(false)
    setDuration(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    chunksRef.current = []
  }

  const startRecording = async () => {
    try {
      setLocalError(null)
      setStatusMessage('Preparing to record...')

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support audio recording.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setStatusMessage('Recording...')

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
        setStatusMessage('Processing audio...')
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await transcribeAudio(blob)
        resetRecordingState()
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Recording start failed:', err)
      setLocalError(
        err instanceof Error ? err.message : 'Failed to access the microphone.',
      )
      setStatusMessage(null)
      resetRecordingState()
    }
  }

  const stopRecording = () => {
    if (!isRecording) return

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setStatusMessage('Finishing up...')
  }

  const transcribeAudio = async (blob: Blob) => {
    if (blob.size === 0) {
      setLocalError('Recorded audio was empty. Please try again.')
      setStatusMessage(null)
      return
    }

    try {
      setIsTranscribing(true)
      setStatusMessage('Transcribing...')

      const formData = new FormData()
      formData.append('audio', blob, `${recordingCategory}.webm`)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: string }).error || 'Transcription failed.',
        )
      }

      const data = (await response.json()) as { transcript?: string }

      if (!data.transcript) {
        throw new Error('No transcript returned. Please try again.')
      }

      const cleanedTranscript = data.transcript.trim()
      onChange(cleanedTranscript)
      setStatusMessage('Transcript added. You can edit it now.')
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    } catch (err) {
      console.error('Transcription error:', err)
      setLocalError(
        err instanceof Error ? err.message : 'Transcription failed. Please retry.',
      )
      setStatusMessage(null)
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
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#E5E7EB]">{label}</label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled || isTranscribing}
          className={cn(
            'w-full px-4 py-3 pr-14 bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            error || localError
              ? 'border-[#FF0040] focus:ring-[#FF0040] focus:border-[#FF0040]'
              : 'border-[#666666] focus:ring-[#199D67] focus:border-[#199D67]',
            disabled && 'opacity-60 cursor-not-allowed',
            className,
          )}
          {...rest}
        />

        <button
          type="button"
          onClick={() => {
            if (disabled || isTranscribing) return
            if (isRecording) {
              stopRecording()
            } else {
              void startRecording()
            }
          }}
          disabled={disabled || isTranscribing}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 flex items-center justify-center transition-colors',
            'bg-neutral-700 hover:bg-neutral-600 text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#199D67] focus:ring-offset-2 focus:ring-offset-neutral-900',
            isRecording && 'bg-[#D03739] hover:bg-[#EF4444]',
            (disabled || isTranscribing) && 'opacity-60 cursor-not-allowed',
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {(statusMessage || isRecording) && (
        <p className="text-xs text-neutral-400">
          {isRecording ? `Recording… ${formatDuration(duration)}` : statusMessage}
        </p>
      )}

      {(error || localError) && (
        <p className="text-xs text-[#FF0040]">{error || localError}</p>
      )}

      {helperText && !(error || localError) && (
        <p className="text-xs text-neutral-400">{helperText}</p>
      )}
    </div>
  )
}

