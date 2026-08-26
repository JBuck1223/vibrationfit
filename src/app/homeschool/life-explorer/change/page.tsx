'use client'

/**
 * Change Direction — the expedition chooser.
 *
 * The rule of three: VIVA offers a comfort pick, a stretch, and one
 * genuinely unknown world. The child taps one; that becomes the next
 * expedition and the first lesson composes. The manual path stays for
 * parents who already know where curiosity points.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Spinner, Button, Input } from '@/lib/design-system/components'
import type { LeWorldMapItem, WorldCluster } from '@/lib/life-explorer/types'

interface SuggestionCard {
  kind: 'comfort' | 'stretch' | 'unknown'
  title: string
  hook: string
  why_this_matters: string
  cluster: WorldCluster
}

const KIND_COPY: Record<SuggestionCard['kind'], { tag: string; ring: string; text: string }> = {
  comfort: { tag: 'More of what he loves', ring: 'border-[#39FF14]/40', text: 'text-[#39FF14]' },
  stretch: { tag: 'A new angle', ring: 'border-[#00FFFF]/40', text: 'text-[#00FFFF]' },
  unknown: { tag: 'Somewhere brand new', ring: 'border-purple-400/40', text: 'text-purple-300' },
}

export default function ChangeDirectionPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const [why, setWhy] = useState('')
  const [title, setTitle] = useState('')
  const [tastes, setTastes] = useState<LeWorldMapItem[]>([])
  const [cards, setCards] = useState<SuggestionCard[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [today, map] = await Promise.all([
          fetch('/api/life-explorer/lessons/today').then((r) => r.json()),
          fetch('/api/life-explorer/world-map').then((r) => r.json()),
        ])
        setStudentId(today.student?.id || null)
        setCurrentTitle(today.expedition?.title || null)
        setTastes(map.items || [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function suggest() {
    if (!studentId) return
    setSuggesting(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/expeditions/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not offer three worlds')
      setCards(json.cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggestion failed')
    } finally {
      setSuggesting(false)
    }
  }

  async function startExpedition(nextTitle: string, nextWhy: string, savingKey: string) {
    if (!studentId || !nextTitle.trim()) return
    setSaving(savingKey)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/expeditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          title: nextTitle.trim(),
          why_this_matters: nextWhy.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to change direction')

      await fetch('/api/life-explorer/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })

      // Recompose the coming week around the new world (fire-and-forget).
      void fetch('/api/life-explorer/week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })

      router.push('/homeschool/life-explorer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Choose the next world</h2>
          <p className="text-neutral-400 mt-2">
            {currentTitle
              ? `Current expedition (${currentTitle}) will be paused and kept. VIVA offers three worlds — he picks. Or name one yourselves below.`
              : 'VIVA offers three worlds — he picks. Or name one yourselves below.'}
          </p>
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        {/* The rule of three */}
        <div>
          {!cards && (
            <Button variant="primary" size="lg" onClick={() => void suggest()} disabled={suggesting || !studentId}>
              {suggesting ? 'VIVA is scouting…' : 'VIVA: offer three worlds'}
            </Button>
          )}
          {cards && (
            <Stack gap="md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cards.map((card) => {
                  const copy = KIND_COPY[card.kind]
                  return (
                    <button
                      key={card.kind}
                      type="button"
                      disabled={!!saving}
                      onClick={() => void startExpedition(card.title, card.why_this_matters, card.kind)}
                      className={`text-left rounded-2xl border bg-[#111] p-5 transition-transform hover:scale-[1.02] disabled:opacity-60 ${copy.ring}`}
                    >
                      <p className={`text-xs uppercase tracking-wide ${copy.text}`}>{copy.tag}</p>
                      <p className="text-lg font-semibold text-white mt-2 leading-snug">{card.title}</p>
                      <p className="text-sm text-neutral-300 mt-2">{card.hook}</p>
                      <p className="text-xs text-neutral-500 mt-3">{card.why_this_matters}</p>
                      <p className={`text-xs mt-4 ${copy.text}`}>
                        {saving === card.kind ? 'Starting…' : 'Tap to choose →'}
                      </p>
                    </button>
                  )
                })}
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={() => void suggest()} disabled={suggesting || !!saving}>
                  {suggesting ? 'VIVA is scouting…' : 'Three different worlds'}
                </Button>
              </div>
            </Stack>
          )}
        </div>

        {/* Manual path */}
        <div className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
          <p className="text-sm text-neutral-300 mb-4">Or name the world yourselves</p>

          {tastes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-neutral-500 mb-2">From the World Map</p>
              <div className="flex flex-wrap gap-2">
                {tastes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTitle(t.name)
                      setWhy(t.taste_looks_like || '')
                    }}
                    className="rounded-full border border-[#333] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#39FF14]/40"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm text-neutral-300 mb-2 block">New expedition</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Antarctica, The backyard creek, How ice works"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm text-neutral-300 mb-2 block">Why this world</span>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={3}
              placeholder="You want to be an explorer who asks why…"
              className="w-full rounded-xl border border-[#333] bg-[#111] text-white px-4 py-3 text-sm"
            />
          </label>

          <Button
            variant="primary"
            size="lg"
            disabled={!studentId || !title.trim() || !!saving}
            onClick={() => void startExpedition(title, why, 'manual')}
          >
            {saving === 'manual' ? 'Starting…' : 'Start New Expedition'}
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
