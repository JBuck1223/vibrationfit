import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to Vibe Tribe | Vibration Fit',
  description: 'Get started with Vibe Tribe. Learn how to post, use tags, and connect with the community.',
}

export default function VibeTribeNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
