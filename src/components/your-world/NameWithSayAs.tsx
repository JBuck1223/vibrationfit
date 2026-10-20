'use client'

import { useRef, useState } from 'react'
import { Loader2, Volume2 } from 'lucide-react'
import { Input } from '@/lib/design-system/components'
import { normalizeSayAs, syllableCount } from '@/lib/your-world/say-as'
import { cn } from '@/lib/utils'

async function suggestSayAs(name: string): Promise<string> {
  try {
    const res = await fetch('/api/your-world/say-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: [name] }),
    })
    if (!res.ok) return ''
    const body = (await res.json()) as { suggestions?: Record<string, string> }
    return body.suggestions?.[name] || ''
  } catch {
    return ''
  }
}

/**
 * A name plus "How to say it". VIVA fills in a first guess when the name is
 * entered; the member edits it and can hear it before saving.
 */
export function NameWithSayAs({
  nameLabel,
  name,
  sayAs,
  onNameChange,
  onSayAsChange,
  nameReadOnly = false,
  readOnly = false,
  highlightName = false,
  highlightSayAs = false,
  namePlaceholder,
}: {
  nameLabel: string
  name: string
  sayAs: string
  onNameChange?: (value: string) => void
  onSayAsChange: (value: string) => void
  nameReadOnly?: boolean
  readOnly?: boolean
  highlightName?: boolean
  highlightSayAs?: boolean
  namePlaceholder?: string
}) {
  const [suggesting, setSuggesting] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hearError, setHearError] = useState<string | null>(null)
  const lastSuggestedFor = useRef<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const requestSuggestion = async (forName: string) => {
    const trimmed = forName.trim()
    if (!trimmed || sayAs.trim() || lastSuggestedFor.current === trimmed) return
    lastSuggestedFor.current = trimmed
    setSuggesting(true)
    const suggestion = await suggestSayAs(trimmed)
    setSuggesting(false)
    if (suggestion) onSayAsChange(suggestion)
  }

  const hear = async () => {
    if (!name.trim()) return
    setHearError(null)
    setPlaying(true)
    try {
      const res = await fetch('/api/your-world/say-as/hear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), say_as: normalizeSayAs(sayAs) }),
      })
      if (!res.ok) throw new Error('Could not play that right now')
      const url = URL.createObjectURL(await res.blob())
      audioRef.current?.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setPlaying(false)
        URL.revokeObjectURL(url)
      }
      await audio.play()
    } catch (err) {
      setPlaying(false)
      setHearError(err instanceof Error ? err.message : 'Could not play that right now')
    }
  }

  const syllables = syllableCount(sayAs)
  const highlight = '[&_.vf-field]:border-[#B3B300]'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={cn(highlightName && highlight)}>
        <Input
          label={nameLabel}
          value={name}
          placeholder={namePlaceholder}
          readOnly={nameReadOnly || readOnly}
          disabled={readOnly}
          onChange={(e) => onNameChange?.(e.target.value)}
          onBlur={(e) => requestSuggestion(e.target.value)}
          onFocus={() => {
            if (nameReadOnly && name) requestSuggestion(name)
          }}
        />
      </div>
      <div className={cn(highlightSayAs && highlight)}>
        <label className="mb-2 block text-sm font-medium text-[#E5E7EB]">How to say it</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={sayAs}
              placeholder={suggesting ? 'VIVA is thinking...' : 'SEER-sha'}
              disabled={readOnly}
              onFocus={() => requestSuggestion(name)}
              onChange={(e) => onSayAsChange(e.target.value)}
              onBlur={(e) => onSayAsChange(normalizeSayAs(e.target.value))}
            />
            {suggesting && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
            )}
          </div>
          <button
            type="button"
            onClick={hear}
            disabled={!name.trim() || playing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#666666] px-3 text-sm text-neutral-200 transition hover:border-[#39FF14] hover:text-[#39FF14] disabled:opacity-40"
          >
            {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            Hear it
          </button>
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          {hearError
            ? hearError
            : syllables > 0
              ? `${syllables} syllable${syllables === 1 ? '' : 's'}. Capitals mark the stressed one.`
              : 'Syllables with dashes, stressed one in capitals. Leave blank to read it as written.'}
        </p>
      </div>
    </div>
  )
}
