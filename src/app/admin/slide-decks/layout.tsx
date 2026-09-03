import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Slide Decks',
}

export default function SlideDecksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
