import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Voice Audition Studio',
}

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
