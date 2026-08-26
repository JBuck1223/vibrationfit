'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Square, Volume2 } from 'lucide-react'
import { tokenizePage, type WordResult } from '@/lib/life-explorer/read-aloud'

interface ReadingRow {
  pass: number
  transcript: string | null
  audio_url: string | null
  word_results: WordResult[]
  hit_count: number
  miss_count: number
}

interface Props {
  bookId: string
  pageId: string
  pageText: string
  onBusyChange?: (busy: boolean) => void
}

function pickMime(): string {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const option of options) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(option)) return option
  }
  return 'audio/webm'
}

export function ReadAloudPractice({ bookId, pageId, pageText, onBusyChange }: Props) {
  const [pass, setPass] = useState<1 | 2>(1)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pass1, setPass1] = useState<ReadingRow | null>(null)
  const [pass2, setPass2] = useState<ReadingRow | null>(null)
  const [clips, setClips] = useState<Record<string, string>>({})
  const [clipsLoading, setClipsLoading] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clipsRef = useRef(clips)
  clipsRef.current = clips

  const tokens = useMemo(() => tokenizePage(pageText), [pageText])
  const uniqueWords = useMemo(() => {
    const seen = new Set<string>()
    const words: string[] = []
    for (const t of tokens) {
      if (!t.isWord || seen.has(t.display)) continue
      seen.add(t.display)
      words.push(t.display)
    }
    return words
  }, [tokens])

  const current = pass === 1 ? pass1 : pass2

  const statusAt = (norm: string, occurrence: number): WordResult['status'] | null => {
    if (!current?.word_results) return null
    let n = 0
    for (const r of current.word_results) {
      if (r.norm !== norm) continue
      if (n === occurrence) return r.status
      n++
    }
    return null
  }

  useEffect(() => {
    onBusyChange?.(busy || recording)
  }, [busy, recording, onBusyChange])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/life-explorer/books/${bookId}/read-aloud?page_id=${pageId}`)
        const json = await res.json()
        if (!res.ok || cancelled) return
        setPass1(json.pass1)
        setPass2(json.pass2)
        if (json.pass1) setPass(2)
      } catch {
        /* first visit */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookId, pageId])

  const requestClips = useCallback(
    async (texts: string[]) => {
      const res = await fetch('/api/life-explorer/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not load word sounds')
      const next = json.clips as Record<string, string>
      setClips((prev) => ({ ...prev, ...next }))
      return next
    },
    []
  )

  useEffect(() => {
    if (pass !== 2) return
    let cancelled = false
    setClipsLoading(true)
    requestClips([...uniqueWords, pageText])
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load word sounds')
      })
      .finally(() => {
        if (!cancelled) setClipsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pass, pageText, uniqueWords, requestClips])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioRef.current?.pause()
    }
  }, [])

  const playUrl = async (url: string, id: string) => {
    audioRef.current?.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    setPlaying(id)
    audio.onended = () => setPlaying(null)
    audio.onerror = () => setPlaying(null)
    await audio.play()
  }

  const playWord = async (word: string) => {
    if (pass !== 2) return
    let url = clipsRef.current[word]
    if (!url) {
      const next = await requestClips([word])
      url = next[word]
    }
    if (url) await playUrl(url, `word:${word}`)
  }

  const playSentence = async () => {
    let url = clipsRef.current[pageText]
    if (!url) {
      const next = await requestClips([pageText])
      url = next[pageText]
    }
    if (url) await playUrl(url, 'sentence')
  }

  const submit = async (blob: Blob) => {
    if (blob.size < 200) {
      setError('That recording was too short. Try the whole page.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('audio', blob, 'reading.webm')
      form.append('page_id', pageId)
      form.append('pass', String(pass))
      const res = await fetch(`/api/life-explorer/books/${bookId}/read-aloud`, {
        method: 'POST',
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not score the read')
      if (pass === 1) {
        setPass1(json.reading)
        setPass(2)
      } else {
        setPass2(json.reading)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not score the read')
    } finally {
      setBusy(false)
    }
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMime()
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        void submit(blob)
      }
      recorder.start(200)
      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setError('Microphone permission is needed to record the read.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setRecording(false)
  }

  const occ = new Map<string, number>()
  const gained = pass1 && pass2 ? pass2.hit_count - pass1.hit_count : 0

  return (
    <div
      className="relative z-10 mt-3 shrink-0 rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] p-3"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00FFFF]">
          {pass === 1 ? 'Pass 1 — no help' : 'Pass 2 — tap a word or play the sentence'}
        </p>
        {current && (
          <p className="text-[11px] text-neutral-500">
            {current.hit_count} clear
            {current.miss_count > 0 ? ` · ${current.miss_count} to try again` : ''}
          </p>
        )}
      </div>

      <p
        className={`mt-2 text-center text-white ${
          pass === 1
            ? 'text-xl md:text-2xl font-semibold leading-snug tracking-wide'
            : 'text-lg md:text-xl leading-snug'
        }`}
      >
        {tokens.map((t, i) => {
          if (!t.isWord) return <span key={i}>{t.display}</span>
          const n = occ.get(t.norm) || 0
          occ.set(t.norm, n + 1)
          const status = statusAt(t.norm, n)
          const color =
            status === 'hit'
              ? 'text-[#39FF14]'
              : status === 'miss' || status === 'sub'
                ? 'text-amber-300 underline decoration-wavy decoration-amber-400'
                : ''
          if (pass === 2) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => playWord(t.display)}
                className={`mx-0.5 rounded px-0.5 hover:bg-white/10 ${color} ${
                  playing === `word:${t.display}` ? 'bg-[#00FFFF]/20' : ''
                }`}
              >
                {t.display}
              </button>
            )
          }
          return (
            <span key={i} className={color}>
              {t.display}
            </span>
          )
        })}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {pass === 2 && (
          <button
            type="button"
            onClick={() => void playSentence()}
            disabled={clipsLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-200 hover:border-[#00FFFF] hover:text-[#00FFFF] disabled:opacity-40"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {playing === 'sentence' ? 'Playing…' : clipsLoading ? 'Loading sounds…' : 'Play the sentence'}
          </button>
        )}
        {pass === 2 && pass1 && (
          <button
            type="button"
            onClick={() => setPass(1)}
            className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
          >
            Show pass 1
          </button>
        )}
        {pass === 1 && pass1 && (
          <button
            type="button"
            onClick={() => setPass(2)}
            className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
          >
            Go to pass 2
          </button>
        )}
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Square className="h-3.5 w-3.5" />
            Stop {seconds}s
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#39FF14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5FFF3E] disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
            {busy ? 'Listening…' : pass === 1 ? 'Record pass 1' : 'Record pass 2'}
          </button>
        )}
      </div>

      {gained > 0 && pass === 2 && (
        <p className="mt-2 text-center text-xs text-[#39FF14]">
          Pass 2 picked up {gained} more word{gained === 1 ? '' : 's'}.
        </p>
      )}
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  )
}
