'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'
import { adminNavigation } from '@/lib/navigation/menu-definitions'
import { useAdminStudio } from './AdminStudioContext'

function isAdminHref(href: string) {
  return href === '/admin' || href.startsWith('/admin/')
}

function pathMatches(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
  return pathname === href || pathname.startsWith(href + '/')
}

function titleFromPath(pathname: string) {
  const last = pathname.split('/').filter(Boolean).pop() ?? 'Admin'
  return last.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function pageMeta(pathname: string): { name: string; icon: LucideIcon } {
  if (pathname === '/admin' || pathname === '/admin/') {
    return { name: 'Admin', icon: LayoutDashboard }
  }

  let best: { name: string; icon: LucideIcon; len: number } | undefined
  for (const item of adminNavigation) {
    const candidates = [
      { name: item.name, href: item.href, icon: item.icon },
      ...(item.children ?? []).map(child => ({
        name: child.name,
        href: child.href,
        icon: child.icon,
      })),
    ]
    for (const candidate of candidates) {
      if (!isAdminHref(candidate.href)) continue
      if (!pathMatches(pathname, candidate.href)) continue
      if (!best || candidate.href.length > best.len) {
        best = { name: candidate.name, icon: candidate.icon, len: candidate.href.length }
      }
    }
  }

  return best
    ? { name: best.name, icon: best.icon }
    : { name: titleFromPath(pathname), icon: LayoutDashboard }
}

export function AdminAreaBar() {
  const pathname = usePathname()
  const { chrome } = useAdminStudio()

  if (pathname.startsWith('/admin/inbox')) return null

  const meta = pageMeta(pathname)
  const title = chrome?.title ?? meta.name
  const icon = chrome?.icon ?? meta.icon
  const tabs = chrome?.tabs ?? []

  return (
    <AreaBar
      area={{ name: title, icon }}
      areaHeadline={title}
      tabs={tabs}
      variant="default"
      appLikePrimaryTabs={tabs.length > 0}
    />
  )
}
