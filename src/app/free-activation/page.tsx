import type { Metadata } from 'next'
import { FreeActivationOptIn } from '@/components/activation/FreeActivationOptIn'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export const metadata: Metadata = {
  title: ACTIVATION_COPY.optIn.metaTitle,
  description: ACTIVATION_COPY.optIn.metaDescription,
}

export default function FreeActivationPage() {
  return <FreeActivationOptIn />
}
