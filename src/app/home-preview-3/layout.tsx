import type { Metadata } from 'next'
import { Indie_Flower } from 'next/font/google'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Homepage Preview 3 — Merged',
  description: 'Merged draft front door: sales power + soul. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreview3Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={display.variable}>{children}</div>
}
