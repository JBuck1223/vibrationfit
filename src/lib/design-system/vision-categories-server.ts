// Server-safe vision categories (no React components)
// This version can be used in API routes and server-side code

export interface VisionCategoryServer {
  key: string
  label: string
  description: string
  order: number
}

export const VISION_CATEGORIES_SERVER: VisionCategoryServer[] = [
  {
    key: 'forward',
    label: 'Forward',
    description: 'Opening statement and intention',
    order: 1
  },
  {
    key: 'fun',
    label: 'Fun / Recreation',
    description: 'Hobbies and joyful activities',
    order: 2
  },
  {
    key: 'travel',
    label: 'Travel / Adventure',
    description: 'Places to explore and adventures',
    order: 3
  },
  {
    key: 'home',
    label: 'Home / Environment',
    description: 'Living space and environment',
    order: 4
  },
  {
    key: 'family',
    label: 'Family / Parenting',
    description: 'Family relationships and life',
    order: 5
  },
  {
    key: 'romance',
    label: 'Love / Romance',
    description: 'Romantic relationships',
    order: 6
  },
  {
    key: 'health',
    label: 'Health / Vitality',
    description: 'Physical and mental well-being',
    order: 7
  },
  {
    key: 'money',
    label: 'Money / Wealth',
    description: 'Financial goals and wealth',
    order: 8
  },
  {
    key: 'business',
    label: 'Business / Career',
    description: 'Work and career aspirations',
    order: 9
  },
  {
    key: 'social',
    label: 'Social / Friends',
    description: 'Social connections and friendships',
    order: 10
  },
  {
    key: 'possessions',
    label: 'Possessions / Stuff',
    description: 'Material belongings and things',
    order: 11
  },
  {
    key: 'giving',
    label: 'Giving / Legacy',
    description: 'Contribution and legacy',
    order: 12
  },
  {
    key: 'spirituality',
    label: 'Spirituality',
    description: 'Spiritual growth and expansion',
    order: 13
  },
  {
    key: 'conclusion',
    label: 'Conclusion',
    description: 'Closing thoughts and commitment',
    order: 14
  }
]

// Helper functions for server-side use
export function getVisionCategoryServer(key: string): VisionCategoryServer | undefined {
  return VISION_CATEGORIES_SERVER.find(category => category.key === key)
}

export function getVisionCategoryLabelServer(key: string): string {
  const category = getVisionCategoryServer(key)
  return category ? category.label : key
}

export function getVisionCategoryDescriptionServer(key: string): string {
  const category = getVisionCategoryServer(key)
  return category ? category.description : ''
}

export function getVisionCategoryKeysServer(): string[] {
  return VISION_CATEGORIES_SERVER.map(category => category.key)
}

export function isValidVisionCategoryServer(key: string): boolean {
  return VISION_CATEGORIES_SERVER.some(category => category.key === key)
}
