/**
 * VibrationFit Navigation System
 * 
 * Centralized exports for page classifications and menu definitions.
 * This is the master system for navigation and routing.
 */

// Page Classifications
export {
  PAGE_CLASSIFICATIONS,
  STUDIO_ROUTE_PREFIXES,
  getPageType,
  isStudioRoute,
  requiresAuth,
  requiresAdmin,
  getPagesByType,
  getTotalPageCount,
  type PageType,
} from './page-classifications'

// Menu Definitions
export {
  userNavigation,
  userNavigationGroups,
  adminNavigation,
  mobileNavigation,
  headerAccountMenu,
  getFilteredNavigation,
  findNavItemByHref,
  isNavItemActive,
  type NavItem,
  type NavGroup,
} from './menu-definitions'

// Legacy page catalog (studio migration)
export {
  LEGACY_PAGES,
  LEGACY_STUDIOS,
  LEGACY_TIER_ORDER,
  LEGACY_PAGE_TIER_LABELS,
  LEGACY_PAGE_TIER_BADGE,
  buildLegacyHref,
  canPreviewLegacyPage,
  type LegacyPageEntry,
  type LegacyPageTier,
  type LegacySampleIds,
  type LegacySampleKey,
} from './legacy-pages'

export {
  LEGACY_ARCHIVE_PREFIX,
  MOVED_LEGACY_ROUTES,
  isMovedLegacyRoute,
  archiveHrefFromPublicTemplate,
  resolveLegacyPublicRedirect,
  applyLegacyArchiveToEntry,
} from './legacy-archive'

export { createLegacyPublicRedirect } from './legacy-redirect-page'

