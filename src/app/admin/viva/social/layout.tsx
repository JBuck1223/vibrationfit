import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Social VIVA',
}

export default function SocialVivaLayout({ children }: { children: ReactNode }) {
  return children
}
