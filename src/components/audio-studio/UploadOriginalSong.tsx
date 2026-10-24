'use client'

import React, { useRef, useState } from 'react'
import { Upload, Music2, ShieldCheck, CheckSquare, Square, Loader2 } from 'lucide-react'
import { Button, Card, Input, Stack } from '@/lib/design-system/components'
import { uploadUserFile, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import {
  ORIGINAL_MUSIC_ACCEPT,
  ORIGINAL_MUSIC_MAX_BYTES,
  ORIGINAL_MUSIC_RIGHTS_STATEMENTS,
  ORIGINAL_MUSIC_RIGHTS_VERSION,
} from '@/lib/songs/upload-rights'

interface UploadOriginalSongProps {
  /** Called after the song is saved; receives the new song + track ids. */
  onUploaded: (result: { songId: string; trackId: string }) => void
  /** Rendered inside the app shell (lighter glass styling). */
  inShell?: boolean
  className?: string
}

function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Read the audio duration in the browser so the track shows a length without server processing. */
function readAudioDurationMs(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    audio.onloadedmetadata = () => {
      const seconds = audio.duration
      finish(isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : null)
    }
    audio.onerror = () => finish(null)
    audio.src = url
  })
}

export function UploadOriginalSong({ onUploaded, inShell = false, className = '' }: UploadOriginalSongProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const busy = phase !== 'idle'
  const canSubmit = !!file && title.trim().length > 0 && agreed && !busy

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] || null
    e.target.value = ''
    setError(null)
    if (!picked) return
    if (picked.size > ORIGINAL_MUSIC_MAX_BYTES) {
      setError('That file is too large. Songs can be up to 200MB.')
      return
    }
    setFile(picked)
    if (!title.trim()) setTitle(titleFromFileName(picked.name))
  }

  async function handleSubmit() {
    if (!file || !canSubmit) return
    setError(null)
    setProgress(0)
    setPhase('uploading')

    try {
      const [{ url, key }, durationMs] = await Promise.all([
        uploadUserFile('songUploads', file, undefined, setProgress),
        readAudioDurationMs(file),
      ])

      setPhase('saving')
      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          mp3_url: url,
          s3_key: key,
          duration_ms: durationMs ?? undefined,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || undefined,
          rights_attested: true,
          rights_version: ORIGINAL_MUSIC_RIGHTS_VERSION,
          add_to_member_library: true,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not save your song')

      onUploaded({ songId: json.song_id, trackId: json.track?.id })
    } catch (err) {
      setError(getUploadErrorMessage(err))
      setPhase('idle')
    }
  }

  const muted = inShell ? 'text-white/60' : 'text-neutral-400'

  return (
    <Card variant="glass" className={`p-5 ${className}`}>
      <Stack gap="md">
        <div className="space-y-5">
          <p className={`text-sm leading-relaxed ${muted}`}>
            Already have a finished song you made yourself? Upload it here. Originals only:
            it lands in My Songs and in your Member Library under your name, so other members can listen inside the app.
          </p>

          {/* File picker */}
          <input
            ref={inputRef}
            type="file"
            accept={ORIGINAL_MUSIC_ACCEPT}
            onChange={handleFileChange}
            className="hidden"
            disabled={busy}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-black/40 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Music2 className="w-5 h-5 text-primary-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
              </div>
              {!busy && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-neutral-700 hover:border-primary-500/50 bg-black/30 px-4 py-8 flex flex-col items-center gap-2 text-center transition-colors"
            >
              <Upload className="w-6 h-6 text-neutral-400" />
              <span className="text-sm text-neutral-200">Choose an audio file</span>
              <span className="text-xs text-neutral-500">MP3, WAV, M4A, AAC, FLAC or OGG, up to 200MB</span>
            </button>
          )}

          {/* Title */}
          <Input
            label="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is this song called?"
            maxLength={200}
            disabled={busy}
          />

          {/* Rights attestation */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-sm text-neutral-300 font-medium leading-relaxed pt-2">
                Only upload music you have full rights to. By uploading, you confirm:
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-neutral-400 leading-relaxed">
              {ORIGINAL_MUSIC_RIGHTS_STATEMENTS.map((statement) => (
                <li key={statement} className="flex gap-2.5">
                  <span className="text-primary-500 flex-shrink-0 mt-0.5">&#x2022;</span>
                  <span>{statement}</span>
                </li>
              ))}
            </ul>

            <div
              role="checkbox"
              aria-checked={agreed}
              aria-disabled={busy}
              tabIndex={0}
              onClick={() => { if (!busy) setAgreed(prev => !prev) }}
              onKeyDown={(e) => {
                if (busy) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setAgreed(prev => !prev)
                }
              }}
              className={`flex items-center gap-3 w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                agreed
                  ? 'border-primary-500/30 bg-primary-500/5'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {agreed ? (
                <CheckSquare className="w-5 h-5 text-primary-500 flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-neutral-600 flex-shrink-0" />
              )}
              <span className="text-sm text-neutral-300">
                This is my original music and I hold full rights to it.
              </span>
            </div>
          </div>

          {/* Progress */}
          {busy && (
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-[width] duration-200"
                  style={{ width: `${phase === 'saving' ? 100 : progress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500">
                {phase === 'saving' ? 'Adding to your library...' : `Uploading ${progress}%`}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {busy ? 'Uploading...' : 'Upload My Song'}
        </Button>
      </Stack>
    </Card>
  )
}
