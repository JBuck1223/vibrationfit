import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home – preview - original',
  description: 'Retired live homepage, kept for reference. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreviewOriginalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
