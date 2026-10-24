import type { SeoPage } from '../types'

const SHOT = { width: 2880, height: 1840 }

export const visionBoardApp: SeoPage = {
  path: 'vision-board/app',
  cluster: 'vision-board',
  keyword: 'digital vision board',
  secondaryKeywords: [
    'vision board app',
    'vision board maker',
    'online vision board',
    'electronic vision board',
    'vision board generator',
  ],
  status: 'published',
  title: 'Digital Vision Board App: Make a Vision Board That Moves You',
  description:
    'Build a digital vision board free. Turn each desire into a living card with why it matters, how it feels and your next inspired action, then watch it actualize.',
  h1: 'Digital Vision Board',
  eyebrow: 'Vision Board App',
  answer:
    'A digital vision board is an online collage of images and words that represent the life you choose, kept on your phone or computer so you see it every day. The best ones go further: each desire holds why you want it, how it will feel, and the next inspired action, so the board becomes a practice, not wall art.',
  definition: {
    term: 'Digital vision board',
    text: 'A digital vision board is an online collage of images and words that represents the life you choose, kept where you will see it every day.',
  },
  heroSub:
    'Most vision boards get made once and forgotten. In Vibration Fit, every image on your board is a living manifestation: why you want it, how it feels, the steps you are taking, and the story of when it arrives.',
  ctaLabel: 'Build My Vision Board Free',
  heroImage: {
    src: '/home-preview/screenshots/vision-board.jpg',
    alt: 'Digital vision board in Vibration Fit with manifestation cards across life categories',
    ...SHOT,
  },
  tool: {
    id: 'vision-board-builder',
    title: 'Try it: start your vision board right here',
    intro:
      'Pick the areas of life you want to feel different in, add one desire to each, and see your first board take shape. Save it to your account to add images and keep it growing.',
  },
  steps: {
    heading: 'How to make a digital vision board that actually works',
    intro: 'This is the same order we walk every member through. It takes about fifteen minutes to start.',
    items: [
      {
        title: 'Choose across all 12 areas of life, not just one',
        body: 'A board that is all money and no love, or all travel and no health, pulls against itself. Start by noticing which of the 12 life categories you most want to feel different in: fun, health, travel, love, family, social, home, work, money, stuff, giving and spirituality. Add one desire to each area that calls you.',
        screenshot: { src: '/home-preview/screenshots/life-vision.jpg', alt: 'Life Vision organized across twelve life categories', ...SHOT },
      },
      {
        title: 'Give every image a why and a feeling',
        body: 'An image alone fades into the background within a week. Next to each one, write why you want it and what it will feel like when it is real. The feeling is the part you practice daily; the picture is the reminder.',
        screenshot: { src: '/home-preview/screenshots/vision-board.jpg', alt: 'A manifestation card with why it matters and how it feels', ...SHOT },
      },
      {
        title: 'Attach one inspired action',
        body: 'Ask: what is one small step that would feel good to take this week? Add it as an action step on the card. Momentum shows up as evidence, and evidence builds belief.',
      },
      {
        title: 'See it daily, then log the journey',
        body: 'Open your board each morning for one minute. When something shifts, even a small sign, journal it on that card. Over time each card holds its own journey, and when it arrives you mark it Actualized and write the story.',
        screenshot: { src: '/home-preview/screenshots/journal.jpg', alt: 'Journal entries linked to a manifestation', ...SHOT },
      },
    ],
  },
  examples: {
    heading: 'Digital vision board ideas to start with',
    intro: 'Borrow any of these as a first card. Then make it yours by adding why it matters and how it feels.',
    groups: [
      { title: 'Health', items: ['Waking up rested and strong', 'Moving my body daily because I love how it feels', 'A kitchen full of food that fuels me'] },
      { title: 'Money', items: ['Paying every bill with ease and a smile', 'A savings balance that lets me breathe', 'Giving generously without checking my account'] },
      { title: 'Love', items: ['A partnership that feels like home', 'Weekly dates we both look forward to', 'Being fully seen and adored'] },
      { title: 'Travel and fun', items: ['A month somewhere warm by the water', 'Saying yes to spontaneous weekends', 'Laughing until my face hurts'] },
    ],
  },
  founderNote: {
    heading: 'Why we stopped using paper vision boards',
    paragraphs: [
      'We made poster board vision boards for years. They looked beautiful for a week, then became part of the wall. What changed everything was treating each image as a manifestation we were in a relationship with: knowing why we wanted it, feeling it daily, taking one inspired step, and noticing every sign along the way.',
      'That is the board we built into Vibration Fit. It is the same practice we use every morning, and it is why so many of the things on our first digital board have since been marked Actualized.',
    ],
  },
  faqs: [
    {
      question: 'Is a digital vision board as effective as a physical one?',
      answer: 'Often more so, because you actually see it. A digital board lives on the phone you already open dozens of times a day, and it can hold the why, the feeling and the next step behind each image, which a poster cannot.',
    },
    {
      question: 'Can I make a digital vision board for free?',
      answer: 'Yes. Start a Free Activation in Vibration Fit to build your first board and Life Vision at no cost. You can also use the starter tool on this page without an account.',
    },
    {
      question: 'What should I put on my digital vision board?',
      answer: 'One clear desire for each area of life you want to feel different in, with an image that makes you feel it, a short line on why you want it, and one inspired action. Fewer, deeper cards beat a crowded collage.',
    },
    {
      question: 'How often should I look at my vision board?',
      answer: 'Daily, for about a minute. Look at each card long enough to feel what it will be like when it is real. The feeling, repeated, is the practice.',
    },
    {
      question: 'What is the difference between a vision board app and Canva?',
      answer: 'Canva is a design tool: great for making a beautiful collage you look at. A vision board app like Vibration Fit is a practice tool: each image tracks why it matters, your inspired actions, journal entries and the moment it actualizes.',
    },
  ],
  related: ['affirmations'],
  datePublished: '2026-10-21',
  dateModified: '2026-10-21',
  ppc: {
    campaign: 'VF – Vision Board – Commercial',
    adGroup: 'Digital Vision Board App',
    defaultHeadline: 'Digital Vision Board',
    keywords: [
      'digital vision board',
      'vision board app',
      'vision board maker',
      'online vision board',
      'electronic vision board',
      'vision board generator',
      'digital vision board app',
      'vision board online',
      'make a vision board online',
      'free vision board app',
      'vision board app free',
      'best vision board app',
    ],
    negatives: ['template', 'canva', 'pinterest', 'printable', 'supplies', 'kit'],
    subTemplate: 'The {keyword} built for conscious creators. Free to start, and every image becomes a living manifestation you practice daily.',
    headlines: [
      'Free to Start',
      'Build Your Board in Minutes',
      '12 Life Areas, One Vision',
      'Images That Track Your Why',
      'Log Every Sign It Is Working',
      'Mark Desires Actualized',
      'See It, Feel It, Live It',
      'Your Board on Every Device',
      'Daily One-Minute Practice',
      'Vision Board + Journal',
      'Made by Conscious Creators',
      'Start Your Free Activation',
    ],
    descriptions: [
      'Turn each image into a living manifestation: why you want it, how it feels, the next step.',
      'Start free. Build your vision board across all 12 areas of life and practice it daily.',
      'More than a collage. Track inspired actions, journal the journey, celebrate what arrives.',
    ],
    maxCpc: 1.6,
    overrides: {
      'vision board app': { h1: 'The Vision Board App for Conscious Creators' },
      'free vision board app': { h1: 'Free Vision Board App', cta: 'Start My Free Board' },
      'vision board app free': { h1: 'Free Vision Board App', cta: 'Start My Free Board' },
    },
  },
}
