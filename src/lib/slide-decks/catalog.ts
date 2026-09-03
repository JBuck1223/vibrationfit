export type SlideDeckUsage = {
  label: string
  href: string
}

export type SlideDeck = {
  slug: string
  title: string
  shortTitle: string
  description: string
  slideCount: number
  publicPath: string
  usedIn: SlideDeckUsage[]
}

export const SLIDE_DECKS: SlideDeck[] = [
  {
    slug: 'journey-to-conscious-allower',
    title: 'The Journey to Conscious Allower',
    shortTitle: 'Conscious Allower',
    description: 'The seven stages from Unaware to Conscious Allower.',
    slideCount: 27,
    publicPath: '/slide-decks/journey-to-conscious-allower.html',
    usedIn: [
      {
        label: 'Alignment Gym',
        href: '/alignment-gym/256cb678-d743-49f1-95a0-f4c0bf1aceff',
      },
    ],
  },
  {
    slug: 'how-you-become-you',
    title: 'How You Become You & the A.U.R.A. Process',
    shortTitle: 'How You Become You',
    description: 'How identity forms, and the A.U.R.A. process that follows.',
    slideCount: 41,
    publicPath: '/slide-decks/how-you-become-you.html',
    usedIn: [],
  },
  {
    slug: 'your-life-lens',
    title: 'Your Life Lens',
    shortTitle: 'Your Life Lens',
    description: 'Teaching deck for seeing life through the Vibration Fit lens.',
    slideCount: 55,
    publicPath: '/slide-decks/your-life-lens.html',
    usedIn: [],
  },
  {
    slug: 'my-life-lens',
    title: 'The Magic Lens',
    shortTitle: 'The Magic Lens',
    description: 'The Magic Lens cut of the Life Lens teaching.',
    slideCount: 14,
    publicPath: '/slide-decks/my-life-lens.html',
    usedIn: [],
  },
  {
    slug: 'total-freedom',
    title: 'Live a Life of Total Freedom',
    shortTitle: 'Total Freedom',
    description: 'The four freedoms, vibrational momentum, and the Activation Intensive.',
    slideCount: 100,
    publicPath: '/slide-decks/total-freedom.html',
    usedIn: [],
  },
  {
    slug: 'remember-who-you-are',
    title: 'Remember Who You Are',
    shortTitle: 'Remember Who You Are',
    description: 'Disney stories teaching deck.',
    slideCount: 5,
    publicPath: '/slide-decks/remember-who-you-are.html',
    usedIn: [],
  },
]

export function getSlideDeck(slug: string): SlideDeck | undefined {
  return SLIDE_DECKS.find(deck => deck.slug === slug)
}

export function slideDeckAdminHref(slug: string): string {
  return `/admin/slide-decks/${slug}`
}
