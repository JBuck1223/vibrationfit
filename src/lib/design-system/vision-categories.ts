// Vibration Fit Vision Categories Configuration
// Centralized source of truth for all vision categories across the application
// This ensures consistency in titles, icons, and descriptions everywhere

import { 
  Sparkles, 
  PartyPopper, 
  Plane, 
  Home, 
  Users, 
  Heart, 
  Activity, 
  DollarSign, 
  Briefcase, 
  UserPlus, 
  Package, 
  Gift, 
  Zap, 
  Star,
  CheckCircle,
  LucideIcon
} from 'lucide-react'

export interface VisionCategory {
  key: string
  label: string
  description: string
  icon: LucideIcon
  order: number
}

export const VISION_CATEGORIES = [
  {
    key: 'forward',
    label: 'Forward',
    description: 'Opening with intention and energy',
    icon: Sparkles,
    order: 0
  },
  {
    key: 'fun',
    label: 'Fun',
    description: 'Hobbies and joyful activities',
    icon: PartyPopper,
    order: 1
  },
  {
    key: 'health',
    label: 'Health',
    description: 'Physical and mental well-being',
    icon: Activity,
    order: 2
  },
  {
    key: 'travel',
    label: 'Travel',
    description: 'Places to explore and adventures',
    icon: Plane,
    order: 3
  },
  {
    key: 'love',
    label: 'Love',
    description: 'Romantic relationships',
    icon: Heart,
    order: 4
  },
  {
    key: 'family',
    label: 'Family',
    description: 'Family relationships and life',
    icon: Users,
    order: 5
  },
  {
    key: 'social',
    label: 'Social',
    description: 'Social connections and friendships',
    icon: UserPlus,
    order: 6
  },
  {
    key: 'home',
    label: 'Home',
    description: 'Living space and environment',
    icon: Home,
    order: 7
  },
  {
    key: 'work',
    label: 'Work',
    description: 'Work and career aspirations',
    icon: Briefcase,
    order: 8
  },
  {
    key: 'money',
    label: 'Money',
    description: 'Financial goals and wealth',
    icon: DollarSign,
    order: 9
  },
  {
    key: 'stuff',
    label: 'Stuff',
    description: 'Material belongings and things',
    icon: Package,
    order: 10
  },
  {
    key: 'giving',
    label: 'Giving',
    description: 'Contribution and legacy',
    icon: Gift,
    order: 11
  },
  {
    key: 'spirituality',
    label: 'Spirituality',
    description: 'Spiritual growth and expansion',
    icon: Star,
    order: 12
  },
  {
    key: 'conclusion',
    label: 'Conclusion',
    description: 'Closing statement that brings vision together',
    icon: CheckCircle,
    order: 13
  }
] as const satisfies readonly VisionCategory[]

// ============================================================================
// TYPE-SAFE CATEGORY KEYS
// ============================================================================

// Extract the union type of all category keys (compile-time safe)
export type VisionCategoryKey = (typeof VISION_CATEGORIES)[number]['key']

// Meta categories (forward/conclusion) vs life categories
export const META_CATEGORY_KEYS = ['forward', 'conclusion'] as const
export type MetaCategoryKey = typeof META_CATEGORY_KEYS[number]

// Life category keys (excludes meta categories)
export type LifeCategoryKey = Exclude<VisionCategoryKey, MetaCategoryKey>

// ============================================================================
// DERIVED CONSTANTS
// ============================================================================

// Pre-sorted categories (memoized for performance)
export const ORDERED_VISION_CATEGORIES = [...VISION_CATEGORIES].sort((a, b) => a.order - b.order)

// All life category keys (excludes forward/conclusion)
export const LIFE_CATEGORY_KEYS = VISION_CATEGORIES
  .map(c => c.key)
  .filter((k): k is LifeCategoryKey => 
    !META_CATEGORY_KEYS.includes(k as MetaCategoryKey)
  )

// Individual category key constants (for convenience)
export const CATEGORY_KEYS = {
  FORWARD: 'forward',
  FUN: 'fun',
  HEALTH: 'health',
  TRAVEL: 'travel',
  LOVE: 'love',
  FAMILY: 'family',
  SOCIAL: 'social',
  HOME: 'home',
  WORK: 'work',
  MONEY: 'money',
  STUFF: 'stuff',
  GIVING: 'giving',
  SPIRITUALITY: 'spirituality',
  CONCLUSION: 'conclusion',
} as const satisfies Record<string, VisionCategoryKey>

// ============================================================================
// HELPER FUNCTIONS (Type-safe)
// ============================================================================

export function getVisionCategory(key: VisionCategoryKey): VisionCategory | undefined {
  return VISION_CATEGORIES.find(category => category.key === key)
}

export function getVisionCategoryLabel(key: VisionCategoryKey): string {
  const category = getVisionCategory(key)
  return category ? category.label : key
}

export function getVisionCategoryIcon(key: VisionCategoryKey): LucideIcon {
  const category = getVisionCategory(key)
  return category ? category.icon : Sparkles // Default fallback
}

export function getVisionCategoryDescription(key: VisionCategoryKey): string {
  const category = getVisionCategory(key)
  return category ? category.description : ''
}

// Get categories in order (already memoized as ORDERED_VISION_CATEGORIES)
export function getOrderedVisionCategories(): readonly VisionCategory[] {
  return ORDERED_VISION_CATEGORIES
}

// Get category keys in order
export function getVisionCategoryKeys(): VisionCategoryKey[] {
  return ORDERED_VISION_CATEGORIES.map(category => category.key)
}

// Type guard: check if a string is a valid vision category key
export function isValidVisionCategory(key: string): key is VisionCategoryKey {
  return VISION_CATEGORIES.some(category => category.key === key)
}

// ============================================================================
// FIELD NAME MAPPING HELPERS (Type-safe, life categories only)
// ============================================================================
// Map category keys to their corresponding database field names
// These only work with life categories (not forward/conclusion)

/**
 * Get the story field name for a life category (e.g., 'fun' -> 'fun_story')
 * Only accepts life category keys (excludes forward/conclusion)
 */
export function getCategoryStoryField(categoryKey: LifeCategoryKey): string {
  return `${categoryKey}_story`
}

/**
 * Get the state field name for a life category (e.g., 'fun' -> 'state_fun')
 * Only accepts life category keys (excludes forward/conclusion)
 */
export function getCategoryStateField(categoryKey: LifeCategoryKey): string {
  return `state_${categoryKey}`
}

/** @deprecated Use getCategoryStateField instead */
export const getCategoryClarityField = getCategoryStateField
/** @deprecated Contrast fields no longer exist; use getCategoryStateField */
export const getCategoryContrastField = getCategoryStateField

/**
 * Get state field name for a life category
 * Only accepts life category keys (excludes forward/conclusion)
 */
export function getCategoryFields(categoryKey: LifeCategoryKey): {
  state: string
  clarity: string
  contrast: string
} {
  return {
    state: getCategoryStateField(categoryKey),
    clarity: `clarity_${categoryKey}`,
    contrast: `contrast_${categoryKey}`,
  }
}

// Strongly-typed maps of all category fields for batch operations
export const CATEGORY_STORY_FIELDS: Record<LifeCategoryKey, string> = 
  LIFE_CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = getCategoryStoryField(key)
    return acc
  }, {} as Record<LifeCategoryKey, string>)

export const CATEGORY_STATE_FIELDS: Record<LifeCategoryKey, string> = 
  LIFE_CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = getCategoryStateField(key)
    return acc
  }, {} as Record<LifeCategoryKey, string>)

/** @deprecated Use CATEGORY_STATE_FIELDS instead */
export const CATEGORY_CLARITY_FIELDS = CATEGORY_STATE_FIELDS
/** @deprecated Contrast fields no longer exist; use CATEGORY_STATE_FIELDS */
export const CATEGORY_CONTRAST_FIELDS = CATEGORY_STATE_FIELDS

// ============================================================================
// CATEGORY MAPPING - AUTO-GENERATED FROM VISION_CATEGORIES
// ============================================================================
// All category formats use the same keys now (single source of truth)
// This mapping exists for API compatibility but is derived, not duplicated

/**
 * Complete category mapping for each life area
 * Auto-generated from VISION_CATEGORIES to prevent drift
 * All formats use the same keys (vision/assessment/recording/profileSection are identical)
 */
export interface CategoryMapping {
  vision: LifeCategoryKey
  assessment: LifeCategoryKey
  recording: LifeCategoryKey
  profileSection: LifeCategoryKey
  label: string
}

/**
 * Category mappings - auto-generated from LIFE_CATEGORY_KEYS
 * Cannot drift from VISION_CATEGORIES since it's derived
 */
export const CATEGORY_MAPPINGS: CategoryMapping[] = LIFE_CATEGORY_KEYS.map((key) => ({
  vision: key,
  assessment: key,
  recording: key,
  profileSection: key,
  label: getVisionCategoryLabel(key),
})) satisfies CategoryMapping[]

// ============================================================================
// CONVERSION HELPER FUNCTIONS (Simplified - all keys are identical)
// ============================================================================

/**
 * Convert between any category key format
 * Since all formats now use the same keys, this just returns the key
 */
export function convertCategoryKey(
  key: LifeCategoryKey,
  _from: keyof Omit<CategoryMapping, 'label'>,
  _to: keyof Omit<CategoryMapping, 'label'>
): LifeCategoryKey {
  return key // All formats use the same keys now
}

/**
 * Convert vision category key to assessment category key
 * (Identity function - keys are identical)
 */
export function visionToAssessmentKey(visionKey: LifeCategoryKey): LifeCategoryKey {
  return visionKey
}

/**
 * Convert assessment category key to vision category key
 * (Identity function - keys are identical)
 */
export function assessmentToVisionKey(assessmentKey: LifeCategoryKey): LifeCategoryKey {
  return assessmentKey
}

/**
 * Convert vision category key to recording category key
 * (Identity function - keys are identical)
 */
export function visionToRecordingKey(visionKey: LifeCategoryKey): LifeCategoryKey {
  return visionKey
}

/**
 * Convert recording category key to vision category key
 * (Identity function - keys are identical)
 */
export function recordingToVisionKey(recordingKey: LifeCategoryKey): LifeCategoryKey {
  return recordingKey
}

/**
 * Convert vision category key to profile section key
 * (Identity function - keys are identical)
 */
export function visionToProfileSectionKey(visionKey: LifeCategoryKey): LifeCategoryKey {
  return visionKey
}

/**
 * Convert profile section key to vision category key
 * (Identity function - keys are identical)
 */
export function profileSectionToVisionKey(profileSectionKey: LifeCategoryKey): LifeCategoryKey {
  return profileSectionKey
}

/**
 * Get the full mapping for a category
 * Type-safe lookup with auto-complete
 */
export function getCategoryMapping(key: LifeCategoryKey): CategoryMapping | undefined {
  return CATEGORY_MAPPINGS.find(m => m.vision === key)
}
