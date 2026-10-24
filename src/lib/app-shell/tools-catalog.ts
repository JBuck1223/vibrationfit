/**
 * The Tool Box: every creation surface in the app, searchable and grouped
 * into Capture, Shift and Audio. Listen is where members enjoy content; the
 * Tool Box is where they make it.
 */

import {
  BookOpen,
  DollarSign,
  FileText,
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

/** How the Tool Box groups tools. */
export type ToolGroup = 'capture' | 'shift' | 'audio'

export const TOOL_GROUPS: { id: ToolGroup; label: string; description: string }[] = [
  { id: 'capture', label: 'Capture', description: 'Get it down: what you notice, choose and receive.' },
  { id: 'shift', label: 'Shift', description: 'Create what moves you toward the life you choose.' },
  { id: 'audio', label: 'Audio', description: 'Record your voice and mix your tracks.' },
]

export interface ToolEntry {
  id: string
  name: string
  description: string
  href: string
  icon: LucideIcon
  accent: ToolAccent
  group: ToolGroup
  /** Words search should also match. */
  keywords: string[]
}

export const TOOLS: ToolEntry[] = [
  {
    id: 'journal',
    group: 'capture',
    name: 'Journal',
    description: 'Capture what is on your mind.',
    href: '/journal/new',
    icon: BookOpen,
    accent: 'brand',
    keywords: ['write', 'entry', 'reflect'],
  },
  {
    id: 'daily-paper',
    group: 'capture',
    name: 'Daily Paper',
    description: 'Gratitude, your top three, and one fun thing.',
    href: '/daily-paper/new',
    icon: FileText,
    accent: 'brand',
    keywords: ['gratitude', 'plan', 'today', 'tasks'],
  },
  {
    id: 'abundance',
    group: 'capture',
    name: 'Abundance Tracker',
    description: 'Record money and value as it arrives.',
    href: '/abundance-tracker/new',
    icon: DollarSign,
    accent: 'brand',
    keywords: ['money', 'value', 'wins', 'receipt'],
  },
  {
    id: 'viva',
    group: 'shift',
    name: 'VIVA',
    description: 'Talk it through with your guide.',
    href: '/viva',
    icon: Sparkles,
    accent: 'viva',
    keywords: ['guide', 'coach', 'chat', 'talk', 'conversation'],
  },
  {
    id: 'manifestations',
    group: 'shift',
    name: 'Manifestations',
    description: 'Make what you are calling in visible.',
    href: '/manifestations/new',
    icon: ImageIcon,
    accent: 'brand',
    keywords: ['vision board', 'image', 'picture', 'board'],
  },
  {
    id: 'life-vision',
    group: 'shift',
    name: 'Life Vision',
    description: 'Write or refine the life you choose.',
    href: '/life-vision/update',
    icon: Target,
    accent: 'brand',
    keywords: ['vision', 'the life i choose', 'write', 'refine'],
  },
  {
    id: 'stories',
    group: 'shift',
    name: 'Stories',
    description: 'Future-self stories in your voice.',
    href: '/story/new',
    icon: Library,
    accent: 'brand',
    keywords: ['story', 'future self', 'narrative'],
  },
  {
    id: 'meditations',
    group: 'shift',
    name: 'Meditations',
    description: 'Build a breath-paced meditation track.',
    href: '/meditations',
    icon: Wind,
    accent: 'brand',
    keywords: ['breath', 'breathing', 'focus', 'calm', 'track studio'],
  },
  {
    id: 'songs',
    group: 'shift',
    name: 'Songs',
    description: 'Write lyrics and generate your song.',
    href: '/audio/songwriter',
    icon: Music2,
    accent: 'brand',
    keywords: ['music', 'songwriter', 'lyrics'],
  },
  {
    id: 'incantations',
    group: 'shift',
    name: 'Incantations',
    description: 'Short spoken lines to shift your state.',
    href: '/story/new?kind=incantation',
    icon: Mic,
    accent: 'brand',
    keywords: ['affirmation', 'spoken', 'mantra'],
  },
  {
    id: 'queries',
    group: 'shift',
    name: 'Queries',
    description: 'Questions that spark a better feeling.',
    href: '/story/new?kind=spark_query',
    icon: Lightbulb,
    accent: 'brand',
    keywords: ['spark', 'question', 'prompt'],
  },
  {
    id: 'audio-record',
    group: 'audio',
    name: 'Record',
    description: 'Record your own voice for any track.',
    href: '/audio/record',
    icon: Headphones,
    accent: 'brand',
    keywords: ['voice', 'recording', 'audio'],
  },
  {
    id: 'audio-mix',
    group: 'audio',
    name: 'Mix',
    description: 'Blend voice, music and ambience.',
    href: '/audio/mix',
    icon: Sliders,
    accent: 'brand',
    keywords: ['mixer', 'background', 'ambience', 'audio'],
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
