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
      `You're ${pct}% through Tools Training. Nothing is locked.`,
    stepsCount: (done: number, total: number) => `${done} of ${total} steps`,
    currentPhase: (phase: string, step: number, total: number) =>
      `Current Phase: ${phase} · Step ${step} of ${total}`,
    nextStep: 'Next Step',
    view: 'View',
  },
  vision: {
    openingFirstVision: (hasActivation: boolean) =>
      `Before we write anything, I want to actually know you.

Not the polished bio — the real life. Who you love, what matters to you, what this season actually feels like. Come as you are: the good, the heavy, the stuff you'd only say out loud to someone who's really listening.

I'll ask, you answer however you want — as much or as little as feels right. Along the way I'll catch what you share as contrast and clarity on the board beside us. Then when we write your Life I Choose, it will sound like you instead of a template.${hasActivation ? '\n\n*You already activated one area of life before joining — I have those words, and they count. We build from there.*' : ''}

So let's start easy. Where does life have you right now — and who's in it with you?`,
    chrome:
      'VIVA gets to know you first — your people, your season, what you actually want — then writes the first draft as one life. Accept what lands, edit what needs your voice, then commit.',
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
    body: 'The platform is already open. When you want a walk through the rest of the tools — profile, stories, journal, MAP — Tools Training is waiting. Or just live.',
    trainingCta: 'Learn the tools',
    dashboardCta: 'Go to Dashboard',
    visionCta: 'Open my Life Vision',
  },
  training: {
    eyebrow: 'Tools Training',
    title: 'Learn the tools when you want them',
    body: 'A recommended path through the studios. Open a tool, click Walkthrough in the upper right, and finish it. That first finish is the checkmark. You can replay anytime.',
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
