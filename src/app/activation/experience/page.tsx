'use client'

/**
 * Activation Experience — the guided wizard.
 *
 * Current State → VIVA reflection → Dream Layer → Category confirmation →
 * Generate (core written assets) → Vision preview → Enter My Activation.
 * Inputs autosave; refreshing resumes at the right step from the server row.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Text,
  Textarea,
  ProgressBar,
  Spinner,
} from '@/lib/design-system/components'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Heart,
} from 'lucide-react'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS, getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

type Step = 'loading' | 'current-state' | 'reflection' | 'dream' | 'category' | 'generating' | 'preview'

interface DreamAnswers {
  want: string
  why: string
  feel: string
  become: string
}

const DREAM_QUESTIONS: Array<{ key: keyof DreamAnswers; label: string; placeholder: string; required?: boolean }> = [
  {
    key: 'want',
    label: "If this area of your life could change, what would you love to be true instead? Don't make it realistic yet. What do you actually want?",
    placeholder: 'I would love...',
    required: true,
  },
  { key: 'why', label: 'Why does this matter to you?', placeholder: 'It matters because...' },
  { key: 'feel', label: 'How would you feel living this reality?', placeholder: 'I would feel...' },
  { key: 'become', label: 'Who would you become?', placeholder: 'I would be someone who...' },
]

function ActivationExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activationId = searchParams.get('id')

  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)

  const [currentState, setCurrentState] = useState('')
  const [reflection, setReflection] = useState<string | null>(null)
  const [dream, setDream] = useState<DreamAnswers>({ want: '', why: '', feel: '', become: '' })
  const [category, setCategory] = useState<string | null>(null)
  const [confirmationLine, setConfirmationLine] = useState<string | null>(null)
  const [visionStatement, setVisionStatement] = useState<string | null>(null)
  const [essence, setEssence] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [correcting, setCorrecting] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Resume from the server row ----
  useEffect(() => {
    if (!activationId) {
      router.replace('/activation')
      return
    }
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/activation/${activationId}`)
        if (res.status === 401) {
          router.replace('/activation')
          return
        }
        if (!res.ok) throw new Error('Could not load your Activation')
        const { activation } = await res.json()
        if (cancelled) return

        setCurrentState(activation.current_state || '')
        setReflection(activation.reflection || null)
        if (activation.dream_response) setDream((d) => ({ ...d, ...activation.dream_response }))
        setCategory(activation.category || null)
        setVisionStatement(activation.vision_statement || null)
        setEssence(activation.essence || null)

        if (['ready', 'entered'].includes(activation.status)) {
          if (activation.entered_at) {
            router.replace(`/activation/${activationId}`)
            return
          }
          setStep('preview')
        } else if (activation.status === 'generating') {
          setStep('generating')
          runGenerate()
        } else if (activation.status === 'dream' && activation.category) {
          setStep('category')
        } else if (activation.status === 'current_state' && activation.reflection) {
          setStep('reflection')
        } else {
          setStep('current-state')
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your Activation')
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationId])

  // ---- Autosave (debounced) ----
  const autosave = useCallback((payload: Record<string, unknown>) => {
    if (!activationId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/activation/${activationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }, 1200)
  }, [activationId])

  // ---- Step handlers ----
  async function handleReflect() {
    if (!activationId || !currentState.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/activation/${activationId}/reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentState }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'VIVA had trouble hearing that. Please try again.')
      setReflection(data.reflection)
      setStep('reflection')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDreamComplete() {
    if (!activationId || !dream.want.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/activation/${activationId}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamResponse: dream }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setCategory(data.category)
      setConfirmationLine(data.confirmationLine)
      setStep('category')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function runGenerate(confirmedCategory?: string) {
    if (!activationId) return
    setStep('generating')
    setError(null)
    try {
      if (confirmedCategory) {
        await fetch(`/api/activation/${activationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: confirmedCategory, status: 'category_confirmed' }),
        })
      }
      const res = await fetch(`/api/activation/${activationId}/generate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation hit a snag. Please try again.')
      setVisionStatement(data.activation.vision_statement)
      setEssence(data.activation.essence)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation hit a snag. Please try again.')
      setStep('category')
    }
  }

  async function handleEnter() {
    if (!activationId) return
    setBusy(true)
    try {
      await fetch(`/api/activation/${activationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enter' }),
      })
      router.push(`/activation/${activationId}`)
    } catch {
      router.push(`/activation/${activationId}`)
    }
  }

  // ---- Progress header ----
  const stepOrder: Step[] = ['current-state', 'reflection', 'dream', 'category', 'generating', 'preview']
  const stepIndex = Math.max(0, stepOrder.indexOf(step))
  const progressPct = Math.round(((stepIndex + 1) / stepOrder.length) * 100)

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
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#BF00FF]" />
                <Text size="sm" className="text-white font-medium">Your Activation</Text>
              </div>
              <Text size="sm" className="text-neutral-400">
                {step === 'generating' ? 'Creating...' : `Step ${stepIndex + 1} of ${stepOrder.length}`}
              </Text>
            </div>
            <ProgressBar value={progressPct} max={100} size="sm" />
          </div>
        </Container>
      </div>

      <Container size="sm">
        <div className="py-6 md:py-10">

          {/* ------------------------------------------------ CURRENT STATE */}
          {step === 'current-state' && (
            <Stack gap="lg">
              <div>
                <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug mb-2">
                  What's happening right now?
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Tell the truth. What feels frustrating, painful, confusing, or stuck?
                  Take as much room as you need — VIVA listens before anything else.
                </p>
              </div>
              <Textarea
                value={currentState}
                onChange={(e) => {
                  setCurrentState(e.target.value)
                  autosave({ current_state: e.target.value })
                }}
                placeholder="Right now..."
                rows={10}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                variant="primary"
                size="sm"
                onClick={handleReflect}
                disabled={busy || currentState.trim().length < 20}
                className="w-full sm:w-auto"
              >
                {busy ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    VIVA is listening...
                  </>
                ) : (
                  <>
                    Share with VIVA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </Stack>
          )}

          {/* ---------------------------------------------------- REFLECTION */}
          {step === 'reflection' && reflection && (
            <Stack gap="lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#BF00FF]" />
                <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">VIVA</Text>
              </div>
              <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
                <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">
                  {reflection}
                </p>
              </Card>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="sm" onClick={() => setStep('dream')}>
                  Yes, that's it
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep('current-state')}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Let me add more
                </Button>
              </div>
            </Stack>
          )}

          {/* --------------------------------------------------- DREAM LAYER */}
          {step === 'dream' && (
            <Stack gap="lg">
              <div>
                <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug mb-2">
                  Now — what do you actually want?
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Don't make it realistic yet. Let yourself want what you want.
                </p>
              </div>
              {DREAM_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <label className="block text-sm text-neutral-200 font-medium mb-1.5 leading-relaxed">
                    {q.label}
                  </label>
                  <Textarea
                    value={dream[q.key]}
                    onChange={(e) => {
                      const next = { ...dream, [q.key]: e.target.value }
                      setDream(next)
                      autosave({ dream_response: next })
                    }}
                    placeholder={q.placeholder}
                    rows={q.key === 'want' ? 5 : 3}
                  />
                </div>
              ))}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDreamComplete}
                  disabled={busy || !dream.want.trim()}
                >
                  {busy ? (
                    <>
                      <Spinner variant="primary" size="sm" className="mr-2" />
                      VIVA is tuning in...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep('reflection')}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              </div>
            </Stack>
          )}

          {/* ------------------------------------------- CATEGORY CONFIRMATION */}
          {step === 'category' && category && (
            <Stack gap="lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#BF00FF]" />
                <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">VIVA</Text>
              </div>
              <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
                <p className="text-sm md:text-base text-neutral-200 leading-relaxed">
                  {confirmationLine ||
                    `This sounds primarily connected to ${getVisionCategoryLabel(category as VisionCategoryKey)}. Is that right?`}
                </p>
              </Card>

              {!correcting ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="primary" size="sm" onClick={() => runGenerate(category)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Yes — Create My Activation
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCorrecting(true)}>
                    It's a different area
                  </Button>
                </div>
              ) : (
                <Stack gap="md">
                  <Text size="sm" className="text-neutral-300">Which area is at the center of this?</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LIFE_CATEGORY_KEYS.map((key) => {
                      const def = VISION_CATEGORIES.find((c) => c.key === key)
                      const Icon = def?.icon || Heart
                      const selected = category === key
                      return (
                        <button
                          key={key}
                          onClick={() => setCategory(key)}
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                            selected
                              ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                              : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                          <span className="text-sm">{def?.label || key}</span>
                          {selected && <CheckCircle className="h-4 w-4 text-[#39FF14] ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                  <Button variant="primary" size="sm" onClick={() => runGenerate(category)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create My Activation
                  </Button>
                </Stack>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
            </Stack>
          )}

          {/* ---------------------------------------------------- GENERATING */}
          {step === 'generating' && (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Stack gap="md" className="text-center max-w-sm">
                <div className="flex justify-center">
                  <Spinner size="lg" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  VIVA is creating your Activation
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your Life I Choose vision, Future-Self Story, Incantation, and
                  SparkQuery are being written from your own words. This usually
                  takes under a minute.
                </p>
              </Stack>
            </div>
          )}

          {/* ------------------------------------------------------- PREVIEW */}
          {step === 'preview' && visionStatement && (
            <Stack gap="lg">
              <div className="text-center">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-2">
                  The Life I Choose
                </Text>
                {essence && (
                  <div className="flex justify-center mb-2">
                    <span className="px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-medium">
                      {essence}
                    </span>
                  </div>
                )}
              </div>
              <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
                <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line">
                  {visionStatement}
                </p>
              </Card>
              <p className="text-sm text-neutral-400 text-center leading-relaxed">
                Your full Activation is ready: your Future-Self Story, Incantation,
                and SparkQuery — with your guided audio, personal song, and vision
                images being created as you enter.
              </p>
              <div className="flex justify-center">
                <Button variant="primary" size="sm" onClick={handleEnter} disabled={busy}>
                  {busy ? (
                    <>
                      <Spinner variant="primary" size="sm" className="mr-2" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enter My Activation
                    </>
                  )}
                </Button>
              </div>
            </Stack>
          )}
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
