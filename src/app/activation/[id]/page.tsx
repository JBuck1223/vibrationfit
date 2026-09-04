'use client'

/**
 * Activation delivery — Preview → Immersion → Offer on one route.
 */

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'
import {
  ActivationDelivery,
  type DeliveryAssets,
  type DeliveryActivation,
  type DeliveryPhase,
} from '@/components/activation/ActivationDelivery'

interface Payload {
  activation: DeliveryActivation
  assets: DeliveryAssets
}

function phaseFor(activation: DeliveryActivation): DeliveryPhase {
  if (activation.entered_at || activation.status === 'entered') return 'offer'
  if (activation.opened_at || activation.status === 'opened') return 'immersion'
  return 'preview'
}

export default function ActivationDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const [inspiredStep, setInspiredStep] = useState('')
  const [inspiredSaved, setInspiredSaved] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const enrichFired = useRef(false)

  const track = useCallback((eventType: string, eventData?: Record<string, unknown>) => {
    fetch('/api/activation/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, activationId: id, eventData }),
    }).catch(() => {})
  }, [id])

  const load = useCallback(async () => {
    const res = await fetch(`/api/activation/${id}`)
    if (res.status === 401) {
      router.replace('/activation')
      return null
    }
    if (!res.ok) throw new Error('Could not load your Activation')
    const payload = (await res.json()) as Payload
    setData(payload)
    return payload
  }, [id, router])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const payload = await load()
        if (!payload || cancelled) return

        if (!['ready', 'opened', 'entered'].includes(payload.activation.status)) {
          router.replace(`/activation/experience?id=${id}`)
          return
        }
        if (payload.activation.inspired_next_step) {
          setInspiredStep(payload.activation.inspired_next_step)
          setInspiredSaved(true)
        }
        const opened = ['opened', 'entered'].includes(payload.activation.status)
        if (opened && !enrichFired.current) {
          enrichFired.current = true
          fetch(`/api/activation/${id}/enrich`, { method: 'POST' })
            .then(() => load())
            .catch(() => {})
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your Activation')
      }
    }
    init()
    return () => { cancelled = true }
  }, [id, load, router])

  const assetStatus = data?.activation.asset_status || {}
  const enrichmentPending = (['audio', 'song', 'board'] as const).some(
    (k) => !assetStatus[k] || ['pending', 'generating'].includes(String(assetStatus[k]?.state)),
  )

  useEffect(() => {
    if (!data || phaseFor(data.activation) === 'preview' || !enrichmentPending) return
    const interval = setInterval(async () => {
      const taskId = assetStatus.song?.mureka_task_id
      if (assetStatus.song?.state === 'generating' && taskId && data.activation.song_id) {
        fetch(`/api/songs/poll/${taskId}?song_id=${data.activation.song_id}`).catch(() => {})
      }
      try { await load() } catch { /* transient */ }
    }, 8000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.activation.id, enrichmentPending, assetStatus.song?.state])

  async function handleOpen() {
    setEntering(true)
    try {
      await fetch(`/api/activation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      })
      const next = await load()
      if (next && !enrichFired.current) {
        enrichFired.current = true
        fetch(`/api/activation/${id}/enrich`, { method: 'POST' })
          .then(() => load())
          .catch(() => {})
      }
    } finally {
      setEntering(false)
    }
  }

  async function handleEnter() {
    await fetch(`/api/activation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enter' }),
    })
    await load()
    requestAnimationFrame(() => {
      document.getElementById('continue')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  async function saveInspiredStep() {
    if (!inspiredStep.trim()) return
    await fetch(`/api/activation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspired_next_step: inspiredStep }),
    }).catch(() => {})
    setInspiredSaved(true)
  }

  async function retryEnrich() {
    setRetrying(true)
    try {
      await fetch(`/api/activation/${id}/enrich`, { method: 'POST' })
      await load()
    } finally {
      setRetrying(false)
    }
  }

  if (error) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const phase = phaseFor(data.activation)

  return (
    <Container size="xl">
      <div className={phase === 'offer' ? 'pb-24' : undefined}>
        <ActivationDelivery
          phase={phase}
          activation={data.activation}
          assets={data.assets}
          onEnter={handleOpen}
          entering={entering}
          onGuideDone={handleEnter}
          inspiredStep={inspiredStep}
          inspiredSaved={inspiredSaved}
          onInspiredChange={setInspiredStep}
          onInspiredSave={saveInspiredStep}
          onTrack={track}
          onRetryEnrich={retryEnrich}
          retrying={retrying}
        />
      </div>
    </Container>
  )
}
