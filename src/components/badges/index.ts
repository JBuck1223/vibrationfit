/**
 * Badge Components
 * 
 * Components for displaying user badges and achievements.
 */

export { default as BadgeWithProgress } from './BadgeWithProgress'
export { default as BadgeDisplay } from './BadgeDisplay'
export { default as BadgeDetailModal } from './BadgeDetailModal'
export { default as BadgeIcon, BadgeIcons } from './BadgeIcon'
export { default as UserBadgeIndicator, clearBadgeCache } from './UserBadgeIndicator'

// Re-export types for convenience
export type {
  BadgeType,
  BadgeCategory,
  BadgeDefinition,
  UserBadge,
  BadgeWithProgress as BadgeWithProgressType,
  UserBadgeStatus,
} from '@/lib/badges/types'

export {
  BADGE_DEFINITIONS,
  BADGE_CATEGORY_COLORS,
  BADGE_CATEGORY_INFO,
  getBadgesByCategory,
  getAllBadgeTypes,
} from '@/lib/badges/types'
