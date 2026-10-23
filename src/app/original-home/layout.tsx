import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Retired homepage, kept for reference. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OriginalHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
