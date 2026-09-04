/**
 * User-facing copy for the public Activation funnel.
 *
 * Inspect and review every step at /admin/activation. Edit strings here —
 * the landing page, experience wizard, start form, and Immersion screen
 * all read from this module.
 */

export type DreamAnswerKey = 'want' | 'why' | 'feel' | 'become'

export interface DreamQuestion {
  key: DreamAnswerKey
  label: string
  placeholder: string
  required?: boolean
}

export const ACTIVATION_COPY = {
  chrome: {
    title: 'Your Activation',
    creating: 'Creating...',
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    withViva: 'With VIVA',
  },

  orientation: {
    source: 'src/components/activation/ActivationOrientation.tsx',
    eyebrow: 'Your Activation',
    title: 'Tell the truth. Then say what you want.',
    intro:
      'This is a conversation, not a form. You do not need the polished version. You need the real one.',
    youWillTitle: 'What you will do',
    youWill:
      'Tell VIVA what is true right now — the frustration, the weight, the stuck place — then say what you actually want instead.',
    vivaWillTitle: 'What VIVA will do',
    vivaWill:
      'Listen. Ask only what she still needs. Then write your Activation from your own words.',
    leaveWithTitle: 'What you leave with',
    leaveWith:
      'Your Life I Choose, Future-Self Story, Incantation, and SparkQuery. Audio, song, and images arrive as you enter.',
    time: 'About 10 to 15 minutes.',
    cta: 'I am ready',
    committing: 'Opening...',
  },

  categoryPick: {
    source: 'src/components/activation/ActivationCategoryPick.tsx',
    eyebrow: 'One area',
    title: 'Which part of your life wants your attention?',
    subtitle:
      'Pick the area you want to sit with. VIVA will stay there with you — not try to name it for you.',
    continue: 'Talk with VIVA',
    continuing: 'Opening...',
  },

  chat: {
    source: 'src/components/activation/ActivationIntakeChat.tsx',
    promptFile: 'src/lib/viva/prompts/activation-chat-prompts.ts',
    opening: (firstName: string | null | undefined, categoryLabel: string) => {
      const name = firstName?.trim()
      const hello = name ? `I'm glad you're here, ${name}.` : "I'm glad you're here."
      return `${hello}\n\nYou chose ${categoryLabel}. That's the place we'll sit together — not to fix it from the outside, but to hear what's true there, and what you actually want instead.\n\nWhenever you're ready, start wherever it is. The weight. The want. A moment. I'm listening.`
    },
    placeholder: 'Talk to VIVA...',
    readinessTitle: 'What VIVA is holding',
    readinessCurrent: 'Current state',
    readinessDesire: 'Desire',
    create: 'Create My Activation',
    creating: 'Creating your Activation...',
    readyLine: 'I have what I need. When you are ready, I will write your Activation from your words.',
  },

  landing: {
    route: '/activation',
    source: 'src/app/activation/page.tsx',
    metaTitle: 'Create Your Free Activation | Vibration Fit',
    metaDescription:
      'Tell VIVA where you are. Experience the reality you want next. A personalized Activation you can read, hear, feel, and keep — free, in 10 to 15 minutes.',
    cta: 'Create My Free Activation',
    noCard: 'No credit card required. Takes 10–15 minutes.',
    sections: [
      {
        id: 'hero',
        heading: 'Thoughts Become Things. So Why Isn\'t It Working?',
        notes: 'Hero headline + video + "Tell VIVA where you are."',
      },
      {
        id: 'how-it-works',
        heading: 'How Vibration Fit Works',
        notes: 'Short version of the Conscious Creation System.',
      },
      {
        id: 'meet-viva',
        heading: 'What VIVA Does',
        notes: 'Contrast → Life I Choose → blacksmith tools.',
      },
      {
        id: 'what-you-keep',
        heading: 'Your personalized Activation includes',
        notes: 'Seven assets (written + enrichment).',
      },
      {
        id: 'practice',
        heading: 'You Know the Law. Now Live It.',
        notes: 'Vibrational Fitness framing.',
      },
      {
        id: 'loop',
        heading: 'Install It Once. Run It Daily. Evolve As Life Changes.',
        notes: 'Five-stage conscious creation loop.',
      },
      {
        id: 'proof',
        heading: 'This is not another generic manifestation exercise.',
        notes: 'SocialProofSection testimonials.',
      },
      {
        id: 'final-cta',
        heading: 'Your vision is waiting to take shape.',
        notes: 'Email capture form.',
      },
    ],
  },

  startForm: {
    source: 'src/components/activation/ActivationStartForm.tsx',
    firstNamePlaceholder: 'First name',
    emailPlaceholder: 'you@example.com',
    submit: 'Create My Free Activation',
    submitting: 'Setting up your space...',
    footer: 'No credit card required. Takes 10–15 minutes. Your information stays private.',
    checkEmailTitle: 'Check your email',
    checkEmailBefore: 'You already have a Vibration Fit account, so we sent a secure sign-in link to',
    checkEmailAfter: 'Open it on this device to continue your Activation.',
  },

  currentState: {
    source: 'src/app/activation/experience/page.tsx',
    title: "What's happening right now?",
    subtitle:
      'Tell the truth. What feels frustrating, painful, confusing, or stuck? Take as much room as you need — VIVA listens before anything else.',
    placeholder: 'Right now...',
    submit: 'Share with VIVA',
    submitting: 'VIVA is listening...',
    minLength: 20,
  },

  reflection: {
    source: 'src/app/activation/experience/page.tsx',
    vivaLabel: 'VIVA',
    confirm: "Yes, that's it",
    addMore: 'Let me add more',
    promptFile: 'src/lib/viva/prompts/activation-experience-prompts.ts',
  },

  dream: {
    source: 'src/app/activation/experience/page.tsx',
    title: 'Now — what do you actually want?',
    subtitle: "Don't make it realistic yet. Let yourself want what you want.",
    submit: 'Continue',
    submitting: 'VIVA is tuning in...',
    back: 'Back',
    questions: [
      {
        key: 'want',
        label:
          "If this area of your life could change, what would you love to be true instead? Don't make it realistic yet. What do you actually want?",
        placeholder: 'I would love...',
        required: true,
      },
      { key: 'why', label: 'Why does this matter to you?', placeholder: 'It matters because...' },
      { key: 'feel', label: 'How would you feel living this reality?', placeholder: 'I would feel...' },
      { key: 'become', label: 'Who would you become?', placeholder: 'I would be someone who...' },
    ] satisfies DreamQuestion[],
  },

  category: {
    source: 'src/app/activation/experience/page.tsx',
    vivaLabel: 'VIVA',
    fallbackLine: (categoryLabel: string) =>
      `This sounds primarily connected to ${categoryLabel}. Is that right?`,
    confirm: 'Yes — Create My Activation',
    differentArea: "It's a different area",
    correctPrompt: 'Which area is at the center of this?',
    create: 'Create My Activation',
    promptFile: 'src/lib/viva/prompts/activation-experience-prompts.ts',
  },

  generating: {
    source: 'src/app/activation/experience/page.tsx',
    title: 'VIVA is creating your Activation',
    body: 'Your Life I Choose vision, Future-Self Story, Incantation, and SparkQuery are being written from your own words. This usually takes under a minute.',
  },

  preview: {
    source: 'src/app/activation/[id]/page.tsx',
    eyebrow: 'Ready',
    headline: 'Your Activation is ready',
    supporting:
      'The written pieces are in. Enter to step into them. Audio, song, and images begin the moment you do.',
    enter: 'Enter My Activation',
    entering: 'Opening...',
    arrivingNext: 'Arrives when you enter',
    assets: [
      { key: 'vision', label: 'Life I Choose' },
      { key: 'story', label: 'Future-Self Story' },
      { key: 'incantation', label: 'Incantation' },
      { key: 'spark_query', label: 'SparkQuery' },
    ],
    queued: [
      { key: 'audio', label: 'Spoken audio' },
      { key: 'song', label: 'Your song' },
      { key: 'board', label: 'Vision images' },
    ],
  },

  immersion: {
    source: 'src/app/activation/[id]/page.tsx',
    headline: 'Step Into Your Chosen Reality',
    categoryFallback: 'Your Activation',
    categoryTitle: (label: string) => `${label} Activation`,
    guideTitle: 'Start Here — your first Activation takes about 3 minutes',
    guideDone: "I've Entered This Reality",
    seeHow: 'See How Vibration Fit Continues This',
    guideSteps: [
      'Read your Life I Choose.',
      'Experience your Future-Self Story.',
      'Repeat your Incantation.',
      'Ask your SparkQuery.',
      'Notice what possibility opens.',
    ],
    lifeIChoose: 'Life I Choose',
    story: 'Future-Self Story',
    readStory: 'Read your story',
    incantation: 'Incantation',
    incantationHint: 'Speak it out loud. Rhythm builds identity.',
    sparkQuery: 'SparkQuery',
    sparkHint: 'A question you ask the universe to open yourself to new mental possibilities.',
    download: 'Download',
    downloadEverything: 'Download Everything',
    arriving: 'Arriving for you now',
    song: 'Your Song',
    images: 'Vision Images',
    creating: 'creating',
    didntComeThrough: "didn't come through",
    retry: 'Try again',
    retrying: 'Trying again...',
    keepNote:
      'Everything here is yours to keep — download any of it, any time. No need to wait on this page; your Activation stays saved in your account.',
    offerTitle: 'One Activation is powerful. A system makes it a way of life.',
    offerBody:
      'What you just received is yours. Vibration Fit is how you repeat this with VIVA — Manifestations, the Loop (Capture, Choose, Immerse, Plan, Connect), Alignment Gym, and Vibe Tribe — so one chosen reality becomes a way of life.',
    offerCta: 'Continue With Vibration Fit',
    offerVideoLabel: 'Offer video',
    offerVideoPlaceholder: 'A short film of what VIVA just created — and what continues from here — is coming to this spot.',
    inspiredTitle: 'What feels inspired now?',
    inspiredHint:
      'Totally optional. If an action is calling you from inside this new reality, capture it here.',
    inspiredPlaceholder: 'One thing I feel inspired to do...',
    inspiredSave: 'Save my inspired step',
  },
} as const

export const ACTIVATION_SAMPLE = {
  firstName: 'Jordan',
  email: 'jordan@example.com',
  conversation: [
    {
      role: 'assistant' as const,
      content:
        "I'm glad you're here, Jordan.\n\nYou chose Money. That's the place we'll sit together — not to fix it from the outside, but to hear what's true there, and what you actually want instead.\n\nWhenever you're ready, start wherever it is. The weight. The want. A moment. I'm listening.",
    },
    {
      role: 'user' as const,
      content:
        "I've been working sixty-hour weeks for two years and I still feel one bad month away from everything falling apart. I can't remember the last time I felt proud of my life.",
    },
    {
      role: 'assistant' as const,
      content:
        "I hear the hours — and the fear under them. Sixty weeks stacked on sixty, and the life those hours were supposed to buy still feels one bad month from collapsing. What would you love to be true instead?",
    },
  ],
  currentState:
    "I've been working sixty-hour weeks for two years and I still feel one bad month away from everything falling apart. I can't remember the last time I felt proud of my life — just tired, behind, and like I'm performing a version of success that doesn't actually feel like mine.",
  reflection:
    "Here's what I'm hearing. You've been pouring everything into the hours — sixty of them, week after week — and the life those hours were supposed to buy still feels one bad month from collapsing. Underneath the tired is something sharper: you're performing a version of success that doesn't feel like yours, and you can't remember the last time you felt proud.\n\nThat gap between the effort and the feeling is heavy. And underneath a weight like that, there's usually something you want very specifically — a life that actually feels like yours.",
  dream: {
    want: 'I would love to work from a calm home office three days a week, take Fridays for my kids, and feel like the work I do actually matters — not just keeps the lights on.',
    why: 'It matters because I don\'t want my kids to only know the tired version of me. I want them to know I chose a life I was proud of.',
    feel: 'I would feel light. Steady. Like I can breathe in my own house.',
    become: 'I would be someone who leads with presence instead of panic — a parent and a builder who is actually in the room.',
  },
  category: 'money',
  confirmationLine:
    'This sounds primarily connected to money and the pressure of providing — the hours, the fear of one bad month, the version of success that doesn\'t feel like yours. Is that right?',
  essence: 'Steady Presence',
  visionStatement:
    'I work from a calm home office three days a week. Fridays belong to my kids. The work I do matters — it is not just keeping the lights on. I am proud of this life. I lead with presence instead of panic. I am a parent and a builder who is actually in the room. My house feels like I can breathe in it. I am light. I am steady. This is the life I choose.',
  story:
    'I close the laptop at three on a Thursday and the house is already warm. My daughter is at the table with markers. I sit down next to her — not the tired version, the one who is actually here. Friday is already ours. The work I did this week mattered. I can feel it in my chest: pride, not performance.',
  incantation:
    'I am present. I am proud. I build a life that feels like mine. I lead with steadiness. I am in the room.',
  sparkQuestions: [
    'What becomes possible when my work and my presence stop competing?',
    'Who do I get to be when Friday already belongs to us?',
  ],
  inspiredStep: 'Block Friday mornings on the calendar starting next week — no meetings.',
}
