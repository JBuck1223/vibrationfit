import type { SeoCluster } from './types'

/**
 * The 25-page SEO + PPC roadmap with the Semrush keyword data it was chosen
 * from (US database, pulled 2026-10-21). `path` matches `SeoPage.path` once
 * the page is built; the admin area joins the two.
 *
 * kd = Semrush keyword difficulty (0–100), cpc in USD, vol = monthly US searches.
 * `spiky` marks volumes inflated by a single-month spike.
 */

export type KeywordStat = { keyword: string; vol: number; kd: number | null; cpc: number; spiky?: boolean }

export type RoadmapEntry = {
  n: number
  cluster: SeoCluster
  hub?: boolean
  title: string
  path: string
  wave: 1 | 2 | 3
  feature: string
  tool?: string
  keywords: KeywordStat[]
  note?: string
}

export const SEMRUSH_PULLED_AT = '2026-10-21'

/** Vision board searches peak around New Year; that cluster must be live first. */
export const VISION_BOARD_DEADLINE = '2026-11-25'

export const CLUSTER_LABELS: Record<SeoCluster, string> = {
  'vision-board': 'Vision Board',
  affirmations: 'Affirmations',
  manifestation: 'Manifestation',
  journaling: 'Journaling',
  'law-of-attraction': 'Law of Attraction',
  'conscious-creation': 'Conscious Creation',
}

export const ROADMAP: RoadmapEntry[] = [
  // Vision Board
  { n: 1, cluster: 'vision-board', hub: true, title: 'Vision board', path: 'vision-boards', wave: 1, feature: 'Vision Board', tool: 'Mini board builder',
    keywords: [{ keyword: 'vision board', vol: 74000, kd: 67, cpc: 0.95 }, { keyword: 'what is a vision board', vol: 8100, kd: 38, cpc: 0.22 }, { keyword: 'dream board', vol: 2400, kd: 28, cpc: 0.37 }, { keyword: 'vision boards', vol: 8100, kd: null, cpc: 0.95 }] },
  { n: 2, cluster: 'vision-board', title: 'How to make a vision board', path: 'vision-boards/how-to-make', wave: 1, feature: 'Vision Board → Life Vision', tool: 'Step checklist',
    keywords: [{ keyword: 'how to make a vision board', vol: 165000, kd: 36, cpc: 0.32, spiky: true }, { keyword: 'how to create a vision board', vol: 4400, kd: null, cpc: 0.46 }, { keyword: 'how to build a vision board', vol: 2900, kd: null, cpc: 0.37 }, { keyword: 'create a vision board', vol: 1000, kd: 55, cpc: 0.74 }] },
  { n: 3, cluster: 'vision-board', title: 'Vision board ideas', path: 'vision-boards/ideas', wave: 1, feature: '12 life categories', tool: 'Idea gallery',
    keywords: [{ keyword: 'vision board ideas', vol: 27100, kd: 45, cpc: 0.16 }, { keyword: 'vision board inspo', vol: 2400, kd: null, cpc: 0.69 }, { keyword: '2026 vision board ideas', vol: 1600, kd: null, cpc: 0 }, { keyword: 'vision board words', vol: 880, kd: 12, cpc: 0 }] },
  { n: 4, cluster: 'vision-board', title: 'Vision board examples & pictures', path: 'vision-boards/examples', wave: 1, feature: 'Member boards', tool: 'Gallery',
    keywords: [{ keyword: 'vision board pictures', vol: 9900, kd: 48, cpc: 0.47 }, { keyword: 'vision board examples', vol: 6600, kd: 48, cpc: 0.5 }, { keyword: 'vision board images', vol: 6600, kd: null, cpc: 0.47 }] },
  { n: 5, cluster: 'vision-board', title: 'Vision board template', path: 'vision-boards/template', wave: 1, feature: 'Board export', tool: 'Free printable',
    keywords: [{ keyword: 'vision board template', vol: 6600, kd: 36, cpc: 1.17 }, { keyword: 'canva vision board template', vol: 5400, kd: null, cpc: 0 }] },
  { n: 6, cluster: 'vision-board', title: 'Digital vision board app', path: 'vision-boards/app', wave: 1, feature: 'Vision Board', tool: 'Live board builder',
    keywords: [{ keyword: 'digital vision board', vol: 2400, kd: 41, cpc: 1.13 }, { keyword: 'vision board maker', vol: 2400, kd: 27, cpc: 1.07 }, { keyword: 'electronic vision board', vol: 1900, kd: null, cpc: 1.13 }, { keyword: 'vision board app', vol: 1300, kd: 36, cpc: 0.64 }, { keyword: 'vision board generator', vol: 1000, kd: null, cpc: 1.1 }, { keyword: 'online vision board', vol: 880, kd: 29, cpc: 1.13 }],
    note: 'No paid advertisers found in Semrush for "vision board app".' },
  { n: 7, cluster: 'vision-board', title: '2027 vision board', path: 'vision-boards/2027', wave: 1, feature: 'New-year board', tool: 'Board template',
    keywords: [{ keyword: 'vision board 2026 (proxy for 2027)', vol: 2400, kd: 20, cpc: 0.44 }, { keyword: '2026 vision board', vol: 3600, kd: null, cpc: 1.41 }],
    note: 'The 2027 term shows ~0 today and will spike in December, like 2026 did.' },
  // Affirmations
  { n: 8, cluster: 'affirmations', hub: true, title: 'Positive affirmations', path: 'affirmations', wave: 1, feature: 'Incantations, Audio', tool: 'Affirmation generator',
    keywords: [{ keyword: 'positive affirmations', vol: 60500, kd: 18, cpc: 0.81 }, { keyword: 'affirmations', vol: 33100, kd: 62, cpc: 2.77 }, { keyword: 'positive affirmation', vol: 5400, kd: null, cpc: 0.81 }, { keyword: 'positive affirmations for the day', vol: 1900, kd: null, cpc: 0.25 }, { keyword: 'short positive affirmations', vol: 1600, kd: null, cpc: 4.04 }],
    note: 'Paid results are almost all churches (Ad Grants): an uncontested paid market.' },
  { n: 9, cluster: 'affirmations', title: 'Positive affirmations for women', path: 'affirmations/women', wave: 2, feature: 'Incantations', tool: 'Generator preset',
    keywords: [{ keyword: 'positive affirmations for women', vol: 12100, kd: 30, cpc: 0.16 }, { keyword: 'affirmations for women', vol: 4400, kd: 38, cpc: 0.03 }] },
  { n: 10, cluster: 'affirmations', title: 'Morning affirmations', path: 'affirmations/morning', wave: 2, feature: 'Daily Paper + Audio', tool: 'Morning routine',
    keywords: [{ keyword: 'morning affirmations', vol: 6600, kd: 52, cpc: 4.03 }, { keyword: 'positive morning affirmations', vol: 1300, kd: null, cpc: 4.03 }] },
  { n: 11, cluster: 'affirmations', title: 'Self love affirmations', path: 'affirmations/self-love', wave: 2, feature: 'Incantations', tool: 'Generator preset',
    keywords: [{ keyword: 'self love affirmations', vol: 2900, kd: 16, cpc: 0.48 }, { keyword: 'affirmations for self love', vol: 2400, kd: 23, cpc: 0.48 }] },
  { n: 12, cluster: 'affirmations', title: 'Abundance mindset & money affirmations', path: 'affirmations/abundance-money', wave: 2, feature: 'Abundance Tracker',
    keywords: [{ keyword: 'abundance mindset', vol: 2400, kd: 34, cpc: 1.09 }, { keyword: 'money affirmations', vol: 2400, kd: 35, cpc: 3.77 }, { keyword: 'how to manifest money', vol: 1000, kd: 27, cpc: 0.52 }, { keyword: 'wealth affirmations', vol: 720, kd: 31, cpc: 0.35 }, { keyword: 'abundance affirmations', vol: 720, kd: 26, cpc: 0.07 }],
    note: 'No guaranteed-income claims in ads or copy.' },
  // Manifestation
  { n: 13, cluster: 'manifestation', hub: true, title: 'Manifestation / how to manifest', path: 'manifestation', wave: 2, feature: 'Full loop', tool: 'Manifestation starter',
    keywords: [{ keyword: 'manifestation', vol: 33100, kd: 32, cpc: 0.64 }, { keyword: 'how to manifest', vol: 6600, kd: 34, cpc: 0.32 }, { keyword: 'how to manifest something', vol: 4400, kd: 32, cpc: 0.03 }, { keyword: 'what is manifestation', vol: 2900, kd: 36, cpc: 0.29 }],
    note: 'No paid advertisers found in Semrush for "manifestation".' },
  { n: 14, cluster: 'manifestation', title: 'Law of assumption', path: 'manifestation/law-of-assumption', wave: 2, feature: 'Stories, Meditations',
    keywords: [{ keyword: 'law of assumption', vol: 6600, kd: 28, cpc: 1.01 }] },
  { n: 15, cluster: 'manifestation', title: '369 method', path: 'manifestation/369-method', wave: 3, feature: 'Incantations', tool: '369 tracker',
    keywords: [{ keyword: '369 method', vol: 2900, kd: 41, cpc: 0.88 }, { keyword: '369 manifestation method', vol: 1000, kd: 19, cpc: 0.65 }] },
  { n: 16, cluster: 'manifestation', title: 'Manifestation techniques & methods', path: 'manifestation/techniques', wave: 3, feature: 'Stories', tool: 'Script generator',
    keywords: [{ keyword: 'manifestation techniques', vol: 1000, kd: 32, cpc: 0.24 }, { keyword: 'manifestation methods', vol: 1000, kd: 27, cpc: 0.24 }, { keyword: 'scripting manifestation', vol: 590, kd: 30, cpc: 1.85 }, { keyword: '55x5 method', vol: 90, kd: 16, cpc: 0 }] },
  { n: 17, cluster: 'manifestation', title: 'Manifestation journal', path: 'manifestation/journal', wave: 2, feature: 'Journal', tool: 'Prompts',
    keywords: [{ keyword: 'manifestation journal', vol: 1900, kd: 27, cpc: 0.39 }, { keyword: 'manifestation journal prompts', vol: 320, kd: 6, cpc: 0.23 }] },
  { n: 18, cluster: 'manifestation', title: 'Manifestation quotes', path: 'manifestation/quotes', wave: 3, feature: 'Shareable cards',
    keywords: [{ keyword: 'manifestation quotes', vol: 1600, kd: 13, cpc: 0.08 }] },
  // Journaling
  { n: 19, cluster: 'journaling', hub: true, title: 'Gratitude journal', path: 'journaling/gratitude', wave: 1, feature: 'Journal', tool: 'Daily gratitude prompt',
    keywords: [{ keyword: 'gratitude journal', vol: 33100, kd: 23, cpc: 0.58 }, { keyword: 'gratitude journal prompts', vol: 2900, kd: 20, cpc: 0.27 }] },
  { n: 20, cluster: 'journaling', title: 'Journal prompts', path: 'journaling/prompts', wave: 2, feature: 'Journal (video/audio)', tool: 'Prompt generator',
    keywords: [{ keyword: 'journal prompts', vol: 22200, kd: 38, cpc: 0 }, { keyword: 'how to start journaling', vol: 135000, kd: 54, cpc: 0.14, spiky: true }] },
  { n: 21, cluster: 'journaling', title: 'Shadow work prompts', path: 'journaling/shadow-work', wave: 3, feature: 'Journal, VIVA',
    keywords: [{ keyword: 'shadow work prompts', vol: 2400, kd: 16, cpc: 0.35 }] },
  // Law of Attraction
  { n: 22, cluster: 'law-of-attraction', hub: true, title: 'Law of attraction', path: 'law-of-attraction', wave: 3, feature: 'Whole system',
    keywords: [{ keyword: 'law of attraction', vol: 22200, kd: 58, cpc: 1.47 }, { keyword: 'what is the law of attraction', vol: 2400, kd: 52, cpc: 0.19 }] },
  { n: 23, cluster: 'law-of-attraction', title: 'How to raise your vibration', path: 'law-of-attraction/raise-your-vibration', wave: 3, feature: 'Vibration Assessment', tool: 'Mini vibration check',
    keywords: [{ keyword: 'how to raise your vibration', vol: 1300, kd: 11, cpc: 0.52 }, { keyword: 'vibrational frequency', vol: 1300, kd: 31, cpc: 0.48 }, { keyword: 'high vibration', vol: 880, kd: 16, cpc: 0.18 }, { keyword: 'raise your vibration', vol: 720, kd: 12, cpc: 0.6 }, { keyword: 'law of vibration', vol: 590, kd: 23, cpc: 0 }] },
  { n: 24, cluster: 'conscious-creation', title: 'Wheel of life', path: 'conscious-creation/wheel-of-life', wave: 3, feature: '12 categories', tool: 'Wheel scorer',
    keywords: [{ keyword: 'wheel of life', vol: 6600, kd: 50, cpc: 4.13 }, { keyword: 'wheel of life assessment', vol: 880, kd: 23, cpc: 5.6 }, { keyword: 'areas of life', vol: 880, kd: 14, cpc: 0 }],
    note: 'Highest CPC in the plan — cap bids.' },
  { n: 25, cluster: 'conscious-creation', title: 'Vision statement examples', path: 'conscious-creation/life-vision', wave: 3, feature: 'Life Vision', tool: 'Statement starter',
    keywords: [{ keyword: 'vision statement examples', vol: 3600, kd: 27, cpc: 0.38 }, { keyword: 'personal vision statement', vol: 390, kd: 36, cpc: 0 }, { keyword: 'life vision', vol: 390, kd: 24, cpc: 0.55 }] },
]

/** Researched but parked: too competitive for a new domain. */
export const PARKED_KEYWORDS: KeywordStat[] = [
  { keyword: 'box breathing', vol: 33100, kd: 80, cpc: 0.58 },
  { keyword: 'guided meditation', vol: 22200, kd: 79, cpc: 1.57 },
  { keyword: 'sleep meditation', vol: 18100, kd: 62, cpc: 0.68 },
  { keyword: 'breathwork', vol: 12100, kd: 73, cpc: 1.55 },
  { keyword: 'manifest', vol: 110000, kd: 93, cpc: 0.65 },
  { keyword: 'angel numbers', vol: 74000, kd: 61, cpc: 0.18 },
]

export function clusterVolume(entry: RoadmapEntry): number {
  return entry.keywords.filter(k => !k.spiky).reduce((sum, k) => sum + k.vol, 0)
}
