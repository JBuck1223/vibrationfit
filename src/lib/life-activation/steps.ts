export const ONBOARDING_STEP_IDS = [
  'welcome',
  'vision',
  'kit',
  'tribe',
  'gym',
  'complete',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number]

export const TRAINING_STEP_IDS = [
  'profile',
  'intake',
  'stories',
  'spoken',
  'songs',
  'manifestations',
  'journal',
  'daily_paper',
  'voice',
  'viva',
  'map',
  'complete',
] as const

export type TrainingStepId = (typeof TRAINING_STEP_IDS)[number]

export const ONBOARDING_PHASES = ['Start', 'Vision', 'Community', 'Completion'] as const
export const TRAINING_PHASES = ['Foundation', 'Expression', 'Practice', 'Coach', 'Completion'] as const

export interface JourneyStep<T extends string = string> {
  id: T
  number: number
  title: string
  description: string
  phase: string
  href: string
  viewHref: string
  doneWhen: string
  actionLabel: string
  canSkip?: boolean
}

export const ONBOARDING_STEPS: JourneyStep<OnboardingStepId>[] = [
  {
    id: 'welcome',
    number: 1,
    title: 'Welcome',
    description: 'Watch how this works, then start.',
    phase: 'Start',
    href: '/begin/welcome',
    viewHref: '/begin/welcome',
    doneWhen: 'You watch the welcome and start',
    actionLabel: 'Open Welcome',
  },
  {
    id: 'vision',
    number: 2,
    title: 'Write your Life Vision',
    description: "Answer VIVA's questions. She gathers contrast and clarity, then writes the whole Life Vision in one pass.",
    phase: 'Vision',
    href: '/life-vision/begin',
    viewHref: '/life-vision',
    doneWhen: 'Your Life Vision is committed',
    actionLabel: 'Write My Life Vision',
  },
  {
    id: 'kit',
    number: 3,
    title: 'Hear your vision',
    description: 'Speak it, mix it, and place images on your board. Skip anytime.',
    phase: 'Vision',
    href: '/begin?step=kit',
    viewHref: '/begin?step=kit',
    doneWhen: 'Activation Kit started, or you skip after seeing it',
    actionLabel: 'Hear My Vision',
    canSkip: true,
  },
  {
    id: 'tribe',
    number: 4,
    title: 'Meet Vibe Tribe',
    description: 'Introduce yourself. One post is enough.',
    phase: 'Community',
    href: '/vibe-tribe',
    viewHref: '/vibe-tribe',
    doneWhen: 'You introduce yourself',
    actionLabel: 'Open Vibe Tribe',
  },
  {
    id: 'gym',
    number: 5,
    title: 'Alignment Gym',
    description: 'Find the room and the next live session.',
    phase: 'Community',
    href: '/alignment-gym',
    viewHref: '/alignment-gym',
    doneWhen: 'You know where the room is and when the next session is',
    actionLabel: 'Open Alignment Gym',
  },
  {
    id: 'complete',
    number: 6,
    title: "You're started",
    description: 'The platform is open. Training can wait until you want it.',
    phase: 'Completion',
    href: '/begin/complete',
    viewHref: '/begin/complete',
    doneWhen: 'You finish the start flow',
    actionLabel: "See What's Next",
  },
]

export const TRAINING_STEPS: JourneyStep<TrainingStepId>[] = [
  {
    id: 'profile',
    number: 1,
    title: 'Life Profile',
    description: 'A snapshot of your life so the rest of the platform has context.',
    phase: 'Foundation',
    href: '/profile',
    viewHref: '/profile',
    doneWhen: 'You finished the Life Profile walk-through',
    actionLabel: 'Open Life Profile',
  },
  {
    id: 'intake',
    number: 2,
    title: 'Baseline Intake',
    description: 'A short survey so you can see where you started.',
    phase: 'Foundation',
    href: '/begin/intake',
    viewHref: '/begin/intake',
    doneWhen: 'You finished the intake walk-through, or submitted the survey',
    actionLabel: 'Start Intake',
  },
  {
    id: 'stories',
    number: 3,
    title: 'Stories',
    description: 'This is where your stories live and get written.',
    phase: 'Expression',
    href: '/story',
    viewHref: '/story',
    doneWhen: 'You finished the Stories walk-through',
    actionLabel: 'Open Stories',
  },
  {
    id: 'spoken',
    number: 4,
    title: 'Incantations and SparkQueries',
    description: 'Spoken tools for the words you want in your mouth.',
    phase: 'Expression',
    href: '/story?kind=incantation',
    viewHref: '/story?kind=incantation',
    doneWhen: 'You finished the spoken tools walk-through',
    actionLabel: 'Open Spoken Tools',
  },
  {
    id: 'songs',
    number: 5,
    title: 'Songs',
    description: 'Vision songs live here. Open the room so you know the way back.',
    phase: 'Expression',
    href: '/audio/songs',
    viewHref: '/audio/songs',
    doneWhen: 'You finished the Songs walk-through',
    actionLabel: 'Open Songs',
  },
  {
    id: 'manifestations',
    number: 6,
    title: 'Manifestations',
    description: 'Images and scenes for the life you are living into.',
    phase: 'Practice',
    href: '/manifestations',
    viewHref: '/manifestations',
    doneWhen: 'You finished the Manifestations walk-through',
    actionLabel: 'Open Manifestations',
  },
  {
    id: 'journal',
    number: 7,
    title: 'Journal',
    description: 'Write a first entry, or just see where journaling lives.',
    phase: 'Practice',
    href: '/journal',
    viewHref: '/journal',
    doneWhen: 'You finished the Journal walk-through',
    actionLabel: 'Open Journal',
    canSkip: true,
  },
  {
    id: 'daily_paper',
    number: 8,
    title: 'Daily Paper',
    description: 'Your daily read. Open it once so you know it is here.',
    phase: 'Practice',
    href: '/daily-paper',
    viewHref: '/daily-paper',
    doneWhen: 'You finished the Daily Paper walk-through',
    actionLabel: 'Open Daily Paper',
  },
  {
    id: 'voice',
    number: 9,
    title: 'Your voice',
    description: 'Record so VIVA can speak in your voice, or skip for now.',
    phase: 'Coach',
    href: '/audio',
    viewHref: '/audio',
    doneWhen: 'You finished the voice walk-through',
    actionLabel: 'Open Voice',
    canSkip: true,
  },
  {
    id: 'viva',
    number: 10,
    title: 'Talk with VIVA',
    description: 'The coach conversation. Open it and say something true.',
    phase: 'Coach',
    href: '/viva',
    viewHref: '/viva',
    doneWhen: 'You finished the VIVA walk-through',
    actionLabel: 'Talk with VIVA',
  },
  {
    id: 'map',
    number: 11,
    title: 'MAP',
    description: 'Review and activate MAP when you are ready to work the plan.',
    phase: 'Completion',
    href: '/map',
    viewHref: '/map',
    doneWhen: 'You finished the MAP walk-through',
    actionLabel: 'Open MAP',
  },
  {
    id: 'complete',
    number: 12,
    title: 'Training complete',
    description: 'You know the rooms. Use them whenever something wants to be made.',
    phase: 'Completion',
    href: '/begin/training/complete',
    viewHref: '/begin/training/complete',
    doneWhen: 'You close the trainer',
    actionLabel: 'Finish Training',
  },
]

export function getOnboardingStep(id: string | null | undefined) {
  return ONBOARDING_STEPS.find((s) => s.id === id) || ONBOARDING_STEPS[0]
}

export function getTrainingStep(id: string | null | undefined) {
  return TRAINING_STEPS.find((s) => s.id === id) || TRAINING_STEPS[0]
}

export function nextOnboardingStep(id: OnboardingStepId): OnboardingStepId | null {
  const i = ONBOARDING_STEP_IDS.indexOf(id)
  if (i < 0 || i >= ONBOARDING_STEP_IDS.length - 1) return null
  return ONBOARDING_STEP_IDS[i + 1]
}

export function nextTrainingStep(id: TrainingStepId): TrainingStepId | null {
  const i = TRAINING_STEP_IDS.indexOf(id)
  if (i < 0 || i >= TRAINING_STEP_IDS.length - 1) return null
  return TRAINING_STEP_IDS[i + 1]
}

export function isOnboardingStepDone(
  completions: Record<string, string>,
  id: OnboardingStepId,
) {
  return Boolean(completions[id])
}

export function isTrainingStepDone(
  completions: Record<string, string>,
  id: TrainingStepId,
) {
  return Boolean(completions[id])
}

export function firstIncompleteOnboarding(
  completions: Record<string, string>,
): OnboardingStepId {
  return ONBOARDING_STEP_IDS.find((id) => !completions[id]) || 'complete'
}

export function firstIncompleteTraining(
  completions: Record<string, string>,
): TrainingStepId {
  return TRAINING_STEP_IDS.find((id) => !completions[id]) || 'complete'
}
