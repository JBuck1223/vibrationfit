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
    title: 'Welcome to your Activation!',
    lead: 'Here\'s how it works:',
    body:
      'You\'ll have a conversation with VIVA about the current state of your life and where your imagination takes you when you allow yourself to dream big! She will then craft your vision from your words using vibrational grammar that is harmonious with universal law. From this vision, she will build your Activation so you can begin activating your new vision immediately.',
    close:
      'You can read it, speak it, listen to it, and look at it. Everything is yours to keep.',
    time: 'About 10 to 15 minutes.',
    cta: 'Start My Activation',
    committing: 'Starting...',
  },

  categoryPick: {
    source: 'src/components/activation/ActivationCategoryPick.tsx',
    eyebrow: 'One area',
    title: 'Which life category would you like to activate?',
    continue: 'Talk with VIVA',
    continuing: 'Opening...',
  },

  chat: {
    source: 'src/components/activation/ActivationIntakeChat.tsx',
    promptFile: 'src/lib/viva/prompts/activation-chat-prompts.ts',
    opening: (firstName: string | null | undefined, categoryLabel: string) => {
      const name = firstName?.trim()
      const hello = name
        ? `Hi, I'm VIVA. And I'm glad you're here, ${name}.`
        : "Hi, I'm VIVA. And I'm glad you're here."
      return `${hello}\n\nIn this chat, I'll be collecting the information I need to help you craft your Life Vision in this area.\n\nPlease begin by telling me about the current state of ${categoryLabel} in your life. Be as raw and as real as you can. After current state, we'll move on to what's in your imagination, and what clarity you already have about what you want. If you flow into what you want while describing current state, that's cool too.`
    },
    placeholder: 'Talk to VIVA...',
    readinessTitle: 'So far',
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
      'A personalized Activation you can read, hear, feel, and keep — free, in 10 to 15 minutes.',
    cta: 'Create My Free Activation',
    noCard: 'No credit card required. Takes 10–15 minutes.',
    sections: [
      {
        id: 'hero',
        heading: 'Thoughts Become Things. So Why Isn\'t It Working?',
        notes: 'Hero headline + offer video + CTA.',
      },
      {
        id: 'how-it-works',
        heading: 'How Vibration Fit Works',
        notes: 'Short version of the Conscious Creation System.',
      },
      {
        id: 'proof',
        heading: 'Real People. Real Results.',
        notes: 'SocialProofSection testimonials, directly under How Vibration Fit Works.',
      },
      {
        id: 'what-you-keep',
        heading: 'Your personalized Activation includes',
        notes: 'Words / sound and image — not a delivery timeline. Directly under Real People. Real Results.',
      },
      {
        id: 'meet-viva',
        heading: 'What VIVA Does',
        notes: 'Contrast → Life I Choose → blacksmith tools.',
      },
      {
        id: 'practice',
        heading: 'You Know the Law. Now Live It.',
        notes: 'Vibrational Fitness framing. Graphic on the right; CTA under the graphic on mobile.',
      },
      {
        id: 'loop',
        heading: 'Install It Once. Run It Daily. Evolve As Life Changes.',
        notes: 'Five-stage conscious creation loop.',
      },
      {
        id: 'final-cta',
        heading: 'Your vision is waiting to take shape.',
        notes: 'Email capture form.',
      },
    ],
  },

  landingHome: {
    route: '/',
    source: 'src/app/page.tsx',
    notes:
      'Live front door. Activation landing is the spine; homepage-only containers (orbit, founders, fit check) are grafted in. FAQ is free Activation → $99/28-day membership, cancel anytime. `/activation/home` redirects here.',
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
    source: 'src/components/activation/ActivationExperienceSteps.tsx',
    messages: (categoryLabel?: string) => [
      categoryLabel
        ? `VIVA is writing your Life I Choose in ${categoryLabel}...`
        : 'VIVA is writing your Life I Choose from your words...',
      'Writing your Future-Self Story...',
      'Forging your Incantation...',
      'Crafting your SparkQuery...',
      'Writing your song...',
    ],
    estimatedTime: 'This usually takes under a minute.',
    cycleDuration: 8000,
    estimatedDuration: 50000,
  },

  preview: {
    source: 'src/app/activation/[id]/page.tsx',
    eyebrow: 'Ready',
    headline: (firstName?: string | null, categoryLabel?: string | null) => {
      if (firstName && categoryLabel) return `${firstName}, your ${categoryLabel} Activation is ready`
      if (categoryLabel) return `Your ${categoryLabel} Activation is ready`
      if (firstName) return `${firstName}, your Activation is ready`
      return 'Your Activation is ready'
    },
    supporting:
      'The words are ready. Pick a voice for your audios and a genre for your song, then step in.',
    enter: 'Enter My Activation',
    entering: 'Opening...',
    readyLabel: 'Ready',
    assets: [
      { key: 'vision', label: 'Life I Choose' },
      { key: 'story', label: 'Future-Self Story' },
      { key: 'incantation', label: 'Incantation' },
      { key: 'spark_query', label: 'SparkQuery' },
      { key: 'song', label: 'Your song' },
    ],
  },

  mediaPick: {
    source: 'src/components/activation/ActivationMediaPick.tsx',
    voiceTitle: 'Choose the voice for your vision audios',
    genreTitle: 'Choose a genre for your song',
    previewHint: 'Click play to preview.',
  },

  immersion: {
    source: 'src/app/activation/[id]/page.tsx',
    headline: 'Your Activation',
    categoryFallback: 'Your Activation',
    categoryTitle: (label: string) => `${label} Activation`,
    heroVideoLabel: 'How to enter',
    heroVideoPlaceholder:
      'A short film on how to use this Activation is coming to this spot.',
    mapTitle: 'How to activate',
    mapLead: 'Every piece on this page is a way in. Use them in any order — this is the map.',
    mapStops: [
      { id: 'life-i-choose', title: 'Life I Choose', use: 'Read it. Then play the audio.' },
      { id: 'future-self-story', title: 'Future-Self Story', use: 'Read yourself into the day. Then listen.' },
      { id: 'incantation', title: 'Incantation', use: 'Say it out loud.' },
      { id: 'spark-query', title: 'SparkQuery', use: 'Ask it. Notice what opens.' },
      { id: 'song', title: 'Your Song', use: 'Play it while you read and look.' },
      { id: 'vision-board', title: 'Vision Board', use: 'Look at the pictures of this life.' },
    ],
    guideDone: "I've Entered This Reality",
    lifeIChoose: 'Life I Choose',
    lifeIChooseHint: 'Read it. Then play the audio.',
    story: 'Future-Self Story',
    storyHint: 'Read yourself into the day. Then listen.',
    incantation: 'Incantation',
    incantationHint: 'Say it out loud.',
    sparkQuery: 'SparkQuery',
    sparkHint: 'Ask it. Notice what opens.',
    copyLabel: 'Copy',
    copied: 'Copied',
    download: 'Download',
    saved: 'Saved',
    listen: 'Listen',
    lyrics: 'Read the lyrics',
    visionAudio: 'Vision Audio',
    song: 'Your Song',
    songHint: 'Play it while you read and look.',
    images: 'Vision Board',
    imagesHint: 'Look at the pictures of this life.',
    creating: 'Creating',
    ready: 'Ready',
    failedLabel: 'Failed',
    failed: 'This piece needs another moment. Try again.',
    retry: 'Try again',
    retrying: 'Trying again...',
    keepTitle: 'Keep Your Activation',
    keepBody: 'Everything created here is yours to download, revisit, and keep.',
    downloadEverything: 'Download Everything',
    inspiredTitle: 'What feels inspired now?',
    inspiredHint:
      'One thought, action, or possibility that feels alive after experiencing your Activation.',
    inspiredPlaceholder: 'One thought, action, or possibility...',
    inspiredSave: 'Save Inspired Thought',
    offerTitle: 'One area is chosen. Now write the rest of this life.',
    offerBody:
      'You just entered one reality. Vibration Fit is where VIVA writes your full Life Vision as one life, then takes you to Vibe Tribe and Alignment Gym — your people, your room. The rest of the tools wait until you want them.',
    offerCta: 'Activate the Rest of This Life',
    offerVideoLabel: 'Offer video',
    offerVideoPlaceholder:
      'A short film of what VIVA just created — and how Vibration Fit continues from here — is coming to this spot.',
  },
} as const

export const ACTIVATION_SAMPLE = {
  firstName: 'Jordan',
  email: 'jordan@example.com',
  conversation: [
    {
      role: 'assistant' as const,
      content:
        "Hi, I'm VIVA. And I'm glad you're here, Jordan.\n\nIn this chat, I'll be collecting the information I need to help you craft your Life Vision in this area.\n\nPlease begin by telling me about the current state of Money in your life. Be as raw and as real as you can. After current state, we'll move on to what's in your imagination, and what clarity you already have about what you want. If you flow into what you want while describing current state, that's cool too.",
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
    'I work from a calm home office three days a week. Fridays belong to my kids. The work I do matters. I am proud of this life. I lead with presence. I am a parent and a builder who is actually in the room. My house feels like I can breathe in it. I am light. I am steady. This is the life I choose.',
  story:
    'I close the laptop at three on a Thursday and the house is already warm. My daughter is at the table with markers. I sit down next to her — the one who is actually here. Friday is already ours. The work I did this week mattered. I can feel it in my chest: pride.',
  incantation:
    'I am in the room!\nPresence fills this house, Friday already ours, the work I love landing with ease!\nI am present, I am proud, I am the builder who is here — for this is who I am!',
  sparkQuestions: [
    'Why does my work flow so naturally from a calm home office three days a week?',
    'Why do Fridays already belong to my kids so easily?',
    'Why am I the kind of person who leads with presence and feels proud of this life?',
  ],
  inspiredStep: 'Block Friday mornings on the calendar starting next week — no meetings.',
  songLyrics:
    'I close the laptop and the house is already warm\nFriday already belongs to us\nI lead with presence\nThis is the life I choose',
}
