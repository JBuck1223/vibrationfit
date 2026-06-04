import {
  Sun,
  FileText,
  BookOpen,
  Image,
  UsersRound,
  Video,
  Heart,
  Headphones,
  DollarSign,
  Eye,
  BookMarked,
  Music2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MapCategory } from './types'

export interface ActivityDefinition {
  type: string
  label: string
  description: string
  icon: LucideIcon
  category: MapCategory
  defaultDeepLink: string
  defaultDaysOfWeek: number[]
  defaultTimeOfDay: string | null
  smsTemplate: string
  /** When true, MAP hides cadence/day pickers and per-commitment reminders (e.g. Alignment Gym). */
  usesPublishedSchedule?: boolean
}

export const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  // ── Activations ──
  // "How many times did I show up and engage with my tools?"
  {
    type: 'vision_audio',
    label: 'Vision Audio Listen',
    description: 'Listen to your Life Vision audio or a category-specific track.',
    icon: Headphones,
    category: 'activations',
    defaultDeepLink: '/audio?listen=life-vision',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '07:30',
    smsTemplate: 'Listen to your Vision Audio: {link}',
  },
  {
    type: 'story_audio',
    label: 'Story Audio Listen',
    description: 'Listen to one of your Focus Stories.',
    icon: BookMarked,
    category: 'activations',
    defaultDeepLink: '/audio?listen=stories',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: null,
    smsTemplate: 'Listen to your Focus Story: {link}',
  },
  {
    type: 'music_listen',
    label: 'Music Listen',
    description: 'Listen to Vibration Fit music.',
    icon: Music2,
    category: 'activations',
    defaultDeepLink: '/audio?listen=music',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: null,
    smsTemplate: 'Listen to Vibration Fit music: {link}',
  },
  {
    type: 'vision_read',
    label: 'Life Vision Read',
    description: 'Read through your Life Vision.',
    icon: Eye,
    category: 'activations',
    defaultDeepLink: '/life-vision',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: null,
    smsTemplate: 'Read through your Life Vision: {link}',
  },
  {
    type: 'vision_board_view',
    label: 'Vision Board View',
    description: 'View your Vision Board and spend time with the life you\'re building.',
    icon: Image,
    category: 'activations',
    defaultDeepLink: '/vision-board',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: null,
    smsTemplate: 'View your Vision Board: {link}',
  },
  {
    type: 'journal_review',
    label: 'Journal Review',
    description: 'Read back through your journal entries — revisit evidence, patterns, and wins.',
    icon: Sun,
    category: 'activations',
    defaultDeepLink: '/journal',
    defaultDaysOfWeek: [0],
    defaultTimeOfDay: null,
    smsTemplate: 'Review your journal entries: {link}',
  },

  // ── Creations ──
  // "What objects exist because of me?"
  {
    type: 'journal_entry',
    label: 'Journal Entry',
    description: 'Write, record audio, or record video in your journal.',
    icon: BookOpen,
    category: 'creations',
    defaultDeepLink: '/journal/new',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '21:00',
    smsTemplate: 'Capture what aligned today: {link}',
  },
  {
    type: 'daily_paper',
    label: 'Daily Paper',
    description: 'Complete your Daily Paper with gratitude, tasks, and a fun plan.',
    icon: FileText,
    category: 'creations',
    defaultDeepLink: '/daily-paper/new',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '07:00',
    smsTemplate: 'Start your day with a Daily Paper: {link}',
  },
  {
    type: 'vision_board_update',
    label: 'Vision Board Update',
    description: 'Add new desires, mark actualized items, or refresh your tiles.',
    icon: Image,
    category: 'creations',
    defaultDeepLink: '/vision-board',
    defaultDaysOfWeek: [0],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Update your Vision Board: {link}',
  },
  {
    type: 'abundance_tracker',
    label: 'Abundance Tracker Entry',
    description: 'Log an abundance moment or goal progress.',
    icon: DollarSign,
    category: 'creations',
    defaultDeepLink: '/abundance-tracker',
    defaultDaysOfWeek: [5],
    defaultTimeOfDay: '18:00',
    smsTemplate: 'Log your abundance moments: {link}',
  },

  // ── Connections ──
  // "How many times did I interact with the community?"
  {
    type: 'vibe_tribe_post',
    label: 'Vibe Tribe Post',
    description: 'Share a win, wobble, vision, or collaboration with the community.',
    icon: UsersRound,
    category: 'connections',
    defaultDeepLink: '/vibe-tribe/new',
    defaultDaysOfWeek: [3],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Share with the community: {link}',
  },
  {
    type: 'vibe_tribe_engage',
    label: 'Vibe Tribe Engagement',
    description:
      'Witness and respond to other members — heart a post or leave a short comment. Presence counts; it must be on someone else\'s post, not only your own.',
    icon: Heart,
    category: 'connections',
    defaultDeepLink: '/vibe-tribe',
    defaultDaysOfWeek: [2, 4],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Connect with the community: {link}',
  },

  // ── Sessions ──
  // "How often am I showing up to live coaching?"
  {
    type: 'alignment_gym',
    label: 'Alignment Gym',
    description:
      'Attending live or watching the replay counts as complete. Schedule and replays: Alignment Gym.',
    icon: Video,
    category: 'sessions',
    defaultDeepLink: '/alignment-gym',
    defaultDaysOfWeek: [4],
    defaultTimeOfDay: '19:00',
    smsTemplate: 'Alignment Gym: {link}',
    usesPublishedSchedule: true,
  },
]

export function getActivityDefinition(type: string): ActivityDefinition | undefined {
  return ACTIVITY_DEFINITIONS.find(a => a.type === type)
}

/**
 * Browse/view routes for creation activities when the occurrence is already complete.
 * Create flows use defaultDeepLink; completed rows should open the library instead.
 */
const MAP_COMPLETED_VIEW_LINKS: Record<string, string> = {
  journal_entry: '/journal',
  daily_paper: '/daily-paper',
  vibe_tribe_post: '/vibe-tribe',
}

/** Deep link for MAP day rows — create URL when pending, view URL when done. */
export function getMapActivityDeepLink(
  activityType: string,
  options?: { completed?: boolean },
): string {
  const def = getActivityDefinition(activityType)
  if (!def) return '/map'
  if (options?.completed && MAP_COMPLETED_VIEW_LINKS[activityType]) {
    return MAP_COMPLETED_VIEW_LINKS[activityType]
  }
  return def.defaultDeepLink
}

export function getActivitiesByCategory(category: MapCategory): ActivityDefinition[] {
  return ACTIVITY_DEFINITIONS.filter(a => a.category === category)
}
