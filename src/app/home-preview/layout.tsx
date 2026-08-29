import type { Metadata } from 'next'
import { Indie_Flower } from 'next/font/google'
import './preview.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Homepage Preview v14',
  description: 'Draft front door. Not indexed.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={display.variable}>{children}</div>
}
