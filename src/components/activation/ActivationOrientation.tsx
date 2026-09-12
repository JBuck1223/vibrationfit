'use client'

import { Indie_Flower } from 'next/font/google'
import { ArrowRight } from 'lucide-react'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { ActivationIncludes } from '@/components/activation/ActivationIncludes'
import {
  Display,
} from '@/components/marketing/home/primitives'
import { Container } from '@/lib/design-system'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export function ActivationOrientation({
  onReady,
  busy,
  error,
}: {
  onReady: () => void
  busy?: boolean
  error?: string | null
}) {
  const copy = ACTIVATION_COPY.orientation

  return (
    <div
      className={`${display.variable} overflow-x-clip`}
      data-home="activation-orientation"
    >
      <header>
        <Container size="xl" className="px-4 pb-8 pt-8 md:px-10 md:pb-10 md:pt-10">
          <Display as="h1" className="hp-hero-headline">
            <span className="hp-hero-headline-line">Welcome to your</span>
            <br />
            Activation!
          </Display>

          <div className="mt-6 grid items-start gap-8 lg:mt-8 lg:grid-cols-4 lg:gap-x-10">
            <p className="hp-display text-left text-[1.65rem] leading-none text-[#39FF14] md:text-[2rem] lg:col-span-2">
              {copy.lead}
            </p>

            <div className="lg:col-span-2 lg:row-start-2">
              <div className="space-y-5 text-pretty text-lg leading-[1.7] text-neutral-300">
                {copy.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 lg:row-start-2">
              <ActivationIncludes />
            </div>
          </div>

          {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex justify-center md:mt-10">
            <button
              type="button"
              onClick={onReady}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-4 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 disabled:opacity-60 md:w-auto md:whitespace-nowrap md:px-7"
            >
              {busy ? copy.committing : copy.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Container>
      </header>
    </div>
  )
}
