import { ACTIVATION_OFFER_VIDEO } from '@/lib/activation/offer-video'

/** How it works — orientation, before Start My Activation. */
export const ACTIVATION_ORIENTATION_VIDEO = {
  src: 'https://media.vibrationfit.com/site-assets/free-activation/free-activation-1-1080p.mp4',
  poster:
    'https://media.vibrationfit.com/site-assets/free-activation/free-activation-1-thumb.0000000.jpg',
} as const

/** Bottom offer video — same asset as the home page hero. */
export const ACTIVATION_IMMERSION_OFFER_VIDEO = ACTIVATION_OFFER_VIDEO
