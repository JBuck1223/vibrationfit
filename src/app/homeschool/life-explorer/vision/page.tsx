'use client'

/**
 * The Life I Choose, built in three steps:
 * 1. Where he is now — the parent's current-state profile (12 life categories, kid lens)
 * 2. VIVA's draft — composed from that profile
 * 3. His turn — the child adds imagination and makes it his
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type { LeStudent } from '@/lib/life-explorer/types'
import { ProfileIntake } from './ProfileIntake'

type Step = 'profile' | 'draft' | 'his-turn'

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'profile', label: '1. Where he is now' },
  { key: 'draft', label: "2. VIVA's draft" },
  { key: 'his-turn', label: '3. His turn' },
]

export default function LifeIChoosePage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="py-20 flex justify-center">
          <Spinner />
        </Container>
      }
    >
      <LifeIChooseFlow />
    </Suspense>
  )
}

function LifeIChooseFlow() {
  const params = useSearchParams()
  const [student, setStudent] = useState<LeStudent | null>(null)
  const [step, setStep] = useState<Step | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/lessons/today')
        const json = await res.json()
        const s = json.student as LeStudent | null
        setStudent(s)
        setDraft(s?.life_i_choose || '')
        const requested = params.get('step')
        if (requested === 'profile') setStep('profile')
        else if (s?.life_i_choose) setStep('his-turn')
        else setStep('profile')
      } finally {
        setLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save(next = draft) {
    if (!student) return
    setBusy('save')
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/life-explorer/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          life_i_choose: next,
          life_i_choose_source: 'child_edited',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setStudent(json.student)
      setDraft(json.student.life_i_choose || next)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(null)
    }
  }

  async function composeDraft() {
    if (!student) return
    setBusy('draft')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/vision/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not draft this')
      setDraft(json.text)
      setStudent((s) => (s ? { ...s, life_i_choose: json.text, life_i_choose_source: 'profile_draft' } : s))
      setStep('his-turn')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed')
    } finally {
      setBusy(null)
    }
  }

  async function tighten() {
    if (!student) return
    setBusy('tighten')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/vision/tighten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not polish this')
      setDraft(json.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polish failed')
    } finally {
      setBusy(null)
    }
  }

  async function hear() {
    if (!student) return
    setBusy('hear')
    setError(null)
    try {
      await save(draft)
      const res = await fetch('/api/life-explorer/vision/hear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, text: draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Hear-it failed')
      setStudent((s) => (s ? { ...s, life_i_choose_audio_url: json.audio_url } : s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hear-it failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading || !step) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (!student) {
    return (
      <Container size="md" className="py-16">
        <p className="text-neutral-400">No explorer yet. Start from Today.</p>
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
          <h2 className="text-3xl font-bold text-white mt-3">The Life I Choose</h2>
          <p className="text-neutral-400 mt-2">
            The vision every school day is composed from. You describe where {student.name} is
            now, VIVA drafts a beginning, and {student.name} makes it his.
          </p>
        </div>

        {/* Step nav */}
        <div className="flex gap-2 flex-wrap">
          {STEPS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(s.key)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                step === s.key
                  ? 'border-[#39FF14]/60 bg-[#39FF14]/10 text-[#39FF14]'
                  : 'border-[#333] text-neutral-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {saved && !error && <p className="text-sm text-[#39FF14]">Saved.</p>}

        {step === 'profile' && (
          <Stack gap="md">
            <ProfileIntake student={student} />
            <div>
              <Button variant="secondary" onClick={() => setStep('draft')}>
                Next: VIVA&apos;s draft
              </Button>
            </div>
          </Stack>
        )}

        {step === 'draft' && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
            <h3 className="text-lg font-semibold text-white">VIVA&apos;s draft</h3>
            <p className="text-sm text-neutral-400 mt-1 mb-4">
              VIVA writes a first version from the profile — real loves, real people, a small
              reach past them. It replaces what is in the editor, and {student.name} edits from
              there.
            </p>
            {student.life_i_choose && (
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4 mb-4">
                <p className="text-xs text-neutral-500 mb-2">
                  Current version
                  {student.life_i_choose_source === 'profile_draft'
                    ? " — VIVA's draft, not yet his"
                    : student.life_i_choose_source === 'child_edited'
                      ? ' — already his'
                      : ''}
                </p>
                <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {student.life_i_choose}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void composeDraft()} disabled={!!busy}>
                {busy === 'draft'
                  ? 'VIVA is drafting…'
                  : student.life_i_choose
                    ? 'Draft a fresh version'
                    : 'VIVA: draft from the profile'}
              </Button>
              {student.life_i_choose && (
                <Button variant="ghost" onClick={() => setStep('his-turn')} disabled={!!busy}>
                  Keep this — go edit
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'his-turn' && (
          <Stack gap="md">
            <p className="text-sm text-neutral-400">
              Read it together. {student.name} changes anything, adds anything — you scribe. His
              words win.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              placeholder="I am… This is the life I choose."
              className="w-full rounded-2xl border border-[#333] bg-[#111] text-white px-4 py-3 leading-relaxed min-h-[240px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void save()} disabled={!!busy}>
                {busy === 'save' ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => void tighten()} disabled={!!busy || !draft.trim()}>
                {busy === 'tighten' ? 'VIVA is polishing…' : 'VIVA: polish the wording'}
              </Button>
              <Button variant="secondary" onClick={() => void hear()} disabled={!!busy || !draft.trim()}>
                {busy === 'hear' ? 'Recording…' : 'Hear it'}
              </Button>
              <a
                href="/api/life-explorer/print/vision"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-[#333] px-4 py-2 text-sm text-neutral-200 hover:border-[#39FF14]/40"
              >
                Print the book
              </a>
            </div>
            {student.life_i_choose_audio_url && (
              <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
                <p className="text-sm text-neutral-400 mb-3">Hear-it recording</p>
                <audio controls src={student.life_i_choose_audio_url} className="w-full" />
              </div>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
