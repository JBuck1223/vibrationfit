import {
  BookOpen,
  Headphones,
  LayoutGrid,
  Music,
  Quote,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const ACTIVATION_ASSET_GROUPS: Array<{
  heading: string
  color: string
  items: Array<{ icon: LucideIcon; title: string; detail: string }>
}> = [
  {
    heading: 'Read it. Speak it.',
    color: '#39FF14',
    items: [
      {
        icon: ScrollText,
        title: 'Life I Choose',
        detail: 'the life you\u2019re choosing, in your words',
      },
      {
        icon: BookOpen,
        title: 'Future-Self Story',
        detail: 'a story you can step into',
      },
      {
        icon: Quote,
        title: 'Incantation',
        detail: 'words you speak until they feel like you',
      },
      {
        icon: Sparkles,
        title: 'SparkQuery',
        detail: 'a question that opens what\u2019s next',
      },
    ],
  },
  {
    heading: 'Hear it. See it.',
    color: '#BF00FF',
    items: [
      {
        icon: Headphones,
        title: 'Vision Audio',
        detail: 'your vision, spoken so you can listen',
      },
      {
        icon: Music,
        title: 'Personalized Song',
        detail: 'a song written from your vision',
      },
      {
        icon: LayoutGrid,
        title: 'Vision Board',
        detail: 'pictures of the life you\u2019re choosing',
      },
    ],
  },
]
