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
  BookOpen,
  Layers,
  Headphones,
  LayoutGrid,
  Sparkles,
  Zap,
  Target,
  Star,
  Award,
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
  | 'activated_3d'
  | 'activated_7d'
  | 'activated_14d'
  | 'activated_21d'
  | 'activated_28d'
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
    label: 'First Reps',
    description: 'Attended 3 Alignment Gym sessions',
    icon: Dumbbell,
    threshold: 3,
  },
  gym_regular: {
    type: 'gym_regular',
    category: 'sessions',
    label: 'Consistent Practice',
    description: 'Attended 12 Alignment Gym sessions',
    icon: Users,
    threshold: 12,
  },
  gym_og: {
    type: 'gym_og',
    category: 'sessions',
    label: 'Vibration Fit',
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
    label: 'Conscious Connector',
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
  activated_3d: {
    type: 'activated_3d',
    category: 'activations',
    label: '3-Day Activated',
    description: "You've started. You're officially someone who shows up for The Life I Choose.",
    icon: Sparkles,
    streakDays: 3,
  },
  activated_7d: {
    type: 'activated_7d',
    category: 'activations',
    label: '7-Day Activated',
    description: 'You stayed with it past the novelty. Consistency is now part of your story.',
    icon: Zap,
    streakDays: 7,
  },
  activated_14d: {
    type: 'activated_14d',
    category: 'activations',
    label: '14-Day Activated',
    description: "You're building a new normal. Returning to alignment is what you do.",
    icon: Target,
    streakDays: 14,
  },
  activated_21d: {
    type: 'activated_21d',
    category: 'activations',
    label: '21-Day Activated',
    description: 'Old patterns are losing their grip. This version of you is sticking.',
    icon: Star,
    streakDays: 21,
  },
  activated_28d: {
    type: 'activated_28d',
    category: 'activations',
    label: '28-Day Activated',
    description: 'You completed 28 days. You have proof: you are a conscious creator in action.',
    icon: Award,
    streakDays: 28,
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
