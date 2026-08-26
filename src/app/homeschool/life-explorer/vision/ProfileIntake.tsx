'use client'

/**
 * Guided current-state intake: one life category at a time, kid lens.
 * Saves each answer as the parent moves on; every category is skippable.
 * The finished profile is what VIVA drafts the Life I Choose from.
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner } from '@/lib/design-system/components'
import { KID_CATEGORIES, type LeStudentProfile } from '@/lib/life-explorer/life-profile'
import type { LeStudent } from '@/lib/life-explorer/types'

const HOPES_STEP = KID_CATEGORIES.length

export function ProfileIntake({
  student,
  onSaved,
}: {
  student: LeStudent
  onSaved?: (profile: LeStudentProfile) => void
}) {
  const [profile, setProfile] = useState<Partial<LeStudentProfile>>({})
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const category = step < HOPES_STEP ? KID_CATEGORIES[step] : null
  const currentField = category ? category.field : 'parent_hopes'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/life-explorer/profile?student_id=${student.id}`)
        const json = await res.json()
        if (json.profile) setProfile(json.profile)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [student.id])

  useEffect(() => {
    const existing = profile[currentField]
    setValue(typeof existing === 'string' ? existing : '')
  }, [step, profile, currentField])

  // Chips from the freeform portrait — a memory jog while answering.
  const hints = useMemo(
    () =>
      [...(student.interests || []), ...(student.strengths || [])].slice(0, 8),
    [student]
  )

  async function saveField(field: string, text: string): Promise<boolean> {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, [field]: text.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setProfile(json.profile)
      onSaved?.(json.profile)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function next() {
    const changed = value !== (profile[currentField] ?? '')
    if (changed) {
      const ok = await saveField(currentField, value)
      if (!ok) return
    }
    if (step <= HOPES_STEP) setStep(step + 1)
  }

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <Spinner />
      </div>
    )
  }

  const isHopes = step === HOPES_STEP
  const done = step > HOPES_STEP

  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {KID_CATEGORIES.map((c, i) => {
          const filled = typeof profile[c.field] === 'string' && String(profile[c.field]).trim()
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setStep(i)}
              title={c.label}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === step
                  ? 'bg-[#39FF14]'
                  : filled
                    ? 'bg-[#39FF14]/40'
                    : 'bg-[#333]'
              }`}
            />
          )
        })}
        <button
          type="button"
          onClick={() => setStep(HOPES_STEP)}
          title="Parent hopes"
          className={`h-2.5 w-5 rounded-full transition-colors ${
            isHopes ? 'bg-[#00FFFF]' : profile.parent_hopes ? 'bg-[#00FFFF]/40' : 'bg-[#333]'
          }`}
        />
      </div>

      {!done && (
        <>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {isHopes ? 'One more' : `${step + 1} of ${KID_CATEGORIES.length}`}
          </p>
          <h4 className="text-lg font-semibold text-white mt-1">
            {isHopes ? 'Your hopes for this year' : category!.label}
          </h4>
          <p className="text-sm text-neutral-400 mt-1">
            {isHopes
              ? `In your own words: what do you hope this year holds for ${student.name}?`
              : category!.prompt}
          </p>

          {step === 0 && hints.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hints.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-2.5 py-1 text-xs text-neutral-400"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            placeholder={isHopes ? 'I hope he…' : `e.g. ${category!.example}`}
            className="mt-3 w-full rounded-xl border border-[#333] bg-[#0a0a0a] text-white px-3 py-2 text-sm leading-relaxed"
          />

          {error && <p className="text-sm text-red-300 mt-2">{error}</p>}

          <div className="mt-4 flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={busy}>
                Back
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => void next()} disabled={busy}>
              {busy ? 'Saving…' : isHopes ? 'Finish' : 'Next'}
            </Button>
            {!isHopes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={busy}
              >
                Skip
              </Button>
            )}
          </div>
        </>
      )}

      {done && (
        <div>
          <h4 className="text-lg font-semibold text-white">Profile saved</h4>
          <p className="text-sm text-neutral-400 mt-1">
            {student.name}&apos;s current state is on record. VIVA can draft the Life I Choose
            from it now.
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setStep(0)}>
            Review answers
          </Button>
        </div>
      )}
    </div>
  )
}
