export const LIFE_ACTIVATION_COPY = {
  source: 'src/lib/life-activation/copy.ts',
  sidebar: {
    onboardingTitle: 'Getting Started',
    trainingTitle: 'Tools Training',
    trainingReady: "Learn the tools when you're ready",
    progress: (done: number, total: number) => `${done} of ${total}`,
    next: (title: string) => `Next: ${title}`,
  },
  welcome: {
    eyebrow: 'Life Activation',
    title: 'Write the life. Meet your people.',
    body: 'This is everything you need to get started: one conversation that writes your Life Vision, then Vibe Tribe and Alignment Gym. The rest of the tools can wait until you want them.',
    withActivation:
      'You already chose one area. Those words and assets stay yours. Now we write the rest of this life as one piece — then we take you to your people.',
    start: 'Start My Life Activation',
    continue: 'Continue',
    firstNameLabel: 'What should we call you?',
    firstNamePlaceholder: 'First name',
    accountHint: 'One line so VIVA can greet you by name.',
    page: {
      whatHeading: "What you're about to do",
      whatBody:
        'You already made a first Activation in one area of life. Those words and assets stay yours. Now we write the rest of this life as one piece, hear it, and take you to your people.',
      whatBodyFresh:
        'This is the start. One conversation writes your Life Vision. Then you hear it, meet Vibe Tribe, and find Alignment Gym. The rest of the tools can wait.',
      firstHeading: 'Your first Activation',
      firstBody: (categoryLabel: string) =>
        `${categoryLabel} is already written. You can read it, speak it, listen to it, and look at it. That one area stays. We do not redo it.`,
      firstBodyFresh:
        'A first Activation is one life category, written with VIVA, plus the assets that come with it — words you can read and speak, audio you can hear, images you can see.',
      nowHeading: 'Now we write the whole life',
      nowBody:
        'VIVA writes every area as one Life Vision, in harmony. You accept, edit, or discard every section. Then you can hear it, meet Vibe Tribe, and find Alignment Gym.',
      pathHeading: 'Your start path',
      howHeading: 'How it works',
      howWatch:
        'Watch the video. It is the why. The path below is the what.',
      howChoose:
        'Nothing is locked. The sidebar stays open. This path is a recommended order, not a gate.',
      howNext:
        'When you are ready, start. You will come back to your dashboard with Write your Life Vision as the next step.',
      startCta: 'Start My Life Activation',
      continueCta: 'Go to Dashboard',
    },
  },
  dashboard: {
    overall: 'Overall Progress',
    onboardingLine: (pct: number) =>
      `You're ${pct}% through getting started. One conversation. Then your people.`,
    trainingLine: (pct: number) =>
      `You're ${pct}% through Platform Training. Nothing is locked.`,
    stepsCount: (done: number, total: number) => `${done} of ${total} steps`,
    currentPhase: (phase: string, step: number, total: number) =>
      `Current Phase: ${phase} · Step ${step} of ${total}`,
    nextStep: 'Next Step',
    view: 'View',
  },
  vision: {
    openingWithActivation: (firstName: string | null, categoryLabel: string) =>
      `I'm glad you're here${firstName ? `, ${firstName}` : ''}. ${categoryLabel} is already written beside us — that stays. Now we write the rest of this life as one life, not eleven more pieces.\n\nTell me about the life you choose. Talk across home, work, love, body, spirit — however it wants to come out. When I have enough, I'll write the whole Life Vision in one pass. You accept, edit, or discard every section.`,
    openingFresh: (firstName: string | null) =>
      `I'm glad you're here${firstName ? `, ${firstName}` : ''}. We're going to write your Life Vision as one life — all of it, in harmony — from this conversation.\n\nTell me about now, and where your imagination goes when you let yourself want what you want. When I have enough, I'll compose the whole document. You accept, edit, or discard every section.`,
    chrome:
      'Talk with VIVA about the life you choose. She writes the whole vision as one piece. Accept what lands, edit what needs your voice, then commit.',
  },
  kit: {
    title: 'Hear your vision',
    body: 'VIVA can speak your Life Vision, mix it, and place images on your board. This takes a few minutes and uses tokens. You can skip and come back anytime.',
    cta: 'Generate My Activation Kit',
    skip: 'Skip for now',
    generating: 'Your kit is creating. You can keep going.',
  },
  tribe: {
    title: 'Meet Vibe Tribe',
    body: 'This is your people. Introduce yourself — one post is enough. While you are here, heart someone else if it feels right.',
    cta: 'I introduced myself',
  },
  gym: {
    title: 'Alignment Gym',
    body: 'This is the room. Live sessions and replays live here. Look at the next session, then mark this step done.',
    cta: "I've seen the Gym",
  },
  complete: {
    eyebrow: "You're started",
    title: 'Your life is written. Your people are here.',
    body: 'The platform is already open. When you want a walk through the rest of the tools — profile, stories, journal, MAP — Platform Training is waiting. Or just live.',
    trainingCta: 'Learn the tools',
    dashboardCta: 'Go to Dashboard',
    visionCta: 'Open my Life Vision',
  },
  training: {
    eyebrow: 'Platform Training',
    title: 'Learn the tools when you want them',
    body: 'A recommended path through the studios. Nothing is locked. Mark a step when you have seen it.',
    start: 'Start Training',
    continue: 'Continue Training',
    dismiss: 'Not now',
  },
  trainingComplete: {
    title: 'You know the rooms',
    body: 'Stories, spoken tools, songs, manifestations, journal, Daily Paper, VIVA, and MAP are yours to use whenever something wants to be made.',
    dashboardCta: 'Go to Dashboard',
  },
  banner: {
    markDone: 'Mark done',
    next: 'Next',
    skip: 'Skip',
  },
} as const
