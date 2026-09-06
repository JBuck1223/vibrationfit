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
  title: 'Homepage Preview — September 6, 2026',
  description: 'Archived live homepage from before the Activation front door. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreview9626Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={display.variable}>{children}</div>
}
