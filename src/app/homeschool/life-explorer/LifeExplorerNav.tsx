'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Map, User, Sparkles, BookOpen, CalendarDays, Library, ListChecks } from 'lucide-react'

const BASE = '/homeschool/life-explorer'

// Four surfaces. Calendar is first-class — it's how days get tracked.
const SURFACES = [
  { key: 'today', href: BASE, label: 'Today', icon: Compass },
  { key: 'calendar', href: `${BASE}/calendar`, label: 'Calendar', icon: CalendarDays },
  { key: 'map', href: `${BASE}/map`, label: 'Map', icon: Map },
  { key: 'profile', href: `${BASE}/profile`, label: 'Profile', icon: User },
] as const

// Panels that belong to the Today / Expedition surface.
const EXPEDITION_PANELS = [
  { href: BASE, label: 'Expedition', icon: Compass },
  { href: `${BASE}/wonder`, label: 'Wonder Wall', icon: Sparkles },
  { href: `${BASE}/lessons`, label: 'Lesson Log', icon: ListChecks },
  { href: `${BASE}/books`, label: 'Storybooks', icon: Library },
  { href: `${BASE}/resources`, label: 'Resources', icon: BookOpen },
] as const

type Surface = 'today' | 'calendar' | 'map' | 'profile'

function activeSurface(pathname: string): Surface {
  if (pathname.startsWith(`${BASE}/calendar`)) return 'calendar'
  if (pathname.startsWith(`${BASE}/map`) || pathname.startsWith(`${BASE}/overview`)) return 'map'
  if (
    pathname.startsWith(`${BASE}/profile`) ||
    pathname.startsWith(`${BASE}/portfolio`) ||
    pathname.startsWith(`${BASE}/progress`)
  )
    return 'profile'
  return 'today'
}

export function LifeExplorerNav({
  expeditionTitle,
  lifeCategory,
  studentName,
}: {
  expeditionTitle?: string | null
  lifeCategory?: string | null
  studentName?: string | null
}) {
  const pathname = usePathname() || BASE
  const surface = activeSurface(pathname)

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
                  <span className="hidden sm:inline truncate text-sm text-[#00FFFF] capitalize">
                    {lifeCategory ? `${lifeCategory} · ` : ''}
                    {expeditionTitle}
                  </span>
                )}
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#141414] p-1">
              {SURFACES.map((s) => {
                const Icon = s.icon
                const active = surface === s.key
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

        {surface === 'today' && (
          <div className="border-t border-[#1c1c1c]">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <nav className="flex gap-1 overflow-x-auto py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {EXPEDITION_PANELS.map((p) => {
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
        )}
      </div>

      {/* Mobile: fixed bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#222] bg-[#0f0f0f]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {SURFACES.map((s) => {
            const Icon = s.icon
            const active = surface === s.key
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
