'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

function isInternalNavigationLink(anchor: HTMLAnchorElement, pathname: string): boolean {
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || anchor.target === '_blank') return false
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return false
  if (href === pathname) return false
  return true
}

export function NavigationProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(false)
  }, [pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor || !isInternalNavigationLink(anchor, pathname)) return
      setActive(true)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  if (!active) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[99999] h-0.5 overflow-hidden bg-neutral-900/50"
      aria-hidden="true"
    >
      <div className="navigation-progress-bar h-full w-1/3 bg-[#39FF14]" />
    </div>
  )
}
