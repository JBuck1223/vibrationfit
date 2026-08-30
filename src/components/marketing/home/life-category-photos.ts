import type { LucideIcon } from 'lucide-react'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { getVisionCategory, getVisionCategoryIcon } from '@/lib/design-system/vision-categories'

export type LifeCategoryPhoto = {
  key: LifeCategoryKey
  label: string
  icon: LucideIcon
  src: string
  alt: string
  focus: string
  width: number
  height: number
}

const ENTRIES: Array<{
  key: LifeCategoryKey
  src: string
  alt: string
  focus: string
  width: number
  height: number
}> = [
  {
    key: 'fun',
    src: '/home-preview/photos/skydive-engagement.jpg',
    alt: 'Jordan and Vanessa skydiving together',
    focus: 'center 35%',
    width: 1536,
    height: 1024,
  },
  {
    key: 'health',
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-3-actualized.jpg',
    alt: 'Jordan and Vanessa on the beach, fit and aligned',
    focus: 'center 28%',
    width: 1600,
    height: 1200,
  },
  {
    key: 'travel',
    src: '/home-preview/photos/travel-mountains.png',
    alt: 'Family on a mountain path with pine trees and open sky',
    focus: 'center 28%',
    width: 768,
    height: 1024,
  },
  {
    key: 'love',
    src: '/home-preview/photos/australia-cliff-kiss.jpg',
    alt: 'Jordan and Vanessa kissing on a cliff in Australia',
    focus: '82% 42%',
    width: 1024,
    height: 576,
  },
  {
    key: 'family',
    src: '/home-preview/photos/family-sunset-rocks.jpg',
    alt: 'Jordan, Vanessa, and the kids on the rocks at the beach',
    focus: 'center 32%',
    width: 682,
    height: 1024,
  },
  {
    key: 'social',
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/social-v2.jpg',
    alt: 'Family and friends at Hollywood Studios',
    focus: 'center 40%',
    width: 2000,
    height: 1500,
  },
  {
    key: 'home',
    src: '/home-preview/photos/home-kitchen.png',
    alt: 'Family gathered around the kitchen table',
    focus: 'center 40%',
    width: 1024,
    height: 768,
  },
  {
    key: 'work',
    src: '/home-preview/photos/work-studio.png',
    alt: 'Jordan and Vanessa on set with a professional camera',
    focus: 'center 38%',
    width: 1024,
    height: 682,
  },
  {
    key: 'money',
    src: '/home-preview/photos/money-adeline.png',
    alt: 'Adeline smiling and holding cash',
    focus: 'center 28%',
    width: 768,
    height: 1024,
  },
  {
    key: 'stuff',
    src: '/home-preview/photos/stuff-golf-cart.png',
    alt: 'Vanessa and the kids on the golf cart',
    focus: 'center 42%',
    width: 1024,
    height: 768,
  },
  {
    key: 'giving',
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-actualized.jpg',
    alt: 'Family together in the snow at the mountain chalet',
    focus: 'center 38%',
    width: 1600,
    height: 1200,
  },
  {
    key: 'spirituality',
    src: '/home-preview/photos/spirituality-yoga.png',
    alt: 'The kids practicing yoga',
    focus: 'center 32%',
    width: 768,
    height: 1024,
  },
]

export const LIFE_CATEGORY_PHOTOS: LifeCategoryPhoto[] = ENTRIES.map((entry) => ({
  key: entry.key,
  label: getVisionCategory(entry.key)?.label ?? entry.key,
  icon: getVisionCategoryIcon(entry.key),
  src: entry.src,
  alt: entry.alt,
  focus: entry.focus,
  width: entry.width,
  height: entry.height,
}))
