'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, ArrowUp, Paperclip, X, FileText } from 'lucide-react'
import { VIVALoadingOverlay } from '@/lib/design-system/components/overlays'
import { cn } from '@/lib/utils'

export interface ChatAttachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document'
}

interface VivaChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend?: (attachments?: ChatAttachment[]) => void
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
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: ChatAttachment[] = Array.from(files).map(file => {
      const isImage = file.type.startsWith('image/')
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        type: isImage ? 'image' : 'document',
      }
    })

    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter(a => a.id !== id)
    })
  }

  // --- Recording ---
  const startRecording = async () => {
    try {
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
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
        setAudioLevel(avg / 255)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
        setAudioLevel(0)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size === 0) return

        setIsTranscribing(true)
        try {
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })
          if (response.ok) {
            const data = await response.json()
            if (data.transcript) {
              onChange(value ? `${value}\n${data.transcript}` : data.transcript)
            }
          }
        } catch (err) {
          console.error('[VivaChatInput] Transcription error:', err)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000)
    } catch (err) {
      console.error('[VivaChatInput] Mic access error:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  // --- Send ---
  const handleSend = () => {
    if (onSend) {
      onSend(attachments.length > 0 ? attachments : undefined)
    } else if (onSubmit) {
      onSubmit(value)
    }
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim() && canSend && !disabled) {
      e.preventDefault()
      handleSend()
    }
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
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                onClick={() => fileInputRef.current?.click()}
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
              onClick={() => {
                stopRecording()
                chunksRef.current = []
              }}
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

      {/* VIVA transcription overlay */}
      <VIVALoadingOverlay
        isVisible={isTranscribing}
        messages={[
          'VIVA is turning your voice into text...',
          'Just a few more seconds...',
        ]}
        cycleDuration={4000}
        estimatedTime="~10s"
        showProgressBar={false}
        size="sm"
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
