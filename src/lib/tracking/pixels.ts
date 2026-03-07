'use client'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void
      identify: (params: Record<string, unknown>) => void
    }
  }
}

export type ConversionEvent =
  | 'lead'
  | 'initiate_checkout'
  | 'purchase'
  | 'add_to_cart'

export interface ConversionParams {
  value?: number
  currency?: string
  content_name?: string
  content_id?: string
  event_id?: string
  email?: string
  phone?: string
  [key: string]: unknown
}

const META_EVENT_MAP: Record<ConversionEvent, string> = {
  lead: 'Lead',
  initiate_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  add_to_cart: 'AddToCart',
}

const GA4_EVENT_MAP: Record<ConversionEvent, string> = {
  lead: 'generate_lead',
  initiate_checkout: 'begin_checkout',
  purchase: 'purchase',
  add_to_cart: 'add_to_cart',
}

const TIKTOK_EVENT_MAP: Record<ConversionEvent, string> = {
  lead: 'SubmitForm',
  initiate_checkout: 'InitiateCheckout',
  purchase: 'CompletePayment',
  add_to_cart: 'AddToCart',
}

function hasPixel(name: 'fbq' | 'gtag' | 'ttq'): boolean {
  return typeof window !== 'undefined' && typeof window[name] !== 'undefined'
}

/**
 * Fire a conversion event to all installed marketing pixels.
 * Safe to call even if pixels aren't loaded -- each call is guarded.
 */
export function trackConversion(event: ConversionEvent, params: ConversionParams = {}) {
  if (typeof window === 'undefined') return

  const { value, currency = 'USD', content_name, content_id, event_id, ...rest } = params

  // Meta Pixel
  if (hasPixel('fbq')) {
    const metaParams: Record<string, unknown> = {}
    if (value != null) metaParams.value = value
    if (currency) metaParams.currency = currency
    if (content_name) metaParams.content_name = content_name
    if (content_id) metaParams.content_ids = [content_id]
    if (event_id) metaParams.eventID = event_id
    window.fbq!('track', META_EVENT_MAP[event], metaParams)
  }

  // Google Analytics 4 + Google Ads
  if (hasPixel('gtag')) {
    const gtagParams: Record<string, unknown> = {}
    if (value != null) gtagParams.value = value
    if (currency) gtagParams.currency = currency
    if (content_name) gtagParams.item_name = content_name
    if (event_id) gtagParams.transaction_id = event_id

    window.gtag!('event', GA4_EVENT_MAP[event], gtagParams)

    // Also fire Google Ads conversion for purchases
    if (event === 'purchase') {
      const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
      const adsLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL
      if (adsId && adsLabel) {
        window.gtag!('event', 'conversion', {
          send_to: `${adsId}/${adsLabel}`,
          value: value ?? 0,
          currency,
          transaction_id: event_id,
        })
      }
    }
  }

  // TikTok Pixel
  if (hasPixel('ttq')) {
    const ttParams: Record<string, unknown> = {}
    if (value != null) ttParams.value = value
    if (currency) ttParams.currency = currency
    if (content_name) ttParams.content_name = content_name
    if (content_id) ttParams.content_id = content_id
    if (event_id) ttParams.event_id = event_id
    window.ttq!.track(TIKTOK_EVENT_MAP[event], ttParams)
  }
}

/**
 * Fire a video milestone event to all installed marketing pixels.
 * Called automatically by the Video component when trackingId is set.
 */
export function trackVideoMilestone(
  trackingId: string,
  milestone: 25 | 50 | 75 | 95,
  currentTimeSeconds: number
) {
  if (typeof window === 'undefined') return

  // Meta Pixel -- custom event
  if (hasPixel('fbq')) {
    window.fbq!('trackCustom', 'VideoMilestone', {
      video_id: trackingId,
      milestone_percent: milestone,
      watch_time_seconds: Math.round(currentTimeSeconds * 10) / 10,
    })
  }

  // GA4 -- uses the recognized video_progress event name
  if (hasPixel('gtag')) {
    window.gtag!('event', 'video_progress', {
      video_id: trackingId,
      percent: milestone,
      current_time: Math.round(currentTimeSeconds * 10) / 10,
    })
  }

  // TikTok -- ViewContent with video metadata
  if (hasPixel('ttq')) {
    window.ttq!.track('ViewContent', {
      content_id: trackingId,
      content_name: trackingId,
      value: milestone,
      description: `video_milestone_${milestone}`,
    })
  }
}
