'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Indie_Flower } from 'next/font/google'
import { ArrowRight } from 'lucide-react'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { Accent, Display } from '@/components/marketing/home/primitives'
import {
  Button,
  Container,
  Input,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import { LIFE_ACTIVATION_WELCOME_VIDEO } from '@/lib/life-activation/video'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export function BeginWelcomePage() {
  const router = useRouter()
  const { progress, seed, isLoading, isUpdating, startOnboarding, saveName } =
    useLifeActivation()
  const [firstName, setFirstName] = useState('')
  const [starting, setStarting] = useState(false)

  const started = Boolean(progress?.onboarding.welcome)
  const copy = LIFE_ACTIVATION_COPY.welcome.page

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
        <div className={display.variable}>
          <Display as="h1">
            Welcome to
            <br />
            <Accent>Vibration Fit</Accent>
          </Display>
        </div>
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
            ) : (
              <>
                {copy.startCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
