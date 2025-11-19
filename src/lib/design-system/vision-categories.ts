// VibrationFit Vision Categories Configuration
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

export const VISION_CATEGORIES: VisionCategory[] = [
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
]

// Helper functions for working with vision categories
export function getVisionCategory(key: string): VisionCategory | undefined {
  return VISION_CATEGORIES.find(category => category.key === key)
}

export function getVisionCategoryLabel(key: string): string {
  const category = getVisionCategory(key)
  return category ? category.label : key
}

export function getVisionCategoryIcon(key: string): LucideIcon {
  const category = getVisionCategory(key)
  return category ? category.icon : Sparkles // Default fallback
}

export function getVisionCategoryDescription(key: string): string {
  const category = getVisionCategory(key)
  return category ? category.description : ''
}

// Get categories in order
export function getOrderedVisionCategories(): VisionCategory[] {
  return [...VISION_CATEGORIES].sort((a, b) => a.order - b.order)
}

// Get category keys in order
export function getVisionCategoryKeys(): string[] {
  return getOrderedVisionCategories().map(category => category.key)
}

// Check if a key is a valid vision category
export function isValidVisionCategory(key: string): boolean {
  return VISION_CATEGORIES.some(category => category.key === key)
}

// ============================================================================
// CATEGORY KEY CONSTANTS - Single Source of Truth
// ============================================================================
// Use these instead of hardcoding category keys throughout the codebase

// All category keys (excluding forward/conclusion)
export const LIFE_CATEGORY_KEYS = VISION_CATEGORIES
  .filter(c => c.order > 0 && c.order < 13)
  .map(c => c.key)

// Individual category key constants
export const CATEGORY_KEYS = {
  FORWARD: 'forward' as const,
  FUN: 'fun' as const,
  HEALTH: 'health' as const,
  TRAVEL: 'travel' as const,
  LOVE: 'love' as const,
  FAMILY: 'family' as const,
  SOCIAL: 'social' as const,
  HOME: 'home' as const,
  WORK: 'work' as const,
  MONEY: 'money' as const,
  STUFF: 'stuff' as const,
  GIVING: 'giving' as const,
  SPIRITUALITY: 'spirituality' as const,
  CONCLUSION: 'conclusion' as const,
} as const

// ============================================================================
// FIELD NAME MAPPING HELPERS
// ============================================================================
// Map category keys to their corresponding database field names

/**
 * Get the story field name for a category (e.g., 'fun' -> 'fun_story')
 */
export function getCategoryStoryField(categoryKey: string): string {
  return `${categoryKey}_story`
}

/**
 * Get the clarity field name for a category (e.g., 'fun' -> 'clarity_fun')
 */
export function getCategoryClarityField(categoryKey: string): string {
  return `clarity_${categoryKey}`
}

/**
 * Get the contrast field name for a category (e.g., 'fun' -> 'contrast_fun')
 */
export function getCategoryContrastField(categoryKey: string): string {
  return `contrast_${categoryKey}`
}

/**
 * Get the dream field name for a category
 * e.g., 'fun' → 'dream_fun'
 */
export function getCategoryDreamField(categoryKey: string): string {
  return `dream_${categoryKey}`
}

/**
 * Get the worry field name for a category
 * e.g., 'fun' → 'worry_fun'
 */
export function getCategoryWorryField(categoryKey: string): string {
  return `worry_${categoryKey}`
}

/**
 * Get clarity, contrast, dream, and worry field names for a category
 */
export function getCategoryFields(categoryKey: string): { 
  clarity: string
  contrast: string
  dream: string
  worry: string
} {
  return {
    clarity: getCategoryClarityField(categoryKey),
    contrast: getCategoryContrastField(categoryKey),
    dream: getCategoryDreamField(categoryKey),
    worry: getCategoryWorryField(categoryKey),
  }
}

// Map of all category story fields for batch operations
export const CATEGORY_STORY_FIELDS = LIFE_CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = getCategoryStoryField(key)
  return acc
}, {} as Record<string, string>)

// Map of all category dream fields for batch operations
export const CATEGORY_DREAM_FIELDS = LIFE_CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = getCategoryDreamField(key)
  return acc
}, {} as Record<string, string>)

// Map of all category worry fields for batch operations
export const CATEGORY_WORRY_FIELDS = LIFE_CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = getCategoryWorryField(key)
  return acc
}, {} as Record<string, string>)

// Map of all category clarity fields for batch operations
export const CATEGORY_CLARITY_FIELDS = LIFE_CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = getCategoryClarityField(key)
  return acc
}, {} as Record<string, string>)

// Map of all category contrast fields for batch operations
export const CATEGORY_CONTRAST_FIELDS = LIFE_CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = getCategoryContrastField(key)
  return acc
}, {} as Record<string, string>)

// ============================================================================
// COMPREHENSIVE CATEGORY MAPPING - SINGLE SOURCE OF TRUTH
// ============================================================================
// Different parts of the app use different category key formats
// This mapping ensures consistency across all systems

/**
 * Complete category mapping for each life area
 * Vision keys are the canonical source of truth
 */
export interface CategoryMapping {
  vision: string           // Canonical key (e.g., 'love', 'work', 'stuff')
  assessment: string       // Same as vision
  recording: string        // Same as vision
  profileSection: string   // Same as vision - ONE set of clean keys everywhere!
  label: string           // Display name
}

export const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    vision: 'fun',
    assessment: 'fun',
    recording: 'fun',
    profileSection: 'fun',
    label: 'Fun'
  },
  {
    vision: 'health',
    assessment: 'health',
    recording: 'health',
    profileSection: 'health',
    label: 'Health'
  },
  {
    vision: 'travel',
    assessment: 'travel',
    recording: 'travel',
    profileSection: 'travel',
    label: 'Travel'
  },
  {
    vision: 'love',
    assessment: 'love',
    recording: 'love',
    profileSection: 'love',
    label: 'Love'
  },
  {
    vision: 'family',
    assessment: 'family',
    recording: 'family',
    profileSection: 'family',
    label: 'Family'
  },
  {
    vision: 'social',
    assessment: 'social',
    recording: 'social',
    profileSection: 'social',
    label: 'Social'
  },
  {
    vision: 'home',
    assessment: 'home',
    recording: 'home',
    profileSection: 'home',
    label: 'Home'
  },
  {
    vision: 'work',
    assessment: 'work',
    recording: 'work',
    profileSection: 'work',
    label: 'Work'
  },
  {
    vision: 'money',
    assessment: 'money',
    recording: 'money',
    profileSection: 'money',
    label: 'Money'
  },
  {
    vision: 'stuff',
    assessment: 'stuff',
    recording: 'stuff',
    profileSection: 'stuff',
    label: 'Stuff'
  },
  {
    vision: 'giving',
    assessment: 'giving',
    recording: 'giving',
    profileSection: 'giving',
    label: 'Giving'
  },
  {
    vision: 'spirituality',
    assessment: 'spirituality',
    recording: 'spirituality',
    profileSection: 'spirituality',
    label: 'Spirituality'
  }
]

// ============================================================================
// CONVERSION HELPER FUNCTIONS
// ============================================================================

/**
 * Convert between any category key format
 */
export function convertCategoryKey(
  key: string,
  from: keyof Omit<CategoryMapping, 'label'>,
  to: keyof Omit<CategoryMapping, 'label'>
): string {
  const mapping = CATEGORY_MAPPINGS.find(m => m[from] === key)
  return mapping ? mapping[to] : key
}

/**
 * Convert vision category key to assessment category key
 */
export function visionToAssessmentKey(visionKey: string): string {
  return convertCategoryKey(visionKey, 'vision', 'assessment')
}

/**
 * Convert assessment category key to vision category key
 */
export function assessmentToVisionKey(assessmentKey: string): string {
  return convertCategoryKey(assessmentKey, 'assessment', 'vision')
}

/**
 * Convert vision category key to recording category key
 */
export function visionToRecordingKey(visionKey: string): string {
  return convertCategoryKey(visionKey, 'vision', 'recording')
}

/**
 * Convert recording category key to vision category key
 */
export function recordingToVisionKey(recordingKey: string): string {
  return convertCategoryKey(recordingKey, 'recording', 'vision')
}

/**
 * Convert vision category key to profile section key
 */
export function visionToProfileSectionKey(visionKey: string): string {
  return convertCategoryKey(visionKey, 'vision', 'profileSection')
}

/**
 * Convert profile section key to vision category key
 */
export function profileSectionToVisionKey(profileSectionKey: string): string {
  return convertCategoryKey(profileSectionKey, 'profileSection', 'vision')
}

/**
 * Get the full mapping for a category by any key type
 */
export function getCategoryMapping(
  key: string,
  keyType: keyof Omit<CategoryMapping, 'label'>
): CategoryMapping | undefined {
  return CATEGORY_MAPPINGS.find(m => m[keyType] === key)
}
