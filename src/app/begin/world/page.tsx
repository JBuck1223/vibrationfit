'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { BeginTitle } from '@/components/life-activation/BeginTitle'
import { WORLD_SCREENS, YourWorldEditor } from '@/components/your-world/YourWorldEditor'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { useYourWorld } from '@/hooks/useYourWorld'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import { normalizeSnapshot } from '@/lib/your-world/snapshot'
import type { YourWorldSnapshot } from '@/lib/your-world/types'
import { cn } from '@/lib/utils'

export default function BeginWorldPage() {
  const router = useRouter()
  const copy = LIFE_ACTIVATION_COPY.world
  const { progress, completeOnboardingStep, isUpdating } = useLifeActivation()
  const { data, isLoading, saveVersion } = useYourWorld()
  const [snapshot, setSnapshot] = useState<YourWorldSnapshot | null>(null)
  const [screen, setScreen] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const completed = Boolean(progress?.onboarding.world)

  useEffect(() => {
    if (!data || snapshot) return
    setSnapshot(normalizeSnapshot(data.active?.snapshot ?? data.seed))
  }, [data, snapshot])

  if (!progress || isLoading || !data || !snapshot) {
    return (
      <Container size="xl">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const current = WORLD_SCREENS[screen]
  const last = screen === WORLD_SCREENS.length - 1

  const finish = async () => {
    setError(null)
    try {
      await saveVersion.mutateAsync({ snapshot, source: 'getting_started' })
      await completeOnboardingStep('world')
      router.push('/life-vision/start')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  const next = () => {
    if (last) return finish()
    setScreen((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow={LIFE_ACTIVATION_COPY.sidebar.onboardingTitle}
          title={<BeginTitle text={copy.title} accent={copy.titleAccent} />}
          subtitle={completed ? copy.done : copy.body}
          action={
            completed ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/your-world">{copy.editCta}</Link>
              </Button>
            ) : undefined
          }
        />

        {completed ? (
          <YourWorldEditor value={snapshot} onChange={() => {}} firstName={data.firstName} readOnly />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {WORLD_SCREENS.map((s, i) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScreen(i)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                      i === screen
                        ? 'border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]'
                        : 'border-white/10 text-neutral-400 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {i + 1}. {s.title}
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-neutral-400">{current.subtitle}</p>

            <YourWorldEditor
              value={snapshot}
              onChange={setSnapshot}
              firstName={data.firstName}
              screens={[current.id]}
            />

            {error && <p className="text-sm text-contrast-400">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                {screen > 0 && (
                  <Button variant="ghost" onClick={() => setScreen((s) => s - 1)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    {copy.back}
                  </Button>
                )}
              </div>
              <Button
                variant="primary"
                onClick={next}
                disabled={saveVersion.isPending || isUpdating}
                className="min-w-[200px]"
              >
                {last ? copy.cta : copy.next}
                {!last && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </Stack>
    </Container>
  )
}
