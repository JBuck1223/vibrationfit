'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Button, Card, Input } from '@/lib/design-system/components'
import { BPM_OPTIONS, DEFAULT_BPM, MOOD_IDEAS } from '@/lib/meditations/constants'

const POLL_MS = 4000
const POLL_LIMIT_MS = 10 * 60 * 1000

interface TrackStudioProps {
  /** Called with the new song track id once the instrumental is ready. */
  onCreated: (track: { songTrackId: string | null; title: string; bpm: number; mood: string }) => Promise<void> | void
}

export function TrackStudio({ onCreated }: TrackStudioProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState('')
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM)
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
        body: JSON.stringify({ title: name, mood, bpm }),
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
          await onCreated({ songTrackId: result.tracks[0].id ?? null, title: name, bpm, mood: mood.trim() })
          setStatus(`“${name}” is ready and selected`)
          setTitle('')
          return
        }
      }
      throw new Error('This is taking longer than usual. It will appear under My tracks when it finishes.')
    } catch (err) {
      if (signal.aborted) return
      setError(err instanceof Error ? err.message : 'Could not create the track')
      setStatus(null)
    } finally {
      if (!signal.aborted) setGenerating(false)
    }
  }

  return (
    <Card className="overflow-hidden p-0 md:p-0 lg:p-0">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left md:p-6"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15 text-[#BF00FF]">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-white">Create your own track</span>
          <span className="block text-xs md:text-sm text-neutral-400">
            {generating ? `${status} · ${seconds}s` : 'An instrumental with no vocals, shaped by a mood you describe'}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-neutral-800 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Track title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Soft horizon"
              disabled={generating}
            />
            <Input
              label="Mood"
              value={mood}
              onChange={(event) => setMood(event.target.value)}
              placeholder="Warm pads, distant piano"
              disabled={generating}
            />
          </div>

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

          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Tempo</p>
            <div className="flex flex-wrap gap-2">
              {BPM_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={bpm === option ? 'primary' : 'outline'}
                  onClick={() => setBpm(option)}
                  disabled={generating}
                >
                  {option} BPM
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Tempo is guidance, so the track feels slow without locking to a clock.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="accent" size="sm" onClick={generate} loading={generating} disabled={generating}>
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
    </Card>
  )
}
