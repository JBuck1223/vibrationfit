/**
 * App shell section catalog.
 *
 * One list drives the pill nav (phones, tablets, native apps), the desktop
 * rail, the header title and active-state matching. Nothing else should hold
 * a copy of these labels or hrefs.
 */

import {
  Home,
  Sparkles,
  Headphones,
  PenLine,
  UsersRound,
  LayoutGrid,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SectionId = 'home' | 'viva' | 'listen' | 'capture' | 'tribe' | 'tools' | 'account'

/** Which brand color the section paints with. Only VIVA is purple. */
export type SectionAccent = 'brand' | 'viva'

export interface SectionTab {
  label: string
  href: string
}

export interface Section {
  id: SectionId
  label: string
  icon: LucideIcon
  accent: SectionAccent
  /** The section root. Phase 1 adds the pages; today several still redirect. */
  href: string
  /** Every path prefix that counts as "inside" this section for active state. */
  matchPrefixes: string[]
  /** Sub-tabs the section's AreaBar shows. */
  tabs: SectionTab[]
  /** True for the five that sit in the pill. Tools and Account live in the header. */
  inPill: boolean
}

export const SECTIONS: Section[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    accent: 'brand',
    href: '/home',
    matchPrefixes: ['/home', '/dashboard', '/map', '/your-world', '/activity', '/tracking'],
    tabs: [],
    inPill: true,
  },
  {
    id: 'viva',
    label: 'VIVA',
    icon: Sparkles,
    accent: 'viva',
    href: '/viva',
    matchPrefixes: ['/viva'],
    tabs: [],
    inPill: true,
  },
  {
    id: 'listen',
    label: 'Listen',
    icon: Headphones,
    accent: 'brand',
    href: '/listen',
    matchPrefixes: ['/listen', '/audio', '/meditations', '/story', '/life-vision', '/music'],
    tabs: [
      { label: 'Life Vision', href: '/listen' },
      { label: 'Stories', href: '/listen/stories' },
      { label: 'Meditations', href: '/listen/meditations' },
      { label: 'Songs', href: '/listen/songs' },
      { label: 'Incantations', href: '/listen/incantations' },
      { label: 'Queries', href: '/listen/queries' },
      { label: 'Playlists', href: '/listen/playlists' },
    ],
    inPill: true,
  },
  {
    id: 'capture',
    label: 'Capture',
    icon: PenLine,
    accent: 'brand',
    href: '/capture',
    matchPrefixes: ['/capture', '/daily-paper', '/journal', '/abundance-tracker'],
    tabs: [
      { label: 'Daily Paper', href: '/daily-paper' },
      { label: 'Journal', href: '/journal' },
      { label: 'Abundance', href: '/abundance-tracker' },
    ],
    inPill: true,
  },
  {
    id: 'tribe',
    label: 'Tribe',
    icon: UsersRound,
    accent: 'brand',
    href: '/tribe',
    matchPrefixes: ['/tribe', '/vibe-tribe', '/alignment-gym', '/referral', '/sessions', '/session'],
    tabs: [
      { label: 'Vibe Tribe', href: '/vibe-tribe' },
      { label: 'Alignment Gym', href: '/alignment-gym' },
      { label: 'Referrals', href: '/referral' },
    ],
    inPill: true,
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: LayoutGrid,
    accent: 'brand',
    href: '/tools',
    matchPrefixes: ['/tools', '/manifestations', '/vision', '/scenes'],
    tabs: [],
    inPill: false,
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserRound,
    accent: 'brand',
    href: '/account',
    matchPrefixes: ['/account', '/billing', '/tokens', '/storage', '/household', '/profile', '/assessment', '/voice-profile', '/support'],
    tabs: [
      { label: 'Billing', href: '/account/billing' },
      { label: 'Settings', href: '/account/settings' },
      { label: 'Appearance', href: '/account/appearance' },
      { label: 'Household', href: '/account/household' },
    ],
    inPill: false,
  },
]

export const PILL_SECTIONS = SECTIONS.filter((s) => s.inPill)

export function getSection(id: SectionId): Section {
  const found = SECTIONS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown section: ${id}`)
  return found
}

/**
 * The section a pathname belongs to. Longest matching prefix wins so
 * `/account/billing` is Account even though `/billing` is also listed there.
 * Unknown member paths fall back to Home.
 */
export function sectionForPath(pathname: string | null | undefined): Section {
  const path = (pathname ?? '/').split('?')[0]
  let best: { section: Section; length: number } | null = null
  for (const section of SECTIONS) {
    for (const prefix of section.matchPrefixes) {
      const hit = path === prefix || path.startsWith(`${prefix}/`)
      if (hit && (!best || prefix.length > best.length)) {
        best = { section, length: prefix.length }
      }
    }
  }
  return best?.section ?? getSection('home')
}

/** True when the path is the section's root rather than a page inside it. */
export function isSectionRoot(pathname: string | null | undefined): boolean {
  const path = (pathname ?? '/').split('?')[0]
  return SECTIONS.some((s) => s.href === path)
}
