'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Gift, ArrowRight, X } from 'lucide-react'

const BANNER_HEIGHT = '48px'
const DISMISSED_KEY = 'vf_ref_banner_dismissed'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

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
    const cookieRef = getCookie('vf_ref')
    const code = urlRef || cookieRef

    if (!code) return

    setRefCode(code)

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

  useEffect(() => {
    if (refCode && !dismissed) {
      document.body.style.paddingTop = BANNER_HEIGHT
    } else {
      document.body.style.paddingTop = ''
    }
    return () => { document.body.style.paddingTop = '' }
  }, [refCode, dismissed])

  if (!refCode || dismissed) return null

  const isOfferPage = pathname?.startsWith('/offer/launch')

  const nameDisplay = referrerName
    ? ` ${referrerName.charAt(0).toUpperCase()}${referrerName.slice(1)}`
    : ''

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r from-[#39FF14] to-[#00FFFF] px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-3 shadow-lg overflow-hidden"
      style={{ height: BANNER_HEIGHT }}
    >
      <a
        href={isOfferPage ? '#pricing' : `/offer/launch?ref=${refCode}`}
        className="flex items-center gap-1.5 sm:gap-2 text-black text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity min-w-0 flex-1 justify-center"
      >
        <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="truncate">
          <span className="hidden sm:inline">Your friend{nameDisplay} unlocked the </span>
          <strong>$1 Activation Intensive</strong>
          <span className="hidden sm:inline"> for you</span>
        </span>
        {!isOfferPage && <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
      </a>
      <button
        onClick={handleDismiss}
        className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 bg-black/10 hover:bg-black/20 rounded-full transition-colors flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5 text-black" />
      </button>
    </div>
  )
}
