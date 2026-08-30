import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { getVisionCategory } from '@/lib/design-system/vision-categories'

export type LifeCategoryPhoto = {
  key: LifeCategoryKey
  label: string
  src: string
  alt: string
  focus: string
  width: number
  height: number
}

const ENTRIES: Array<{
  key: LifeCategoryKey
  file: string
  alt: string
  focus: string
  width: number
  height: number
}> = [
  { key: 'fun', file: 'fun-v2.jpg', alt: 'Catching a largemouth bass on the water', focus: 'center 35%', width: 1500, height: 2000 },
  { key: 'health', file: 'health-v2.jpg', alt: 'Carrying the kids on a trail walk', focus: 'center 22%', width: 1500, height: 2000 },
  { key: 'travel', file: 'travel-v2.jpg', alt: 'Family in front of Cinderella Castle', focus: 'center 30%', width: 2000, height: 1500 },
  { key: 'love', file: 'love-v2.jpg', alt: 'Family on the beach at sunset', focus: 'center 40%', width: 2000, height: 1500 },
  { key: 'family', file: 'family-v2.jpg', alt: 'Family selfie together', focus: 'center 30%', width: 1500, height: 2000 },
  { key: 'social', file: 'social-v2.jpg', alt: 'Family and friends out on the boat', focus: 'center 40%', width: 2000, height: 1500 },
  { key: 'home', file: 'home-v2.jpg', alt: 'Family gathered on the pontoon', focus: 'center 35%', width: 2000, height: 1500 },
  { key: 'work', file: 'work-v2.jpg', alt: 'Family day at Magic Kingdom', focus: 'center 28%', width: 2000, height: 1500 },
  { key: 'money', file: 'money-v2.jpg', alt: 'A full boat day on the waterway', focus: 'center 45%', width: 2000, height: 1500 },
  { key: 'stuff', file: 'stuff-v2.jpg', alt: 'Family stop at Buc-ee\'s', focus: 'center 35%', width: 2000, height: 1498 },
  { key: 'giving', file: 'giving-v2.jpg', alt: 'Holding hands under the garden pergola', focus: 'center 28%', width: 1500, height: 2000 },
  { key: 'spirituality', file: 'spirituality-v2.jpg', alt: 'Family in a field of daffodils', focus: 'center 40%', width: 2000, height: 1500 },
]

export const LIFE_CATEGORY_PHOTOS: LifeCategoryPhoto[] = ENTRIES.map((entry) => ({
  key: entry.key,
  label: getVisionCategory(entry.key)?.label ?? entry.key,
  src: `https://media.vibrationfit.com/site-assets/home-preview/life-categories/${entry.file}`,
  alt: entry.alt,
  focus: entry.focus,
  width: entry.width,
  height: entry.height,
}))
