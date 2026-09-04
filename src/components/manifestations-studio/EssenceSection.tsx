'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Spinner, Textarea } from '@/lib/design-system'
import { Check, Edit3, Flame, Heart, History, RefreshCw, Sparkles, X } from 'lucide-react'

export interface EssenceVersion {
  id: string
  manifestation_id: string
  why_it_matters: string | null
  what_it_feels_like: string | null
  source: 'viva' | 'member'
  version_number: number
  created_at: string
}

interface EssenceSectionProps {
  manifestationId: string
  whyItMatters: string | null
  whatItFeelsLike: string | null
  versions: EssenceVersion[]
  onSaved: () => void
  onEdit: () => void
  /** Increment to ask VIVA to distill a new draft (e.g. after gathering). */
  distillSignal?: number
}

interface Draft {
  why_it_matters: string
  what_it_feels_like: string
}

/**
 * "Why you want it / What it feels like" — the essence of a manifestation.
 *
 * VIVA distills both from the member's Life Vision, journal entries,
 * conversations, and inspired action. Auto-fills when empty, refreshes on
 * demand, and every accepted version is kept in history for restore.
 */
export function EssenceSection({
  manifestationId,
  whyItMatters,
  whatItFeelsLike,
  versions,
  onSaved,
  onEdit,
  distillSignal = 0,
}: EssenceSectionProps) {
  const [distilling, setDistilling] = useState(false)
  const [autoDistilling, setAutoDistilling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const autoRanRef = useRef(false)

  const isEmpty = !whyItMatters?.trim() && !whatItFeelsLike?.trim()

  const distill = async (): Promise<Draft | null> => {
    const res = await fetch(`/api/manifestations/${manifestationId}/distill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'VIVA could not distill this yet.')
    }
    const data = await res.json()
    return {
      why_it_matters: data.why_it_matters || '',
      what_it_feels_like: data.what_it_feels_like || '',
    }
  }

  const save = async (text: Draft, source: 'viva' | 'member' = 'viva') => {
    const res = await fetch(`/api/manifestations/${manifestationId}/distill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        source,
        why_it_matters: text.why_it_matters,
        what_it_feels_like: text.what_it_feels_like,
      }),
    })
    if (!res.ok) throw new Error('Failed to save')
  }

  // Auto-fill: a manifestation created without essence text gets it written
  // by VIVA on first view, saved as version 1.
  useEffect(() => {
    if (!isEmpty || autoRanRef.current || distilling || draft) return
    autoRanRef.current = true
    setAutoDistilling(true)
    setError(null)
    distill()
      .then(async result => {
        if (!result) return
        await save(result, 'viva')
        onSaved()
      })
      // Auto-fill is best-effort (e.g. viewing a household member's item) — stay quiet on failure
      .catch(() => {})
      .finally(() => setAutoDistilling(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty])

  const handleRefresh = async () => {
    if (distilling) return
    setDistilling(true)
    setError(null)
    try {
      const result = await distill()
      if (result) setDraft(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VIVA could not distill this yet.')
    } finally {
      setDistilling(false)
    }
  }

  const lastDistillSignal = useRef(0)
  useEffect(() => {
    if (!distillSignal || distillSignal === lastDistillSignal.current) return
    lastDistillSignal.current = distillSignal
    void handleRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distillSignal])

  const handleAccept = async () => {
    if (!draft || saving) return
    setSaving(true)
    setError(null)
    try {
      await save(draft, 'viva')
      setDraft(null)
      onSaved()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (version: EssenceVersion) => {
    if (restoringId) return
    setRestoringId(version.id)
    try {
      const res = await fetch(`/api/manifestations/${manifestationId}/distill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', version_id: version.id }),
      })
      if (!res.ok) throw new Error()
      setShowHistory(false)
      onSaved()
    } catch {
      setError('Failed to restore that version.')
    } finally {
      setRestoringId(null)
    }
  }

  const essenceCard = (
    icon: React.ReactNode,
    label: string,
    text: string | null,
    emptyHint: string,
    accent: string,
  ) => (
    <div
      className="relative rounded-2xl border border-[#282828] bg-gradient-to-b from-[#1A1A1A] to-[#121212] p-5 md:p-6 overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 w-1 rounded-full" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>{label}</p>
      </div>
      {text?.trim() ? (
        <p className="text-neutral-100 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
      ) : (
        <p className="text-sm text-neutral-500">{emptyHint}</p>
      )}
    </div>
  )

  return (
    <section id="the-essence" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BF00FF]/15 shrink-0">
            <Sparkles className="h-4 w-4 text-[#D46BFF]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">The Essence</h3>
            <p className="text-xs text-neutral-500">Why you want it, and what living it feels like — distilled by VIVA, owned by you</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {versions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4 mr-1.5" />
              History
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={distilling || autoDistilling}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#BF00FF] px-4 py-1.5 text-sm font-medium text-[#D46BFF] transition-all duration-300 hover:bg-[#BF00FF]/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${distilling ? 'animate-spin' : ''}`} />
            {distilling ? 'Distilling…' : 'Refresh with VIVA'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#FF0040]">{error}</p>
      )}

      {autoDistilling ? (
        <div className="rounded-2xl border border-[#BF00FF]/25 bg-[#BF00FF]/[0.06] p-6 flex items-center gap-3">
          <Spinner size="sm" />
          <div>
            <p className="text-sm font-medium text-white">VIVA is distilling the essence of this manifestation…</p>
            <p className="text-xs text-neutral-400">Reading your Life Vision, journal, and conversations to name why you want this and what it feels like.</p>
          </div>
        </div>
      ) : draft ? (
        <div className="rounded-2xl border border-[#BF00FF]/30 bg-[#BF00FF]/[0.05] p-4 md:p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46BFF]">VIVA&apos;s distillation — check it, tweak it, keep it</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Why you want it</label>
              <Textarea
                value={draft.why_it_matters}
                onChange={e => setDraft(prev => prev ? { ...prev, why_it_matters: e.target.value } : prev)}
                rows={6}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">What it feels like</label>
              <Textarea
                value={draft.what_it_feels_like}
                onChange={e => setDraft(prev => prev ? { ...prev, what_it_feels_like: e.target.value } : prev)}
                rows={6}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={saving}>
              <X className="w-4 h-4 mr-1.5" />
              Discard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={distilling || saving}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${distilling ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="primary" size="sm" onClick={handleAccept} loading={saving} disabled={saving}>
              <Check className="w-4 h-4 mr-1.5" />
              Keep this
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {essenceCard(
            <Heart className="w-4 h-4" style={{ color: '#39FF14' }} />,
            'Why you want it',
            whyItMatters,
            'Not captured yet — Refresh with VIVA to name the real why under this want.',
            '#39FF14',
          )}
          {essenceCard(
            <Flame className="w-4 h-4" style={{ color: '#00FFFF' }} />,
            'What it feels like',
            whatItFeelsLike,
            'Not captured yet — first person, present tense, feeling words.',
            '#00FFFF',
          )}
        </div>
      )}

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Essence history"
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {versions.length === 0 ? (
            <p className="text-sm text-neutral-500">No versions yet.</p>
          ) : (
            versions.map((version, index) => (
              <div key={version.id} className="rounded-xl border border-[#282828] bg-[#161616] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">v{version.version_number}</span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.16em] rounded-full px-2 py-0.5 ${
                      version.source === 'viva'
                        ? 'bg-[#BF00FF]/15 text-[#D46BFF]'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {version.source === 'viva' ? 'VIVA' : 'You'}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(version.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#39FF14]">Current</span>
                  )}
                  <div className="flex-1" />
                  {index !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(version)}
                      loading={restoringId === version.id}
                      disabled={Boolean(restoringId)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
                {version.why_it_matters && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">Why you want it</p>
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap line-clamp-4">{version.why_it_matters}</p>
                  </div>
                )}
                {version.what_it_feels_like && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">What it feels like</p>
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap line-clamp-4">{version.what_it_feels_like}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </section>
  )
}
