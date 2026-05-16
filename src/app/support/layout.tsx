import type { Metadata } from 'next'
import { SupportLayoutClient } from '@/components/support/SupportLayoutClient'

export const metadata: Metadata = {
  title: 'Support',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <SupportLayoutClient>{children}</SupportLayoutClient>
}

