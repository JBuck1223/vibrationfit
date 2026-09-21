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
    body: 'This is everything you need to get started: one conversation that writes your Life Vision, then Vibe Tribe, Alignment Gym, and MAP. The rest of the tools can wait until you want them.',
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
        'This is the start. One conversation writes your Life Vision. Then you hear it, meet Vibe Tribe, find Alignment Gym, and open MAP. The rest of the tools can wait.',
      firstHeading: 'Your first Activation',
      firstBody: (categoryLabel: string) =>
        `${categoryLabel} is already written. You can read it, speak it, listen to it, and look at it. That one area stays. We do not redo it.`,
      firstBodyFresh:
        'A first Activation is one life category, written with VIVA, plus the assets that come with it — words you can read and speak, audio you can hear, images you can see.',
      nowHeading: 'Now we write the whole life',
      nowBody:
        'VIVA writes every area as one Life Vision, in harmony. You accept, edit, or discard every section. Then you can hear it, meet Vibe Tribe, find Alignment Gym, and open MAP.',
      pathHeading: 'Your start path',
      howHeading: 'How it works',
      howWatch:
        'Watch the video. It is the why. The path below is the what.',
      howChooseHeading: 'One step at a time',
      howChoose:
        'Finish the current step to unlock the next. The sidebar stays open if you need to look around.',
      howNext:
        'When you are ready, start. You will come back to your dashboard with Write your Life Vision as the next step.',
      startCta: 'Start My Life Activation',
      continueCta: 'Go to Dashboard',
    },
  },
  dashboard: {
    stepsCount: (done: number, total: number) => `${done} of ${total}`,
    nextStep: 'Up next',
    pathHeading: 'Your path',
    pathNote: 'Finish this step to unlock the next.',
    skip: 'Skip for now',
    view: 'View',
    now: 'Now',
    locked: 'Locked',
    onboardingLead: (stepId: string | null) => {
      switch (stepId) {
        case 'welcome':
          return 'Start here. Watch the welcome, then write your Life Vision.'
        case 'vision':
          return 'One conversation with VIVA writes your Life Vision. Then you meet your people.'
        case 'kit':
          return 'Your Life Vision is written. Hear it — or skip ahead to Vibe Tribe.'
        case 'tribe':
          return 'Your vision is written. Now introduce yourself in Vibe Tribe.'
        case 'gym':
          return "You've met your people. Take the Alignment Gym tour, then open MAP."
        case 'map':
          return 'You know where your people are. Now open MAP and see how the week runs.'
        case 'complete':
          return "You're almost there. One last look at what's next."
        default:
          return "You're started. The platform is open."
      }
    },
    trainingLead: (stepTitle: string | null) =>
      stepTitle
        ? `Up next: ${stepTitle}. Nothing is locked.`
        : 'You know the rooms. Use them whenever something wants to be made.',
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
    body: 'Introduce yourself to the people practicing conscious creation right alongside you.',
    cta: 'I introduced myself',
  },
  gym: {
    title: 'Alignment Gym',
    body: 'Take the tour so you know how to join the next live group coaching session.',
    cta: "I've seen the Gym",
  },
  map: {
    title: 'MAP',
    body: 'Review your plan and activate MAP so you know how the week runs.',
    cta: "I've seen MAP",
  },
  complete: {
    eyebrow: "You're started",
    title: 'Your life is written. Your people are here.',
    body: 'The platform is already open. When you want a walk through the rest of the tools — profile, stories, journal — Tools Training is waiting. Or just live.',
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
