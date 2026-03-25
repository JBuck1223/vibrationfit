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
  HeartHandshake,
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
  Megaphone,
  Radio,
  MessageSquare,
  Flame,
  CalendarCheck,
  Music,
  FileText,
  PenTool,
  TrendingUp,
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
  | 'voice_activated'
  | 'signal_amplifier'
  | 'conversation_starter'
  | 'heart_giver'
  | 'heart_overflow'
  | 'tribe_streak_7d'
  | 'tribe_streak_30d'
  // Activations
  | 'graduate_72h'
  | 'activated_3d'
  | 'activated_7d'
  | 'activated_14d'
  | 'activated_21d'
  | 'activated_28d'
  | 'audio_streak_7d'
  | 'audio_streak_30d'
  | 'paper_streak_7d'
  | 'paper_streak_30d'
  | 'journal_streak_7d'
  | 'journal_streak_30d'
  | 'abundance_streak_7d'
  | 'abundance_streak_30d'
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
  /** Number of distinct calendar days with at least one Activation event */
  activationDays?: number
  /** Consecutive-day streak required (longest streak ever achieved) */
  streakDays?: number
  /** Which activity the streak tracks: 'audio' | 'paper' | 'journal' | 'abundance' | 'tribe' */
  streakActivity?: 'audio' | 'paper' | 'journal' | 'abundance' | 'tribe'
  special?: 'checklist_72h' | 'full_12_vision'
  /** If true, shows next to user name in Vibe Tribe */
  showInline?: boolean
  /** 1-2 sentence "story" explaining what earning this badge means */
  meaning?: string
  /** Short guidance on the next badge to work toward (null if this is the final badge in its track) */
  nextBadge?: string | null
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
    meaning: 'You walked through the door. Most people never do. Three sessions in and you are already building the muscle of showing up.',
    nextBadge: 'Attend 12 sessions to earn the Consistent Practice badge.',
  },
  gym_regular: {
    type: 'gym_regular',
    category: 'sessions',
    label: 'Consistent Practice',
    description: 'Attended 12 Alignment Gym sessions',
    icon: Users,
    threshold: 12,
    meaning: 'Twelve sessions deep. The Alignment Gym is no longer something you try -- it is part of your rhythm.',
    nextBadge: 'Keep showing up to 50 sessions for the ultimate Vibration Fit badge.',
  },
  gym_og: {
    type: 'gym_og',
    category: 'sessions',
    label: 'Vibration Fit',
    description: 'Attended 50+ Alignment Gym sessions',
    icon: Crown,
    threshold: 50,
    meaning: 'Fifty sessions. You are the standard. Your commitment to alignment is undeniable proof of who you are becoming.',
    nextBadge: null,
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
    meaning: 'You put yourself out there. Your first signal to the tribe says you are willing to be seen on this journey.',
    nextBadge: 'Create 5 posts to earn the Voice Activated badge.',
  },
  voice_activated: {
    type: 'voice_activated',
    category: 'connections',
    label: 'Voice Activated',
    description: '5 Vibe Tribe posts',
    icon: Megaphone,
    threshold: 5,
    meaning: 'Five posts shared with the tribe. Your voice is activated -- you are no longer watching from the sidelines.',
    nextBadge: 'Keep posting to reach 25 posts and become a Signal Amplifier.',
  },
  signal_amplifier: {
    type: 'signal_amplifier',
    category: 'connections',
    label: 'Signal Amplifier',
    description: '25 Vibe Tribe posts',
    icon: Radio,
    threshold: 25,
    meaning: 'Twenty-five posts. You are amplifying your signal and raising the frequency of the entire tribe.',
    nextBadge: null,
  },
  conversation_starter: {
    type: 'conversation_starter',
    category: 'connections',
    label: 'Conversation Starter',
    description: '10 comments in the Vibe Tribe',
    icon: MessageSquare,
    threshold: 10,
    meaning: 'Ten comments. You are not just broadcasting -- you are in conversation. That is where real connection lives.',
    nextBadge: null,
  },
  heart_giver: {
    type: 'heart_giver',
    category: 'connections',
    label: 'Heart Giver',
    description: '25 hearts given to the tribe',
    icon: Heart,
    threshold: 25,
    meaning: 'Twenty-five hearts shared. Every heart you give is a moment of seeing someone else. That energy comes back.',
    nextBadge: 'Give 100 hearts to earn the Heart Overflow badge.',
  },
  heart_overflow: {
    type: 'heart_overflow',
    category: 'connections',
    label: 'Heart Overflow',
    description: '100 hearts given to the tribe',
    icon: HeartHandshake,
    threshold: 100,
    showInline: true,
    meaning: 'One hundred hearts. Your generosity of attention is overflowing. The tribe feels your presence.',
    nextBadge: null,
  },
  tribe_streak_7d: {
    type: 'tribe_streak_7d',
    category: 'connections',
    label: '7-Day Tribe Streak',
    description: 'Engaged with the Vibe Tribe 7 days in a row',
    icon: Flame,
    streakDays: 7,
    streakActivity: 'tribe',
    meaning: 'Seven consecutive days in the tribe. You are building a daily habit of connection. Community is now part of your rhythm.',
    nextBadge: 'Keep your tribe streak alive for 30 days to earn the ultimate connection badge.',
  },
  tribe_streak_30d: {
    type: 'tribe_streak_30d',
    category: 'connections',
    label: '30-Day Tribe Streak',
    description: 'Engaged with the Vibe Tribe 30 days in a row',
    icon: CalendarCheck,
    streakDays: 30,
    streakActivity: 'tribe',
    meaning: 'Thirty consecutive days of tribe engagement. You are proof that showing up for your community transforms everything.',
    nextBadge: null,
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
    meaning: 'You completed the full Activation Checklist within 72 hours. That kind of momentum sets the tone for everything that follows.',
    nextBadge: 'Keep running your Daily Activations to earn your 3-Day Activated badge.',
  },
  activated_3d: {
    type: 'activated_3d',
    category: 'activations',
    label: '3-Day Activated',
    description: "You've shown up 3 days. You're officially someone who shows up for The Life I Choose.",
    icon: Sparkles,
    activationDays: 3,
    meaning: "You've started. Three days of choosing to show up for The Life I Choose. That first streak is everything.",
    nextBadge: 'Keep running at least one Daily Activation per day to work toward your 7-Day badge.',
  },
  activated_7d: {
    type: 'activated_7d',
    category: 'activations',
    label: '7-Day Activated',
    description: '7 days of practice. Consistency is now part of your story.',
    icon: Zap,
    activationDays: 7,
    meaning: 'You stayed with your MAP past the novelty. Consistency is now part of your story.',
    nextBadge: 'Keep showing up daily to work toward your 14-Day Activated badge.',
  },
  activated_14d: {
    type: 'activated_14d',
    category: 'activations',
    label: '14-Day Activated',
    description: "14 days of showing up. Returning to alignment is what you do.",
    icon: Target,
    activationDays: 14,
    meaning: 'Two weeks in. Returning to alignment is no longer a decision -- it is what you do.',
    nextBadge: 'Keep your streak alive to reach 21 days and break through old patterns.',
  },
  activated_21d: {
    type: 'activated_21d',
    category: 'activations',
    label: '21-Day Activated',
    description: '21 days of activation. Old patterns are losing their grip.',
    icon: Star,
    activationDays: 21,
    meaning: 'Twenty-one days of activation. Old patterns are losing their grip. The new version of you is taking hold.',
    nextBadge: 'One more week to the full 28-Day Activated badge -- the ultimate proof of practice.',
  },
  activated_28d: {
    type: 'activated_28d',
    category: 'activations',
    label: '28-Day Activated',
    description: '28 days activated. You have proof: you are a conscious creator in action.',
    icon: Award,
    activationDays: 28,
    meaning: 'Twenty-eight days activated. You have proof: you are a conscious creator in action. This is who you are now.',
    nextBadge: null,
  },

  // --- Per-Activity Streak Badges ---
  audio_streak_7d: {
    type: 'audio_streak_7d',
    category: 'activations',
    label: '7-Day Audio Streak',
    description: 'Listened to your vision audio 7 days in a row',
    icon: Music,
    streakDays: 7,
    streakActivity: 'audio',
    meaning: 'Seven consecutive days of listening. Your vision is being wired into your nervous system, one session at a time.',
    nextBadge: 'Keep listening daily to reach a 30-day audio streak.',
  },
  audio_streak_30d: {
    type: 'audio_streak_30d',
    category: 'activations',
    label: '30-Day Audio Streak',
    description: 'Listened to your vision audio 30 days in a row',
    icon: Headphones,
    streakDays: 30,
    streakActivity: 'audio',
    meaning: 'Thirty consecutive days of vision audio. The Life I Choose is no longer words on a page -- it lives in your body.',
    nextBadge: null,
  },
  paper_streak_7d: {
    type: 'paper_streak_7d',
    category: 'activations',
    label: '7-Day Paper Streak',
    description: 'Completed your Daily Paper 7 days in a row',
    icon: FileText,
    streakDays: 7,
    streakActivity: 'paper',
    meaning: 'Seven consecutive days of your Daily Paper. You are setting your intention and designing each day with purpose.',
    nextBadge: 'Keep your Daily Paper going for 30 days straight.',
  },
  paper_streak_30d: {
    type: 'paper_streak_30d',
    category: 'activations',
    label: '30-Day Paper Streak',
    description: 'Completed your Daily Paper 30 days in a row',
    icon: FileText,
    streakDays: 30,
    streakActivity: 'paper',
    meaning: 'Thirty consecutive days of Daily Paper. Conscious creation is now your morning default. The compound effect is real.',
    nextBadge: null,
  },
  journal_streak_7d: {
    type: 'journal_streak_7d',
    category: 'activations',
    label: '7-Day Journal Streak',
    description: 'Journaled 7 days in a row',
    icon: PenTool,
    streakDays: 7,
    streakActivity: 'journal',
    meaning: 'Seven consecutive days of journaling. You are building awareness by putting thoughts on the page, day after day.',
    nextBadge: 'Keep journaling daily for 30 days to earn the ultimate journaling badge.',
  },
  journal_streak_30d: {
    type: 'journal_streak_30d',
    category: 'activations',
    label: '30-Day Journal Streak',
    description: 'Journaled 30 days in a row',
    icon: PenTool,
    streakDays: 30,
    streakActivity: 'journal',
    meaning: 'Thirty consecutive days of journaling. You have created a practice of self-reflection that most people only talk about.',
    nextBadge: null,
  },
  abundance_streak_7d: {
    type: 'abundance_streak_7d',
    category: 'activations',
    label: '7-Day Abundance Streak',
    description: 'Tracked abundance 7 days in a row',
    icon: TrendingUp,
    streakDays: 7,
    streakActivity: 'abundance',
    meaning: 'Seven consecutive days of tracking abundance. What you measure grows. You are training your brain to see more of what is working.',
    nextBadge: 'Keep tracking for 30 days straight to prove abundance is your frequency.',
  },
  abundance_streak_30d: {
    type: 'abundance_streak_30d',
    category: 'activations',
    label: '30-Day Abundance Streak',
    description: 'Tracked abundance 30 days in a row',
    icon: TrendingUp,
    streakDays: 30,
    streakActivity: 'abundance',
    meaning: 'Thirty consecutive days of abundance tracking. You have proof: abundance is not something you chase -- it is something you notice.',
    nextBadge: null,
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
    meaning: 'You wrote your full Life I Choose across all 12 categories. Most people never get this specific about what they want. You did.',
    nextBadge: 'Refine and evolve your vision over time to earn the Vision Weaver badge.',
  },
  vision_weaver: {
    type: 'vision_weaver',
    category: 'creations',
    label: 'Vision Weaver',
    description: '3+ vision versions over time',
    icon: Layers,
    threshold: 3,
    meaning: 'Three versions of your vision. You are not set-and-forget -- you are refining, growing, and getting clearer every iteration.',
    nextBadge: 'Create 10 unique vision audios to earn the Audio Architect badge.',
  },
  audio_architect: {
    type: 'audio_architect',
    category: 'creations',
    label: 'Audio Architect',
    description: '10+ unique vision audios created',
    icon: Headphones,
    threshold: 10,
    meaning: 'Ten unique audios created. You have built a library of immersive tracks that wire your vision into your nervous system.',
    nextBadge: 'Fill your Vision Board with 24 tiles to earn the Board Builder badge.',
  },
  board_builder: {
    type: 'board_builder',
    category: 'creations',
    label: 'Board Builder',
    description: '24+ Vision Board tiles created',
    icon: LayoutGrid,
    threshold: 24,
    meaning: 'Twenty-four Vision Board tiles. Every tile is a conscious intention you have placed into the world. Your board is alive.',
    nextBadge: null,
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
