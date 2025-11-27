// /src/hooks/useUTMTracking.ts
// Hook to capture UTM parameters and tracking data
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export interface UTMData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  landing_page?: string
}

export function useUTMTracking(): UTMData {
  const searchParams = useSearchParams()
  const [utmData, setUtmData] = useState<UTMData>({})

  useEffect(() => {
    // Capture UTM parameters from URL
    const data: UTMData = {
      utm_source: searchParams?.get('utm_source') || undefined,
      utm_medium: searchParams?.get('utm_medium') || undefined,
      utm_campaign: searchParams?.get('utm_campaign') || undefined,
      utm_content: searchParams?.get('utm_content') || undefined,
      utm_term: searchParams?.get('utm_term') || undefined,
      referrer: document.referrer || undefined,
      landing_page: window.location.href,
    }

    setUtmData(data)

    // Store in sessionStorage for later use
    sessionStorage.setItem('utm_data', JSON.stringify(data))
  }, [searchParams])

  return utmData
}

export function getStoredUTMData(): UTMData {
  if (typeof window === 'undefined') return {}

  try {
    const stored = sessionStorage.getItem('utm_data')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

