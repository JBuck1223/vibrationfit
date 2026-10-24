'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Button, Input } from '@/lib/design-system/components'
import { MOOD_IDEAS, REFERENCE_CLIP_SECONDS } from '@/lib/meditations/constants'
import { ReferencePicker, type MeditationReference } from './ReferencePicker'

const POLL_MS = 4000
const POLL_LIMIT_MS = 10 * 60 * 1000

interface TrackStudioProps {
  /** Called once the instrumental is ready so the library can show it under Mine. */
  onCreated: (title: string) => Promise<void> | void
}

export function TrackStudio({ onCreated }: TrackStudioProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState('')
  const [mode, setMode] = useState<'mood' | 'reference'>('mood')
  const [reference, setReference] = useState<MeditationReference | null>(null)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (!generating) return
    const started = Date.now()
    setSeconds(0)
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [generating])

  async function generate() {
    const name = title.trim()
    if (!name) {
      setError('Name the track before creating it')
      return
    }
    if (mode === 'reference' && !reference) {
      setError('Choose or add a reference first')
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setGenerating(true)
    setError(null)
    setStatus('Composing your track')
    try {
      const response = await fetch('/api/meditations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'reference'
          ? { title: name, reference_id: reference!.id }
          : { title: name, mood }),
        signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not start the track')

      const started = Date.now()
      while (Date.now() - started < POLL_LIMIT_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS))
        if (signal.aborted) return
        const poll = await fetch(`/api/meditations/poll/${data.task_id}?song_id=${data.song_id}`, { signal })
        const result = await poll.json()
        if (result.status === 'failed') throw new Error(result.error || 'The track did not finish')
        if (result.status === 'completed' && result.tracks?.[0]) {
          await onCreated(name)
          setStatus(`“${name}” is ready in your Library under Mine`)
          setTitle('')
          return
        }
      }
      throw new Error('This is taking longer than usual. It will appear in your Library under Mine when it finishes.')
    } catch (err) {
      if (signal.aborted) return
      setError(err instanceof Error ? err.message : 'Could not create the track')
      setStatus(null)
    } finally {
      if (!signal.aborted) setGenerating(false)
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border transition-colors ${open ? 'border-[#BF00FF]/50 bg-[rgba(20,16,30,0.55)]' : 'border-white/[0.12] bg-white/[0.05] hover:border-white/25'}`}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15 text-[#BF00FF]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm md:text-base font-semibold text-white">Create your own track</span>
          <span className="block truncate text-xs text-neutral-400">
            {generating ? `${status} · ${seconds}s` : 'An instrumental with no vocals, from a mood or a reference track'}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/55 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-white/10 p-4">
          <Input
            label="Track title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Soft horizon"
            disabled={generating}
          />

          <div className="mt-4 flex gap-1 rounded-full border border-white/15 bg-[rgba(28,22,38,0.45)] p-1 backdrop-blur-xl" role="tablist">
            {([
              { id: 'mood', label: 'Describe a mood' },
              { id: 'reference', label: 'Use a reference' },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={mode === option.id}
                disabled={generating}
                onClick={() => setMode(option.id)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs md:text-sm transition-colors ${
                  mode === option.id ? 'bg-[#BF00FF] font-semibold text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {mode === 'mood' ? (
              <>
                <Input
                  label="Mood"
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  placeholder="Warm pads, distant piano"
                  disabled={generating}
                />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {MOOD_IDEAS.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      disabled={generating}
                      onClick={() => setMood(idea)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                        mood === idea ? 'bg-[#BF00FF] text-white' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-xs text-neutral-400">
                  Your track follows the pace and feel of a {REFERENCE_CLIP_SECONDS}-second clip. Pick a slow section with no drums for the calmest result.
                </p>
                <ReferencePicker
                  selectedId={reference?.id ?? null}
                  onSelect={setReference}
                  disabled={generating}
                />
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              size="sm"
              onClick={generate}
              loading={generating}
              disabled={generating || (mode === 'reference' && !reference)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? 'Creating' : 'Create track'}
            </Button>
            {generating && (
              <p className="text-xs text-neutral-400">Usually a minute or two. You can keep breathing meanwhile.</p>
            )}
          </div>
          {!generating && status && <p className="mt-3 text-sm text-[#39FF14]">{status}</p>}
          {error && <p className="mt-3 text-sm text-[#FF0040]">{error}</p>}
        </div>
      )}
    </div>
  )
}
