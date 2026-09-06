'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  Headphones,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ActivationIncludes } from '@/components/activation/ActivationIncludes'
import {
  Button,
  Card,
  Container,
  Input,
  Spinner,
  Stack,
  Text,
} from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import { ONBOARDING_PHASES, ONBOARDING_STEPS } from '@/lib/life-activation/steps'
import { LIFE_ACTIVATION_WELCOME_VIDEO } from '@/lib/life-activation/video'

const PHASE_ICONS = {
  Start: Rocket,
  Vision: Sparkles,
  Community: Users,
  Completion: CheckCircle,
} as const

export function BeginWelcomePage() {
  const router = useRouter()
  const { progress, seed, isLoading, isUpdating, startOnboarding, saveName } =
    useLifeActivation()
  const [firstName, setFirstName] = useState('')
  const [starting, setStarting] = useState(false)

  const started = Boolean(progress?.onboarding.welcome)
  const hasFirstActivation = Boolean(seed?.visionStatement && seed.categoryLabel)
  const copy = LIFE_ACTIVATION_COPY.welcome.page

  const whatBody = hasFirstActivation ? copy.whatBody : copy.whatBodyFresh
  const firstBody = hasFirstActivation && seed?.categoryLabel
    ? copy.firstBody(seed.categoryLabel)
    : copy.firstBodyFresh

  const phases = useMemo(
    () =>
      ONBOARDING_PHASES.map((phase) => ({
        name: phase,
        icon: PHASE_ICONS[phase],
        steps: ONBOARDING_STEPS.filter((step) => step.phase === phase),
      })),
    [],
  )

  const handleStart = async () => {
    if (starting || isUpdating) return
    setStarting(true)
    try {
      if (firstName.trim()) {
        await saveName(firstName.trim())
      }
      if (!started) {
        await startOnboarding()
      }
      router.push('/begin')
    } catch (error) {
      console.error('[begin/welcome] start failed', error)
      setStarting(false)
    }
  }

  if (isLoading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={LIFE_ACTIVATION_WELCOME_VIDEO.src}
            thumbnailUrl={LIFE_ACTIVATION_WELCOME_VIDEO.poster}
            context="single"
            className="w-full"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          {seed?.needsFirstName && !started && (
            <div className="w-full max-w-sm space-y-2">
              <label className="text-sm text-neutral-400">
                {LIFE_ACTIVATION_COPY.welcome.firstNameLabel}
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={LIFE_ACTIVATION_COPY.welcome.firstNamePlaceholder}
              />
              <p className="text-xs text-neutral-500">
                {LIFE_ACTIVATION_COPY.welcome.accountHint}
              </p>
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={starting || isUpdating}
            className="w-full px-8 sm:w-auto"
          >
            {starting || isUpdating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Starting...
              </>
            ) : started ? (
              <>
                <ArrowRight className="mr-2 h-5 w-5" />
                {copy.continueCta}
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                {copy.startCta}
              </>
            )}
          </Button>
        </div>

        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010]">
          <Stack gap="md">
            <Text
              size="sm"
              className="text-neutral-400 uppercase tracking-[0.3em] underline decoration-[#333] underline-offset-4"
            >
              {copy.whatHeading}
            </Text>
            <p className="text-sm leading-relaxed text-neutral-300">{whatBody}</p>
          </Stack>
        </Card>

        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010]">
          <Stack gap="md">
            <Text
              size="sm"
              className="text-neutral-400 uppercase tracking-[0.3em] underline decoration-[#333] underline-offset-4"
            >
              {copy.firstHeading}
            </Text>
            <p className="text-sm leading-relaxed text-neutral-300">{firstBody}</p>
            <ActivationIncludes />
          </Stack>
        </Card>

        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010]">
          <Stack gap="md">
            <Text
              size="sm"
              className="text-neutral-400 uppercase tracking-[0.3em] underline decoration-[#333] underline-offset-4"
            >
              {copy.nowHeading}
            </Text>
            <p className="text-sm leading-relaxed text-neutral-300">{copy.nowBody}</p>
          </Stack>
        </Card>

        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010]">
          <Stack gap="md">
            <Text
              size="sm"
              className="text-neutral-400 uppercase tracking-[0.3em] underline decoration-[#333] underline-offset-4"
            >
              {copy.pathHeading}
            </Text>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {phases.map((phase) => (
                <div
                  key={phase.name}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <phase.icon className="h-5 w-5 text-accent-400" />
                    <span className="font-semibold text-white">{phase.name}</span>
                  </div>
                  <div className="space-y-2">
                    {phase.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-sm text-neutral-400"
                      >
                        <span className="w-4 font-mono text-xs text-neutral-600">
                          {step.number}
                        </span>
                        <span>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Stack>
        </Card>

        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010]">
          <Stack gap="lg">
            <Text
              size="sm"
              className="text-neutral-400 uppercase tracking-[0.3em] underline decoration-[#333] underline-offset-4"
            >
              {copy.howHeading}
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <div className="flex items-start gap-2">
                  <Headphones className="h-5 w-5 text-primary-500" />
                  <Text size="sm" className="font-semibold text-white">
                    Watch first
                  </Text>
                </div>
                <p className="text-sm leading-relaxed text-neutral-300">{copy.howWatch}</p>
              </Stack>
              <Stack gap="sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="font-semibold text-white">
                    Nothing is locked
                  </Text>
                </div>
                <p className="text-sm leading-relaxed text-neutral-300">{copy.howChoose}</p>
              </Stack>
              <Stack gap="sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-accent-400" />
                  <Text size="sm" className="font-semibold text-white">
                    Then write the life
                  </Text>
                </div>
                <p className="text-sm leading-relaxed text-neutral-300">{copy.howNext}</p>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
