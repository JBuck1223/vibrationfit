'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, LayoutGrid, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSection, isSectionRoot, sectionForPath } from '@/lib/app-shell/sections'
import { useShellProfile } from './useShellProfile'

/**
 * The one header every screen shares. Section icon and title on the left (a
 * back chevron inside a sub-page), search, Tools and the avatar on the right.
 * Collapses to a slim glass bar once the page scrolls.
 */
export function ShellHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const section = sectionForPath(pathname)
  const atRoot = isSectionRoot(pathname)
  const [scrolled, setScrolled] = React.useState(false)
  const profile = useShellProfile()
  const tools = getSection('tools')
  const account = getSection('account')
  const Icon = section.icon

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-shell-header
      className={cn(
        'sticky top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-200',
        scrolled ? 'glass-chrome border-x-0 border-t-0 rounded-none' : 'border-b border-transparent',
      )}
      style={{ paddingTop: 'var(--native-inset-top, 0px)' }}
    >
      <div
        className="mx-auto flex w-full max-w-[1200px] items-center gap-2 px-4 md:px-6 lg:px-8"
        style={{ height: 'var(--shell-header-height)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2" data-section={section.accent === 'viva' ? 'viva' : undefined}>
          {atRoot ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--section-accent-soft)] text-[var(--section-accent)]">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="truncate text-[17px] font-semibold text-white">{section.label}</h1>
        </div>

        <Link
          href="/tools?focus=search"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href={tools.href}
          aria-label="Tools"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <Link href={account.href} aria-label="Account" className="ml-1 flex h-9 w-9 items-center justify-center">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#39FF14]/70"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-2 ring-[#39FF14]/50">
              {profile.initial}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
