'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import {
  ACTIVATION_GENRES,
  ACTIVATION_VOICES,
  type ActivationGenreId,
  type ActivationVoiceId,
} from '@/lib/activation/media-options'

export function ActivationMediaPick({
  voiceId: voiceIdProp,
  genreId: genreIdProp,
  onChange,
}: {
  voiceId?: ActivationVoiceId
  genreId?: ActivationGenreId
  onChange?: (choices: { voiceId: ActivationVoiceId; genreId: ActivationGenreId }) => void
}) {
  const copy = ACTIVATION_COPY.mediaPick
  const [voiceId, setVoiceId] = useState<ActivationVoiceId>(voiceIdProp ?? 'nova')
  const [genreId, setGenreId] = useState<ActivationGenreId>(genreIdProp ?? 'unstoppable')
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  function selectVoice(next: ActivationVoiceId) {
    setVoiceId(next)
    onChange?.({ voiceId: next, genreId })
  }

  function selectGenre(next: ActivationGenreId) {
    setGenreId(next)
    onChange?.({ voiceId, genreId: next })
  }

  function togglePreview(key: string, url: string) {
    if (playingKey === key && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingKey(null)
      return
    }
    audioRef.current?.pause()
    const next = new Audio(url)
    next.addEventListener('ended', () => {
      setPlayingKey(null)
      audioRef.current = null
    })
    audioRef.current = next
    setPlayingKey(key)
    void next.play().catch(() => {
      setPlayingKey(null)
      audioRef.current = null
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-center text-base font-semibold text-white md:text-lg">{copy.voiceTitle}</p>
        <p className="mb-4 mt-1 text-center text-sm text-neutral-500">{copy.previewHint}</p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVATION_VOICES.map((voice) => {
            const selected = voiceId === voice.id
            const playing = playingKey === `voice:${voice.id}`
            return (
              <div
                key={voice.id}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all duration-200 ${
                  selected
                    ? 'border-[#BF00FF] bg-[#BF00FF]/10'
                    : 'border-[#222] bg-[#0D0D0D]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectVoice(voice.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium text-white">{voice.label}</p>
                  <p className="text-xs text-neutral-500">{voice.gender}</p>
                </button>
                <button
                  type="button"
                  aria-label={playing ? `Pause ${voice.label}` : `Play ${voice.label}`}
                  onClick={() => togglePreview(`voice:${voice.id}`, voice.previewUrl)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#333] text-neutral-300 hover:border-white hover:text-white"
                >
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-center text-base font-semibold text-white md:text-lg">{copy.genreTitle}</p>
        <p className="mb-4 mt-1 text-center text-sm text-neutral-500">{copy.previewHint}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACTIVATION_GENRES.map((genre) => {
            const selected = genreId === genre.id
            const playing = playingKey === `genre:${genre.id}`
            return (
              <div
                key={genre.id}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all duration-200 ${
                  selected
                    ? 'border-[#39FF14] bg-[#39FF14]/10'
                    : 'border-[#222] bg-[#0D0D0D]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectGenre(genre.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium text-white">{genre.label}</p>
                  <p className="text-xs text-neutral-500">{genre.description}</p>
                </button>
                <button
                  type="button"
                  aria-label={playing ? `Pause ${genre.label}` : `Play ${genre.label}`}
                  onClick={() => togglePreview(`genre:${genre.id}`, genre.previewUrl)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#333] text-neutral-300 hover:border-white hover:text-white"
                >
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
