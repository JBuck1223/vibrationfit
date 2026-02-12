/**
 * VibrationFit Navigation System
 * 
 * Centralized exports for page classifications and menu definitions.
 * This is the master system for navigation and routing.
 */

// Page Classifications
export {
  PAGE_CLASSIFICATIONS,
  getPageType,
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

