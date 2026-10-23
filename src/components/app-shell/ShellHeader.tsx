'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, LayoutGrid, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { areaForPath, getSection, isSectionRoot, sectionForPath } from '@/lib/app-shell/sections'
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
  // Inside a studio (Journal, Daily Paper...) the bar names that studio with
  // its icon; the studio's own header handles going back from deeper pages.
  const area = atRoot ? null : areaForPath(section, pathname)
  const Icon = area?.icon ?? section.icon
  const showIcon = atRoot || !!area

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
        // Vibe Tribe's top bar scrolls away with the feed; everywhere else it sticks.
        (pathname ?? '').startsWith('/vibe-tribe') ? 'relative z-30' : 'sticky top-0 z-30 lg:top-3',
        'transition-[background-color,border-color,backdrop-filter] duration-200',
        // Desktop: lines up with the floating sidebar (same top inset) and
        // floats as a rounded panel like it; phones keep a full-width bar.
        'lg:mx-3 lg:mt-3 lg:rounded-[22px]',
        // Same violet frosted glass as the cards and bottom bar.
        scrolled
          ? 'vf-glass border-b border-white/[0.10] bg-[linear-gradient(180deg,rgba(44,36,60,0.62)_0%,rgba(26,21,37,0.70)_100%)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 lg:border'
          : 'border-b border-transparent lg:border',
      )}
      style={{ paddingTop: 'var(--native-inset-top, 0px)' }}
    >
      <div
        className="flex w-full items-center gap-2 px-4 md:px-6 lg:px-5"
        style={{ height: 'var(--shell-header-height)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2" data-section={section.accent === 'viva' ? 'viva' : undefined}>
          {showIcon ? (
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
          <h1 className="truncate text-[17px] font-semibold text-white">{area?.label ?? section.label}</h1>
        </div>

        {/* Studios drop their Walkthrough button in here (ShellWalkthroughButton). */}
        <div id="shell-header-actions" className="flex items-center" />

        <Link
          href="/tools?focus=search"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href={tools.href}
          aria-label="Tool Box"
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
