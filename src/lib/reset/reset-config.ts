// Reset ("Phoenix") feature configuration.
// Registry of the suggested items a member can include in a Reset, mirroring the
// step-mapping pattern used by the Activation Intensive. Icons are Lucide names
// resolved in the UI.

export type ResetItemType =
  | 'profile'
  | 'life_vision'
  | 'vision_board'
  | 'audio'
  | 'project'
  | 'map'

export interface ResetItemConfig {
  type: ResetItemType
  label: string
  description: string
  href: string
  icon: string // Lucide icon name
  defaultSelected: boolean
}

export const RESET_ITEMS: ResetItemConfig[] = [
  {
    type: 'profile',
    label: 'Recommit Your Profile',
    description: 'Capture an honest snapshot of where your life is right now and commit a new version.',
    href: '/profile/create',
    icon: 'User',
    defaultSelected: true,
  },
  {
    type: 'life_vision',
    label: 'Refresh Your Life Vision',
    description: 'Re-imagine the life you choose and commit a new version of your vision.',
    href: '/life-vision/new/fun',
    icon: 'Sparkles',
    defaultSelected: true,
  },
  {
    type: 'vision_board',
    label: 'Update Your Vision Board',
    description: 'Add or refresh the images that represent your new life.',
    href: '/vision-board/create',
    icon: 'Image',
    defaultSelected: true,
  },
  {
    type: 'audio',
    label: 'Generate New Audio',
    description: 'Create fresh audio so you can listen your vision into reality.',
    href: '/audio/create',
    icon: 'Headphones',
    defaultSelected: true,
  },
  {
    type: 'project',
    label: 'Build a Project',
    description: 'Design a project with a task list that moves your new life forward.',
    href: '/projects',
    icon: 'FolderKanban',
    defaultSelected: false,
  },
  {
    type: 'map',
    label: 'Commit a New Habit',
    description: 'Use your MAP to commit to the rituals that build your new life.',
    href: '/map/update',
    icon: 'CalendarCheck',
    defaultSelected: false,
  },
]

export function getResetItemConfig(type: ResetItemType): ResetItemConfig | undefined {
  return RESET_ITEMS.find((i) => i.type === type)
}
