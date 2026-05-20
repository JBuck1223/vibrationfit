import { Headphones, BookOpen, Heart, Video } from 'lucide-react'
import type { MapCategory } from './types'

export const PILLAR_ORDER: MapCategory[] = ['activations', 'creations', 'connections', 'sessions']

export const PILLAR_META: Record<
  string,
  {
    label: string
    verb: string
    color: string
    gradient: string
    example: string
    exampleIcon: typeof Headphones
  }
> = {
  activations: {
    label: 'Activations',
    verb: 'Activate',
    color: '#39FF14',
    gradient: 'from-[#39FF14]/10 to-transparent',
    example: 'Listen to Life Vision audio',
    exampleIcon: Headphones,
  },
  creations: {
    label: 'Creations',
    verb: 'Create',
    color: '#FFFF00',
    gradient: 'from-[#FFFF00]/10 to-transparent',
    example: 'Journal entry or Daily Paper',
    exampleIcon: BookOpen,
  },
  connections: {
    label: 'Connections',
    verb: 'Connect',
    color: '#BF00FF',
    gradient: 'from-[#BF00FF]/10 to-transparent',
    example: 'Heart or comment on another member\'s post',
    exampleIcon: Heart,
  },
  sessions: {
    label: 'Sessions',
    verb: 'Attend',
    color: '#00FFFF',
    gradient: 'from-[#00FFFF]/10 to-transparent',
    example: 'Alignment Gym (live or session page after)',
    exampleIcon: Video,
  },
}
