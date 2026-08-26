'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  Map,
  User,
  Sparkles,
  BookOpen,
  CalendarDays,
  CalendarCheck2,
  Library,
  ListChecks,
  Heart,
  TrendingUp,
  Images,
  Shuffle,
  NotebookPen,
  Info,
  Mountain,
} from 'lucide-react'

const BASE = '/homeschool/life-explorer'

type SurfaceKey = 'today' | 'week' | 'map' | 'progress' | 'profile'

interface Panel {
  href: string
  label: string
  icon: typeof Compass
}

interface Surface {
  key: SurfaceKey
  href: string
  label: string
  icon: typeof Compass
  /** Path prefixes (after BASE) that belong to this surface. */
  paths: string[]
  panels: Panel[]
}

// Five surfaces, one per time horizon of the parent's job:
// run the day → shape the week → see the year → prove the growth → know the child.
const SURFACES: Surface[] = [
  {
    key: 'today',
    href: BASE,
    label: 'Today',
    icon: Compass,
    paths: ['/lesson/', '/record', '/wonder', '/books'],
    panels: [
      { href: BASE, label: 'Expedition', icon: Compass },
      { href: `${BASE}/record`, label: 'Record', icon: NotebookPen },
      { href: `${BASE}/wonder`, label: 'Wonder Wall', icon: Sparkles },
      { href: `${BASE}/books`, label: 'Storybooks', icon: Library },
    ],
  },
  {
    key: 'week',
    href: `${BASE}/week`,
    label: 'Week',
    icon: CalendarDays,
    paths: ['/week', '/calendar', '/change', '/resources'],
    panels: [
      { href: `${BASE}/week`, label: 'Coming Week', icon: CalendarDays },
      { href: `${BASE}/calendar`, label: 'Calendar', icon: CalendarCheck2 },
      { href: `${BASE}/change`, label: 'New Direction', icon: Shuffle },
      { href: `${BASE}/resources`, label: 'Resources', icon: BookOpen },
    ],
  },
  {
    key: 'map',
    href: `${BASE}/map`,
    label: 'Map',
    icon: Map,
    paths: ['/map', '/overview'],
    panels: [
      { href: `${BASE}/map`, label: 'Learning Map', icon: Map },
      { href: `${BASE}/overview`, label: 'How It Works', icon: Info },
    ],
  },
  {
    key: 'progress',
    href: `${BASE}/expeditions`,
    label: 'Path',
    icon: Mountain,
    paths: ['/progress', '/portfolio', '/expeditions', '/lessons'],
    panels: [
      { href: `${BASE}/expeditions`, label: 'Expeditions', icon: Mountain },
      { href: `${BASE}/progress`, label: 'Progress', icon: TrendingUp },
      { href: `${BASE}/portfolio`, label: 'Portfolio', icon: Images },
      { href: `${BASE}/lessons`, label: 'Lesson Log', icon: ListChecks },
    ],
  },
  {
    key: 'profile',
    href: `${BASE}/profile`,
    label: 'Profile',
    icon: User,
    paths: ['/profile', '/vision'],
    panels: [
      { href: `${BASE}/profile`, label: 'Explorer', icon: User },
      { href: `${BASE}/vision`, label: 'Life I Choose', icon: Heart },
    ],
  },
]

function activeSurface(pathname: string): Surface {
  for (const surface of SURFACES) {
    if (surface.key === 'today') continue
    if (surface.paths.some((p) => pathname.startsWith(`${BASE}${p}`))) return surface
  }
  return SURFACES[0]
}

export function LifeExplorerNav({
  expeditionTitle,
  studentName,
}: {
  expeditionTitle?: string | null
  lifeCategory?: string | null
  studentName?: string | null
}) {
  const pathname = usePathname() || BASE
  const isBookReader = pathname.startsWith(`${BASE}/books/`)
  const surface = activeSurface(pathname)

  // The storybook reader is its own full-screen chrome. Hide the section
  // nav so its top bar and mobile tab bar don't sit on the page.
  if (isBookReader) return null

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-[#222] bg-[#0f0f0f]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href={BASE} className="min-w-0 group">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#39FF14]/80">
                Vibration Fit Homeschool
              </p>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-base font-semibold text-white group-hover:text-[#39FF14] transition-colors">
                  Life Explorer
                </span>
                {expeditionTitle && (
                  <span className="hidden sm:inline truncate text-sm text-[#00FFFF]">
                    {expeditionTitle}
                  </span>
                )}
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#141414] p-1">
              {SURFACES.map((s) => {
                const Icon = s.icon
                const active = surface.key === s.key
                return (
                  <Link
                    key={s.key}
                    href={s.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#39FF14] text-black'
                        : 'text-neutral-300 hover:text-white hover:bg-[#1f1f1f]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </Link>
                )
              })}
            </nav>

            {studentName && (
              <p className="hidden lg:block text-xs text-neutral-500 shrink-0">
                Exploring with <span className="text-neutral-300">{studentName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Panel row for the active surface */}
        <div className="border-t border-[#1c1c1c]">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <nav className="flex gap-1 overflow-x-auto py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {surface.panels.map((p) => {
                const Icon = p.icon
                const active =
                  p.href === BASE
                    ? pathname === BASE || pathname.startsWith(`${BASE}/lesson/`)
                    : pathname.startsWith(p.href)
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? 'text-[#39FF14] bg-[#39FF14]/10'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#222] bg-[#0f0f0f]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {SURFACES.map((s) => {
            const Icon = s.icon
            const active = surface.key === s.key
            return (
              <Link
                key={s.key}
                href={s.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-[#39FF14]' : 'text-neutral-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {s.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
