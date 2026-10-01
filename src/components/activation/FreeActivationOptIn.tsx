'use client'

import { ActivationIncludes } from '@/components/activation/ActivationIncludes'
import { ActivationStartForm } from '@/components/activation/ActivationStartForm'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import '@/components/marketing/home/marketing.css'

const LOGO =
  'https://media.vibrationfit.com/site-assets/brand/logo/logo-white.svg'

export function FreeActivationOptIn({
  preview = false,
}: {
  preview?: boolean
}) {
  const copy = ACTIVATION_COPY.optIn

  return (
    <div>
      <div className="hp-optin-hero">
      <img src={LOGO} alt="Vibration Fit" className="mx-auto mb-8 block h-5 w-auto opacity-70" />
      <div className="px-4 md:px-8">
        <div className="mx-auto w-full max-w-2xl text-center [container-type:inline-size]">
          <h1 className="hp-optin-title">{copy.headline}</h1>
          <ActivationStartForm
            landingPage="/free-activation/start"
            previewState={preview ? 'form' : undefined}
          />
          <p className="hp-optin-sub">{copy.subhead}</p>
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
