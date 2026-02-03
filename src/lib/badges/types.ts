/**
 * Badge System Types and Definitions
 * 
 * Badges are organized by Core 4 categories:
 * 1. Sessions (Alignment Gym)
 * 2. Connections (Vibe Tribe)
 * 3. Activations (Daily Protocol)
 * 4. Creations (Asset Building)
 */

import {
  Dumbbell,
  Users,
  Crown,
  MessageCircle,
  Heart,
  Anchor,
  GraduationCap,
  Flame,
  Shield,
  Trophy,
  BookOpen,
  Layers,
  Headphones,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'

// Badge category types matching Core 4 tiles
export type BadgeCategory = 'sessions' | 'connections' | 'activations' | 'creations'

// All badge types
export type BadgeType =
  // Sessions
  | 'gym_rookie'
  | 'gym_regular'
  | 'gym_og'
  // Connections
  | 'first_signal'
  | 'vibe_contributor'
  | 'vibe_anchor'
  // Activations
  | 'graduate_72h'
  | 'daily_alchemist'
  | 'signal_keeper'
  | 'activated_28'
  // Creations
  | 'life_author'
  | 'vision_weaver'
  | 'audio_architect'
  | 'board_builder'

// Badge definition with all metadata
export interface BadgeDefinition {
  type: BadgeType
  category: BadgeCategory
  label: string
  description: string
  icon: LucideIcon
  threshold?: number
  streakDays?: number
  special?: 'checklist_72h' | 'challenge_28d' | 'full_12_vision'
  /** If true, shows next to user name in Vibe Tribe */
  showInline?: boolean
}

// Category colors matching tile colors
export const BADGE_CATEGORY_COLORS: Record<BadgeCategory, {
  primary: string
  bg: string
  border: string
  ring: string
}> = {
  sessions: {
    primary: '#14B8A6', // teal
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    ring: 'stroke-teal-400',
  },
  connections: {
    primary: '#8B5CF6', // purple
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    ring: 'stroke-purple-400',
  },
  activations: {
    primary: '#199D67', // green
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    ring: 'stroke-green-400',
  },
  creations: {
    primary: '#FFB701', // yellow/gold
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    ring: 'stroke-yellow-400',
  },
}

// Badge definitions organized by category
export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  // ============================================
  // SESSIONS BADGES (Alignment Gym)
  // ============================================
  gym_rookie: {
    type: 'gym_rookie',
    category: 'sessions',
    label: 'Gym Rookie',
    description: 'Attended 3 Alignment Gym sessions',
    icon: Dumbbell,
    threshold: 3,
  },
  gym_regular: {
    type: 'gym_regular',
    category: 'sessions',
    label: 'Gym Regular',
    description: 'Attended 12 Alignment Gym sessions',
    icon: Users,
    threshold: 12,
  },
  gym_og: {
    type: 'gym_og',
    category: 'sessions',
    label: 'Gym OG',
    description: 'Attended 50+ Alignment Gym sessions',
    icon: Crown,
    threshold: 50,
  },

  // ============================================
  // CONNECTIONS BADGES (Vibe Tribe)
  // ============================================
  first_signal: {
    type: 'first_signal',
    category: 'connections',
    label: 'First Signal Sent',
    description: 'Made your first Vibe Tribe post',
    icon: MessageCircle,
    threshold: 1,
  },
  vibe_contributor: {
    type: 'vibe_contributor',
    category: 'connections',
    label: 'Vibe Contributor',
    description: '25 Vibe Tribe interactions',
    icon: Heart,
    threshold: 25,
  },
  vibe_anchor: {
    type: 'vibe_anchor',
    category: 'connections',
    label: 'Vibe Anchor',
    description: '100+ Vibe Tribe interactions',
    icon: Anchor,
    threshold: 100,
    showInline: true, // Show next to name in Vibe Tribe
  },

  // ============================================
  // ACTIVATIONS BADGES (Daily Protocol)
  // ============================================
  graduate_72h: {
    type: 'graduate_72h',
    category: 'activations',
    label: '72-Hour Graduate',
    description: 'Completed Activation Checklist in 72 hours',
    icon: GraduationCap,
    special: 'checklist_72h',
  },
  daily_alchemist: {
    type: 'daily_alchemist',
    category: 'activations',
    label: 'Daily Alchemist',
    description: '7-day activation streak',
    icon: Flame,
    streakDays: 7,
  },
  signal_keeper: {
    type: 'signal_keeper',
    category: 'activations',
    label: 'Signal Keeper',
    description: '28-day streak with activation + evidence',
    icon: Shield,
    streakDays: 28,
  },
  activated_28: {
    type: 'activated_28',
    category: 'activations',
    label: 'Activated 28',
    description: 'Completed the 28-Day Life I Choose Challenge',
    icon: Trophy,
    special: 'challenge_28d',
  },

  // ============================================
  // CREATIONS BADGES (Asset Building)
  // ============================================
  life_author: {
    type: 'life_author',
    category: 'creations',
    label: 'Life I Choose Author',
    description: 'Completed a full 12-category Life Vision',
    icon: BookOpen,
    special: 'full_12_vision',
  },
  vision_weaver: {
    type: 'vision_weaver',
    category: 'creations',
    label: 'Vision Weaver',
    description: '3+ vision versions over time',
    icon: Layers,
    threshold: 3,
  },
  audio_architect: {
    type: 'audio_architect',
    category: 'creations',
    label: 'Audio Architect',
    description: '10+ unique vision audios created',
    icon: Headphones,
    threshold: 10,
  },
  board_builder: {
    type: 'board_builder',
    category: 'creations',
    label: 'Board Builder',
    description: '24+ Vision Board tiles created',
    icon: LayoutGrid,
    threshold: 24,
  },
}

// Get badges by category
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.category === category)
}

// Get all badge types
export function getAllBadgeTypes(): BadgeType[] {
  return Object.keys(BADGE_DEFINITIONS) as BadgeType[]
}

// Category display info
export const BADGE_CATEGORY_INFO: Record<BadgeCategory, {
  label: string
  description: string
}> = {
  sessions: {
    label: 'Sessions',
    description: 'Alignment Gym attendance',
  },
  connections: {
    label: 'Connections',
    description: 'Vibe Tribe interactions',
  },
  activations: {
    label: 'Activations',
    description: 'Daily protocol engagement',
  },
  creations: {
    label: 'Creations',
    description: 'Asset building progress',
  },
}

// User badge record (from database)
export interface UserBadge {
  id: string
  user_id: string
  badge_type: BadgeType
  earned_at: string
  metadata: Record<string, unknown>
}

// Badge with progress info (for display)
export interface BadgeWithProgress {
  definition: BadgeDefinition
  earned: boolean
  earnedAt?: string
  progress: {
    current: number
    target: number
    percentage: number
  }
}

// Full badge status for a user
export interface UserBadgeStatus {
  userId: string
  badges: BadgeWithProgress[]
  byCategory: Record<BadgeCategory, BadgeWithProgress[]>
  earnedCount: number
  totalCount: number
}
