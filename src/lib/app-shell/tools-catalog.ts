/**
 * The Tools directory: every creation surface in the app, searchable.
 * Listen is where members enjoy content; Tools is where they make it.
 */

import {
  BookOpen,
  Headphones,
  Image as ImageIcon,
  Lightbulb,
  Library,
  Mic,
  Music2,
  Sliders,
  Sparkles,
  Target,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolAccent = 'brand' | 'viva'

export interface ToolEntry {
  id: string
  name: string
  description: string
  href: string
  icon: LucideIcon
  accent: ToolAccent
  /** Words search should also match. */
  keywords: string[]
}

export const TOOLS: ToolEntry[] = [
  {
    id: 'viva',
    name: 'VIVA',
    description: 'Talk it through with your coach.',
    href: '/viva',
    icon: Sparkles,
    accent: 'viva',
    keywords: ['coach', 'chat', 'talk', 'conversation'],
  },
  {
    id: 'manifestations',
    name: 'Manifestations',
    description: 'Make what you are calling in visible.',
    href: '/manifestations/new',
    icon: ImageIcon,
    accent: 'brand',
    keywords: ['vision board', 'image', 'picture', 'board'],
  },
  {
    id: 'life-vision',
    name: 'Life Vision',
    description: 'Write or refine the life you choose.',
    href: '/life-vision/update',
    icon: Target,
    accent: 'brand',
    keywords: ['vision', 'the life i choose', 'write', 'refine'],
  },
  {
    id: 'stories',
    name: 'Stories',
    description: 'Future-self stories in your voice.',
    href: '/story/new',
    icon: Library,
    accent: 'brand',
    keywords: ['story', 'future self', 'narrative'],
  },
  {
    id: 'meditations',
    name: 'Meditations',
    description: 'Build a breath-paced meditation track.',
    href: '/meditations',
    icon: Wind,
    accent: 'brand',
    keywords: ['breath', 'breathing', 'focus', 'calm', 'track studio'],
  },
  {
    id: 'songs',
    name: 'Songs',
    description: 'Write lyrics and generate your song.',
    href: '/audio/songwriter',
    icon: Music2,
    accent: 'brand',
    keywords: ['music', 'songwriter', 'lyrics'],
  },
  {
    id: 'incantations',
    name: 'Incantations',
    description: 'Short spoken lines to shift your state.',
    href: '/story/new?kind=incantation',
    icon: Mic,
    accent: 'brand',
    keywords: ['affirmation', 'spoken', 'mantra'],
  },
  {
    id: 'queries',
    name: 'Queries',
    description: 'Questions that spark a better feeling.',
    href: '/story/new?kind=spark_query',
    icon: Lightbulb,
    accent: 'brand',
    keywords: ['spark', 'question', 'prompt'],
  },
  {
    id: 'audio-record',
    name: 'Record',
    description: 'Record your own voice for any track.',
    href: '/audio/record',
    icon: Headphones,
    accent: 'brand',
    keywords: ['voice', 'recording', 'audio'],
  },
  {
    id: 'audio-mix',
    name: 'Mix',
    description: 'Blend voice, music and ambience.',
    href: '/audio/mix',
    icon: Sliders,
    accent: 'brand',
    keywords: ['mixer', 'background', 'ambience', 'audio'],
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Capture what is on your mind.',
    href: '/journal/new',
    icon: BookOpen,
    accent: 'brand',
    keywords: ['write', 'entry', 'reflect'],
  },
]

export function searchTools(query: string): ToolEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return TOOLS
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q)),
  )
}
