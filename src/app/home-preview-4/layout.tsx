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
  title: 'Homepage Preview 4',
  description: 'Layout experiment of the merged draft front door. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreview4Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={display.variable}>{children}</div>
}
