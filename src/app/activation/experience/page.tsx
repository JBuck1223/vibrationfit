'use client'

/**
 * Activation Experience — orientation, pick one area, write the two beats
 * (what's going on now / unleash your imagination), then generate.
 * Preview / Immersion / Offer live on /activation/[id].
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'
import { ActivationOrientation } from '@/components/activation/ActivationOrientation'
import { ActivationCategoryPick } from '@/components/activation/ActivationCategoryPick'
import { ActivationRawMaterial } from '@/components/activation/ActivationRawMaterial'
import { GeneratingStep } from '@/components/activation/ActivationExperienceSteps'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

type Step = 'loading' | 'orientation' | 'category' | 'raw-material' | 'generating'

function ActivationExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlId = searchParams.get('id')

  const [activationId, setActivationId] = useState<string | null>(urlId)
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [currentState, setCurrentState] = useState<string | null>(null)
  const [dreamWant, setDreamWant] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)

  const applyRow = useCallback((activation: {
    id: string
    status: string
    entered_at?: string | null
    opened_at?: string | null
    ready_at?: string | null
    current_state?: string | null
    dream_response?: Record<string, string> | null
    category?: string | null
  }) => {
    if (['ready', 'opened', 'entered'].includes(activation.status) || activation.ready_at) {
      router.replace(`/activation/${activation.id}`)
      return 'redirect' as const
    }
    setActivationId(activation.id)
    setCurrentState(activation.current_state || null)
    setDreamWant(activation.dream_response?.want || null)
    setCategory(activation.category || null)

    if (activation.status === 'generating') return 'generating' as const
    if (activation.status === 'started') return 'orientation' as const
    if (!activation.category) return 'category' as const
    return 'raw-material' as const
  }, [router])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (urlId) {
          const res = await fetch(`/api/activation/${urlId}`)
          if (res.status === 401) {
            router.replace('/activation')
            return
          }
          if (!res.ok) throw new Error('Could not load your Activation')
          const { activation } = await res.json()
          if (cancelled) return
          const next = applyRow(activation)
          if (next === 'redirect') return
          if (next === 'generating') {
            setStep('generating')
            runGenerate(activation.id)
            return
          }
          setStep(next)
          return
        }

        const latest = await fetch('/api/activation/latest')
        if (latest.status === 401) {
          router.replace('/activation')
          return
        }
        if (!latest.ok) throw new Error('Could not load your Activation')
        const data = await latest.json()
        if (cancelled) return
        if (!data.activation) {
          router.replace('/activation')
          return
        }
        router.replace(`/activation/experience?id=${data.activation.id}`)
        const next = applyRow(data.activation)
        if (next === 'redirect') return
        if (next === 'generating') {
          setStep('generating')
          runGenerate(data.activation.id)
          return
        }
        setStep(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your Activation')
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId])

  async function handleOrient() {
    if (!activationId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/activation/${activationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'orient' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not continue')
      setStep('category')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue')
    } finally {
      setBusy(false)
    }
  }

  async function handleChooseCategory() {
    if (!activationId || !category) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/activation/${activationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'choose_category', category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not continue')
      const row = data.activation
      setCategory(row.category || category)
      setStep('raw-material')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue')
    } finally {
      setBusy(false)
    }
  }

  async function runGenerate(id?: string) {
    const target = id || activationId
    if (!target) return
    setStep('generating')
    setError(null)
    try {
      const res = await fetch(`/api/activation/${target}/generate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation hit a snag. Please try again.')
      router.push(`/activation/${target}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation hit a snag. Please try again.')
      setStep('raw-material')
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center">
        {error ? <p className="text-sm text-red-400">{error}</p> : <Spinner size="lg" />}
      </div>
    )
  }

  if (step === 'orientation') {
    return (
      <div className="flex-1 overflow-y-auto">
        <ActivationOrientation onReady={handleOrient} busy={busy} error={error} />
      </div>
    )
  }

  if (step === 'category') {
    return (
      <div className="flex-1 overflow-y-auto">
        <Container size="xl" className="px-4 py-10 md:px-10">
          <ActivationCategoryPick
            selected={category}
            onSelect={setCategory}
            onContinue={handleChooseCategory}
            busy={busy}
            error={error}
          />
        </Container>
      </div>
    )
  }

  if (step === 'raw-material' && activationId && category) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Container size="xl" className="px-4 py-6 md:px-10 md:py-8">
          <ActivationRawMaterial
            key={activationId}
            activationId={activationId}
            category={category as LifeCategoryKey}
            initialNow={currentState}
            initialDream={dreamWant}
            onFieldsChange={(next) => {
              setCurrentState(next.current_state)
              setDreamWant(next.dream_response?.want || null)
            }}
            onCreate={() => runGenerate()}
            error={error}
          />
        </Container>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <GeneratingStep category={category} />
    </div>
  )
}

export default function ActivationExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ActivationExperience />
    </Suspense>
  )
}
