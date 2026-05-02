// /src/app/admin/page.tsx
// Admin Dashboard - Auto-discovers ALL admin pages from filesystem
// Server Component — scans the file tree and passes data to the client island

import { adminNavigation } from '@/lib/navigation'
import {
  discoverAdminRoutes,
  collectNavigationHrefs,
  routeToLabel,
} from '@/lib/navigation/discover-admin-routes'

/** Compose/detail URLs under a tool already linked in nav — keep dashboard grid tidy */
function isDetailRouteUnderKnownParent(route: string, knownHrefs: Set<string>): boolean {
  if (knownHrefs.has(route)) return true
  if (route.endsWith('/new')) {
    const parent = route.replace(/\/new$/, '')
    if (knownHrefs.has(parent)) return true
  }
  if (route.startsWith('/admin/texts/') && knownHrefs.has('/admin/texts')) return true
  return false
}
import AdminDashboardClient, { type DashboardSection, type DashboardCard } from './AdminDashboardClient'

export default function AdminDashboardPage() {
  const discovered = discoverAdminRoutes()
  const knownHrefs = collectNavigationHrefs(adminNavigation)

  // Build curated sections from adminNavigation
  const curatedSections: DashboardSection[] = []
  const topLevelCards: DashboardCard[] = []

  for (const item of adminNavigation) {
    if (item.href === '/admin') continue

    if (item.hasDropdown && item.children?.length) {
      curatedSections.push({
        title: item.name,
        cards: item.children.map(child => ({
          name: child.name,
          description: child.description || '',
          href: child.href,
          iconName: child.icon.displayName || 'FileText',
        })),
      })
    } else {
      topLevelCards.push({
        name: item.name,
        description: item.description || '',
        href: item.href,
        iconName: item.icon.displayName || 'FileText',
      })
    }
  }

  // Find uncategorized static routes (exist on disk but not in adminNavigation)
  const uncategorized = discovered
    .filter(
      r =>
        !r.isDynamic &&
        r.route !== '/admin' &&
        !isDetailRouteUnderKnownParent(r.route, knownHrefs)
    )
    .map(r => ({
      name: routeToLabel(r.route),
      description: r.route,
      href: r.route,
      iconName: 'FileText' as const,
    }))

  return (
    <AdminDashboardClient
      topLevelCards={topLevelCards}
      curatedSections={curatedSections}
      uncategorizedCards={uncategorized}
    />
  )
}
