/**
 * Server-side utility to auto-discover all admin page routes from the filesystem.
 * 
 * Scans src/app/admin/ for page.tsx files and converts them to route paths.
 * Used by the admin dashboard to ensure ALL admin pages are always visible,
 * even if they haven't been added to adminNavigation yet.
 * 
 * This file uses Node.js fs — only import in Server Components or API routes.
 */

import fs from 'fs'
import path from 'path'

export interface DiscoveredRoute {
  route: string
  isDynamic: boolean
}

function scanPages(dir: string, routePath: string): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return routes
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const segmentName = entry.name
      const childRoutePath = `${routePath}/${segmentName}`
      routes.push(...scanPages(path.join(dir, segmentName), childRoutePath))
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      const isDynamic = /\[.+\]/.test(routePath)
      routes.push({ route: routePath, isDynamic })
    }
  }

  return routes
}

/**
 * Discovers all admin page routes by scanning the filesystem.
 * Returns both static and dynamic routes, sorted alphabetically.
 */
export function discoverAdminRoutes(): DiscoveredRoute[] {
  const adminDir = path.join(process.cwd(), 'src', 'app', 'admin')
  return scanPages(adminDir, '/admin').sort((a, b) => a.route.localeCompare(b.route))
}

/**
 * Collects every href from an adminNavigation tree (including children).
 */
export function collectNavigationHrefs(
  items: Array<{ href: string; children?: Array<{ href: string }> }>
): Set<string> {
  const hrefs = new Set<string>()
  for (const item of items) {
    hrefs.add(item.href)
    if (item.children) {
      for (const child of item.children) {
        hrefs.add(child.href)
      }
    }
  }
  return hrefs
}

/**
 * Converts a route path into a human-readable label.
 * e.g. "/admin/emails/test" → "Email Test"
 */
export function routeToLabel(route: string): string {
  const segments = route
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean)
    .filter(s => !s.startsWith('['))

  if (segments.length === 0) return 'Admin Dashboard'

  return segments
    .map(s =>
      s
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' / ')
}
