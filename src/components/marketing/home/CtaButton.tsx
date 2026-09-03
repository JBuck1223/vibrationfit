'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export const CTA_LABEL = 'Start Your 72-Hour Vision Activation'

const DEFAULT_CHECKOUT = '/checkout?product=intensive&plan=full&continuity=28day&planType=solo'

const NON_REFERRAL_SOURCES = new Set(['story', 'life_vision'])

function intensiveCheckoutHref(search: URLSearchParams): string {
  const params = new URLSearchParams()
  params.set('product', 'intensive')
  params.set('plan', 'full')
  params.set('continuity', '28day')

  const planType = search.get('planType') || search.get('type')
  params.set('planType', planType === 'household' ? 'household' : 'solo')

  const promo = search.get('promo')
  const ref = search.get('ref') || search.get('affiliate')
  const source = search.get('source')
  const campaign = search.get('campaign') || search.get('utm_campaign')

  if (promo) params.set('promo', promo)
  if (ref) params.set('ref', ref)
  else if (source && !NON_REFERRAL_SOURCES.has(source)) params.set('ref', source)
  if (campaign) params.set('campaign', campaign)

  return `/checkout?${params.toString()}`
}

export function Cta({ className = '' }: { className?: string }) {
  const [href, setHref] = useState(DEFAULT_CHECKOUT)

  useEffect(() => {
    setHref(intensiveCheckoutHref(new URLSearchParams(window.location.search)))
  }, [])

  return (
    <div className={`mt-10 flex justify-center ${className}`}>
      <a
        href={href}
        className="inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-4 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:w-auto md:whitespace-nowrap md:px-7"
      >
        {CTA_LABEL}
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  )
}
