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
    key: 'romance',
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
    key: 'business',
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
    key: 'possessions',
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
