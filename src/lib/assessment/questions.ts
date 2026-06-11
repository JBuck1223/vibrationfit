import { AssessmentCategory as AssessmentCategoryType, ResponseValue } from '@/types/assessment'

export interface QuestionOption {
  text: string
  value: ResponseValue
  emoji: string
  greenLine: 'above' | 'neutral' | 'below'
  isCustom?: boolean
}

export interface ConditionalLogic {
  field: string
  condition: (value: any) => boolean
}

export interface AssessmentQuestion {
  id: string
  category: AssessmentCategoryType
  text: string
  options: QuestionOption[]
  conditionalLogic?: ConditionalLogic
}

export interface AssessmentCategoryQuestions {
  category: AssessmentCategoryType
  questions: AssessmentQuestion[]
}

// ============================================================================
// MONEY & WEALTH
// ============================================================================
const moneyQuestions: AssessmentQuestion[] = [
  {
    id: 'money_1',
    category: 'money',
    text: 'When you think about whether there\'s \'enough\' money in your life, what\'s the honest feeling?',
    options: [
      { text: 'I feel abundant \u2014 there\'s always enough, and more is on the way', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel secure \u2014 I trust that my needs are met', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel okay most days but worry creeps in sometimes', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel a constant low-level anxiety about money running out', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel trapped in scarcity \u2014 there\'s never enough and it won\'t change', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_2',
    category: 'money',
    text: 'When you think about what you earn relative to the value you provide, what comes up?',
    options: [
      { text: 'I know my worth and I\'m compensated accordingly', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel fairly valued for what I bring', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m not sure if I\'m over or underpaid', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel undervalued \u2014 I give more than I get back', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like I\'ll never be paid what I\'m truly worth', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_3',
    category: 'money',
    text: 'When you see someone with something expensive you\'d love to own, what\'s your first honest thought?',
    options: [
      { text: 'That\'s coming for me too', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Good for them, that\'s awesome', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Nice, no emotional charge', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Must be nice (with a twinge of resentment)', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'They probably got lucky or inherited it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_4',
    category: 'money',
    text: 'When money comes up in conversation (salary, prices, asking for a raise), what\'s your internal response?',
    options: [
      { text: 'Comfortable \u2014 money is just a topic, no charge', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Fine, I can discuss it when needed', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'A little uncomfortable but I manage', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I avoid money conversations \u2014 they feel taboo or vulnerable', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Deeply uncomfortable \u2014 money talk triggers shame or anxiety', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_5',
    category: 'money',
    text: 'When you think about your financial future (5-10 years from now), what do you feel?',
    options: [
      { text: 'Excited \u2014 I can see abundance ahead and I\'m building toward it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Optimistic \u2014 I trust things are moving in the right direction', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Uncertain \u2014 I hope it works out but I\'m not sure', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Anxious \u2014 I worry I\'ll never get ahead', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Hopeless \u2014 I can\'t imagine financial freedom for myself', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_6',
    category: 'money',
    text: 'When you think about any debt or financial obligations you carry, what\'s the feeling?',
    options: [
      { text: 'Managed and light \u2014 debt is a tool, not a burden', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Under control \u2014 I have a plan and it doesn\'t stress me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It weighs on me sometimes but I cope', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Heavy \u2014 it\'s a constant background stress', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Crushing \u2014 it feels like I\'ll never get free', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_7',
    category: 'money',
    text: 'When good financial things happen to you (raise, bonus, windfall, new client), what\'s your first internal reaction?',
    options: [
      { text: '"Of course \u2014 I attract this"', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: '"I earned this and I\'m grateful"', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: '"Cool, but let\'s see if it lasts"', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: '"I don\'t deserve this" or "there must be a catch"', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: '"Something bad will happen to balance this out"', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// FUN & RECREATION
// ============================================================================
const funQuestions: AssessmentQuestion[] = [
  {
    id: 'fun_1',
    category: 'fun',
    text: 'When you have free time with no obligations, how do you feel about it?',
    options: [
      { text: 'Excited \u2014 I have things I genuinely look forward to doing', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Content \u2014 I enjoy the freedom and use it well', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral \u2014 I fill the time but nothing excites me', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Restless or guilty \u2014 I should be doing something productive', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Lost \u2014 I don\'t know what to do with myself', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_2',
    category: 'fun',
    text: 'When you think about your hobbies and interests, what comes up?',
    options: [
      { text: 'I have multiple passions I actively pursue', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I enjoy several activities regularly', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some interests I dabble in', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I used to have hobbies but lost interest', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I don\'t really have any hobbies', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_3',
    category: 'fun',
    text: 'When you think about joy and pleasure in your daily life, what\'s the truth?',
    options: [
      { text: 'I experience genuine joy regularly \u2014 life feels rich', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I find pleasure in my routines and activities', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Some moments feel good, but joy is inconsistent', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I rarely feel genuine pleasure or excitement about anything', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Life feels flat \u2014 I can\'t remember the last time I felt real joy', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_4',
    category: 'fun',
    text: 'When you think about play and having fun, how do you feel?',
    options: [
      { text: 'I embrace playfulness and joy regularly', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I enjoy being playful when appropriate', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have fun but it\'s not a priority', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel guilty about taking time to play', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I don\'t really know how to have fun', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_5',
    category: 'fun',
    text: 'When you think about laughter in your life, what comes up?',
    options: [
      { text: 'I laugh often and easily \u2014 humor is a big part of my life', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I find reasons to laugh and feel lighthearted regularly', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I laugh sometimes but life feels more serious than playful', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I can\'t remember the last time I really laughed', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel heavy \u2014 nothing seems funny or lighthearted anymore', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_6',
    category: 'fun',
    text: 'When you imagine adding more joy to your life, what do you feel?',
    options: [
      { text: 'Excited \u2014 I know what brings me alive and I pursue it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Open \u2014 I\'m willing and able to create more joy', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Guilty \u2014 I feel like I don\'t deserve fun or shouldn\'t prioritize it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Stuck \u2014 I want more joy but don\'t know how or feel blocked', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Hopeless \u2014 joy feels out of reach for someone like me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_7',
    category: 'fun',
    text: 'When something fun IS happening \u2014 you\'re in the middle of a good time \u2014 can you actually enjoy it?',
    options: [
      { text: 'Fully \u2014 I\'m present, soaking it in, savoring every moment', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly \u2014 I enjoy it with occasional distracting thoughts', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Partly \u2014 I\'m there but my mind is elsewhere', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Barely \u2014 I can\'t relax even in fun situations', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'No \u2014 guilt, anxiety, or numbness prevents me from enjoying anything', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// HEALTH & VITALITY
// ============================================================================
const healthQuestions: AssessmentQuestion[] = [
  {
    id: 'health_1',
    category: 'health',
    text: 'When you catch your reflection in a mirror, what\'s your honest first reaction?',
    options: [
      { text: 'I feel good, confident, and attractive', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel mostly positive about how I look', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m neutral, don\'t think about it much', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel self-conscious or disappointed', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I avoid mirrors and dislike my appearance', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_2',
    category: 'health',
    text: 'When you think about how you move your body \u2014 exercise, walking, stretching, any physical activity \u2014 what\'s your relationship with it?',
    options: [
      { text: 'I move in ways that feel good and it\'s a natural part of my life', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m generally active and enjoy how movement makes me feel', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I know I should move more but I\'m managing', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel stuck \u2014 movement feels like a chore or punishment', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I\'ve become sedentary and it\'s affecting how I feel about myself', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_3',
    category: 'health',
    text: 'When you think about your day-to-day energy and how alive you feel, what comes up?',
    options: [
      { text: 'I feel vibrant \u2014 my energy matches the life I want to live', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have good energy most days', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'My energy is inconsistent \u2014 some days great, others depleted', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel tired most of the time and it limits me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I\'m running on empty and have been for a while', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_4',
    category: 'health',
    text: 'When you think about how you eat and nourish your body, what\'s your feeling?',
    options: [
      { text: 'I love food and feel nourished by what I eat', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I eat well and feel satisfied', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I eat what I need but don\'t think about it much', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I struggle with eating habits and feel guilty', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I have a difficult relationship with food', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_5',
    category: 'health',
    text: 'When you think about your mental and emotional well-being, what comes up?',
    options: [
      { text: 'I feel mentally strong and emotionally balanced', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I manage my emotions well most of the time', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have ups and downs but cope okay', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I struggle with anxiety, depression, or emotional overwhelm', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel mentally exhausted and emotionally drained', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_6',
    category: 'health',
    text: 'When you think about your sleep, what\'s your experience?',
    options: [
      { text: 'I sleep deeply and wake refreshed', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I generally sleep well', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'My sleep is hit or miss', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I often struggle to fall or stay asleep', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I\'m chronically sleep-deprived and it affects everything', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_7',
    category: 'health',
    text: 'When you think about how well you take care of yourself \u2014 not just physically, but overall \u2014 what\'s honest?',
    options: [
      { text: 'I prioritize my well-being and it shows in how I feel', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I generally take good care of myself', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I know self-care matters but I often put it last', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I neglect myself \u2014 I\'m always last on my own list', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I\'ve abandoned self-care and I\'m paying the price', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// STUFF & POSSESSIONS
// ============================================================================
const possessionsQuestions: AssessmentQuestion[] = [
  {
    id: 'stuff_1',
    category: 'stuff',
    text: 'When you think about your belongings, what\'s your dominant feeling?',
    options: [
      { text: 'I love my possessions and they bring me joy', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I appreciate my belongings and feel satisfied', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have what I need but don\'t think about it much', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by too much stuff', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel burdened by my possessions', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_2',
    category: 'stuff',
    text: 'When you look around at what you own, what\'s the honest feeling?',
    options: [
      { text: 'I have everything I need and it all serves a purpose', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel satisfied \u2014 my possessions support my life well', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'There are gaps that bother me, but it\'s mostly fine', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel lacking \u2014 there are things I need but can\'t access', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel deprived or resentful about what I don\'t have', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_3',
    category: 'stuff',
    text: 'When you think about buying or acquiring things, what\'s your pattern?',
    options: [
      { text: 'Clear and intentional \u2014 I get what serves me, no guilt or compulsion', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have a healthy relationship with buying things', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Sometimes I buy things I don\'t need, sometimes I deprive myself', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I either overspend impulsively or deny myself things I want out of guilt', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'My relationship with acquiring things feels out of control or punishing', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_4',
    category: 'stuff',
    text: 'When you think about letting go of things you no longer need, what comes up?',
    options: [
      { text: 'I release things easily \u2014 I don\'t attach my identity to possessions', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I can let go when something no longer serves me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I hold onto some things longer than I should', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I struggle to let go \u2014 everything feels precious or wasteful to discard', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I can\'t let go of anything and it\'s suffocating me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_5',
    category: 'stuff',
    text: 'When you pause and think about everything you currently have, what\'s the first feeling?',
    options: [
      { text: 'Appreciation \u2014 I\'m genuinely thankful for what\'s in my life', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Content \u2014 I feel at peace and don\'t focus on what\'s missing', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral \u2014 I don\'t really think about it one way or another', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Restless \u2014 I\'m always focused on what\'s missing or next', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Resentful \u2014 I compare what I have to others and feel behind', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_6',
    category: 'stuff',
    text: 'Does what you own make you feel more free or more trapped?',
    options: [
      { text: 'Free \u2014 everything I have adds to my life, nothing weighs me down', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly free \u2014 my stuff supports rather than burdens me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed \u2014 some things liberate me, others feel like anchors', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Burdened \u2014 I feel weighed down by what I own or maintain', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Trapped \u2014 my possessions feel like chains I can\'t escape', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_7',
    category: 'stuff',
    text: 'Overall, how would you describe your relationship with material things?',
    options: [
      { text: 'Healthy and balanced \u2014 I enjoy things without being controlled by them', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Good \u2014 I appreciate quality and don\'t obsess over quantity', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Complicated \u2014 I swing between wanting more and feeling guilty for wanting', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Unhealthy \u2014 I either hoard, overspend, or punish myself for wanting', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Toxic \u2014 material things are a major source of shame, obsession, or avoidance', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// GIVING & LEGACY
// ============================================================================
const givingQuestions: AssessmentQuestion[] = [
  {
    id: 'giving_1',
    category: 'giving',
    text: 'When you contribute to others\' lives \u2014 whether through time, money, or energy \u2014 where does it come from?',
    options: [
      { text: 'Overflow \u2014 I give because I have more than enough to share', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Genuine desire \u2014 I want to help and it feels good', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed \u2014 sometimes joyful, sometimes obligated', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Obligation \u2014 I give because I feel I "should," not because I want to', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Depletion \u2014 I give until I\'m empty and resent it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_2',
    category: 'giving',
    text: 'When someone asks for your time, energy, or resources, what\'s your internal response?',
    options: [
      { text: 'I can freely say yes or no \u2014 my giving has healthy boundaries', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I mostly give when I want to and say no when I need to', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I struggle to say no even when I want to', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel trapped \u2014 I can\'t say no without guilt', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I either give everything until I\'m resentful, or refuse everything out of self-protection', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_3',
    category: 'giving',
    text: 'When you think about making a difference beyond your immediate circle, what comes up?',
    options: [
      { text: 'I\'m actively contributing to something bigger and it lights me up', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I find ways to make an impact that align with my strengths', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'d like to do more but haven\'t found my way yet', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel disconnected from any sense of larger purpose', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel too consumed by my own problems to think about others', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_4',
    category: 'giving',
    text: 'When you reflect on how much you give vs. how much you keep for yourself, what\'s honest?',
    options: [
      { text: 'Balanced \u2014 I serve others generously while honoring my own needs', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly balanced \u2014 I give a lot but still take care of myself', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Tilted \u2014 I tend to put others first and neglect my own needs', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Sacrificing \u2014 I chronically give too much and I\'m running on empty', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Either extreme \u2014 I either sacrifice everything or refuse to give at all', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_5',
    category: 'giving',
    text: 'Do you feel like your life is contributing something meaningful to the world?',
    options: [
      { text: 'Yes \u2014 I know what I\'m here to give and I\'m giving it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly \u2014 I feel like my presence matters and I add value', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Sometimes \u2014 I have moments of purpose but no consistent sense', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Rarely \u2014 I struggle to see how I make a difference', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'No \u2014 I feel like I\'m taking up space without contributing anything', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_6',
    category: 'giving',
    text: 'When you think about receiving help from others, how do you feel?',
    options: [
      { text: 'I\'m grateful and accept help graciously', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I appreciate help when I need it', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I accept help but prefer to be independent', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel uncomfortable accepting help', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel guilty or ashamed about needing help', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_7',
    category: 'giving',
    text: 'When you think about your legacy and how you want to be remembered, what comes up?',
    options: [
      { text: 'I want to be remembered for helping others', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I hope to be remembered for making a positive impact', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I want to be remembered but it\'s not a big priority', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel uncertain about my legacy', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel hopeless about making a meaningful impact', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// SPIRITUALITY
// ============================================================================
const spiritualityQuestions: AssessmentQuestion[] = [
  {
    id: 'spirituality_1',
    category: 'spirituality',
    text: 'When you think about your sense of meaning and connection to life itself, what comes up?',
    options: [
      { text: 'I feel deeply connected to life and at peace with my place in it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have a sense of meaning that guides and comforts me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m searching \u2014 sometimes I feel connected, sometimes lost', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel uncertain and disconnected from any deeper meaning', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Life feels random and meaningless to me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_2',
    category: 'spirituality',
    text: 'When you think about practices that ground you or connect you to something deeper \u2014 nature, meditation, prayer, art, stillness, whatever form that takes for you \u2014 what\'s your experience?',
    options: [
      { text: 'I have regular practices that anchor me and bring deep peace', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I connect to something deeper in ways that work for me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I know what helps me but I\'m inconsistent', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel disconnected and don\'t know how to reconnect', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel spiritually numb or empty', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_3',
    category: 'spirituality',
    text: 'When life feels uncertain or things don\'t go as planned, what\'s your deeper feeling?',
    options: [
      { text: 'I trust that things are working out, even when I can\'t see how', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I generally believe things will be okay in the end', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I go back and forth between trust and anxiety', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I struggle to trust \u2014 life feels unpredictable and threatening', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like the universe is against me or nothing works in my favor', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_4',
    category: 'spirituality',
    text: 'When everything goes quiet \u2014 no distractions, just you and your thoughts \u2014 what do you find?',
    options: [
      { text: 'Peace \u2014 I\'m comfortable in stillness and enjoy my own inner world', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly calm \u2014 I can be present without needing to fill the silence', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Restless \u2014 silence is uncomfortable but I can manage it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Anxious \u2014 I avoid silence because my thoughts overwhelm me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Terrified \u2014 being alone with my thoughts feels unbearable', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_5',
    category: 'spirituality',
    text: 'Do you feel like something \u2014 God, the universe, intuition, life itself \u2014 is supporting or guiding you?',
    options: [
      { text: 'Deeply \u2014 I feel guided and held, even in hard times', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Often \u2014 I notice synchronicities or feel nudges in the right direction', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Sometimes \u2014 I\'d like to feel more supported but I\'m not sure', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Rarely \u2014 I feel like I\'m completely on my own', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Never \u2014 I feel abandoned or unsupported by life itself', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_6',
    category: 'spirituality',
    text: 'When you think about how you\'ve grown as a person over the past few years, what comes up?',
    options: [
      { text: 'I\'m actively evolving \u2014 I can feel myself becoming more of who I\'m meant to be', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'ve grown meaningfully and I\'m on a good path', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Some growth, but I feel stagnant in areas that matter', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel stuck \u2014 like I\'m repeating the same patterns', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like I\'m regressing or losing myself', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_7',
    category: 'spirituality',
    text: 'When you think about whether the way you live matches what you actually believe and value, what\'s honest?',
    options: [
      { text: 'Deeply aligned \u2014 my daily life reflects my deepest values', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly aligned \u2014 I live with integrity most of the time', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Gaps \u2014 I believe one thing but often act differently', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Misaligned \u2014 my life contradicts what I know to be true for me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Completely disconnected \u2014 I\'ve lost touch with what I even believe anymore', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// TRAVEL & ADVENTURE
// ============================================================================
const travelQuestions: AssessmentQuestion[] = [
  {
    id: 'travel_1',
    category: 'travel',
    text: 'When you think about variety and new experiences in your life, what comes up?',
    options: [
      { text: 'I feel stimulated and alive \u2014 life has plenty of novelty', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have a good mix of routine and new experiences', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'My life is comfortable but could use some freshness', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel stuck in sameness and it\'s starting to bother me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'My life feels monotonous and I can\'t break out of it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_2',
    category: 'travel',
    text: 'When you think about planning a trip or vacation, what comes up?',
    options: [
      { text: 'I love the planning process and get excited', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I enjoy thinking about where to go', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I plan when necessary but don\'t love it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I find trip planning stressful or overwhelming', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I avoid planning trips entirely', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_3',
    category: 'travel',
    text: 'When you think about your past travel experiences, what comes up?',
    options: [
      { text: 'I have amazing memories that shaped who I am', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'ve had great experiences I\'m grateful for', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some travel memories but nothing extraordinary', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I wish I had traveled more', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel regret about missed opportunities', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_4',
    category: 'travel',
    text: 'When you see travel photos or stories from others, what\'s your reaction?',
    options: [
      { text: 'I\'m inspired and want to plan my own trip', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I enjoy seeing their adventures', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I appreciate their experiences', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel envious or left out', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel bitter or resentful', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_5',
    category: 'travel',
    text: 'When you think about the world beyond your daily environment, what do you feel?',
    options: [
      { text: 'Curious and connected \u2014 I feel part of something bigger', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Interested and open \u2014 I appreciate the wider world', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Content with my corner of the world', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Disconnected \u2014 my world feels small and that bothers me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Trapped \u2014 I feel confined and unable to expand my horizons', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_6',
    category: 'travel',
    text: 'When you reflect on whether your life has enough stimulation and variety, what\'s honest?',
    options: [
      { text: 'Absolutely \u2014 I feel engaged and alive in my daily life', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Yes \u2014 I have the right amount of novelty for me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s okay, but sometimes I feel like I\'m going through the motions', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel understimulated but don\'t know how to change it', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'My life feels stagnant and I\'ve lost my sense of aliveness', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_7',
    category: 'travel',
    text: 'When you imagine expanding your horizons (travel, learning, new places, new skills), what comes up?',
    options: [
      { text: 'Excited \u2014 I actively create new experiences for myself', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Open and optimistic \u2014 possibilities feel available to me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral \u2014 I\'m fine where I am but could see more', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Stuck \u2014 I want more but feel blocked by money, time, or fear', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Hopeless \u2014 expansion feels impossible for someone like me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// HOME & ENVIRONMENT
// ============================================================================
const homeQuestions: AssessmentQuestion[] = [
  {
    id: 'home_1',
    category: 'home',
    text: 'When you walk into your home, what\'s your immediate feeling?',
    options: [
      { text: 'I feel peaceful and at ease', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel comfortable and relaxed', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel neutral, it\'s just where I live', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel stressed or overwhelmed', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel anxious or uncomfortable', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_2',
    category: 'home',
    text: 'When you think about your living space, what comes up?',
    options: [
      { text: 'I love my home and feel proud of it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m satisfied with my living situation', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s functional but could be better', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel frustrated with my living situation', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel trapped or unhappy with my home', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_3',
    category: 'home',
    text: 'When you think about whether your living space reflects who you are, what comes up?',
    options: [
      { text: 'My home feels like an authentic expression of me', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'My space feels comfortable and suits my life well', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s functional but doesn\'t feel particularly "me"', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'My space feels chaotic, cluttered, or neglected', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'My environment actively drains my energy', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_4',
    category: 'home',
    text: 'When you think about whether your home supports the life you want to live, what comes up?',
    options: [
      { text: 'My home enables and enhances my best life', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'My space works well for what I need day-to-day', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s adequate but doesn\'t fully support how I want to live', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'My living situation holds me back or creates friction', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'My home actively works against the life I\'m trying to build', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_5',
    category: 'home',
    text: 'When you think about your ideal living situation, what comes up?',
    options: [
      { text: 'I have a clear vision of my perfect home', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by housing options', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel hopeless about ever finding my ideal home', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_6',
    category: 'home',
    text: 'When you think about your neighborhood or community, how do you feel?',
    options: [
      { text: 'I love where I live and feel connected', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m satisfied with my neighborhood', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s okay but nothing special', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel disconnected from my community', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel unsafe or unhappy where I live', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_7',
    category: 'home',
    text: 'When you think about whether your home feels truly yours, what comes up?',
    options: [
      { text: 'This is MY space and I feel completely at home here', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel ownership and belonging in my home', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s where I live but it doesn\'t fully feel like mine', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel like a guest or temporary resident in my own home', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I don\'t feel safe or settled where I live', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// SOCIAL & FRIENDS
// ============================================================================
const socialQuestions: AssessmentQuestion[] = [
  {
    id: 'social_1',
    category: 'social',
    text: 'When you think about your friendships, what comes up?',
    options: [
      { text: 'I have deep, meaningful friendships', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have good friends and feel connected', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some friends but relationships are surface-level', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel disconnected from my friends', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel lonely and isolated', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_2',
    category: 'social',
    text: 'When you think about your social life overall, how satisfied do you feel?',
    options: [
      { text: 'Deeply fulfilled \u2014 I have the connection I need', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Satisfied \u2014 my social life works for me', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s okay but something feels missing', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I wish I had more meaningful connection', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel disconnected from others and it bothers me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_3',
    category: 'social',
    text: 'When you\'re around friends or peers, how much of the real you shows up?',
    options: [
      { text: 'I\'m fully myself \u2014 no mask, no performance', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel comfortable being authentic with most people', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I show parts of myself but hold back the deeper stuff', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel like I\'m performing or hiding who I really am', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Nobody in my life sees the real me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_4',
    category: 'social',
    text: 'When you think about whether your friendships feel balanced, what comes up?',
    options: [
      { text: 'My friendships feel mutual \u2014 we show up for each other', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Most of my relationships feel balanced and healthy', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Some feel balanced, others feel one-sided', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel like I give more than I get back', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel used or taken for granted by the people around me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_5',
    category: 'social',
    text: 'After spending time with the people closest to you, how do you typically feel?',
    options: [
      { text: 'Energized, grateful, and connected', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Good \u2014 I enjoy our time together', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Fine, but sometimes it feels like an obligation', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Drained or relieved when it\'s over', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Worse than before \u2014 my relationships deplete me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_6',
    category: 'social',
    text: 'When you think about your social support system, what comes up?',
    options: [
      { text: 'I have strong support and feel deeply connected', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have good support and feel cared for', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some support but could use more', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel like I don\'t have enough support', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel alone and unsupported', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_7',
    category: 'social',
    text: 'When you\'re in a social situation, how do you feel about yourself?',
    options: [
      { text: 'Confident and at ease \u2014 I know my value', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Comfortable \u2014 I can hold my own socially', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Sometimes confident, sometimes self-conscious', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I often compare myself to others and feel inadequate', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel invisible, anxious, or like I don\'t measure up', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// FAMILY & PARENTING
// ============================================================================
const familyQuestions: AssessmentQuestion[] = [
  {
    id: 'family_non_parents_1',
    category: 'family',
    text: 'When your phone rings and it\'s a family member, what\'s your gut reaction?',
    options: [
      { text: 'Happy, I want to answer', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, I\'ll take the call', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Depends on who it is', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Slight dread, "What do they want?"', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I let it go to voicemail', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_2',
    category: 'family',
    text: 'When you think about upcoming family gatherings, how do you feel?',
    options: [
      { text: 'Excited, can\'t wait', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Looking forward to it', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s fine, I\'ll go', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Obligated, already dreading it', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Anxious, considering excuses to skip', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_3',
    category: 'family',
    text: 'When family members ask for your help (money, time, favors), what\'s your immediate feeling?',
    options: [
      { text: 'Happy to help, no hesitation', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Willing, I\'ll figure it out', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'ll do it but it\'s inconvenient', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Resentful, they always ask me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Angry, I feel used', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_4',
    category: 'family',
    text: 'When family members criticize your decisions, what happens inside you?',
    options: [
      { text: 'I listen, take what\'s useful, let go of the rest', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Slightly annoyed but I\'m confident in my choices', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Defensive but I hear them out', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Hurt, they don\'t support me', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Furious or devastated', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_5',
    category: 'family',
    text: 'When you reflect on your childhood, what\'s the dominant feeling that comes up?',
    options: [
      { text: 'Grateful, good memories', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed but mostly positive', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, it was what it was', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Painful, lots of wounds', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Traumatic, I avoid thinking about it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_6',
    category: 'family',
    text: 'When a family member succeeds at something big, what\'s your honest reaction?',
    options: [
      { text: 'Genuinely thrilled for them', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Happy, I celebrate with them', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: '"That\'s nice" (no strong feeling)', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Envious, comparing it to my life', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Bitter, "Why not me?"', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_non_parents_7',
    category: 'family',
    text: 'When you think about your family\'s influence on your life, what comes up?',
    options: [
      { text: 'Grateful for their support and guidance', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'They\'ve shaped me in positive ways', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings, some good some challenging', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'They\'ve held me back in some ways', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I need to break free from their influence', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  {
    id: 'family_parents_1',
    category: 'family',
    text: 'When your child comes to you upset, what\'s your immediate internal response?',
    options: [
      { text: 'I listen fully and help them process', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I comfort them and ask what they need', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I try to fix the problem quickly', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel overwhelmed and want to escape', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I get frustrated and tell them to toughen up', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_2',
    category: 'family',
    text: 'When you have to discipline your child, how do you approach it?',
    options: [
      { text: 'I stay calm and explain consequences', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I set clear boundaries with love', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I try to be fair but it\'s hard', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel guilty and I\'m inconsistent', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I lose my temper and regret it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_3',
    category: 'family',
    text: 'When you think about your child\'s future, what\'s your dominant feeling?',
    options: [
      { text: 'Excited about their potential', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings, some worry', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Anxious about the world they\'ll face', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Terrified I\'m not preparing them well', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_4',
    category: 'family',
    text: 'When your child achieves something significant, what\'s your reaction?',
    options: [
      { text: 'Proud and celebrating their growth', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Happy and encouraging', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Pleased but trying not to overreact', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Relieved they\'re doing well', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Worried about expectations', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_5',
    category: 'family',
    text: 'How do you feel about balancing work and parenting?',
    options: [
      { text: 'I\'ve found a rhythm that works', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s challenging but manageable', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Some days are better than others', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel pulled in too many directions', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I\'m constantly failing at both', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_6',
    category: 'family',
    text: 'When your child makes a mistake or gets in trouble, what happens?',
    options: [
      { text: 'I help them learn from it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I stay calm and address it', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel disappointed but try to help', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I worry about what this means', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like I\'ve failed as a parent', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_parents_7',
    category: 'family',
    text: 'When you reflect on your parenting, how do you feel?',
    options: [
      { text: 'Confident in my approach', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly good with room to grow', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m figuring it out as I go', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I doubt myself a lot', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like I\'m doing it wrong', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  }
]

// ============================================================================
// LOVE & ROMANCE
// ============================================================================
const romanceQuestions: AssessmentQuestion[] = [
  {
    id: 'love_single_1',
    category: 'love',
    text: 'When you think about your ideal romantic partner, what comes up?',
    options: [
      { text: 'I have a clear vision and feel excited', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel confused or frustrated about dating', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel hopeless or have given up', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_2',
    category: 'love',
    text: 'When you think about going on a date, how do you feel?',
    options: [
      { text: 'Excited and confident', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Nervous but optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, see how it goes', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Anxious and self-conscious', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Dread it and want to avoid it', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_3',
    category: 'love',
    text: 'When someone you\'re interested in doesn\'t text back quickly, what\'s your reaction?',
    options: [
      { text: 'No big deal, I\'ll reach out later', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Slightly disappointed but I understand', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I wonder what happened', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I overthink and worry', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I spiral into anxiety and self-doubt', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_4',
    category: 'love',
    text: 'When you think about being single, how do you feel?',
    options: [
      { text: 'I\'m happy and fulfilled as I am', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I\'m content but open to love', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings about it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel lonely and incomplete', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like something is wrong with me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_5',
    category: 'love',
    text: 'When you see happy couples, what\'s your honest reaction?',
    options: [
      { text: 'Happy for them, it gives me hope', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Nice to see, I\'m optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, doesn\'t affect me', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Slightly envious or sad', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Bitter or resentful', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_6',
    category: 'love',
    text: 'When you reflect on your past relationships, what comes up?',
    options: [
      { text: 'Grateful for the lessons learned', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings but mostly positive', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, they were what they were', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Painful memories and regrets', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Traumatic, I avoid thinking about them', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_single_7',
    category: 'love',
    text: 'When you think about finding love, what\'s your dominant feeling?',
    options: [
      { text: 'Confident it will happen when it\'s right', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, but open to possibilities', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Worried it might not happen', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Hopeless or resigned to being alone', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  {
    id: 'love_relationship_1',
    category: 'love',
    text: 'When you think about your relationship, what\'s your dominant feeling?',
    options: [
      { text: 'I feel deeply connected and fulfilled', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel happy and satisfied', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel good but have some concerns', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel uncertain about the future', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel disconnected or unhappy', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_2',
    category: 'love',
    text: 'When you and your partner disagree, how do you handle it?',
    options: [
      { text: 'We communicate openly and resolve it together', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We talk it through and find compromise', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We try to work it out but sometimes struggle', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'We avoid conflict or it escalates', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'We fight and it gets ugly', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_3',
    category: 'love',
    text: 'When you think about your future with your partner, what comes up?',
    options: [
      { text: 'I\'m excited about our future together', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel optimistic about our relationship', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I have mixed feelings about the future', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel uncertain about our compatibility', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel worried or doubtful', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_4',
    category: 'love',
    text: 'How do you feel about intimacy and connection with your partner?',
    options: [
      { text: 'We have deep emotional and physical intimacy', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We feel connected and close', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We have good moments but could be closer', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel disconnected or distant', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel lonely even when we\'re together', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_5',
    category: 'love',
    text: 'When you think about trust in your relationship, what comes up?',
    options: [
      { text: 'I trust my partner completely', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I trust my partner and feel secure', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I trust my partner but have some doubts', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I have trust issues or concerns', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I don\'t trust my partner', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_6',
    category: 'love',
    text: 'How do you feel about balancing your needs and your partner\'s needs?',
    options: [
      { text: 'We both prioritize each other\'s needs equally', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We try to balance both our needs', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We sometimes struggle to balance needs', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I often put their needs before mine', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like my needs are ignored', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  },
  {
    id: 'love_relationship_7',
    category: 'love',
    text: 'When you think about your relationship\'s growth, what\'s your feeling?',
    options: [
      { text: 'We\'re growing together and evolving positively', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We\'re learning and improving as a couple', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'We have ups and downs but overall growing', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'We\'re stuck or not growing together', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'We\'re growing apart or deteriorating', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  }
]

// ============================================================================
// BUSINESS & CAREER
// ============================================================================
const businessQuestions: AssessmentQuestion[] = [
  {
    id: 'work_owner_1',
    category: 'work',
    text: 'When you think about your business growth, what\'s your dominant feeling?',
    options: [
      { text: 'Excited about the possibilities', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Confident in my ability to scale', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings, some optimism', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Overwhelmed by the challenges', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Doubtful about my ability to succeed', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_2',
    category: 'work',
    text: 'When you have to make major business decisions, how do you approach them?',
    options: [
      { text: 'I trust my instincts and move forward', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I gather info and make confident decisions', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I analyze pros and cons carefully', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel paralyzed by the responsibility', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I avoid making decisions', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_3',
    category: 'work',
    text: 'When your business faces setbacks, what\'s your reaction?',
    options: [
      { text: 'I see it as a learning opportunity', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I stay calm and figure out solutions', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I feel stressed but I handle it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I panic and feel overwhelmed', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I feel like giving up', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_4',
    category: 'work',
    text: 'How do you feel about your work-life balance?',
    options: [
      { text: 'I\'ve found a rhythm that works', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mostly good with room for improvement', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s challenging but manageable', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I feel constantly overwhelmed', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I have no balance at all', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_5',
    category: 'work',
    text: 'When you think about your team or employees, what comes up?',
    options: [
      { text: 'I love leading and developing people', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'I enjoy the leadership challenges', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s rewarding but sometimes difficult', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'I find managing people stressful', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'I prefer to work alone', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_6',
    category: 'work',
    text: 'When you think about your business\'s financial health, what\'s your reaction?',
    options: [
      { text: 'Confident and optimistic about growth', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Satisfied with current progress', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Mixed feelings, some concerns', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Worried about cash flow', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Stressed about financial stability', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_owner_7',
    category: 'work',
    text: 'When you think about your business\'s future, what\'s your dominant feeling?',
    options: [
      { text: 'Excited about the possibilities', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Confident in my vision and strategy', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Optimistic but realistic about challenges', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Uncertain about the path forward', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Anxious about the unknown', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  {
    id: 'work_employee_1',
    category: 'work',
    text: 'It\'s Sunday night. Tomorrow is Monday. What do you feel?',
    options: [
      { text: 'Excited for the week ahead', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, ready to go', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Slight resistance but manageable', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Dread, the weekend went too fast', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Anxiety, I can\'t sleep', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_2',
    category: 'work',
    text: 'When you get an email from your boss, what\'s your immediate reaction?',
    options: [
      { text: 'Curious, neutral', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Fine, just another email', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Slight tension before opening', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Anxious, "What did I do?"', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Panic, my stomach drops', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_3',
    category: 'work',
    text: 'When someone at work gets promoted, what\'s your honest feeling?',
    options: [
      { text: 'Happy for them, inspired', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Good for them, no charge', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Neutral, doesn\'t affect me', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Jealous, I deserved it more', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Resentful, bitter', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_4',
    category: 'work',
    text: 'When you\'re asked to take on a new project, what happens?',
    options: [
      { text: 'Excited, I love new challenges', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Interested, let me hear more', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Cautious, is this more work?', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Overwhelmed, I\'m already drowning', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Resentful, they always dump on me', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_5',
    category: 'work',
    text: 'When you make a mistake at work, what\'s your internal response?',
    options: [
      { text: '"Okay, how do I fix this?"', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Briefly frustrated, then move forward', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Embarrassed but I address it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Ashamed, I replay it obsessively', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Devastated, I\'m a failure', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_6',
    category: 'work',
    text: 'When you imagine quitting your job, what do you feel?',
    options: [
      { text: 'Empowered, I could do it anytime', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Curious, exploring options', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'It\'s a nice fantasy', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Terrified, I\'m trapped', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Hopeless, I\'ll never escape', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  },
  {
    id: 'work_employee_7',
    category: 'work',
    text: 'When your work is praised publicly, what happens?',
    options: [
      { text: 'Proud, I own it', value: 5, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Grateful, feels good', value: 4, emoji: '\u{1F7E2}', greenLine: 'above' },
      { text: 'Uncomfortable but I accept it', value: 3, emoji: '\u26AA', greenLine: 'neutral' },
      { text: 'Embarrassed, I deflect', value: 2, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'Suspicious, they want something', value: 1, emoji: '\u{1F534}', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '\u{1F914}', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  }
]

// ============================================================================
// EXPORT CATEGORIES WITH QUESTIONS (in VISION_CATEGORIES order)
// ============================================================================
export const assessmentQuestions: AssessmentCategoryQuestions[] = [
  { category: 'fun', questions: funQuestions },
  { category: 'travel', questions: travelQuestions },
  { category: 'home', questions: homeQuestions },
  { category: 'family', questions: familyQuestions },
  { category: 'love', questions: romanceQuestions },
  { category: 'health', questions: healthQuestions },
  { category: 'money', questions: moneyQuestions },
  { category: 'work', questions: businessQuestions },
  { category: 'social', questions: socialQuestions },
  { category: 'stuff', questions: possessionsQuestions },
  { category: 'giving', questions: givingQuestions },
  { category: 'spirituality', questions: spiritualityQuestions },
]

// ============================================================================
// CATEGORY METADATA
// ============================================================================
export const categoryMetadata: Record<AssessmentCategoryType, { title: string; description: string }> = {
  fun: { title: 'Fun', description: 'How you play, relax, and enjoy life' },
  travel: { title: 'Travel', description: 'Your relationship with exploration and new experiences' },
  home: { title: 'Home', description: 'Your living space and sense of sanctuary' },
  family: { title: 'Family', description: 'Your relationships with family members' },
  love: { title: 'Love', description: 'Your intimate relationships and love life' },
  health: { title: 'Health', description: 'Your physical and mental well-being' },
  money: { title: 'Money', description: 'Your relationship with finances and abundance' },
  work: { title: 'Work', description: 'Your work life and professional fulfillment' },
  social: { title: 'Social', description: 'Your friendships and social connections' },
  stuff: { title: 'Stuff', description: 'Your relationship with material things' },
  giving: { title: 'Giving', description: 'How you contribute and want to be remembered' },
  spirituality: { title: 'Spirituality', description: 'Your connection to meaning, growth, and inner peace' }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function filterQuestionsByProfile(questions: AssessmentQuestion[], profile: any): AssessmentQuestion[] {
  if (!questions || !profile) return questions || []

  return questions.filter(question => {
    if (!question.conditionalLogic) return true

    const { field, condition } = question.conditionalLogic
    const fieldValue = profile[field]

    try {
      return condition(fieldValue)
    } catch (error) {
      console.error('Error evaluating conditional logic:', error)
      return true
    }
  })
}

export function getAllCategories(): string[] {
  const categories = new Set(assessmentQuestions.map(cat => cat.category))
  return Array.from(categories)
}

export default assessmentQuestions
