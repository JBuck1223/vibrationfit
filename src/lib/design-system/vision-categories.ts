// VibrationFit Vision Categories Configuration
// Centralized source of truth for all vision categories across the application
// This ensures consistency in titles, icons, and descriptions everywhere

export interface VisionCategory {
  key: string
  label: string
  description: string
  icon: string
  order: number
}

export const VISION_CATEGORIES: VisionCategory[] = [
  {
    key: 'forward',
    label: 'Forward',
    description: 'Opening statement and intention',
    icon: '✨',
    order: 1
  },
  {
    key: 'fun',
    label: 'Fun / Recreation',
    description: 'Hobbies and joyful activities',
    icon: '🎉',
    order: 2
  },
  {
    key: 'travel',
    label: 'Travel / Adventure',
    description: 'Places to explore and adventures',
    icon: '✈️',
    order: 3
  },
  {
    key: 'home',
    label: 'Home / Environment',
    description: 'Living space and environment',
    icon: '🏡',
    order: 4
  },
  {
    key: 'family',
    label: 'Family / Parenting',
    description: 'Family relationships and life',
    icon: '👨‍👩‍👧‍👦',
    order: 5
  },
  {
    key: 'romance',
    label: 'Love / Romance',
    description: 'Romantic relationships',
    icon: '💕',
    order: 6
  },
  {
    key: 'health',
    label: 'Health / Vitality',
    description: 'Physical and mental well-being',
    icon: '💪',
    order: 7
  },
  {
    key: 'money',
    label: 'Money / Wealth',
    description: 'Financial goals and wealth',
    icon: '💰',
    order: 8
  },
  {
    key: 'business',
    label: 'Business / Career',
    description: 'Work and career aspirations',
    icon: '💼',
    order: 9
  },
  {
    key: 'social',
    label: 'Social / Friends',
    description: 'Social connections and friendships',
    icon: '👥',
    order: 10
  },
  {
    key: 'possessions',
    label: 'Things / Possessions',
    description: 'Material belongings and possessions',
    icon: '📦',
    order: 11
  },
  {
    key: 'giving',
    label: 'Giving / Contribution',
    description: 'Giving back and making a difference',
    icon: '🎁',
    order: 12
  },
  {
    key: 'spirituality',
    label: 'Spirituality / Growth',
    description: 'Spiritual growth and personal development',
    icon: '🌟',
    order: 13
  },
  {
    key: 'conclusion',
    label: 'Conclusion',
    description: 'Closing thoughts and integration',
    icon: '✅',
    order: 14
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

export function getVisionCategoryIcon(key: string): string {
  const category = getVisionCategory(key)
  return category ? category.icon : '❓'
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
