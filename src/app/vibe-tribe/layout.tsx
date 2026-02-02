import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vibe Tribe | VibrationFit',
  description: 'Connect with the VibrationFit community. Share wins, support each other through wobbles, declare visions, and collaborate on practices.',
}

export default function VibeTribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
