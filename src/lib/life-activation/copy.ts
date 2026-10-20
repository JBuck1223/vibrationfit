export const LIFE_ACTIVATION_COPY = {
  source: 'src/lib/life-activation/copy.ts',
  sidebar: {
    onboardingTitle: 'Getting Started',
    onboardingAccent: 'Started',
    trainingTitle: 'Tools Training',
    trainingAccent: 'Training',
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
        'When you are ready, start. You will come back to your dashboard with a short baseline survey as the next step.',
      startCta: 'Get Started',
      continueCta: 'Get Started',
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
          return 'Start here. Watch the welcome, then take a short baseline survey.'
        case 'intake':
          return 'A short baseline so you can see where you started. Then tell VIVA about your world.'
        case 'world':
          return 'Your people, home, work, and money, so VIVA can write a Life Vision that is really yours.'
        case 'vision':
          return 'One conversation with VIVA writes your Life Vision. Then you meet your people.'
        case 'kit':
          return 'Your Life Vision is written. Generate the voice, the mix, and the board.'
        case 'voice':
          return 'Record your Life Vision in your own voice, or skip this step.'
        case 'tribe':
          return 'Your vision is written. Publish your introduction in Vibe Tribe.'
        case 'gym':
          return 'Take the Alignment Gym tour, then build your MAP.'
        case 'map':
          return 'You know where your people are. Customize your plan and activate MAP so you know how the week runs. Then a short closing survey.'
        case 'unlock':
          return 'One last survey. Answer from today so you can see what shifted.'
        case 'complete':
          return 'Use your MAP to stay on track. At your own pace, go through Tools Training so you know your full power inside Vibration Fit.'
        default:
          return "You're started. The platform is open."
      }
    },
    trainingLead: (stepTitle: string | null) =>
      stepTitle
        ? `Up next: ${stepTitle}. Nothing is locked.`
        : 'You know the rooms. Use them whenever something wants to be made.',
  },
  profile: {
    title: 'Your Life Profile',
    body: "Start with Personal Information: your name, birthday, and phone. The current state of each life area is optional, and anything you write there carries into your Life Vision's \"What's going on now.\"",
    cta: 'Continue',
    needProfile: 'Create your profile first, then continue.',
    missing: (fields: string[]) => `Save your ${fields.join(', ')} in Personal Information, then continue.`,
  },
  world: {
    title: 'Your World',
    titleAccent: 'World',
    body: 'The names, places, and details that make your Life Vision yours. Everything here is optional.',
    done: 'Saved. You can update this anytime in Your World.',
    next: 'Next',
    back: 'Back',
    cta: 'Save and continue',
    skip: 'Skip for now',
    editCta: 'Update in Your World',
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
    title: 'Create your Activation Kit',
    body: 'VIVA speaks your Life Vision, mixes it with music, and places images on your board. Voice, a mix, and at least one image are part of this step.',
    cta: 'Generate My Activation Kit',
    generating: 'Your kit is creating. You can keep going.',
  },
  voice: {
    title: 'Record your voice',
    body: 'Record your Life Vision aloud in your own voice, then save each recording. If you do not want to record, skip ahead.',
    cta: 'Record my voice',
  },
  tribe: {
    title: 'Meet Vibe Tribe',
    body: 'Introduce yourself to the people practicing conscious creation right alongside you.',
    cta: 'Write your introduction',
  },
  gym: {
    title: 'Alignment Gym',
    body: 'Take the tour so you know how to join the next live group coaching session.',
    cta: 'Take the tour',
  },
  map: {
    title: 'MAP',
    body: 'Pick at least one action in each area, tune the cadence, then save. That activates your MAP.',
    cta: 'Create My MAP',
  },
  intake: {
    title: 'Baseline Intake',
    titleAccent: 'Intake',
    body: 'A snapshot of where you are now. There are no wrong numbers.',
    locked: 'These answers are locked. This is the snapshot from when you started.',
    cta: 'Save Intake',
  },
  unlock: {
    title: 'Platform Unlock',
    titleAccent: 'Unlock',
    body: 'Answer from today. We filled in a score from the work already on your account. Change anything that does not feel true.',
    cta: 'Save and finish',
    shiftQuestion: 'Please share a brief snippet on your experience getting started.',
    sharePrompt: 'Your words may be exactly what the next member needs to hear. How may we share them?',
    shareOptions: [
      { value: 'named', label: 'With my first name' },
      { value: 'anonymous', label: 'Anonymously' },
      { value: 'none', label: 'Keep it private' },
    ],
  },
  complete: {
    title: "You're started",
    titleAccent: 'started',
    body: 'Use your MAP to stay on track. At your own pace, go through Tools Training so you know your full power inside Vibration Fit.',
    tourCta: 'Show me MAP',
    trainingCta: 'Start Tools Training',
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
    titleAccent: 'rooms',
    body: 'Stories, spoken tools, songs, manifestations, journal, Daily Paper, VIVA, and MAP are yours to use whenever something wants to be made.',
    dashboardCta: 'Go to Dashboard',
  },
  banner: {
    markDone: 'Mark done',
    next: 'Next',
    skip: 'Skip',
  },
} as const
