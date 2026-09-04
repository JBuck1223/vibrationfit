'use client'

/**
 * Activation Experience — orientation, then bounded VIVA chat, then generate.
 * Preview / Immersion / Offer live on /activation/[id].
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Spinner, Text } from '@/lib/design-system/components'
import { Sparkles } from 'lucide-react'
import { ActivationOrientation } from '@/components/activation/ActivationOrientation'
import { ActivationCategoryPick } from '@/components/activation/ActivationCategoryPick'
import { ActivationIntakeChat } from '@/components/activation/ActivationIntakeChat'
import { GeneratingStep } from '@/components/activation/ActivationExperienceSteps'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { isIntakeReady } from '@/lib/activation/intake-markers'
import type { ActivationChatMessage } from '@/lib/activation/orchestrator'

type Step = 'loading' | 'orientation' | 'category' | 'chat' | 'generating'

function ActivationExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlId = searchParams.get('id')

  const [activationId, setActivationId] = useState<string | null>(urlId)
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [conversation, setConversation] = useState<ActivationChatMessage[]>([])
  const [currentState, setCurrentState] = useState<string | null>(null)
  const [dreamWant, setDreamWant] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [intakeReady, setIntakeReady] = useState(false)

  const applyRow = useCallback((activation: {
    id: string
    status: string
    entered_at?: string | null
    opened_at?: string | null
    ready_at?: string | null
    conversation?: ActivationChatMessage[]
    current_state?: string | null
    dream_response?: Record<string, string> | null
    category?: string | null
    intake_ready_at?: string | null
  }) => {
    if (['ready', 'opened', 'entered'].includes(activation.status) || activation.ready_at) {
      router.replace(`/activation/${activation.id}`)
      return 'redirect' as const
    }
    setActivationId(activation.id)
    setCurrentState(activation.current_state || null)
    setDreamWant(activation.dream_response?.want || null)
    setCategory(activation.category || null)
    setIntakeReady(!!activation.intake_ready_at || isIntakeReady(activation))
    setConversation(Array.isArray(activation.conversation) ? activation.conversation : [])

    if (activation.status === 'generating') return 'generating' as const
    if (activation.status === 'started') return 'orientation' as const
    if (!activation.category) return 'category' as const
    return 'chat' as const
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
      setConversation(Array.isArray(row.conversation) ? row.conversation : [])
      setStep('chat')
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
      setStep('chat')
    }
  }

  if (step === 'loading') {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          {error ? <p className="text-sm text-red-400">{error}</p> : <Spinner size="lg" />}
        </div>
      </Container>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-50 bg-neutral-850/95 backdrop-blur-sm border-b border-[#1A1A1A]">
        <Container size="xl">
          <div className="py-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#BF00FF]" />
            <Text size="sm" className="text-white font-medium">{ACTIVATION_COPY.chrome.title}</Text>
            <span className="text-xs text-neutral-500">{ACTIVATION_COPY.chrome.withViva}</span>
          </div>
        </Container>
      </div>

      <Container size="sm">
        <div className="py-6 md:py-10">
          {step === 'orientation' && (
            <ActivationOrientation onReady={handleOrient} busy={busy} error={error} />
          )}

          {step === 'category' && (
            <ActivationCategoryPick
              selected={category}
              onSelect={setCategory}
              onContinue={handleChooseCategory}
              busy={busy}
              error={error}
            />
          )}

          {step === 'chat' && activationId && (
            <>
              {error && step === 'chat' && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}
              <ActivationIntakeChat
                activationId={activationId}
                initialMessages={conversation}
                currentState={currentState}
                dreamWant={dreamWant}
                category={category}
                intakeReady={intakeReady}
                onFieldsChange={(next) => {
                  setCurrentState(next.current_state || null)
                  setDreamWant(next.dream_want || null)
                  setCategory(next.category || null)
                  setIntakeReady(!!next.intake_ready)
                  setConversation(next.conversation)
                }}
                onCreate={() => runGenerate()}
                creating={false}
              />
            </>
          )}

          {step === 'generating' && <GeneratingStep />}
        </div>
      </Container>
    </>
  )
}

export default function ActivationExperiencePage() {
  return (
    <Suspense
      fallback={
        <Container size="xl">
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      }
    >
      <ActivationExperience />
    </Suspense>
  )
}
