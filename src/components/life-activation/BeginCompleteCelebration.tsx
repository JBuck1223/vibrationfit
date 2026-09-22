'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import { Button, Card } from '@/lib/design-system/components'
import { useWalkthroughChrome } from '@/components/tool-walkthrough'
import { BeginTitle } from '@/components/life-activation/BeginTitle'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  consumeBeginComplete,
  hasPendingBeginComplete,
  BEGIN_JUST_COMPLETED_EVENT,
  markBeginCelebrated,
} from '@/lib/life-activation/celebration'

export function BeginCompleteCelebration() {
  const chrome = useWalkthroughChrome()
  const [open, setOpen] = useState(false)

  const fireConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration
    const colors = ['#199D67', '#14B8A6', '#8B5CF6', '#FFB701']

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors })
    frame()
  }, [])

  useEffect(() => {
    const maybeOpen = () => {
      if (!hasPendingBeginComplete()) return
      markBeginCelebrated()
      setOpen(true)
      fireConfetti()
    }

    maybeOpen()
    window.addEventListener(BEGIN_JUST_COMPLETED_EVENT, maybeOpen)
    return () => window.removeEventListener(BEGIN_JUST_COMPLETED_EVENT, maybeOpen)
  }, [fireConfetti])

  const handleClose = () => {
    consumeBeginComplete()
    setOpen(false)
    chrome?.start()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg shrink-0 animate-in fade-in zoom-in-95 duration-300">
          <Card variant="elevated" className="border-[#333] bg-neutral-850 !p-0">
            <div className="p-6 md:p-8">
              <div className="mb-5 flex justify-center">
                <Image
                  src="https://media.vibrationfit.com/site-assets/brand/logo/logo-bar-white.svg"
                  alt="Vibration Fit"
                  width={72}
                  height={72}
                  priority
                />
              </div>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  <BeginTitle
                    text={LIFE_ACTIVATION_COPY.complete.title}
                    accent={LIFE_ACTIVATION_COPY.complete.titleAccent}
                  />
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-300 md:text-base">
                  {LIFE_ACTIVATION_COPY.complete.body}
                </p>
              </div>
              <div className="flex justify-center">
                <Button variant="primary" size="lg" onClick={handleClose} className="w-full px-8 sm:w-auto">
                  {LIFE_ACTIVATION_COPY.complete.tourCta}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
