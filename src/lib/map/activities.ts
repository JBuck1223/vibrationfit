import {
  Sun,
  Moon,
  Zap,
  FileText,
  BookOpen,
  Image,
  UsersRound,
  Video,
  Heart,
  Target,
  Headphones,
  DollarSign,
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
}

export const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  // ── Activations ──
  {
    type: 'morning_vision',
    label: 'Morning Vision + Daily Paper',
    description: 'Read your Life Vision, scan your Vision Board, and complete your Daily Paper.',
    icon: Sun,
    category: 'activations',
    defaultDeepLink: '/daily-paper/new',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '07:00',
    smsTemplate: 'Time for your Morning Vision + Daily Paper! Start your day aligned: {link}',
  },
  {
    type: 'realtime_activation',
    label: 'Real-Time Category Activation',
    description: 'Listen to your Vision Audio before a key moment and make one micro decision from that place.',
    icon: Zap,
    category: 'activations',
    defaultDeepLink: '/life-vision/active/audio/sets',
    defaultDaysOfWeek: [1, 2, 3, 4, 5],
    defaultTimeOfDay: '12:00',
    smsTemplate: 'Activation reminder: Listen to your Vision Audio before your next key moment. {link}',
  },
  {
    type: 'night_immersion',
    label: 'Night Sleep Immersion + Evidence Journal',
    description: 'Read your Life Vision, journal evidence of alignment, update your Vision Board, and sleep to your immersion track.',
    icon: Moon,
    category: 'activations',
    defaultDeepLink: '/journal/new',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '21:00',
    smsTemplate: 'Time for your Night Immersion. Journal your evidence and drift off to your vision: {link}',
  },

  // ── Connections ──
  {
    type: 'vibe_tribe_post',
    label: 'Vibe Tribe Post',
    description: 'Share a win, wobble, vision, or collaboration with the community.',
    icon: UsersRound,
    category: 'connections',
    defaultDeepLink: '/vibe-tribe/new',
    defaultDaysOfWeek: [3],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Time for your Vibe Tribe post! Share with the community: {link}',
  },
  {
    type: 'vibe_tribe_engage',
    label: 'Vibe Tribe Engagement',
    description: 'Comment on or heart posts from fellow members.',
    icon: Heart,
    category: 'connections',
    defaultDeepLink: '/vibe-tribe',
    defaultDaysOfWeek: [2, 4],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Drop into the Vibe Tribe and connect with the community: {link}',
  },

  // ── Sessions ──
  {
    type: 'alignment_gym',
    label: 'Alignment Gym',
    description: 'Attend the live weekly group coaching session or watch the replay.',
    icon: Video,
    category: 'sessions',
    defaultDeepLink: '/alignment-gym',
    defaultDaysOfWeek: [4],
    defaultTimeOfDay: '19:00',
    smsTemplate: 'The Alignment Gym is on! Join live or catch the replay: {link}',
  },

  // ── Creations ──
  {
    type: 'journal_entry',
    label: 'Journal Entry',
    description: 'Write, record audio, or record video in your journal.',
    icon: BookOpen,
    category: 'creations',
    defaultDeepLink: '/journal/new',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '21:00',
    smsTemplate: 'Time for your Journal entry. Capture what aligned today: {link}',
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
    smsTemplate: 'Start your day with a Daily Paper entry: {link}',
  },
  {
    type: 'vision_board_update',
    label: 'Vision Board Update',
    description: 'Review tiles, mark actualized items, add new desires.',
    icon: Image,
    category: 'creations',
    defaultDeepLink: '/vision-board',
    defaultDaysOfWeek: [0],
    defaultTimeOfDay: '10:00',
    smsTemplate: 'Time to update your Vision Board. Review and refresh your desires: {link}',
  },
  {
    type: 'vision_audio',
    label: 'Vision Audio Listen',
    description: 'Listen to your full Life Vision audio or a category-specific track.',
    icon: Headphones,
    category: 'creations',
    defaultDeepLink: '/life-vision/active/audio/sets',
    defaultDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    defaultTimeOfDay: '07:30',
    smsTemplate: 'Listen to your Vision Audio and step into The Life I Choose: {link}',
  },
  {
    type: 'life_vision_update',
    label: 'Life Vision Review',
    description: 'Read through and refine your Life Vision.',
    icon: Target,
    category: 'creations',
    defaultDeepLink: '/life-vision/active',
    defaultDaysOfWeek: [0],
    defaultTimeOfDay: '09:00',
    smsTemplate: 'Take a moment to review and refine your Life Vision: {link}',
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
    smsTemplate: 'Log your abundance moments for the week: {link}',
  },
]

export function getActivityDefinition(type: string): ActivityDefinition | undefined {
  return ACTIVITY_DEFINITIONS.find(a => a.type === type)
}

export function getActivitiesByCategory(category: MapCategory): ActivityDefinition[] {
  return ACTIVITY_DEFINITIONS.filter(a => a.category === category)
}
