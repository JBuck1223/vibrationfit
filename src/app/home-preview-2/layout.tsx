import type { Metadata } from 'next'
import { Indie_Flower } from 'next/font/google'
import '../home-preview/preview.css'
import './preview.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Homepage Preview 2 — Lucide',
  description: 'Draft front door with Lucide flows. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreview2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={display.variable}>{children}</div>
}
