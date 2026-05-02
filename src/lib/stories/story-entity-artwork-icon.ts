import type { LucideIcon } from 'lucide-react'
import { BookOpen, Clock, Image, Lightbulb, Target } from 'lucide-react'
import type { StoryEntityType } from './types'

/** Lucide icon per story `entity_type` (matches story pickers / audio ENTITY badges). */
const STORY_ENTITY_ARTWORK_ICON: Record<StoryEntityType, LucideIcon> = {
  life_vision: Target,
  vision_board_item: Image,
  goal: BookOpen,
  schedule_block: Clock,
  journal_entry: BookOpen,
  custom: Lightbulb,
}

export function isStoryEntityTypeKey(key: string): key is StoryEntityType {
  return key in STORY_ENTITY_ARTWORK_ICON
}

export function getStoryEntityArtworkIcon(type: StoryEntityType): LucideIcon {
  return STORY_ENTITY_ARTWORK_ICON[type]
}
