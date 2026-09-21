import type { Metadata } from 'next'
import { HomeFrontDoor } from '@/components/marketing/home/HomeFrontDoor'

export const metadata: Metadata = {
  title: {
    absolute: 'Vibration Fit | Thoughts Become Things. So Why Isn\'t It Working?',
  },
  description:
    'Start Vision Pro for $99 every 28 days, or try a Free Activation first. Cancel anytime.',
}

export default function HomePage() {
  return <HomeFrontDoor />
}
