import { TRAINING_STEP_IDS, type TrainingStepId } from './steps'
import walkthroughOverridesJson from './walkthrough-overrides.json'

export const WALKTHROUGH_SOURCE = 'src/lib/life-activation/walkthroughs.ts'
export const WALKTHROUGH_OVERRIDES_SOURCE = 'src/lib/life-activation/walkthrough-overrides.json'

export type WalkthroughRoom =
  | 'here'
  | 'create'
  | 'view'
  | 'resources'
  | 'update'
  | 'listen'
  | 'spoken'
  | 'songs'

export interface ToolWalkthroughStep {
  id: string
  title: string
  body: string
  /** Public URL under /walkthroughs. Optional — attach later from admin or the inbox. */
  snapshot?: string
  /** When false, show a centered card and do not spotlight a control. */
  spotlight?: boolean
  room?: WalkthroughRoom
  /** Studio tab this step lives on. Next navigates here when the path does not match. */
  href?: string
}

export interface ToolWalkthroughCatalog {
  steps: readonly ToolWalkthroughStep[]
}

export const VISION_WALKTHROUGH_ID = 'vision_update' as const
export const VISION_VIEW_WALKTHROUGH_ID = 'vision_view' as const

export type WalkthroughId =
  | Exclude<TrainingStepId, 'complete'>
  | typeof VISION_WALKTHROUGH_ID
  | typeof VISION_VIEW_WALKTHROUGH_ID

export type TrainingCompletionId = TrainingStepId | typeof VISION_VIEW_WALKTHROUGH_ID

export type WalkthroughGroup = 'studio' | 'other' | 'vision'

export interface WalkthroughStepDefinition extends ToolWalkthroughStep {
  target: string
}

export interface WalkthroughDefinition {
  id: WalkthroughId
  label: string
  group: WalkthroughGroup
  description: string
  route: string
  tabLabel: string
  sourceFile: string
  checksOff: Exclude<TrainingStepId, 'complete'> | null
  alsoCompletes?: Exclude<TrainingStepId, 'complete'>[]
  steps: readonly WalkthroughStepDefinition[]
}

export type WalkthroughStepOverride = { title?: string; body?: string; snapshot?: string }
export type WalkthroughOverrides = Partial<
  Record<WalkthroughId, Partial<Record<string, WalkthroughStepOverride>>>
>

function s(
  id: string,
  title: string,
  body: string,
  target: string,
  href: string,
  room: WalkthroughRoom,
): WalkthroughStepDefinition {
  return { id, title, body, target, href, room }
}

export function splitWalkthroughHref(href: string): { pathname: string; search: URLSearchParams } {
  const url = new URL(href, 'http://walkthrough.local')
  return { pathname: url.pathname, search: url.searchParams }
}

export function hrefMatches(
  pathname: string,
  search: { get: (key: string) => string | null } | URLSearchParams | null | undefined,
  href?: string,
): boolean {
  if (!href) return true
  const target = splitWalkthroughHref(href)
  const pathOk = pathname === target.pathname || pathname === `${target.pathname}/`
  if (!pathOk) return false
  for (const [key, value] of target.search) {
    if ((search?.get(key) ?? null) !== value) return false
  }
  return true
}

interface StudioHereTab {
  href: string
  tabId: string
  tabLabel: string
  studio: string
  match?: (pathname: string, search?: { get: (key: string) => string | null } | null) => boolean
}

const STUDIO_HERE_TABS: Partial<Record<WalkthroughId, StudioHereTab[]>> = {
  daily_paper: [
    { href: '/daily-paper/new', tabId: 'studio-tab-daily-paper-create', tabLabel: 'Create', studio: 'Daily Paper' },
    { href: '/daily-paper/resources', tabId: 'studio-tab-daily-paper-resources', tabLabel: 'Resources', studio: 'Daily Paper' },
    { href: '/daily-paper', tabId: 'studio-tab-daily-paper-view', tabLabel: 'View', studio: 'Daily Paper' },
  ],
  journal: [
    { href: '/journal/new', tabId: 'studio-tab-journal-create', tabLabel: 'Create', studio: 'Journal' },
    {
      href: '/journal',
      tabId: 'studio-tab-journal-view',
      tabLabel: 'My Journal',
      studio: 'Journal',
      match: (pathname) =>
        (pathname === '/journal' || pathname === '/journal/' || /^\/journal\/[^/]+/.test(pathname)) &&
        !pathname.startsWith('/journal/new'),
    },
  ],
  stories: [
    { href: '/story/new', tabId: 'studio-tab-stories-create', tabLabel: 'Create', studio: 'My Stories' },
    { href: '/story/update', tabId: 'studio-tab-stories-update', tabLabel: 'Update', studio: 'My Stories' },
    {
      href: '/story',
      tabId: 'studio-tab-stories-view',
      tabLabel: 'All Stories',
      studio: 'My Stories',
      match: (pathname) =>
        (pathname === '/story' || pathname === '/story/' || /^\/story\/[^/]+/.test(pathname)) &&
        pathname !== '/story/new' &&
        !pathname.startsWith('/story/new/') &&
        pathname !== '/story/update' &&
        !pathname.startsWith('/story/update/'),
    },
  ],
  manifestations: [
    {
      href: '/manifestations/create',
      tabId: 'studio-tab-manifestations-create',
      tabLabel: 'Create',
      studio: 'Manifestations',
    },
    {
      href: '/manifestations',
      tabId: 'studio-tab-manifestations-view',
      tabLabel: 'My Board',
      studio: 'Manifestations',
      match: (pathname) =>
        (pathname === '/manifestations' ||
          pathname === '/manifestations/' ||
          /^\/manifestations\/[^/]+/.test(pathname)) &&
        pathname !== '/manifestations/create',
    },
  ],
  profile: [
    { href: '/profile/create', tabId: 'studio-tab-profile-update', tabLabel: 'Update', studio: 'My Profile' },
    {
      href: '/profile',
      tabId: 'studio-tab-profile-view',
      tabLabel: 'View',
      studio: 'My Profile',
      match: (pathname) =>
        (pathname === '/profile' || pathname === '/profile/' || /^\/profile\/[^/]+/.test(pathname)) &&
        pathname !== '/profile/create' &&
        pathname !== '/profile/new',
    },
  ],
  map: [
    { href: '/map/update', tabId: 'studio-tab-map-update', tabLabel: 'Update', studio: 'MAP' },
    { href: '/map', tabId: 'studio-tab-map-view', tabLabel: 'View', studio: 'MAP' },
  ],
  voice: [
    { href: '/audio/create', tabId: 'studio-tab-audio-create', tabLabel: 'Create', studio: 'Audio Studio' },
    { href: '/audio/songs', tabId: 'studio-tab-audio-listen', tabLabel: 'Listen', studio: 'Audio Studio' },
    { href: '/audio', tabId: 'studio-tab-audio-listen', tabLabel: 'Listen', studio: 'Audio Studio' },
  ],
}

function tabMatches(
  tab: StudioHereTab,
  pathname: string,
  search?: { get: (key: string) => string | null } | null,
): boolean {
  if (tab.match) return tab.match(pathname, search)
  return hrefMatches(pathname, search, tab.href)
}

export function buildYouAreHereStep(
  id: WalkthroughId,
  pathname: string,
  search?: { get: (key: string) => string | null } | null,
): ToolWalkthroughStep | null {
  const tabs = STUDIO_HERE_TABS[id]
  if (!tabs?.length) return null
  const tab = tabs.find((item) => tabMatches(item, pathname, search)) ?? tabs[tabs.length - 1]
  return {
    id: tab.tabId,
    title: 'You are here',
    body: `This is ${tab.tabLabel}. You are in ${tab.studio}. Next we start where you make one.`,
    href: tab.href,
    room: 'here',
    spotlight: true,
  }
}

export function composeStudioSteps(
  here: ToolWalkthroughStep | null | undefined,
  catalog: readonly ToolWalkthroughStep[],
): ToolWalkthroughStep[] {
  if (!here) return [...catalog]
  if (catalog[0]?.id === here.id) {
    return [{ ...catalog[0], title: here.title, body: here.body, spotlight: true }, ...catalog.slice(1)]
  }
  return [here, ...catalog]
}

export const WALKTHROUGH_CATALOG: readonly WalkthroughDefinition[] = [
  {
    id: 'profile',
    label: 'Profile',
    group: 'studio',
    description: 'One studio tour: Update first, then View.',
    route: '/profile/create',
    tabLabel: 'Update',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'profile',
    steps: [
      s(
        'studio-tab-profile-update',
        'Update starts a new version',
        'This is where a new profile snapshot begins. The last version stays. Next we walk this room. Nothing is saved until you choose a path.',
        'AreaBar tab Update',
        '/profile/create',
        'create',
      ),
      s(
        'profile-create-reco',
        'A snapshot of now',
        'This is how you update the picture of your life so the rest of the platform stays current.',
        'data-tour="profile-create-reco" on the VIVA Recommendations banner',
        '/profile/create',
        'create',
      ),
      s(
        'profile-create-paths',
        'Pick a path',
        'Continue a draft, update from the active profile, or start fresh. This walk-through does not start one for you.',
        'data-tour="profile-create-paths" on the path cards',
        '/profile/create',
        'create',
      ),
      s(
        'studio-tab-profile-view',
        'View is the live picture',
        'This is where the current snapshot lives after you save a version.',
        'AreaBar tab View',
        '/profile',
        'view',
      ),
      s(
        'profile-snapshot',
        'The current picture',
        'Fun, health, home, work, and the rest. If you have not saved a profile yet, this room is empty — that is what Update is for. You do not edit it here.',
        'data-tour="profile-snapshot" on the profile card / empty state',
        '/profile',
        'view',
      ),
      s(
        'studio-versions',
        'Versions stay',
        'Every update is a version. Active is live. Open a version to switch. If you do not see the picker yet, open a profile — or add a snapshot here later.',
        'AreaBar version selector (visible on a profile). Optional snapshot for the empty list.',
        '/profile',
        'view',
      ),
    ],
  },
  {
    id: 'intake',
    label: 'Intake',
    group: 'other',
    description: 'The baseline survey at /begin/intake.',
    route: '/begin/intake',
    tabLabel: 'Intake',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'intake',
    steps: [
      {
        id: 'intake-survey',
        title: 'A baseline, not a grade',
        body: 'This short survey is so you can see where you started. Answer from today, not from who you think you should be.',
        target: 'data-tour="intake-survey" on the survey fields',
      },
      {
        id: 'intake-submit',
        title: 'Submit when you are ready',
        body: 'Sending it in is what completes this step. You can also skip this overlay and finish the form on your own.',
        target: 'data-tour="intake-submit" on the submit control',
      },
    ],
  },
  {
    id: 'stories',
    label: 'Stories',
    group: 'studio',
    description: 'One studio tour: Create, then the library, Update, and spoken tools.',
    route: '/story/new',
    tabLabel: 'Create',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'stories',
    alsoCompletes: ['spoken'],
    steps: [
      s(
        'studio-tab-stories-create',
        'Create is where you make one',
        'This is the room where you write a story, incantation, or SparkQuery. This walk-through will not write one or spend tokens.',
        'AreaBar tab Create',
        '/story/new',
        'create',
      ),
      s(
        'stories-create-type',
        'What you are making',
        'Story, Incantation, or SparkQuery. For a story you also pick A Day in the Life or Essence. Choose the form first.',
        'data-tour="stories-create-type" on the output-type toggle',
        '/story/new',
        'create',
      ),
      s(
        'stories-create-source',
        'Where it comes from',
        'Life Vision, a board item, a journal entry, or your own words. Pick the source this piece is built from.',
        'data-tour="stories-create-source" on Select Source',
        '/story/new',
        'create',
      ),
      s(
        'stories-create-generate',
        'When you are ready',
        'Generate or Create starts it. When VIVA writes, that uses tokens — only do it when you mean to. This walk-through will not press it.',
        'data-tour="stories-create-generate" on Generate / Create',
        '/story/new',
        'create',
      ),
      s(
        'studio-tab-stories-view',
        'All Stories is the library',
        'This is where a saved story lands. If the room is empty, you have not made one yet.',
        'AreaBar tab All Stories',
        '/story',
        'view',
      ),
      s(
        'stories-list',
        'Your pieces',
        'Tap any card. Activation stories and the ones you write later all sit here. An empty list means start on Create.',
        'data-tour="stories-list" on the story list / empty state',
        '/story',
        'view',
      ),
      s(
        'studio-versions',
        'Each piece has a history',
        'Open a story and use the selector to switch pieces. If the picker is not on this screen, add a snapshot later.',
        'AreaBar story selector on a story detail',
        '/story',
        'view',
      ),
      s(
        'studio-tab-stories-update',
        'Update revises one you have',
        'This tab changes an existing story. That is a new version of that piece — the earlier one stays.',
        'AreaBar tab Update',
        '/story/update',
        'update',
      ),
      s(
        'spoken-incantations',
        'Incantation',
        'These are the words you want in your mouth. Filter to Incantation, then open one when you are ready to speak it.',
        'data-tour="spoken-incantations" on the Incantation filter',
        '/story?kind=incantation',
        'spoken',
      ),
      s(
        'spoken-spark',
        'SparkQuery',
        'Questions that open a new way of seeing. Same room, different spoken tool.',
        'data-tour="spoken-spark" on the SparkQuery filter',
        '/story?kind=spark_query',
        'spoken',
      ),
      s(
        'spoken-open',
        'Open one',
        'Tap a piece to read it, hear it, or work with it. If none exist yet, Create is where they come from.',
        'data-tour="spoken-open" on the spoken list / empty state',
        '/story?kind=spark_query',
        'spoken',
      ),
    ],
  },
  {
    id: 'manifestations',
    label: 'Manifestations',
    group: 'studio',
    description: 'One studio tour: Create tiles first, then the board.',
    route: '/manifestations/create',
    tabLabel: 'Create',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'manifestations',
    steps: [
      s(
        'studio-tab-manifestations-create',
        'Create adds one',
        'This is where something gets a picture. Next we walk the paths. This walk-through will not open a form or spend tokens.',
        'AreaBar tab Create',
        '/manifestations/create',
        'create',
      ),
      s(
        'manifestations-create-tiles',
        'How you add one',
        'Add it yourself, let VIVA pull ideas from your vision, or check the queue.',
        'data-tour="manifestations-create-tiles" on the create tile grid',
        '/manifestations/create',
        'create',
      ),
      s(
        'manifestations-create-add',
        'Add it yourself',
        'Your image, your why, your category. This is the manual path.',
        'data-tour="manifestations-create-add" on Add New Item',
        '/manifestations/create',
        'create',
      ),
      s(
        'manifestations-create-viva',
        'VIVA Ideas',
        'VIVA reads your Life Vision and offers pictures. That uses tokens — only when you mean to.',
        'data-tour="manifestations-create-viva" on VIVA Ideas',
        '/manifestations/create',
        'create',
      ),
      s(
        'manifestations-create-queue',
        'Generation Queue',
        'Jobs VIVA is still building land here. Check this when you are waiting on a picture.',
        'data-tour="manifestations-create-queue" on Generation Queue',
        '/manifestations/create',
        'create',
      ),
      s(
        'studio-tab-manifestations-view',
        'My Board is where they live',
        'A saved manifestation lands here. If the board is empty, you have not added one yet.',
        'AreaBar tab My Board',
        '/manifestations',
        'view',
      ),
      s(
        'manifestations-board',
        'Active and actualized',
        'Active ones are in motion. Actualized ones already landed. An empty board is waiting for Create.',
        'data-tour="manifestations-board" on the board / empty state',
        '/manifestations',
        'view',
      ),
      s(
        'manifestations-open',
        'Click one',
        'Tap a manifestation to see it up close. Skip this if you do not have one yet.',
        'data-tour="manifestations-open" on an item',
        '/manifestations',
        'view',
      ),
    ],
  },
  {
    id: 'journal',
    label: 'Journal',
    group: 'studio',
    description: 'One studio tour: the create form first, then the library.',
    route: '/journal/new',
    tabLabel: 'Create',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'journal',
    steps: [
      s(
        'studio-tab-journal-create',
        'Create starts a blank page',
        'This is the room where you write a journal entry. Next we walk every field. This walk-through will not write or save for you.',
        'AreaBar tab Create',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-date',
        'The date',
        'Which day this entry belongs to. It defaults to today.',
        'data-tour="journal-create-date" on the date picker',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-title',
        'Entry title',
        'A short name so you can find this page later. Optional.',
        'data-tour="journal-create-title" on Entry title',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-type',
        'Entry type',
        'Optional tag: Vision, Win, or Wobble. Tap one or leave it blank.',
        'data-tour="journal-create-type" on Entry type',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-categories',
        'Life categories',
        'Tag the areas of life this entry touches so it files with your vision.',
        'data-tour="journal-create-categories" on Tag life categories',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-entry',
        'The entry',
        'What is true today. Type or tap the mic — VIVA turns voice into text.',
        'data-tour="journal-create-entry" on the journal entry field',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-evidence',
        'Evidence / images',
        'Optional. Upload a photo or file, or let VIVA generate an image from your words.',
        'data-tour="journal-create-evidence" on Evidence / images',
        '/journal/new',
        'create',
      ),
      s(
        'journal-create-save',
        'Save when it is enough',
        'Save is what keeps the entry. Cancel leaves without saving. This walk-through does not press Save.',
        'data-tour="journal-create-save" on Save',
        '/journal/new',
        'create',
      ),
      s(
        'studio-tab-journal-view',
        'My Journal is the library',
        'This is where a saved entry lands. If the list is empty, you have not written one yet.',
        'AreaBar tab My Journal',
        '/journal',
        'view',
      ),
      s(
        'journal-entries',
        'Your entries',
        'Everything you have written lives here. An empty library means start on Create.',
        'data-tour="journal-entries" on the entry list / empty state',
        '/journal',
        'view',
      ),
      s(
        'studio-versions',
        'Switch entries',
        'Open an entry and use the selector to move between dates. If you do not see it yet, add a snapshot later.',
        'AreaBar entry selector on a journal detail',
        '/journal',
        'view',
      ),
    ],
  },
  {
    id: 'daily_paper',
    label: 'Daily Paper',
    group: 'studio',
    description: 'One studio tour: write the paper first, then the archive, then Resources.',
    route: '/daily-paper/new',
    tabLabel: 'Create',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'daily_paper',
    steps: [
      s(
        'studio-tab-daily-paper-create',
        'Create writes a new paper',
        'This is the room where you write today’s page. Next we walk every field. Nothing is saved until you press Save.',
        'AreaBar tab Create',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-date',
        'The date',
        'Which day this paper is for. It defaults to today.',
        'data-tour="daily-paper-create-date" on the date picker',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-gratitude',
        'Gratitude',
        'What you feel grateful for today. Type or tap the mic — VIVA turns voice into text.',
        'data-tour="daily-paper-create-gratitude" on the Gratitude section',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-actions',
        'Aligned actions',
        'Three things you will actually do. Keep them small enough to finish. Type or tap the mic on each task.',
        'data-tour="daily-paper-create-actions" on Aligned actions',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-fun',
        'Fun promise',
        'One fun thing you will do today. Same type-or-mic field as gratitude.',
        'data-tour="daily-paper-create-fun" on Fun promise',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-scan',
        'Printed scan',
        'Optional. Add a photo or PDF if you used the printable form.',
        'data-tour="daily-paper-create-scan" on Printed Daily Paper scan',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-evidence',
        'Evidence / images',
        'Optional. Upload your own files, or tap VIVA Generate to make an image from the words on this page.',
        'data-tour="daily-paper-create-evidence" on Evidence / images',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-save',
        'Save the paper',
        'Save keeps the paper. Cancel leaves without saving. This walk-through will not press Save.',
        'data-tour="daily-paper-create-save" on Save',
        '/daily-paper/new',
        'create',
      ),
      s(
        'daily-paper-create-resources',
        'Need a refresher?',
        'Printable layouts and a short recap live under Resources. This card does not write the paper.',
        'data-tour="daily-paper-create-resources" on the Resources helper card',
        '/daily-paper/new',
        'create',
      ),
      s(
        'studio-tab-daily-paper-view',
        'View is the archive',
        'This is where a saved paper lands. If the room is empty, you have not saved one yet.',
        'AreaBar tab View',
        '/daily-paper',
        'view',
      ),
      s(
        'daily-paper-today',
        'The page itself',
        'Saved papers show up here. An empty state means start on Create, then come back.',
        'data-tour="daily-paper-today" on today’s paper / empty state',
        '/daily-paper',
        'view',
      ),
      s(
        'studio-tab-daily-paper-resources',
        'Resources',
        'The printable form and a refresher. You do not need it to write.',
        'AreaBar tab Resources',
        '/daily-paper/resources',
        'resources',
      ),
      s(
        'daily-paper-resources-print',
        'Printable layouts',
        'Half-page or full-page PDFs if you want to write by hand, then scan the page on Create.',
        'data-tour="daily-paper-resources-print" on Print-ready PDFs',
        '/daily-paper/resources',
        'resources',
      ),
    ],
  },
  {
    id: 'voice',
    label: 'Audio',
    group: 'studio',
    description: 'One studio tour: Create tiles first, then Listen and My Songs.',
    route: '/audio/create',
    tabLabel: 'Create',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'voice',
    alsoCompletes: ['songs'],
    steps: [
      s(
        'studio-tab-audio-create',
        'Create makes audio',
        'This is the room where you generate narration, record in your voice, mix, or write a song. This walk-through will not start a job or spend tokens.',
        'AreaBar tab Create',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-tiles',
        'Ways to make audio',
        'Each tile opens a different room. We will name them. We will not follow a tile off this tab.',
        'data-tour="audio-create-tiles" on the create tile grid',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-generate',
        'Generate Voice Audio',
        'VIVA narration of your Life Vision or a story. That uses tokens — only when you mean to.',
        'data-tour="audio-create-generate" on Generate Voice Audio',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-record',
        'Record in Your Voice',
        'Read your vision or a story aloud. That is the recording room.',
        'data-tour="audio-create-record" on Record in Your Voice',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-mix',
        'Mix Audio',
        'Add background music and binaural beats to a voice track you already have.',
        'data-tour="audio-create-mix" on Mix Audio',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-songwriter',
        'Songwriter',
        'Starts a song from your vision, journal, or life. That uses tokens — only when you mean to.',
        'data-tour="audio-create-songwriter" on Songwriter',
        '/audio/create',
        'create',
      ),
      s(
        'audio-create-queue',
        'Generation Queue',
        'Jobs that are still building land here. Check this when you are waiting on audio.',
        'data-tour="audio-create-queue" on Generation Queue',
        '/audio/create',
        'create',
      ),
      s(
        'studio-tab-audio-listen',
        'Listen is the library',
        'This is where finished audio lives. If a shelf is empty, you have not made that kind yet.',
        'AreaBar tab Listen',
        '/audio',
        'listen',
      ),
      s(
        'audio-listen-vision',
        'Life Vision shelf',
        'This shelf is your vision audio and voice recordings.',
        'data-tour="audio-listen-vision" on Listen context nav Life Vision',
        '/audio',
        'listen',
      ),
      s(
        'voice-record',
        'Play what you have',
        'Play a track from this shelf. Recording your own voice lives under Create. You can skip playing and still finish.',
        'data-tour="voice-record" on the listen player / empty state',
        '/audio',
        'listen',
      ),
      s(
        'studio-versions',
        'Vision versions',
        'If you have more than one Life Vision, this picker switches which version you hear. Active is live. Earlier versions stay.',
        'AreaBar vision version selector on Listen',
        '/audio',
        'listen',
      ),
      s(
        'audio-listen-songs',
        'My Songs',
        'This shelf is your vision songs — Activation songs and any you make later.',
        'data-tour="audio-listen-songs" on Listen context nav My Songs',
        '/audio/songs',
        'songs',
      ),
      s(
        'songs-library',
        'The song library',
        'Every song you have sits here. An empty shelf means Songwriter on Create.',
        'data-tour="songs-library" on the songs section / empty state',
        '/audio/songs',
        'songs',
      ),
      s(
        'songs-play',
        'Click play',
        'Hit play when you want to hear it. Nothing else is required for this room.',
        'data-tour="songs-play" on a play control or empty state',
        '/audio/songs',
        'songs',
      ),
    ],
  },
  {
    id: 'viva',
    label: 'VIVA coach',
    group: 'other',
    description: 'The coach conversation.',
    route: '/viva',
    tabLabel: 'VIVA',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'viva',
    steps: [
      {
        id: 'viva-thread',
        title: 'The conversation',
        body: 'This is the coach thread. VIVA already knows your vision. Talk about what is true today.',
        target: 'data-tour="viva-thread" on the message thread',
      },
      {
        id: 'viva-composer',
        title: 'Say something',
        body: 'Type or speak here. One honest sentence is enough to know you can come back.',
        target: 'data-tour="viva-composer" on the composer',
      },
    ],
  },
  {
    id: 'map',
    label: 'MAP',
    group: 'studio',
    description: 'One studio tour: Update the plan first, then View.',
    route: '/map/update',
    tabLabel: 'Update',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: 'map',
    steps: [
      s(
        'studio-tab-map-update',
        'Update chooses the rituals',
        'This is the room where you pick commitments and cadence. This walk-through will not save a plan.',
        'AreaBar tab Update',
        '/map/update',
        'create',
      ),
      s(
        'map-create-heading',
        'Your Alignment Plan',
        'This is where you choose the rituals and personal commitments you will actually run.',
        'data-tour="map-create-heading" on the page heading',
        '/map/update',
        'create',
      ),
      s(
        'map-create-activations',
        'Activate',
        'Rituals that turn the vision on — listen, read, look. Turn one on, then set how often and how you want to be reminded.',
        'data-tour="map-create-activations" on the Activate pillar',
        '/map/update',
        'create',
      ),
      s(
        'map-create-creations',
        'Create',
        'Things you make: journal, Daily Paper, board, tracker. Same pattern — pick one, then cadence and reminders.',
        'data-tour="map-create-creations" on the Create pillar',
        '/map/update',
        'create',
      ),
      s(
        'map-create-connections',
        'Connect',
        'Vibe Tribe posts and engagement. How you stay with your people.',
        'data-tour="map-create-connections" on the Connect pillar',
        '/map/update',
        'create',
      ),
      s(
        'map-create-sessions',
        'Attend',
        'Alignment Gym and live sessions. The rituals you show up for.',
        'data-tour="map-create-sessions" on the Attend pillar',
        '/map/update',
        'create',
      ),
      s(
        'map-create-custom',
        'Custom',
        'Personal commitments that are not in the system list. Add your own title, cadence, and note.',
        'data-tour="map-create-custom" on Custom',
        '/map/update',
        'create',
      ),
      s(
        'map-create-digest',
        'Weekly MAP digest',
        'Optional Monday summary by email or SMS. Uses your MAP time zone.',
        'data-tour="map-create-digest" on Weekly MAP digest',
        '/map/update',
        'create',
      ),
      s(
        'map-create-save',
        'Save the plan',
        'Saving is what makes it your MAP. This walk-through does not press Save.',
        'data-tour="map-create-save" on Save Plan',
        '/map/update',
        'create',
      ),
      s(
        'studio-tab-map-view',
        'View is the daily plan',
        'This is where the saved MAP runs. If it is empty, you have not saved a plan yet.',
        'AreaBar tab View',
        '/map',
        'view',
      ),
      s(
        'map-view-day',
        'Day',
        'Today’s actions. Same plan, one day at a time.',
        'MAP context nav Day',
        '/map',
        'view',
      ),
      s(
        'map-view-week',
        'Week',
        'The same plan, looked at across the week.',
        'MAP context nav Week',
        '/map',
        'view',
      ),
      s(
        'map-plan',
        'The plan',
        'This is MAP. If it is empty, Update is where you build it.',
        'data-tour="map-plan" on the plan / empty state',
        '/map',
        'view',
      ),
      s(
        'map-actions',
        'Today’s actions',
        'This is what you work today. Empty until a plan is saved.',
        'data-tour="map-actions" on today’s actions / empty state',
        '/map',
        'view',
      ),
    ],
  },
  {
    id: 'vision_view',
    label: 'Life Vision — View',
    group: 'vision',
    description: 'Studio tour: View, About, Update, and versioning.',
    route: '/life-vision',
    tabLabel: 'View',
    sourceFile: WALKTHROUGH_SOURCE,
    checksOff: null,
    steps: [
      {
        id: 'studio-tab-vision-view',
        title: 'You are here',
        body: 'This is View. You are in Life Vision — the living document. Next we walk this room.',
        target: 'AreaBar tab View',
      },
      {
        id: 'studio-tab-vision-about',
        title: 'About',
        body: 'Click About when you want the why. You do not need it to use the vision.',
        target: 'AreaBar tab About',
      },
      {
        id: 'studio-tab-vision-update',
        title: 'Update writes the next version',
        body: 'Click Update when the life has changed. VIVA proposes wording. Commit makes a new version. Earlier versions stay.',
        target: 'AreaBar tab Update',
      },
      {
        id: 'studio-versions',
        title: 'Versions stay',
        body: 'This picker is the history. Active is live. Draft is work in progress. Household visions sit in their own group. If you want this state captured, add a snapshot later.',
        target: 'AreaBar vision version selector',
      },
      {
        id: 'vision-read',
        title: 'The words',
        body: 'This is the vision itself. Read it category by category. Update is where you change it.',
        target: 'data-tour="vision-read" on the vision document',
      },
    ],
  },
  {
    id: 'vision_update',
    label: 'Life Vision — Update',
    group: 'vision',
    description: 'The Life Vision update tour. Uses local storage, not Tools Training.',
    route: '/life-vision/update',
    tabLabel: 'Update',
    sourceFile: 'src/components/life-vision/VisionUpdateTour.tsx',
    checksOff: null,
    steps: [
      {
        id: 'studio-tab-vision-update',
        title: 'You are here',
        body: 'This is Update. You are in the room where the next Life Vision version gets written. Next we walk the panes.',
        target: 'AreaBar tab Update',
      },
      {
        id: 'chat',
        title: 'Talk it out',
        body: "Tell VIVA what's changed — type or speak. She proposes the wording. Nothing touches your draft until you accept.",
        target: 'data-tour="chat" on the VIVA pane',
      },
      {
        id: 'draft',
        title: 'Your draft',
        body: 'Every category lives here. Purple is a VIVA proposal waiting for you. Yellow means this section is already updated in your draft.',
        target: 'data-tour="draft" on the draft pane',
      },
      {
        id: 'proposal',
        title: 'You choose every word',
        body: 'Accept saves into your draft. Discard throws it away. You can still edit after you accept.',
        target: 'data-tour="proposal" on a proposal',
      },
      {
        id: 'views',
        title: 'Edits, Draft, and Active',
        body: 'Edits highlights what changed — green for what is new, red strike for what came out. Draft is the text you are working on. Active is your live vision, read-only.',
        target: 'data-tour="views" on the view switcher',
      },
      {
        id: 'commit',
        title: 'Make it live when it feels right',
        body: 'When it feels right, Commit as Active creates a new version and makes it your living vision — earlier versions stay intact. VIVA will offer a cleanse first — skip it anytime.',
        target: 'data-tour="commit" on Commit as Active',
      },
    ],
  },
]

const WALKTHROUGH_BY_ID = new Map(WALKTHROUGH_CATALOG.map((item) => [item.id, item]))

export function isWalkthroughId(value: string): value is WalkthroughId {
  return WALKTHROUGH_BY_ID.has(value as WalkthroughId)
}

export function isTrainingCompletionId(value: string): value is TrainingCompletionId {
  if (value === VISION_VIEW_WALKTHROUGH_ID) return true
  return (TRAINING_STEP_IDS as readonly string[]).includes(value)
}

export function getWalkthrough(id: WalkthroughId): WalkthroughDefinition | undefined {
  return WALKTHROUGH_BY_ID.get(id)
}

function asOverrides(value: unknown): WalkthroughOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: WalkthroughOverrides = {}
  for (const [walkthroughId, steps] of Object.entries(value as Record<string, unknown>)) {
    if (!isWalkthroughId(walkthroughId) || !steps || typeof steps !== 'object' || Array.isArray(steps)) {
      continue
    }
    const stepMap: Record<string, WalkthroughStepOverride> = {}
    for (const [stepId, patch] of Object.entries(steps as Record<string, unknown>)) {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) continue
      const title = typeof (patch as WalkthroughStepOverride).title === 'string'
        ? (patch as WalkthroughStepOverride).title
        : undefined
      const body = typeof (patch as WalkthroughStepOverride).body === 'string'
        ? (patch as WalkthroughStepOverride).body
        : undefined
      const snapshot = typeof (patch as WalkthroughStepOverride).snapshot === 'string'
        ? (patch as WalkthroughStepOverride).snapshot
        : undefined
      if (title !== undefined || body !== undefined || snapshot !== undefined) {
        stepMap[stepId] = { title, body, snapshot }
      }
    }
    if (Object.keys(stepMap).length > 0) {
      out[walkthroughId] = stepMap
    }
  }
  return out
}

export function parseWalkthroughOverrides(value: unknown): WalkthroughOverrides {
  return asOverrides(value)
}

export function sanitizeWalkthroughOverrides(value: unknown): WalkthroughOverrides {
  const raw = asOverrides(value)
  const out: WalkthroughOverrides = {}
  for (const def of WALKTHROUGH_CATALOG) {
    const steps = raw[def.id]
    if (!steps) continue
    const allowed = new Set(def.steps.map((step) => step.id))
    const next: Record<string, WalkthroughStepOverride> = {}
    for (const [stepId, patch] of Object.entries(steps)) {
      if (!patch || !allowed.has(stepId)) continue
      const clean: WalkthroughStepOverride = {}
      if (typeof patch.title === 'string') clean.title = patch.title
      if (typeof patch.body === 'string') clean.body = patch.body
      if (typeof patch.snapshot === 'string') clean.snapshot = patch.snapshot
      if (clean.title !== undefined || clean.body !== undefined || clean.snapshot !== undefined) {
        next[stepId] = clean
      }
    }
    if (Object.keys(next).length > 0) out[def.id] = next
  }
  return out
}

function mergeSteps(
  def: WalkthroughDefinition,
  overrides: WalkthroughOverrides,
): ToolWalkthroughStep[] {
  const patch = overrides[def.id]
  return def.steps.map((step) => {
    const snapshot = patch?.[step.id]?.snapshot ?? step.snapshot
    return {
      id: step.id,
      title: patch?.[step.id]?.title ?? step.title,
      body: patch?.[step.id]?.body ?? step.body,
      spotlight: step.spotlight,
      ...(step.room ? { room: step.room } : {}),
      ...(step.href ? { href: step.href } : {}),
      ...(snapshot ? { snapshot } : {}),
    }
  })
}

const EMPTY: ToolWalkthroughCatalog = { steps: [] }

export function getToolWalkthrough(
  stepId: WalkthroughId,
  overrides: WalkthroughOverrides = walkthroughOverridesJson as WalkthroughOverrides,
): ToolWalkthroughCatalog {
  const def = WALKTHROUGH_BY_ID.get(stepId)
  if (!def) return EMPTY
  return { steps: mergeSteps(def, asOverrides(overrides)) }
}

export function hasToolWalkthrough(stepId: WalkthroughId): boolean {
  return (WALKTHROUGH_BY_ID.get(stepId)?.steps.length ?? 0) > 0
}

export interface AdminWalkthroughStep extends ToolWalkthroughStep {
  target: string
  defaultTitle: string
  defaultBody: string
  defaultSnapshot: string
  overridden: boolean
}

export interface AdminWalkthroughItem {
  id: WalkthroughId
  label: string
  group: WalkthroughGroup
  description: string
  route: string
  tabLabel: string
  sourceFile: string
  checksOff: Exclude<TrainingStepId, 'complete'> | null
  steps: AdminWalkthroughStep[]
}

export function listAdminWalkthroughs(
  overrides: WalkthroughOverrides = walkthroughOverridesJson as WalkthroughOverrides,
): AdminWalkthroughItem[] {
  const clean = asOverrides(overrides)
  return WALKTHROUGH_CATALOG.map((def) => ({
    id: def.id,
    label: def.label,
    group: def.group,
    description: def.description,
    route: def.route,
    tabLabel: def.tabLabel,
    sourceFile: def.sourceFile,
    checksOff: def.checksOff,
    steps: def.steps.map((step) => {
      const title = clean[def.id]?.[step.id]?.title ?? step.title
      const body = clean[def.id]?.[step.id]?.body ?? step.body
      const snapshot = clean[def.id]?.[step.id]?.snapshot ?? step.snapshot ?? ''
      return {
        id: step.id,
        title,
        body,
        snapshot: snapshot || undefined,
        room: step.room,
        href: step.href,
        target: step.target,
        defaultTitle: step.title,
        defaultBody: step.body,
        defaultSnapshot: step.snapshot ?? '',
        overridden: title !== step.title || body !== step.body || snapshot !== (step.snapshot ?? ''),
      }
    }),
  }))
}

function isExact(pathname: string, path: string) {
  return pathname === path || pathname === `${path}/`
}

function isProfileView(pathname: string) {
  if (isExact(pathname, '/profile')) return true
  const match = pathname.match(/^\/profile\/([^/]+)\/?$/)
  if (!match) return false
  return !['create', 'new', 'compare', 'active'].includes(match[1])
}

function isStoryView(pathname: string) {
  if (isExact(pathname, '/story')) return true
  const match = pathname.match(/^\/story\/([^/]+)\/?$/)
  if (!match) return false
  return !['new', 'update'].includes(match[1])
}

function isJournalView(pathname: string) {
  if (isExact(pathname, '/journal')) return true
  if (isExact(pathname, '/journal/new') || pathname.startsWith('/journal/resources')) return false
  return /^\/journal\/[^/]+/.test(pathname)
}

function isManifestationView(pathname: string) {
  if (isExact(pathname, '/manifestations')) return true
  const match = pathname.match(/^\/manifestations\/([^/]+)\/?$/)
  if (!match) return false
  return !['create', 'new', 'ideas', 'queue', 'export', 'resources', 'about', 'gallery'].includes(match[1])
}

function isLifeVisionView(pathname: string) {
  if (isExact(pathname, '/life-vision') || isExact(pathname, '/life-vision/about')) return true
  if (
    pathname.startsWith('/life-vision/update') ||
    pathname.startsWith('/life-vision/create') ||
    pathname.startsWith('/life-vision/new') ||
    pathname.startsWith('/life-vision/begin') ||
    pathname.startsWith('/life-vision/household') ||
    pathname.startsWith('/life-vision/refine')
  ) {
    return false
  }
  const match = pathname.match(/^\/life-vision\/([^/]+)(\/print)?\/?$/)
  if (!match) return false
  return !['audio', 'active'].includes(match[1])
}

/** Which studio tour belongs to this route, or null if this page has no tour. */
export function resolveToolWalkthrough(
  pathname: string,
  _search?: { get: (key: string) => string | null },
): WalkthroughId | null {
  if (pathname.startsWith('/begin/intake')) return 'intake'
  if (isExact(pathname, '/viva') || pathname.startsWith('/viva/')) return 'viva'

  if (isLifeVisionView(pathname)) return 'vision_view'

  if (isExact(pathname, '/story/new') || isExact(pathname, '/story/update') || isStoryView(pathname)) {
    return 'stories'
  }

  if (isExact(pathname, '/journal/new') || isJournalView(pathname)) return 'journal'

  if (
    isExact(pathname, '/daily-paper/new') ||
    isExact(pathname, '/daily-paper') ||
    isExact(pathname, '/daily-paper/resources')
  ) {
    return 'daily_paper'
  }

  if (pathname.startsWith('/map/update') || isExact(pathname, '/map')) return 'map'

  if (isExact(pathname, '/manifestations/create') || isManifestationView(pathname)) {
    return 'manifestations'
  }

  if (isExact(pathname, '/profile/create') || isProfileView(pathname)) return 'profile'

  if (
    isExact(pathname, '/audio/create') ||
    isExact(pathname, '/audio/songs') ||
    isExact(pathname, '/audio') ||
    isExact(pathname, '/audio/stories') ||
    isExact(pathname, '/audio/music') ||
    isExact(pathname, '/audio/playlists')
  ) {
    return 'voice'
  }

  return null
}
