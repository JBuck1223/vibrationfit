import { ListMusic, AudioLines, Mic, Clock, Eye, Headphones } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const AUDIO_NAV_ICONS: Record<string, LucideIcon> = {
  audioSets: ListMusic,
  generate: AudioLines,
  record: Mic,
  queue: Clock,
  mix: Headphones,
  viewVision: Eye,
}
