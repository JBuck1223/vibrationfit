/**
 * Curated Antarctica expedition resources — generated printables plus
 * verified books and links. Never invent titles/URLs beyond what is here.
 */

import type { EngagementTier } from './types'

export interface ExpeditionResource {
  title: string
  type: 'pdf' | 'book' | 'video' | 'podcast' | 'website' | 'supply'
  url?: string | null
  needs_parent_link?: boolean
  why_selected: string
  question_it_answers?: string
  runtime?: string | null
  /** Curation metadata — see curation.ts for the quality gates. */
  engagement_tier?: EngagementTier
  age_band?: string
  duration_minutes?: number | null
}

/**
 * The three print layers — generated live by /api/life-explorer/print/*,
 * always on-brand and ink-minimal. No static PDFs; the browser's print
 * dialog produces the PDF. The teacher guide is never printed: the lesson
 * screen IS the teacher guide.
 */
export const ANTARCTICA_PDFS: ExpeditionResource[] = [
  {
    title: 'Expedition Kit (print once at launch)',
    type: 'pdf',
    url: '/api/life-explorer/print/kit',
    why_selected:
      'Passport, Wonder Wall headers, expedition map, experiment sheets, completion certificate',
  },
  {
    title: 'Weekly Explorer Packet (print with the Sunday forecast)',
    type: 'pdf',
    url: '/api/life-explorer/print/week',
    why_selected:
      'Five field-notes day pages + reading cards at the current rung + expedition word cards',
  },
]

export const ANTARCTICA_BOOKS: ExpeditionResource[] = [
  {
    title: 'One Frozen Lake (Deborah Jo Larson)',
    type: 'book',
    url: 'https://www.amazon.com/One-Frozen-Lake-Deborah-Larson/dp/0873518667',
    needs_parent_link: false,
    why_selected:
      'Award-winning ice-fishing picture book (4.5★, ages 3-7) — grandpa and grandchild drill the hole, sort lures, and wait; patience is the point',
    question_it_answers: 'How does ice fishing work?',
    engagement_tier: 'verified',
    age_band: 'K-2',
  },
  {
    title: 'Fishing with Grandma (Susan Avingaq & Maren Vsetula)',
    type: 'book',
    url: 'https://www.kirkusreviews.com/book-reviews/susan-avingaq/fishing-with-grandma/',
    needs_parent_link: false,
    why_selected:
      'Kirkus-reviewed (ages 5-7) — Inuit kids learn real ice-fishing steps: test the ice, chisel the hole with a tuuq, skim it, jig with lures; includes a tool glossary',
    question_it_answers: 'How does ice fishing work?',
    engagement_tier: 'verified',
    age_band: 'K-2',
  },
  {
    title: 'Sophie Scott Goes South (Alison Lester)',
    type: 'book',
    url: 'https://www.amazon.com/Sophie-Scott-South-Alison-Lester/dp/0544088956',
    needs_parent_link: false,
    why_selected: 'The expedition-launch read-aloud — 4.9★, ages 6-9',
    question_it_answers: 'How do explorers learn about places they have never been?',
    engagement_tier: 'verified',
    age_band: 'K-2',
  },
  {
    title: 'Where Is Antarctica? (Sarah Fabiny, Who HQ)',
    type: 'book',
    url: 'https://www.penguinrandomhouse.com/books/565127/where-is-antarctica-by-sarah-fabiny-illustrated-by-jerry-hoare/',
    needs_parent_link: false,
    why_selected: 'The geography deep-read — Who HQ series',
    question_it_answers: 'Where is Antarctica and what makes it unique?',
    engagement_tier: 'verified',
    age_band: 'K-2',
  },
]

export const ANTARCTICA_LINKS: ExpeditionResource[] = [
  {
    title: 'PBS Nature – Penguins: Meet the Family',
    type: 'video',
    url: 'https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/',
    why_selected: 'Verified link from Penguin Blubber Experiment guide',
    question_it_answers: "Why don't penguins freeze?",
    engagement_tier: 'franchise',
    age_band: 'K-2',
  },
  {
    title: 'PBS LearningMedia – Animal Insulation Activity',
    type: 'website',
    url: 'https://static.pbslearningmedia.org/media/media_files/3d4ce992-c70e-4a6b-9178-20bcb28ca4d7/e8c63031-db26-4c6f-a8e4-adc4f51c9e95.pdf',
    why_selected: 'Verified teacher guide link from experiment PDF',
    question_it_answers: 'How does insulation / blubber slow heat loss?',
    engagement_tier: 'franchise',
    age_band: 'K-2',
  },
  {
    title: 'How Do Whales, Penguins, and Polar Bears Keep Warm? — SciShow Kids',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=TwfKCX_8fbA',
    why_selected: 'Tier 1 franchise, 3:45 — blubber explained; pairs directly with the blubber-glove experiment',
    question_it_answers: "Why don't penguins freeze?",
    runtime: '3:45',
    engagement_tier: 'franchise',
    age_band: 'K-2',
    duration_minutes: 4,
  },
  {
    title: 'Antarctica | Destination World — Nat Geo Kids',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=X3uT89xoKuc',
    why_selected: 'Tier 1 franchise, 2:58 — the coldest/windiest/driest continent overview',
    question_it_answers: 'Where is Antarctica and what makes it unique?',
    runtime: '2:58',
    engagement_tier: 'franchise',
    age_band: 'K-2',
    duration_minutes: 3,
  },
  {
    title: "Why Don't Fish Freeze in Antarctica? — NOVA Antarctic Extremes",
    type: 'video',
    url: 'https://www.pbs.org/wgbh/nova/video/why-fish-dont-freeze-antarctica/',
    why_selected:
      'PBS/NOVA, 12 min — real scientists ICE FISHING through 10-inch holes in 8-15 ft of McMurdo ice with kid-size Snoopy poles, catching Antarctic toothfish; antifreeze-protein reveal ends with ice cream',
    question_it_answers: 'How does ice fishing work?',
    runtime: '12:01',
    engagement_tier: 'franchise',
    age_band: 'K-2',
    duration_minutes: 12,
  },
  {
    title: "Why Don't Fish Freeze in Winter? — SciShow Kids",
    type: 'video',
    url: 'https://www.kidzsearch.com/kidztube/why-don%e2%80%99t-fish-freeze-in-winter-winter-is-alive-scishow-kids_4758c2c6f.html',
    why_selected:
      'Tier 1 franchise, 3:38, built for grade 1 (NGSS) — what fish do under the ice you drill through; pairs with the NOVA episode',
    question_it_answers: 'Where do the fish go when the water freezes?',
    runtime: '3:38',
    engagement_tier: 'franchise',
    age_band: 'K-2',
    duration_minutes: 4,
  },
  {
    title: 'Living in Antarctica with Engineer Matty Jordan — Lingokids Growin\u2019 Up! (S3E6)',
    type: 'podcast',
    url: 'https://omny.fm/shows/lingokids-growin-up-discover-dream-jobs-1/p281-gu68-living-in-antarctica-with-engineer-matty',
    why_selected: 'Official Lingokids episode (plays in browser, 19 min) — a real Antarctic engineer on building at Scott Base',
    question_it_answers: 'Can people live in Antarctica?',
    runtime: '19:11',
    engagement_tier: 'verified',
    age_band: 'K-2',
    duration_minutes: 19,
  },
]

export const ANTARCTICA_SUPPLIES = [
  'Globe',
  'World map',
  'Printed Expedition Kit (passport, map, experiment sheets)',
  'Sophie Scott Goes South',
  'Where Is Antarctica?',
  'Colored pencils',
  'Sticky notes',
  'LEGO or recycled build materials',
  'Crisco / vegetable shortening',
  'Gallon zip-top bags (2)',
  'Ice + bowl + towels',
  'Device ready for videos / podcast',
]

/** Shape stored on le_expeditions.core_resources */
export function antarcticaCoreResourcesPayload() {
  return [
    ...ANTARCTICA_PDFS,
    ...ANTARCTICA_BOOKS,
    ...ANTARCTICA_LINKS,
  ].map((r) => ({
    title: r.title,
    resource_type: r.type,
    url: r.url ?? null,
    needs_parent_link: r.needs_parent_link ?? false,
    why_selected: r.why_selected,
    question_it_answers: r.question_it_answers ?? null,
    runtime: r.runtime ?? null,
    engagement_tier: r.engagement_tier ?? (r.type === 'pdf' ? 'vf_original' : 'verified'),
    age_band: r.age_band ?? 'K-2',
    duration_minutes: r.duration_minutes ?? null,
  }))
}
