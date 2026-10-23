import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Retired system page, kept for reference. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OriginalSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
