'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, ArrowUp, Paperclip, X, FileText, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { VIVALoadingOverlay } from '@/lib/design-system/components/overlays'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { cn } from '@/lib/utils'

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/ogg;codecs=opus',
]

const IMAGE_NAME = /\.(heic|heif|jpe?g|png|gif|webp|bmp|tif?f)$/i

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_NAME.test(file.name)
}

function clonePickedFile(file: File): File {
  const type = file.type || (IMAGE_NAME.test(file.name) ? 'image/jpeg' : file.type)
  return new File([file], file.name || 'photo.jpg', {
    type,
    lastModified: file.lastModified,
  })
}

function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('m4a')) return 'mp4'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

function pickAudioMimeType(): { mimeType: string; filename: string } {
  const mimeType =
    AUDIO_MIME_CANDIDATES.find(
      (type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)
    ) || ''
  return { mimeType, filename: `recording.${extensionForMime(mimeType)}` }
}

type VoicePhase = 'idle' | 'saving' | 'transcribing' | 'error'

export interface ChatAttachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document'
}

interface VivaChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend?: (attachments?: ChatAttachment[], text?: string) => void
  /** @deprecated Use onSend instead */
  onSubmit?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  canSend?: boolean
  /** @deprecated Use disabled instead */
  isLoading?: boolean
  /** Ignored — textarea auto-grows */
  multiline?: boolean
}

export function VivaChatInput({
  value,
  onChange,
  onSend,
  onSubmit,
  disabled: disabledProp = false,
  placeholder = 'Send a message...',
  canSend = true,
  isLoading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  multiline,
}: VivaChatInputProps) {
  const disabled = disabledProp || isLoading
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [savedAudio, setSavedAudio] = useState<{ key: string; url: string } | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const isTranscribing = voicePhase === 'saving' || voicePhase === 'transcribing'

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onSendRef = useRef(onSend)
  const discardedRef = useRef(false)
  const mimeTypeRef = useRef('')
  const filenameRef = useRef('recording.webm')
  const durationRef = useRef(0)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onSendRef.current = onSend
  }, [onSend])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      attachments.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  // --- Attachments ---
  const openFilePicker = () => {
    const input = fileInputRef.current
    if (!input) return
    // Reset just before opening. Clearing after select can invalidate File
    // objects on iOS WebKit, so the preview stays and the send payload is empty.
    input.value = ''
    input.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: ChatAttachment[] = Array.from(files).map(file => {
      const cloned = clonePickedFile(file)
      const isImage = isImageFile(cloned)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: cloned,
        preview: isImage ? URL.createObjectURL(cloned) : undefined,
        type: isImage ? 'image' : 'document',
      }
    })

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter(a => a.id !== id)
    })
  }

  // --- Recording ---
  // Same path as Journal: save the audio, then transcribe that saved file.
  const applyTranscript = (transcript: string) => {
    const trimmed = transcript.trim()
    if (!trimmed) {
      setVoiceError('No words came through in that recording. Your audio is saved -- tap retry.')
      setVoicePhase('error')
      return
    }
    const existing = valueRef.current.trim()
    const next = existing ? `${existing}\n\n${trimmed}` : trimmed
    onChangeRef.current(next)
    setVoiceError(null)
    setSavedAudio(null)
    setVoicePhase('idle')
    onSendRef.current?.(undefined, next)
  }

  const transcribeSavedAudio = async (s3Key: string) => {
    setVoicePhase('transcribing')
    setVoiceError(null)

    const MAX_ATTEMPTS = 2
    const TIMEOUT_MS = 4 * 60 * 1000

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const response = await fetch('/api/transcribe-from-s3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key }),
          signal: controller.signal,
        })
        window.clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMsg = 'Transcription failed'
          let retryable = false
          try {
            const errorData = await response.json()
            errorMsg = errorData.error || errorMsg
            retryable = errorData.retryable === true || response.status >= 500
          } catch { /* use default */ }

          if (retryable && attempt < MAX_ATTEMPTS) {
            await new Promise(resolve => window.setTimeout(resolve, 2000))
            continue
          }
          throw new Error(errorMsg)
        }

        const data = await response.json()
        applyTranscript(data.transcript || '')
        return
      } catch (err) {
        window.clearTimeout(timeoutId)
        const error = err as { name?: string; message?: string }
        const retryable =
          error.name === 'AbortError' ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('Load failed')

        if (retryable && attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => window.setTimeout(resolve, 2000))
          continue
        }

        console.error('[VivaChatInput] Transcription error:', err)
        setVoiceError(
          error.name === 'AbortError'
            ? 'Transcription timed out. Your audio is saved -- tap retry.'
            : 'Transcription failed. Your audio is saved -- tap retry.'
        )
        setVoicePhase('error')
        return
      }
    }
  }

  const startRecording = async () => {
    try {
      discardedRef.current = false
      setVoiceError(null)
      setVoicePhase('idle')
      setSavedAudio(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        setAudioLevel(Math.min(100, (average / 255) * 100) / 100)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      const { mimeType } = pickAudioMimeType()
      let mediaRecorder: MediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          audioBitsPerSecond: 48000,
        })
      } catch {
        mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)
      }

      mediaRecorderRef.current = mediaRecorder
      const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm'
      mimeTypeRef.current = actualMime
      filenameRef.current = `recording-${Date.now()}.${extensionForMime(actualMime)}`

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        try {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          if (audioContextRef.current) {
            try { audioContextRef.current.close() } catch { /* already closed */ }
            audioContextRef.current = null
          }
          setAudioLevel(0)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }

          if (discardedRef.current) {
            discardedRef.current = false
            chunksRef.current = []
            return
          }

          const blobType = (mimeTypeRef.current || 'audio/webm').split(';')[0] || 'audio/webm'
          const blob = new Blob(chunksRef.current, { type: blobType })
          chunksRef.current = []
          if (blob.size === 0) {
            setVoiceError('Recording failed - no data captured')
            setVoicePhase('error')
            return
          }

          setIsRecording(false)
          setVoicePhase('saving')
          const file = new File([blob], filenameRef.current, { type: blobType })

          try {
            const result = await uploadUserFile('viva', file)
            setSavedAudio({ key: result.key, url: result.url })
            await transcribeSavedAudio(result.key)
          } catch (uploadErr) {
            console.error('[VivaChatInput] S3 upload failed, falling back to direct transcription:', uploadErr)
            setVoicePhase('transcribing')
            try {
              const formData = new FormData()
              formData.append('audio', blob, filenameRef.current)
              const controller = new AbortController()
              const timeoutId = window.setTimeout(() => controller.abort(), 4 * 60 * 1000)
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
              })
              window.clearTimeout(timeoutId)
              if (!response.ok) throw new Error('Direct transcription also failed')
              const data = await response.json()
              applyTranscript(data.transcript || '')
            } catch {
              setVoiceError('Failed to save or transcribe. Please try again.')
              setVoicePhase('error')
            }
          }
        } catch (err) {
          console.error('[VivaChatInput] Recording stop error:', err)
          setVoiceError('Something went wrong. Please try again.')
          setVoicePhase('error')
        } finally {
          setIsRecording(false)
          setRecordingDuration(0)
        }
      }

      if (actualMime.includes('mp4') || actualMime.includes('aac')) mediaRecorder.start()
      else mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingDuration(0)
      durationRef.current = 0
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1
          durationRef.current = next
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('[VivaChatInput] Mic access error:', err)
      const name = err instanceof DOMException ? err.name : ''
      setVoiceError(
        name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access.'
          : name === 'NotFoundError'
            ? 'No microphone found. Please connect a microphone.'
            : 'Failed to access microphone.'
      )
      setVoicePhase('error')
      setIsRecording(false)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      audioContextRef.current = null
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    } else {
      setIsRecording(false)
      setRecordingDuration(0)
    }
  }

  const cancelRecording = () => {
    discardedRef.current = true
    stopRecording()
  }

  const retryTranscription = () => {
    if (!savedAudio) return
    void transcribeSavedAudio(savedAudio.key)
  }


  // --- Send ---
  const handleSend = () => {
    // Blur before the parent disables this field. iOS WebKit can silently
    // drop in-flight requests when a focused textarea becomes disabled.
    textareaRef.current?.blur()
    if (onSend) {
      onSend(attachments.length > 0 ? attachments : undefined, value)
    } else if (onSubmit) {
      onSubmit(value)
    }
    setAttachments([])
  }

  // On phones and tablets Return makes a new line, like other chat apps;
  // the send button sends. On a keyboard, Enter sends and Shift+Enter
  // (or Alt/Option+Enter) starts a new line.
  const [touchKeyboard, setTouchKeyboard] = useState(false)
  useEffect(() => {
    setTouchKeyboard(window.matchMedia?.('(pointer: coarse)').matches ?? false)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    if (touchKeyboard || e.shiftKey || e.altKey) return // newline
    e.preventDefault()
    if (value.trim() && canSend && !disabled) handleSend()
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const showSendEnabled = (value.trim() || attachments.length > 0) && canSend && !disabled && !isRecording && !isTranscribing

  return (
    <div className="relative">
      {/* Attachment previews — sits above the input box */}
      {attachments.length > 0 && (
        <div className="flex gap-2 px-3 pt-3 pb-2 bg-neutral-900 border border-b-0 border-neutral-700 rounded-t-xl overflow-x-auto">
          {attachments.map(att => (
            <div key={att.id} className="relative group flex-shrink-0">
              {att.type === 'image' && att.preview ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-neutral-700">
                  <img src={att.preview} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center gap-1">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span className="text-[9px] text-neutral-500 truncate max-w-[48px]">
                    {att.file.name.split('.').pop()}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-600 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3 text-neutral-300" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container — single bordered box with textarea on top, buttons on bottom */}
      <div className={cn(
        'relative flex flex-col bg-neutral-900 border border-neutral-700 px-4 pt-3 pb-2',
        attachments.length > 0 ? 'rounded-b-xl' : 'rounded-xl'
      )}>
        {/* Raw textarea — top aligned */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          enterKeyHint={touchKeyboard ? 'enter' : 'send'}
          rows={2}
          disabled={disabled || isRecording || isTranscribing}
          className={cn(
            'w-full bg-transparent border-0 outline-none resize-none text-white placeholder-neutral-500 text-base min-h-[48px] max-h-[160px] disabled:opacity-50',
            isRecording && 'opacity-30'
          )}
        />

        {/* Bottom row — normal state: attach + mic on left, send on right */}
        {!isRecording && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* Attach */}
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled || isTranscribing}
                className="w-8 h-8 rounded-full bg-accent-500 hover:bg-accent-500/80 flex items-center justify-center transition-colors disabled:opacity-40"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-white" />
              </button>

              {/* Mic */}
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled || isTranscribing}
                className="w-8 h-8 rounded-full bg-accent-500 hover:bg-accent-500/80 flex items-center justify-center transition-colors disabled:opacity-40"
                title="Record voice"
              >
                <Mic className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Send */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!showSendEnabled}
              className={cn(
                'w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center transition-all',
                showSendEnabled
                  ? 'hover:bg-accent-500/80 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              )}
            >
              {disabled ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Bottom row — recording state: cancel | visualizer + timer | stop */}
        {isRecording && (
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 bg-neutral-600 hover:bg-neutral-500 text-neutral-300 hover:text-white rounded-full transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="flex items-center gap-0.5 h-4">
                {[0, 1, 2, 3].map((i) => {
                  const barHeight = Math.min(100, (audioLevel * 100) + (i * 5))
                  const isActive = barHeight > (i * 25)
                  return (
                    <div
                      key={i}
                      className="w-1 bg-accent-500 rounded-full transition-all duration-100"
                      style={{
                        height: isActive ? `${Math.max(20, barHeight)}%` : '20%',
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                  )
                })}
              </div>
              <span className="text-xs font-mono text-red-400">
                {formatDuration(recordingDuration)}
              </span>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="p-2 bg-red-500 hover:bg-red-400 text-white rounded-full transition-colors"
              title="Stop recording"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          </div>
        )}
      </div>

      {voiceError && voicePhase === 'error' && !isRecording && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{voiceError}</p>
          {savedAudio && (
            <button
              type="button"
              onClick={retryTranscription}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#39FF14] hover:text-[#39FF14]/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry transcription
            </button>
          )}
        </div>
      )}

      <VIVALoadingOverlay
        isVisible={isTranscribing}
        messages={
          voicePhase === 'saving'
            ? ['Saving your audio to the cloud...', 'Almost there...']
            : ['VIVA is turning your voice into text...', 'Just a few more seconds...']
        }
        cycleDuration={4000}
        estimatedTime={voicePhase === 'saving' ? 'Uploading your audio...' : 'This usually takes about 10 seconds'}
        showProgressBar
        size="sm"
        estimatedDuration={voicePhase === 'transcribing' ? Math.max(10000, durationRef.current * 1500) : undefined}
      />

      {/* Visually hidden — display:none file inputs drop the change event on some iOS versions */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
      />
    </div>
  )
}
