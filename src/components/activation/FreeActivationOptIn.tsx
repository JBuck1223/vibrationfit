'use client'

import { Check } from 'lucide-react'
import { Indie_Flower } from 'next/font/google'
import { ActivationIncludes } from '@/components/activation/ActivationIncludes'
import { ActivationStartForm } from '@/components/activation/ActivationStartForm'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { Accent } from '@/components/marketing/home/primitives'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

const LOGO =
  'https://media.vibrationfit.com/site-assets/brand/logo/logo-white.svg'

export function FreeActivationOptIn({
  preview = false,
}: {
  preview?: boolean
}) {
  const copy = ACTIVATION_COPY.optIn

  return (
    <div className={display.variable}>
      <div className="hp-optin-hero">
      <img src={LOGO} alt="Vibration Fit" className="mx-auto mb-8 block h-5 w-auto opacity-70" />
      <div className="px-4 md:px-8">
      <div className="hp-optin-split w-full">
        <div className="hp-optin hp-optin-copy">
          <h1 className="hp-optin-title">
            <span className="hp-optin-lead">{copy.headlineLead}</span>
            <Accent>{copy.headlineAccent}</Accent>
          </h1>
          <p className="hp-optin-sub">{copy.subhead}</p>
          <ul className="mx-auto mt-5 w-fit space-y-2.5 text-left lg:mx-0">
            {[copy.limit, copy.reassurance].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-snug text-white">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={2.5} aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="hp-optin-form">
          <ActivationStartForm
            landingPage="/free-activation"
            previewState={preview ? 'form' : undefined}
          />
        </div>
      </div>
      </div>
      </div>
      <section className="hp-optin-kit">
        <div className="hp-optin-kit-inner">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
            {copy.includesLabel}
          </h2>
          <ActivationIncludes />
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-neutral-500">
            {copy.paidDistinction}
          </p>
        </div>
      </section>
    </div>
  )
}
