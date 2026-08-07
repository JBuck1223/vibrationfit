import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/lib/design-system/components'

export const metadata: Metadata = {
  title: 'Life Explorer | Vibration Fit Homeschool',
  description: 'Curiosity-driven daily lessons for Vibration Fit Homeschool.',
}

const NAV = [
  { href: '/homeschool/life-explorer', label: 'Today' },
  { href: '/homeschool/life-explorer/resources', label: 'Resources' },
  { href: '/homeschool/life-explorer/wonder', label: 'Wonder Wall' },
  { href: '/homeschool/life-explorer/portfolio', label: 'Portfolio' },
  { href: '/homeschool/life-explorer/progress', label: 'Progress' },
]

export default function LifeExplorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#222] bg-[#0f0f0f]/90 backdrop-blur sticky top-0 z-20">
        <Container size="lg" className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#39FF14]/80">Vibration Fit Homeschool</p>
              <h1 className="text-lg font-semibold text-white">Life Explorer</h1>
            </div>
            <nav className="flex flex-wrap gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[#333] px-3 py-1.5 text-sm text-neutral-300 hover:border-[#39FF14]/40 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </Container>
      </div>
      {children}
    </div>
  )
}
