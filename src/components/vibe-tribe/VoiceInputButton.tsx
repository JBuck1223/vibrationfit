'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { scrollSafeAutoResize } from '@/lib/design-system/components/forms/auto-resize-utils'

interface VoiceInputButtonProps {
  value: string
  onChange: (value: string) => void
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  /** Paragraph break for posts. A space for short comments. */
  join?: 'paragraph' | 'space'
  autoResize?: boolean
  disabled?: boolean
  /** Stop an in-progress recording when `disabled` becomes true, and keep the transcript. */
  stopWhenDisabled?: boolean
  className?: string
  iconClassName?: string
}

function appendTranscript(existing: string, transcript: string, join: 'paragraph' | 'space') {
  const cleaned = transcript.trim()
  if (!cleaned) return existing
  if (!existing.trim()) return cleaned

  if (join === 'paragraph') {
    const gap = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n'
    return `${existing}${gap}${cleaned}`
  }

  const gap = /\s$/.test(existing) ? '' : ' '
  return `${existing}${gap}${cleaned}`
}

function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac']
  for (const option of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(option)) {
      return option
    }
  }
  return ''
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VoiceInputButton({
  value,
  onChange,
  textareaRef,
  join = 'space',
  autoResize = false,
  disabled = false,
  stopWhenDisabled = false,
  className = '',
  iconClassName = 'w-4 h-4',
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)
  const aliveRef = useRef(true)
  const mimeTypeRef = useRef('audio/webm')

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const stopTracks = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      cancelledRef.current = true
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      stopTracks()
    }
  }, [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(timer)
  }, [error])

  const applyTranscript = (transcript: string) => {
    const next = appendTranscript(valueRef.current ?? '', transcript, join)
    const textarea = textareaRef?.current
    if (textarea) {
      textarea.value = next
      if (autoResize) {
        scrollSafeAutoResize(textarea, { maxHeight: Math.min(window.innerHeight * 0.4, 300) })
      }
    }
    onChangeRef.current(next)
    requestAnimationFrame(() => {
      const field = textareaRef?.current
      if (!field) return
      field.focus()
      const cursor = next.length
      field.setSelectionRange(cursor, cursor)
    })
  }

  const transcribe = async (blob: Blob) => {
    if (!aliveRef.current) return
    if (blob.size === 0) {
      setError('That recording was empty. Try again.')
      setIsTranscribing(false)
      return
    }

    try {
      setError(null)

      const extension = mimeTypeRef.current.includes('mp4') || mimeTypeRef.current.includes('aac') ? 'mp4' : 'webm'
      const formData = new FormData()
      formData.append('audio', blob, `vibe-tribe.${extension}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4 * 60 * 1000)
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as { error?: string }).error || 'Transcription failed.')
      }

      const data = (await response.json()) as { transcript?: string }
      if (!data.transcript?.trim()) {
        throw new Error('No words came through. Try again.')
      }

      applyTranscript(data.transcript)
    } catch (err) {
      if (!aliveRef.current) return
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'That took too long. Try a shorter recording.'
        : err instanceof Error
          ? err.message
          : 'Could not turn that into text. Try again.'
      setError(message)
    } finally {
      if (aliveRef.current) setIsTranscribing(false)
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      cancelledRef.current = false

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('This browser cannot record audio.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!aliveRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const actualType = recorder.mimeType || mimeTypeRef.current || 'audio/webm'
        mimeTypeRef.current = actualType
        stopTracks()
        const wasCancelled = cancelledRef.current
        cancelledRef.current = false
        if (!aliveRef.current || wasCancelled) return
        setIsRecording(false)
        setDuration(0)
        setIsTranscribing(true)
        const blob = new Blob(chunksRef.current, { type: actualType })
        void transcribe(blob)
      }

      recorder.start(1000)
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      stopTracks()
      setIsRecording(false)
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError') {
        setError('Microphone permission denied. Allow access, then try again.')
      } else if (name === 'NotFoundError') {
        setError('No microphone found.')
      } else {
        setError(err instanceof Error ? err.message : 'Could not access the microphone.')
      }
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
      return
    }
    setIsRecording(false)
    setDuration(0)
    stopTracks()
  }

  useEffect(() => {
    if (!stopWhenDisabled || !disabled) return
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
  }, [stopWhenDisabled, disabled])

  const locked = isTranscribing || (disabled && !isRecording)
  const label = isTranscribing
    ? 'Turning your voice into text'
    : isRecording
      ? `Stop recording, ${formatDuration(duration)}`
      : 'Record voice'

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (isTranscribing) return
          if (isRecording) stopRecording()
          else if (!disabled) void startRecording()
        }}
        disabled={locked}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isRecording
            ? 'bg-red-500 text-white hover:bg-red-400'
            : 'bg-neutral-600 text-white hover:bg-white hover:text-neutral-700'
        }`}
      >
        {isTranscribing ? (
          <Loader2 className={`${iconClassName} animate-spin`} />
        ) : isRecording ? (
          <Square className={`${iconClassName} fill-white`} />
        ) : (
          <Mic className={iconClassName} />
        )}
      </button>
      {error && (
        <p
          role="alert"
          className="absolute bottom-full right-0 z-50 mb-2 w-max max-w-[220px] rounded-xl border border-[#FF0040]/50 bg-neutral-900 px-3 py-1.5 text-left text-xs text-[#FF0040] shadow-lg"
        >
          {error}
        </p>
      )}
    </div>
  )
}
