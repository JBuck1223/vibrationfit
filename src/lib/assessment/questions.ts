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

export interface AssessmentCategory {
  category: AssessmentCategoryType
  questions: AssessmentQuestion[]
}

// ============================================================================
// 💰 MONEY & WEALTH
// ============================================================================
const moneyQuestions: AssessmentQuestion[] = [
  {
    id: 'money_1',
    category: 'money',
    text: 'When you think about your financial situation, what feeling shows up most?',
    options: [
      { text: 'Abundant and confident', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Secure and stable', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, it is what it is', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Worried or uncertain', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Stressed or anxious', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_2',
    category: 'money',
    text: 'When you open your banking app, what happens in your body?',
    options: [
      { text: 'Calm and curious to see the balance', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, just checking numbers', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'A slight hesitation before opening it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'My stomach tightens', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid it unless I absolutely have to', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_3',
    category: 'money',
    text: 'When you see someone with something expensive you\'d love to own, what\'s your first honest thought?',
    options: [
      { text: 'That\'s coming for me too', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good for them, that\'s awesome', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Nice, no emotional charge', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Must be nice (with a twinge of resentment)', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'They probably got lucky or inherited it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_4',
    category: 'money',
    text: 'When you want to buy something that costs more than usual, what\'s your typical pattern?',
    options: [
      { text: 'I buy it if I want it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I consider it briefly, then decide', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I sleep on it and budget for it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I talk myself out of it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel guilty even thinking about it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_5',
    category: 'money',
    text: 'When unexpected money shows up (refund, gift, bonus), what\'s your first thought?',
    options: [
      { text: 'Awesome, more abundance coming!', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'This is awesome, what do I want to do with it?', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Cool, I\'ll save or invest it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Better save this for the next emergency', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'It won\'t last or What\'s the catch?', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_6',
    category: 'money',
    text: 'When you\'re out with friends and the bill comes, what happens internally?',
    options: [
      { text: 'I happily pay for everyone', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m fine with splitting evenly', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I calculate exactly what I owe', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I hope someone else grabs it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel anxious about the amount', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_7',
    category: 'money',
    text: 'How would you honestly describe your relationship with money?',
    options: [
      { text: 'Money flows easily to me', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel comfortable and secure with money', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s functional, neither good nor bad', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I\'m constantly worried about it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Money stresses me out and I avoid it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 👨‍👩‍👧‍👦 FAMILY & PARENTING
// ============================================================================
const familyQuestions: AssessmentQuestion[] = [
  // Non-parents questions
  {
    id: 'family_non_parents_1',
    category: 'family',
    text: 'When your phone rings and it\'s a family member, what\'s your gut reaction?',
    options: [
      { text: 'Happy, I want to answer', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, I\'ll take the call', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Depends on who it is', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Slight dread, "What do they want?"', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I let it go to voicemail', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Excited, can\'t wait', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Looking forward to it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s fine, I\'ll go', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Obligated, already dreading it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Anxious, considering excuses to skip', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Happy to help, no hesitation', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Willing, I\'ll figure it out', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'ll do it but it\'s inconvenient', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Resentful, they always ask me', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Angry, I feel used', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I listen, take what\'s useful, let go of the rest', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Slightly annoyed but I\'m confident in my choices', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Defensive but I hear them out', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Hurt, they don\'t support me', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Furious or devastated', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Grateful, good memories', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed but mostly positive', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, it was what it was', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Painful, lots of wounds', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Traumatic, I avoid thinking about it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Genuinely thrilled for them', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Happy, I celebrate with them', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: '"That\'s nice" (no strong feeling)', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Envious, comparing it to my life', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Bitter, "Why not me?"', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Grateful for their support and guidance', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'They\'ve shaped me in positive ways', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some good some challenging', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'They\'ve held me back in some ways', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I need to break free from their influence', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => !value
    }
  },
  // Parents questions
  {
    id: 'family_parents_1',
    category: 'family',
    text: 'When your child comes to you upset, what\'s your immediate internal response?',
    options: [
      { text: 'I listen fully and help them process', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I comfort them and ask what they need', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to fix the problem quickly', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed and want to escape', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I get frustrated and tell them to toughen up', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I stay calm and explain consequences', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I set clear boundaries with love', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to be fair but it\'s hard', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty and I\'m inconsistent', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I lose my temper and regret it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Excited about their potential', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some worry', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious about the world they\'ll face', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Terrified I\'m not preparing them well', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Proud and celebrating their growth', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Happy and encouraging', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Pleased but trying not to overreact', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Relieved they\'re doing well', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Worried about expectations', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I\'ve found a rhythm that works', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s challenging but manageable', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Some days are better than others', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel pulled in too many directions', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I\'m constantly failing at both', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I help them learn from it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I stay calm and address it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel disappointed but try to help', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I worry about what this means', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like I\'ve failed as a parent', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Confident in my approach', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly good with room to grow', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m figuring it out as I go', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I doubt myself a lot', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like I\'m doing it wrong', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  }
]

// ============================================================================
// ❤️ LOVE & ROMANCE
// ============================================================================
const romanceQuestions: AssessmentQuestion[] = [
  // Single questions
  {
    id: 'love_single_1',
    category: 'love',
    text: 'When you think about your ideal romantic partner, what comes up?',
    options: [
      { text: 'I have a clear vision and feel excited', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel confused or frustrated about dating', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless or have given up', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Excited and confident', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Nervous but optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, see how it goes', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious and self-conscious', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Dread it and want to avoid it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'No big deal, I\'ll reach out later', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Slightly disappointed but I understand', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I wonder what happened', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I overthink and worry', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I spiral into anxiety and self-doubt', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I\'m happy and fulfilled as I am', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m content but open to love', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings about it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel lonely and incomplete', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like something is wrong with me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Happy for them, it gives me hope', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Nice to see, I\'m optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, doesn\'t affect me', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Slightly envious or sad', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Bitter or resentful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Grateful for the lessons learned', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings but mostly positive', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, they were what they were', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Painful memories and regrets', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Traumatic, I avoid thinking about them', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Confident it will happen when it\'s right', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, but open to possibilities', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Worried it might not happen', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Hopeless or resigned to being alone', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "Single"
    }
  },
  // In a Relationship / Married questions
  {
    id: 'love_relationship_1',
    category: 'love',
    text: 'When you think about your relationship, what\'s your dominant feeling?',
    options: [
      { text: 'I feel deeply connected and fulfilled', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel happy and satisfied', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel good but have some concerns', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncertain about the future', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel disconnected or unhappy', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'We communicate openly and resolve it together', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We talk it through and find compromise', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We try to work it out but sometimes struggle', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'We avoid conflict or it escalates', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'We fight and it gets ugly', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I\'m excited about our future together', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel optimistic about our relationship', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have mixed feelings about the future', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncertain about our compatibility', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel worried or doubtful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'We have deep emotional and physical intimacy', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We feel connected and close', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We have good moments but could be closer', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel disconnected or distant', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel lonely even when we\'re together', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I trust my partner completely', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I trust my partner and feel secure', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I trust my partner but have some doubts', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I have trust issues or concerns', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I don\'t trust my partner', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'We both prioritize each other\'s needs equally', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We try to balance both our needs', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We sometimes struggle to balance needs', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I often put their needs before mine', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like my needs are ignored', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'We\'re growing together and evolving positively', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We\'re learning and improving as a couple', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We have ups and downs but overall growing', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'We\'re stuck or not growing together', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'We\'re growing apart or deteriorating', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === "In a Relationship" || value === "Married"
    }
  }
]

// ============================================================================
// 💪 HEALTH & VITALITY
// ============================================================================
const healthQuestions: AssessmentQuestion[] = [
  {
    id: 'health_1',
    category: 'health',
    text: 'When you think about your physical body, what\'s your dominant feeling?',
    options: [
      { text: 'Strong, energetic, and vibrant', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good and generally healthy', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Okay, some good days some not', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Tired and run down', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Unhealthy and concerned', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_2',
    category: 'health',
    text: 'When you catch your reflection unexpectedly (mirror, window, photo), what\'s your honest first thought?',
    options: [
      { text: 'Looking good or neutral appreciation', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Not bad, I\'m okay with what I see', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'No particular thought either way', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Critical thought about a specific body part', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Immediate disgust or disappointment', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_3',
    category: 'health',
    text: 'How do you feel about exercise and moving your body?',
    options: [
      { text: 'I love being active and feel energized by it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy it and feel good when I do it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I do it when I can but don\'t love it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find it difficult or unpleasant', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid it and feel guilty about it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_4',
    category: 'health',
    text: 'How do you feel about what you\'re eating and how you\'re nourishing your body?',
    options: [
      { text: 'I love feeding my body good food', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I eat well and feel good about my choices', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to eat well but it\'s inconsistent', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I struggle with food choices and feel guilty', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I have a difficult relationship with food', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_5',
    category: 'health',
    text: 'When you think about your mental and emotional well-being, what shows up?',
    options: [
      { text: 'I feel mentally strong and emotionally balanced', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel generally good and stable', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have ups and downs but I\'m managing okay', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel stressed and emotionally drained', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel overwhelmed and struggling', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_6',
    category: 'health',
    text: 'How has your sleep been?',
    options: [
      { text: 'I sleep well and wake up feeling rested', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I generally sleep okay and feel refreshed', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'My sleep is inconsistent but manageable', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I struggle to sleep and often feel tired', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I have chronic sleep problems', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_7',
    category: 'health',
    text: 'When you think about your overall health and vitality, what\'s the truth?',
    options: [
      { text: 'I feel vibrant and alive', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel healthy and energized', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel okay, maintaining status quo', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel depleted and need change', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel unwell and worried about my health', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 💼 BUSINESS & CAREER
// ============================================================================
const businessQuestions: AssessmentQuestion[] = [
  // Business Owner questions
  {
    id: 'work_owner_1',
    category: 'work',
    text: 'When you think about your business growth, what\'s your dominant feeling?',
    options: [
      { text: 'Excited about the possibilities', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Confident in my ability to scale', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some optimism', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Overwhelmed by the challenges', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Doubtful about my ability to succeed', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I trust my instincts and move forward', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I gather info and make confident decisions', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I analyze pros and cons carefully', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel paralyzed by the responsibility', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid making decisions', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I see it as a learning opportunity', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I stay calm and figure out solutions', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel stressed but I handle it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I panic and feel overwhelmed', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like giving up', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I\'ve found a rhythm that works', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly good with room for improvement', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s challenging but manageable', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel constantly overwhelmed', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I have no balance at all', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'I love leading and developing people', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy the leadership challenges', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s rewarding but sometimes difficult', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find managing people stressful', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I prefer to work alone', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Confident and optimistic about growth', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Satisfied with current progress', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some concerns', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Worried about cash flow', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Stressed about financial stability', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Excited about the possibilities', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Confident in my vision and strategy', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Optimistic but realistic about challenges', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Uncertain about the path forward', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Anxious about the unknown', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === "Business Owner"
    }
  },
  // Employee questions (default for non-business owners)
  {
    id: 'work_employee_1',
    category: 'work',
    text: 'It\'s Sunday night. Tomorrow is Monday. What do you feel?',
    options: [
      { text: 'Excited for the week ahead', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, ready to go', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Slight resistance but manageable', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Dread, the weekend went too fast', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Anxiety, I can\'t sleep', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Curious, neutral', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Fine, just another email', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Slight tension before opening', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious, "What did I do?"', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Panic, my stomach drops', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Happy for them, inspired', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good for them, no charge', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, doesn\'t affect me', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Jealous, I deserved it more', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Resentful, bitter', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Excited, I love new challenges', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Interested, let me hear more', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Cautious, is this more work?', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Overwhelmed, I\'m already drowning', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Resentful, they always dump on me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: '"Okay, how do I fix this?"', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Briefly frustrated, then move forward', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Embarrassed but I address it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Ashamed, I replay it obsessively', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Devastated, I\'m a failure', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Empowered, I could do it anytime', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Curious, exploring options', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s a nice fantasy', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Terrified, I\'m trapped', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Hopeless, I\'ll never escape', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
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
      { text: 'Proud, I own it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Grateful, feels good', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Uncomfortable but I accept it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Embarrassed, I deflect', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Suspicious, they want something', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== "Business Owner"
    }
  }
]

// ============================================================================
// 🎉 FUN & RECREATION
// ============================================================================
const funQuestions: AssessmentQuestion[] = [
  {
    id: 'fun_1',
    category: 'fun',
    text: 'When you have free time with no obligations, what do you do?',
    options: [
      { text: 'I plan something exciting and look forward to it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I do something I enjoy', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I relax and do whatever feels right', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty about not being productive', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I waste time and feel unfulfilled', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_2',
    category: 'fun',
    text: 'When you think about your hobbies and interests, what comes up?',
    options: [
      { text: 'I have multiple passions I actively pursue', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy several activities regularly', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some interests I dabble in', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I used to have hobbies but lost interest', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I don\'t really have any hobbies', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_3',
    category: 'fun',
    text: 'When someone invites you to try something new and exciting, what\'s your reaction?',
    options: [
      { text: 'I\'m immediately excited and say yes', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m interested and want to learn more', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I consider it but feel cautious', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel anxious about the unknown', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I decline, I prefer familiar activities', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_4',
    category: 'fun',
    text: 'When you think about play and having fun, how do you feel?',
    options: [
      { text: 'I embrace playfulness and joy regularly', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy being playful when appropriate', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have fun but it\'s not a priority', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty about taking time to play', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I don\'t really know how to have fun', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_5',
    category: 'fun',
    text: 'When you see others having fun and enjoying themselves, what\'s your reaction?',
    options: [
      { text: 'I\'m happy for them and want to join in', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I smile and feel positive energy', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I notice but it doesn\'t affect me much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel left out or envious', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel bitter or resentful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_6',
    category: 'fun',
    text: 'When you reflect on your current play and fun, what comes up?',
    options: [
      { text: 'I have a lot of fun and feel playful regularly', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I play and have fun when I can', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I engage in fun things sometimes, but it\'s not a priority', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I don\'t play much, a bit too busy at the moment', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I never play or have fun', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'fun_7',
    category: 'fun',
    text: 'When you think about incorporating more fun into your life, what\'s your feeling?',
    options: [
      { text: 'I actively seek out fun experiences', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I make time for enjoyable activities', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to have fun when I can', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel like I don\'t have time for fun', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel guilty or selfish about having fun', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// ✈️ TRAVEL & ADVENTURE
// ============================================================================
const travelQuestions: AssessmentQuestion[] = [
  {
    id: 'travel_1',
    category: 'travel',
    text: 'When you think about traveling to a new place, what\'s your dominant feeling?',
    options: [
      { text: 'Excited and eager to explore', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Curious and optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Interested but cautious', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious about the unknown', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Overwhelmed and prefer to stay home', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_2',
    category: 'travel',
    text: 'When you\'re planning a trip, how do you approach it?',
    options: [
      { text: 'I love the planning process and research', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy planning and look forward to it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I plan what\'s necessary but keep it simple', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find planning stressful and overwhelming', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid planning and it causes problems', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_3',
    category: 'travel',
    text: 'When you reflect on your past travel experiences, what comes up?',
    options: [
      { text: 'Amazing memories that enriched my life', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good experiences I\'m grateful for', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed experiences, some good some challenging', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Mostly stressful or disappointing', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I haven\'t traveled much or had bad experiences', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_4',
    category: 'travel',
    text: 'When you see travel photos or stories from others, what\'s your reaction?',
    options: [
      { text: 'I\'m inspired and want to plan my own trip', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy seeing their adventures', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I appreciate their experiences', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel envious or left out', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel bitter or resentful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_5',
    category: 'travel',
    text: 'When you think about experiencing different cultures, how do you feel?',
    options: [
      { text: 'I love learning about and experiencing new cultures', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m curious and open to cultural differences', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m interested but prefer familiar environments', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncomfortable with cultural differences', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I prefer to stick to what I know', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_6',
    category: 'travel',
    text: 'When you think about adventure and exploration, what comes up?',
    options: [
      { text: 'I crave adventure and new experiences', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy moderate adventure and exploration', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I like some adventure but prefer comfort', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find adventure stressful and prefer routine', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid adventure and prefer predictability', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'travel_7',
    category: 'travel',
    text: 'When you think about your ideal travel experience, what comes up?',
    options: [
      { text: 'I have clear visions of amazing destinations', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have several places I\'d love to visit', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by too many options', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I don\'t really think about travel much', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 🏠 HOME & ENVIRONMENT
// ============================================================================
const homeQuestions: AssessmentQuestion[] = [
  {
    id: 'home_1',
    category: 'home',
    text: 'When you walk into your home, what\'s your immediate feeling?',
    options: [
      { text: 'I feel peaceful and at ease', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel comfortable and relaxed', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel neutral, it\'s just where I live', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel stressed or overwhelmed', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel anxious or uncomfortable', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_2',
    category: 'home',
    text: 'When you think about your living space, what comes up?',
    options: [
      { text: 'I love my home and feel proud of it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m satisfied with my living situation', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s functional but could be better', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel frustrated with my living situation', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel trapped or unhappy with my home', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_3',
    category: 'home',
    text: 'When you think about decorating or improving your space, how do you feel?',
    options: [
      { text: 'I love creating a beautiful, inspiring space', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy making my home comfortable and nice', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I do what\'s necessary but don\'t prioritize it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find home improvement stressful', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid decorating or improving my space', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_4',
    category: 'home',
    text: 'When you think about hosting people in your home, what\'s your reaction?',
    options: [
      { text: 'I love hosting and sharing my space', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy having people over occasionally', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m okay with hosting but prefer not to', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel anxious about having people over', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid hosting and prefer to meet elsewhere', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_5',
    category: 'home',
    text: 'When you think about your ideal living situation, what comes up?',
    options: [
      { text: 'I have a clear vision of my perfect home', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by housing options', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless about my living situation', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_6',
    category: 'home',
    text: 'When you think about your neighborhood or community, how do you feel?',
    options: [
      { text: 'I love where I live and feel connected', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m happy with my neighborhood', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s okay, I don\'t have strong feelings', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel disconnected from my community', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel isolated or unhappy with my area', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'home_7',
    category: 'home',
    text: 'When you think about your home as a sanctuary, what comes up?',
    options: [
      { text: 'My home is my peaceful retreat', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel safe and comfortable at home', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It\'s functional but not particularly special', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel stressed or uncomfortable at home', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I don\'t feel at home in my own space', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 👥 SOCIAL & FRIENDS
// ============================================================================
const socialQuestions: AssessmentQuestion[] = [
  {
    id: 'social_1',
    category: 'social',
    text: 'When you think about your friendships, what comes up?',
    options: [
      { text: 'I have deep, meaningful friendships', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have good friends and feel connected', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some friends but relationships are surface-level', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel disconnected from my friends', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel lonely and isolated', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_2',
    category: 'social',
    text: 'When you\'re invited to a social gathering, what\'s your reaction?',
    options: [
      { text: 'I\'m excited and look forward to it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m interested and want to go', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'ll go but I\'m not particularly excited', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel anxious about social situations', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I prefer to avoid social gatherings', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_3',
    category: 'social',
    text: 'When you think about meeting new people, how do you feel?',
    options: [
      { text: 'I love meeting new people and making connections', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy meeting new people when it happens naturally', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m okay with meeting new people but don\'t seek it out', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncomfortable meeting new people', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid meeting new people', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_4',
    category: 'social',
    text: 'When you think about your social energy, what\'s your experience?',
    options: [
      { text: 'I feel energized by social interactions', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy social time and feel good afterward', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Social time is okay but I need balance', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Social interactions drain my energy', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel exhausted by social situations', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_5',
    category: 'social',
    text: 'When you think about your communication style, what comes up?',
    options: [
      { text: 'I communicate openly and authentically', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I express myself well and feel heard', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I communicate okay but sometimes struggle', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find it difficult to express myself', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel misunderstood or unheard', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_6',
    category: 'social',
    text: 'When you think about conflict in relationships, how do you handle it?',
    options: [
      { text: 'I address conflict directly and constructively', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to resolve conflicts when they arise', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I handle conflict okay but prefer to avoid it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find conflict stressful and difficult', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid conflict and let things fester', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'social_7',
    category: 'social',
    text: 'When you think about your social support system, what comes up?',
    options: [
      { text: 'I have strong support and feel deeply connected', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have good support and feel cared for', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some support but could use more', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel like I don\'t have enough support', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel alone and unsupported', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 📦 POSSESSIONS & STUFF
// ============================================================================
const possessionsQuestions: AssessmentQuestion[] = [
  {
    id: 'stuff_1',
    category: 'stuff',
    text: 'When you think about your belongings, what\'s your dominant feeling?',
    options: [
      { text: 'I love my possessions and they bring me joy', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I appreciate my belongings and feel satisfied', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have what I need but don\'t think about it much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by too much stuff', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel burdened by my possessions', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_2',
    category: 'stuff',
    text: 'When you think about shopping and acquiring new things, how do you feel?',
    options: [
      { text: 'I enjoy shopping and find it satisfying', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I like shopping when I need something specific', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I shop when necessary but don\'t love it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find shopping stressful or overwhelming', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid shopping and prefer minimalism', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_3',
    category: 'stuff',
    text: 'When you think about your ideal possessions, what comes up?',
    options: [
      { text: 'I have clear visions of things I\'d love to own', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some things I\'d like to acquire', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have ideas but don\'t feel strongly about them', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel conflicted about wanting things', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel guilty about wanting possessions', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_4',
    category: 'stuff',
    text: 'When you think about decluttering or organizing your space, how do you feel?',
    options: [
      { text: 'I love organizing and feel energized by it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy organizing and feel satisfied afterward', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I organize when necessary but don\'t love it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find organizing stressful and overwhelming', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid organizing and feel chaotic', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_5',
    category: 'stuff',
    text: 'When you think about the value of material things, what\'s your perspective?',
    options: [
      { text: 'I believe possessions can enhance life and bring joy', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I appreciate nice things but don\'t overvalue them', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have mixed feelings about material possessions', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel conflicted about materialism', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel guilty about wanting material things', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_6',
    category: 'stuff',
    text: 'When you think about your relationship with stuff, what comes up?',
    options: [
      { text: 'I have a healthy relationship with my possessions', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I generally feel good about my belongings', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some attachment issues with things', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel controlled by my possessions', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel trapped or burdened by stuff', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'stuff_7',
    category: 'stuff',
    text: 'When you think about your ideal living space with your ideal things, what comes up?',
    options: [
      { text: 'I have a clear vision of my perfect space', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some ideas but don\'t think about it much', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by too many options', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless about creating my ideal space', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// 🎁 GIVING & LEGACY
// ============================================================================
const givingQuestions: AssessmentQuestion[] = [
  {
    id: 'giving_1',
    category: 'giving',
    text: 'When you think about helping others, what\'s your dominant feeling?',
    options: [
      { text: 'I love helping and feel fulfilled by it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy helping when I can', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I help when asked but don\'t seek it out', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel overwhelmed by others\' needs', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel resentful about helping others', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_2',
    category: 'giving',
    text: 'When you think about charitable giving, how do you feel?',
    options: [
      { text: 'I love giving and feel good about it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy giving when I can afford it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I give occasionally but don\'t prioritize it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty about not giving more', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel resentful about being asked to give', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_3',
    category: 'giving',
    text: 'When you think about volunteering your time, what comes up?',
    options: [
      { text: 'I love volunteering and find it rewarding', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy volunteering when I have time', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I volunteer occasionally but don\'t prioritize it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty about not volunteering more', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel resentful about being asked to volunteer', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_4',
    category: 'giving',
    text: 'When you think about your impact on others, how do you feel?',
    options: [
      { text: 'I feel good about the positive impact I have', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I believe I make a difference in people\'s lives', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I hope I have some positive impact', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncertain about my impact', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like I don\'t make a difference', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_5',
    category: 'giving',
    text: 'When you think about your generosity, what comes up?',
    options: [
      { text: 'I love being generous and it brings me joy', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I enjoy being generous when I can', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I\'m generous when it feels right', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel conflicted about being generous', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel resentful about being expected to be generous', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_6',
    category: 'giving',
    text: 'When you think about receiving help from others, how do you feel?',
    options: [
      { text: 'I\'m grateful and accept help graciously', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I appreciate help when I need it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I accept help but prefer to be independent', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncomfortable accepting help', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel guilty or ashamed about needing help', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'giving_7',
    category: 'giving',
    text: 'When you think about your legacy and how you want to be remembered, what comes up?',
    options: [
      { text: 'I want to be remembered for helping others', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I hope to be remembered for making a positive impact', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I want to be remembered but it\'s not a big priority', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncertain about my legacy', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless about making a meaningful impact', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// ✨ SPIRITUALITY
// ============================================================================
const spiritualityQuestions: AssessmentQuestion[] = [
  {
    id: 'spirituality_1',
    category: 'spirituality',
    text: 'When you think about your spiritual beliefs, what comes up?',
    options: [
      { text: 'I have strong spiritual beliefs that guide me', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have spiritual beliefs that provide comfort', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some spiritual beliefs but feel uncertain', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel confused about spiritual matters', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel disconnected from spirituality', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_2',
    category: 'spirituality',
    text: 'When you think about your connection to something greater, how do you feel?',
    options: [
      { text: 'I feel deeply connected to something greater', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel some connection and find it meaningful', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I sometimes feel connected but it\'s inconsistent', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel disconnected from something greater', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel alone and without spiritual connection', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_3',
    category: 'spirituality',
    text: 'When you think about prayer, meditation, or spiritual practices, what\'s your experience?',
    options: [
      { text: 'I have regular spiritual practices that bring me peace', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I engage in spiritual practices when I can', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try spiritual practices but struggle to be consistent', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find spiritual practices difficult or uncomfortable', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid spiritual practices entirely', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_4',
    category: 'spirituality',
    text: 'When you think about your purpose and meaning in life, what comes up?',
    options: [
      { text: 'I have a clear sense of purpose and meaning', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel like I\'m living with purpose', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel neutral about my purpose', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel lost and uncertain about my purpose', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like life has no meaning', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_5',
    category: 'spirituality',
    text: 'When you think about death and what happens after, how do you feel?',
    options: [
      { text: 'I feel peaceful and accepting about death', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have beliefs about death that comfort me', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have mixed feelings about death', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel anxious and fearful about death', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel terrified and avoid thinking about death', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_6',
    category: 'spirituality',
    text: 'When you think about your spiritual community or fellowship, what comes up?',
    options: [
      { text: 'I have a strong spiritual community that supports me', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some spiritual connections and fellowship', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some spiritual connections but feel disconnected', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel isolated from spiritual community', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel alone in my spiritual journey', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'spirituality_7',
    category: 'spirituality',
    text: 'When you think about your spiritual growth and development, what\'s your feeling?',
    options: [
      { text: 'I feel like I\'m growing spiritually and evolving', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel like I\'m on a spiritual path', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some spiritual growth but feel stagnant', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel stuck in my spiritual development', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless about spiritual growth', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  }
]

// ============================================================================
// EXPORT CATEGORIES WITH QUESTIONS (in VISION_CATEGORIES order)
// ============================================================================
export const assessmentQuestions: AssessmentCategory[] = [
  {
    category: 'fun',
    questions: funQuestions
  },
  {
    category: 'travel',
    questions: travelQuestions
  },
  {
    category: 'home',
    questions: homeQuestions
  },
  {
    category: 'family',
    questions: familyQuestions
  },
  {
    category: 'love',
    questions: romanceQuestions
  },
  {
    category: 'health',
    questions: healthQuestions
  },
  {
    category: 'money',
    questions: moneyQuestions
  },
  {
    category: 'work',
    questions: businessQuestions
  },
  {
    category: 'social',
    questions: socialQuestions
  },
  {
    category: 'stuff',
    questions: possessionsQuestions
  },
  {
    category: 'giving',
    questions: givingQuestions
  },
  {
    category: 'spirituality',
    questions: spiritualityQuestions
  }
]

// ============================================================================
// CATEGORY METADATA
// ============================================================================
export const categoryMetadata: Record<AssessmentCategoryType, { title: string; description: string }> = {
  fun: { title: 'Fun & Recreation', description: 'How you play, relax, and enjoy life' },
  travel: { title: 'Travel & Adventure', description: 'Your relationship with exploration and new experiences' },
  home: { title: 'Home & Environment', description: 'Your living space and sense of sanctuary' },
  family: { title: 'Family & Parenting', description: 'Your relationships with family members' },
  love: { title: 'Love & Romance', description: 'Your intimate relationships and love life' },
  health: { title: 'Health & Vitality', description: 'Your physical and mental well-being' },
  money: { title: 'Money & Wealth', description: 'Your relationship with finances and abundance' },
  work: { title: 'Work & Career', description: 'Your work life and professional fulfillment' },
  social: { title: 'Social & Friends', description: 'Your friendships and social connections' },
  stuff: { title: 'Stuff & Possessions', description: 'Your relationship with material things' },
  giving: { title: 'Giving & Legacy', description: 'How you contribute and want to be remembered' },
  spirituality: { title: 'Spirituality', description: 'Your spiritual beliefs and connection to something greater' }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter questions based on user profile data
 */
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
      return true // Default to showing the question if there's an error
    }
  })
}

/**
 * Get all unique categories from questions
 */
export function getAllCategories(): string[] {
  const categories = new Set(assessmentQuestions.map(cat => cat.category))
  return Array.from(categories)
}

export default assessmentQuestions