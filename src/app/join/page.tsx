import type { Metadata } from 'next'
import { HomeFrontDoor } from '@/components/marketing/home/HomeFrontDoor'
import { MEMBERSHIP_PRODUCT_NAME } from '@/lib/marketing/public-offer'

export const metadata: Metadata = {
  title: `Join ${MEMBERSHIP_PRODUCT_NAME} | Vibration Fit`,
  description:
    'Start Vision Pro for $99 every 28 days. The complete Vibration Fit system — cancel anytime.',
}

export default function JoinPage() {
  return <HomeFrontDoor paidOnly />
}
