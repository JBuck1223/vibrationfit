import type { Metadata } from 'next'
import { HomeFrontDoor } from '@/components/marketing/home/HomeFrontDoor'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export const metadata: Metadata = {
  title: ACTIVATION_COPY.landing.metaTitle,
  description: ACTIVATION_COPY.landing.metaDescription,
}

export default function FreeActivationPage() {
  return <HomeFrontDoor freeOnly />
}
