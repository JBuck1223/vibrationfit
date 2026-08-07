/**
 * Curated Antarctica expedition resources from the Life Explorer PDF pack.
 * Never invent titles/URLs beyond what is listed here.
 */

export const ANTARCTICA_PDF_BASE = '/homeschool/life-explorer/antarctica'

export interface ExpeditionResource {
  title: string
  type: 'pdf' | 'book' | 'video' | 'podcast' | 'website' | 'supply'
  url?: string | null
  needs_parent_link?: boolean
  why_selected: string
  question_it_answers?: string
  runtime?: string | null
}

export const ANTARCTICA_PDFS: ExpeditionResource[] = [
  {
    title: 'Curriculum Blueprint',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Curriculum_Blueprint.pdf`,
    why_selected: 'Volume architecture for every Life Explorer expedition',
  },
  {
    title: 'Parent Guide — Expedition 1: Antarctica',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Parent_Guide_Expedition_1_Antarctica.pdf`,
    why_selected: 'Philosophy, Wonder Wall, daily rhythm for parents',
  },
  {
    title: 'Week 1 Teacher Guide (Days 1–3)',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Week1_Teacher_Guide_Part1.pdf`,
    why_selected: 'Day-by-day parent scripts with under-10-minute prep',
  },
  {
    title: 'Penguin Blubber Experiment',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Experiment_Penguin_Blubber.pdf`,
    why_selected: 'Exact experiment procedure with verified PBS links',
    question_it_answers: "Why don't penguins freeze?",
  },
  {
    title: 'Student Explorer Journal — Part 1',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Student_Journal_Part1_Antarctica.pdf`,
    why_selected: 'Know / Wonder / prediction / experiment / map pages',
  },
  {
    title: 'Student Explorer Journal — Part 2',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Student_Journal_Part2_Antarctica.pdf`,
    why_selected: 'Field notes, animal log, passport, family presentation',
  },
  {
    title: 'Printables & Portfolio Pack',
    type: 'pdf',
    url: `${ANTARCTICA_PDF_BASE}/Life_Explorer_Printables_and_Portfolio_Antarctica.pdf`,
    why_selected: 'Wonder Wall template, supply checklist, certificate',
  },
]

export const ANTARCTICA_BOOKS: ExpeditionResource[] = [
  {
    title: 'Sophie Scott Goes South',
    type: 'book',
    url: null,
    needs_parent_link: false,
    why_selected: 'Day 1 read-aloud from Week 1 Teacher Guide',
    question_it_answers: 'How do explorers learn about places they have never been?',
  },
  {
    title: 'Where Is Antarctica?',
    type: 'book',
    url: null,
    needs_parent_link: false,
    why_selected: 'Day 2 geography read from Week 1 Teacher Guide',
    question_it_answers: 'Where is Antarctica and what makes it unique?',
  },
]

export const ANTARCTICA_LINKS: ExpeditionResource[] = [
  {
    title: 'PBS Nature – Penguins: Meet the Family',
    type: 'video',
    url: 'https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/',
    why_selected: 'Verified link from Penguin Blubber Experiment guide',
    question_it_answers: "Why don't penguins freeze?",
  },
  {
    title: 'PBS LearningMedia – Animal Insulation Activity',
    type: 'website',
    url: 'https://static.pbslearningmedia.org/media/media_files/3d4ce992-c70e-4a6b-9178-20bcb28ca4d7/e8c63031-db26-4c6f-a8e4-adc4f51c9e95.pdf',
    why_selected: 'Verified teacher guide link from experiment PDF',
    question_it_answers: 'How does insulation / blubber slow heat loss?',
  },
  {
    title: 'Antarctica overview video',
    type: 'video',
    url: null,
    needs_parent_link: true,
    why_selected: 'Mentioned in printable pack; parent chooses a short overview',
    question_it_answers: 'Where is Antarctica and what makes it unique?',
  },
  {
    title: 'Living in Antarctica with Engineer Matty Jordan',
    type: 'podcast',
    url: null,
    needs_parent_link: true,
    why_selected: 'Mentioned in printable pack; parent locates episode',
    question_it_answers: 'Can people live in Antarctica?',
  },
]

export const ANTARCTICA_SUPPLIES = [
  'Globe',
  'World map',
  'Explorer Journal (print Student Journal PDFs)',
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

export const ANTARCTICA_WEEK1_DAYS = [
  {
    day: 1,
    title: 'Launch the Expedition',
    essential_question: "How do explorers learn about places they've never been?",
    core_book: 'Sophie Scott Goes South',
    focus: 'Wonder Wall, oral language, imagination drawing of Antarctica',
  },
  {
    day: 2,
    title: 'Where Is Antarctica?',
    essential_question: 'Where is Antarctica and what makes it unique?',
    core_book: 'Where Is Antarctica?',
    focus: 'Globe/map route from Florida, continents and oceans',
  },
  {
    day: 3,
    title: 'Penguins & Survival',
    essential_question: 'How do penguins survive freezing temperatures?',
    core_book: null,
    focus: 'Blubber experiment, habitat build, journal sentence',
  },
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
  }))
}
