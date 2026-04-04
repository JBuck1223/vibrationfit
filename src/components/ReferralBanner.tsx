'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Gift, X } from 'lucide-react'

const BANNER_MIN_HEIGHT = 48
const DISMISSED_KEY = 'vf_ref_banner_dismissed'

function getRefFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('ref') || params.get('source') || params.get('affiliate')
}

export function ReferralBanner() {
  const pathname = usePathname()
  const [refCode, setRefCode] = useState<string | null>(null)
  const [referrerName, setReferrerName] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    const urlRef = getRefFromUrl()

    if (urlRef) {
      sessionStorage.setItem('vf_ref_active', urlRef)
    }

    const activeRef = urlRef || sessionStorage.getItem('vf_ref_active')

    if (!activeRef) return

    setRefCode(activeRef)

    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY)
    if (wasDismissed) {
      setDismissed(true)
    }

    if (urlRef && !tracked) {
      setTracked(true)
      fetch('/api/referral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: urlRef }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.referrerName) setReferrerName(data.referrerName)
        })
        .catch(() => {})
    }
  }, [pathname, tracked])

  const bannerRef = useRef<HTMLDivElement>(null)

  const syncPadding = useCallback(() => {
    if (refCode && !dismissed && bannerRef.current) {
      document.body.style.paddingTop = `${bannerRef.current.offsetHeight}px`
    } else {
      document.body.style.paddingTop = ''
    }
  }, [refCode, dismissed])

  useEffect(() => {
    syncPadding()
    window.addEventListener('resize', syncPadding)
    return () => {
      window.removeEventListener('resize', syncPadding)
      document.body.style.paddingTop = ''
    }
  }, [syncPadding])

  const isCheckoutPage = pathname?.startsWith('/checkout')

  useEffect(() => {
    if (pathname === '/checkout/success') {
      sessionStorage.removeItem('vf_ref_active')
      sessionStorage.setItem(DISMISSED_KEY, '1')
      setDismissed(true)
    }
  }, [pathname])

  if (!refCode || dismissed || isCheckoutPage) return null

  const isOfferPage = pathname?.startsWith('/offer/launch')

  const nameDisplay = referrerName
    ? `${referrerName.charAt(0).toUpperCase()}${referrerName.slice(1)}`
    : ''

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r from-[#39FF14] to-[#00FFFF] px-10 sm:px-4 py-2 shadow-lg flex items-center justify-center"
      style={{ minHeight: BANNER_MIN_HEIGHT }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5 text-black" />
      </button>

      <a
        href={isOfferPage ? '#pricing' : `/offer/launch?ref=${refCode}`}
        onClick={handleDismiss}
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-black text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity text-center sm:text-left justify-center"
      >
        <Gift className="w-4 h-4 flex-shrink-0" />
        <span className="leading-snug">
          {nameDisplay ? `${nameDisplay} unlocked` : 'A friend unlocked'} <strong>$498 off</strong> for you &mdash; start the Activation Intensive for just <strong>$1</strong>.{!isOfferPage && ' \u2192'}
        </span>
      </a>
    </div>
  )
}
