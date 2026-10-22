/**
 * App shell section catalog.
 *
 * One list drives the pill nav (phones, tablets, native apps), the desktop
 * rail, the header title and active-state matching. Nothing else should hold
 * a copy of these labels or hrefs.
 */

import {
  Activity,
  Award,
  BookOpen,
  CreditCard,
  DollarSign,
  FileText,
  Flame,
  Globe,
  Headphones,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Library,
  ListMusic,
  Map as MapIcon,
  Mic,
  Music2,
  Palette,
  PenLine,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Target,
  UserRound,
  Users,
  UsersRound,
  Video,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SectionId = 'home' | 'viva' | 'listen' | 'capture' | 'tribe' | 'tools' | 'account'

/** Which brand color the section paints with. Only VIVA is purple. */
export type SectionAccent = 'brand' | 'viva'

export interface SectionTab {
  label: string
  href: string
}

/** A studio or page members know by name. Shown in the sidebar and on the section root. */
export interface SectionArea {
  label: string
  href: string
  icon: LucideIcon
  /** Extra prefixes that count as being inside this area. */
  matchPrefixes?: string[]
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
  /** The areas (studios) that live under this section, in sidebar order. */
  areas: SectionArea[]
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
    areas: [
      { label: 'MAP', href: '/map', icon: MapIcon },
      { label: 'My World', href: '/your-world', icon: Globe },
      { label: 'Activity', href: '/activity', icon: Activity },
      { label: 'Streaks', href: '/tracking/streaks', icon: Flame },
      { label: 'Badges', href: '/tracking/badges', icon: Award },
    ],
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
    areas: [],
    inPill: true,
  },
  {
    id: 'listen',
    label: 'Listen',
    icon: Headphones,
    accent: 'brand',
    href: '/audio',
    matchPrefixes: ['/listen', '/audio', '/meditations', '/music'],
    tabs: [
      { label: 'Life Vision', href: '/audio' },
      { label: 'Stories', href: '/audio/stories' },
      { label: 'Meditations', href: '/meditations' },
      { label: 'Music', href: '/audio/music' },
      { label: 'Playlists', href: '/audio/playlists' },
      { label: 'My Songs', href: '/audio/songs' },
    ],
    areas: [
      { label: 'Life Vision', href: '/audio', icon: Target },
      { label: 'Meditations', href: '/meditations', icon: Wind },
      { label: 'Stories', href: '/audio/stories', icon: Library },
      { label: 'Songs', href: '/audio/songs', icon: Music2 },
      { label: 'Playlists', href: '/audio/playlists', icon: ListMusic },
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
    areas: [
      { label: 'Daily Paper', href: '/daily-paper', icon: FileText },
      { label: 'Journal', href: '/journal', icon: BookOpen },
      { label: 'Abundance', href: '/abundance-tracker', icon: DollarSign },
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
    areas: [
      { label: 'Vibe Tribe', href: '/vibe-tribe', icon: UsersRound },
      { label: 'Alignment Gym', href: '/alignment-gym', icon: Video, matchPrefixes: ['/sessions', '/session'] },
      { label: 'Referrals', href: '/referral', icon: Share2 },
    ],
    inPill: true,
  },
  {
    id: 'tools',
    label: 'Tool Box',
    icon: LayoutGrid,
    accent: 'brand',
    href: '/tools',
    matchPrefixes: ['/tools', '/manifestations', '/vision', '/scenes', '/life-vision', '/story'],
    tabs: [],
    areas: [
      { label: 'Manifestations', href: '/manifestations', icon: ImageIcon },
      { label: 'Life Vision', href: '/life-vision', icon: Target },
      { label: 'Stories', href: '/story', icon: Library },
      { label: 'Incantations', href: '/story?kind=incantation', icon: Mic },
      { label: 'Songwriter', href: '/audio/songwriter', icon: Music2 },
      { label: 'Audio Studio', href: '/audio/create', icon: Headphones, matchPrefixes: ['/audio/create', '/audio/generate', '/audio/record', '/audio/mix'] },
    ],
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
    areas: [
      { label: 'Settings', href: '/account/settings', icon: Settings },
      { label: 'Appearance', href: '/account/appearance', icon: Palette },
      { label: 'Household', href: '/account/household', icon: Users },
      { label: 'Billing', href: '/account/billing', icon: CreditCard },
      { label: 'Privacy', href: '/account/privacy', icon: Shield },
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

const AUDIO_CREATE_ROOTS = ['/audio/create', '/audio/generate', '/audio/record', '/audio/mix', '/audio/songwriter', '/audio/queue']

/** True when the path is the section's root rather than a page inside it. */
export function isSectionRoot(pathname: string | null | undefined): boolean {
  const path = (pathname ?? '/').split('?')[0]
  // Listen's tabs and the Create side's top pages are all one Audio page
  // (switched by the Listen | Create toggle), so each is a root too.
  if (AUDIO_CREATE_ROOTS.includes(path)) return true
  return SECTIONS.some((s) => s.href === path || (s.id === 'listen' && s.tabs.some((t) => t.href === path)))
}

/** Longest-prefix match over the section's areas, so the sidebar can highlight the one you are in. */
export function areaForPath(section: Section, pathname: string | null | undefined): SectionArea | null {
  const path = (pathname ?? '/').split('?')[0]
  let best: { area: SectionArea; length: number } | null = null
  for (const area of section.areas) {
    const prefixes = [area.href.split('?')[0], ...(area.matchPrefixes ?? [])]
    for (const prefix of prefixes) {
      const hit = path === prefix || path.startsWith(`${prefix}/`)
      if (hit && (!best || prefix.length > best.length)) best = { area, length: prefix.length }
    }
  }
  return best?.area ?? null
}
