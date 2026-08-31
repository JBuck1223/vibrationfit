import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreview5Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
