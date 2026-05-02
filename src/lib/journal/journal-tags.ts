import { Trophy, Eye, HeartHandshake } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type JournalTag = 'vision' | 'win' | 'wobble'

export interface JournalTagConfig {
  label: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
}

export const JOURNAL_TAG_CONFIG: Record<JournalTag, JournalTagConfig> = {
  vision: {
    label: 'Vision',
    description: 'Intentions, goals, declarations',
    icon: Eye,
    color: '#BF00FF',
    bgColor: 'rgba(191, 0, 255, 0.1)',
  },
  win: {
    label: 'Win',
    description: 'Evidence of actualization',
    icon: Trophy,
    color: '#39FF14',
    bgColor: 'rgba(57, 255, 20, 0.1)',
  },
  wobble: {
    label: 'Wobble',
    description: 'Challenges, growth edges',
    icon: HeartHandshake,
    color: '#00FFFF',
    bgColor: 'rgba(0, 255, 255, 0.1)',
  },
}

export const JOURNAL_TAGS: JournalTag[] = ['vision', 'win', 'wobble']
