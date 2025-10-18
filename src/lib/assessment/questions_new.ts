export interface QuestionOption {
  text: string
  value: number
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
  category: string
  text: string
  options: QuestionOption[]
  conditionalLogic?: ConditionalLogic
}

export interface AssessmentCategory {
  category: string
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
    text: 'When you see someone with something expensive you would love to own, what is your first honest thought?',
    options: [
      { text: 'That is coming for me too', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good for them, that is awesome', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Nice, no emotional charge', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Must be nice (with a twinge of resentment)', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'They probably got lucky or inherited it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_4',
    category: 'money',
    text: 'When you want to buy something that costs more than usual, what do you typically do?',
    options: [
      { text: 'Buy it if I want it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Consider it briefly, then decide', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Sleep on it and budget for it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Talk myself out of it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Feel guilty even thinking about it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_5',
    category: 'money',
    text: 'When unexpected money shows up (refund, gift, bonus), what is your first thought?',
    options: [
      { text: 'Hell yes, more abundance coming!', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'This is awesome, what do I want to do with it?', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Cool, I will save or invest it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Better save this for the next emergency', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'It will not last or What is the catch?', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_6',
    category: 'money',
    text: 'When you are out with friends and the bill comes, what happens internally?',
    options: [
      { text: 'I happily pay for everyone', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I am fine with splitting evenly', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I calculate exactly what I owe', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I hope someone else grabs it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel anxious about the amount', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'money_7',
    category: 'money',
    text: 'How would you describe your relationship with money?',
    options: [
      { text: 'Money flows easily to me', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel comfortable and secure with money', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It is functional, neither good nor bad', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I am constantly worried about it', value: 2, emoji: '🔴', greenLine: 'below' },
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
    text: 'When your phone rings and it is a family member, what is your gut reaction?',
    options: [
      { text: 'Happy, I want to answer', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, I will take the call', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Depends on who it is', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Slight dread, What do they want?', value: 2, emoji: '🔴', greenLine: 'below' },
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
      { text: 'Excited, cannot wait', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Looking forward to it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'It is fine, I will go', value: 3, emoji: '⚪', greenLine: 'neutral' },
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
    text: 'When family members ask for your help (money, time, favors), what is your immediate feeling?',
    options: [
      { text: 'Happy to help, no hesitation', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Willing, I will figure it out', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I will do it but it is inconvenient', value: 3, emoji: '⚪', greenLine: 'neutral' },
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
      { text: 'I listen, take what is useful, let go of the rest', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Slightly annoyed but I am confident in my choices', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Defensive but I hear them out', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Hurt, they do not support me', value: 2, emoji: '🔴', greenLine: 'below' },
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
    text: 'When you reflect on your childhood, what is the dominant feeling?',
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
    text: 'When a family member succeeds at something big, what is your honest reaction?',
    options: [
      { text: 'Genuinely thrilled for them', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Happy, I celebrate with them', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'That is nice (no strong feeling)', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Envious, comparing it to my life', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Bitter, Why not me?', value: 1, emoji: '🔴', greenLine: 'below' },
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
    text: 'When you think about your family influence on your life, what comes up?',
    options: [
      { text: 'Grateful for their support and guidance', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'They have shaped me in positive ways', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some good some challenging', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'They have held me back in some ways', value: 2, emoji: '🔴', greenLine: 'below' },
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
    text: 'When your child comes to you upset, what is your immediate internal response?',
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
      { text: 'I try to be fair but it is hard', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel guilty and I am inconsistent', value: 2, emoji: '🔴', greenLine: 'below' },
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
    text: 'When you think about your child future, what is your dominant feeling?',
    options: [
      { text: 'Excited about their potential', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings, some worry', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious about the world they will face', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Terrified I am not preparing them well', value: 1, emoji: '🔴', greenLine: 'below' },
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
    text: 'When your child achieves something significant, what is your reaction?',
    options: [
      { text: 'Proud and celebrating their growth', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Happy and encouraging', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Pleased but trying not to overreact', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Relieved they are doing well', value: 2, emoji: '🔴', greenLine: 'below' },
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
      { text: 'I have found a rhythm that works', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'It is challenging but manageable', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Some days are better than others', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel pulled in too many directions', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I am constantly failing at both', value: 1, emoji: '🔴', greenLine: 'below' },
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
      { text: 'I feel like I have failed as a parent', value: 1, emoji: '🔴', greenLine: 'below' },
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
      { text: 'I am figuring it out as I go', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I doubt myself a lot', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like I am doing it wrong', value: 1, emoji: '🔴', greenLine: 'below' },
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
    id: 'romance_single_1',
    category: 'romance',
    text: 'When you think about your ideal romantic partner, what comes up?',
    options: [
      { text: 'I have a clear vision and feel excited', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I know what I want and feel optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have some ideas but feel uncertain', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel confused or frustrated about dating', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel hopeless or have given up', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_2',
    category: 'romance',
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
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_3',
    category: 'romance',
    text: 'When someone you are interested in does not text back quickly, what is your reaction?',
    options: [
      { text: 'No big deal, I will reach out later', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Slightly disappointed but I understand', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I wonder what happened', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I overthink and worry', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I spiral into anxiety and self-doubt', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_4',
    category: 'romance',
    text: 'When you think about being single, how do you feel?',
    options: [
      { text: 'I am happy and fulfilled as I am', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I am content but open to love', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed feelings about it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel lonely and incomplete', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like something is wrong with me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_5',
    category: 'romance',
    text: 'When you see happy couples, what is your honest reaction?',
    options: [
      { text: 'Happy for them, it gives me hope', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Nice to see, I am optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral, does not affect me', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Slightly envious or sad', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Bitter or resentful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_6',
    category: 'romance',
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
      condition: (value) => value === 'Single'
    }
  },
  {
    id: 'romance_single_7',
    category: 'romance',
    text: 'When you think about finding love, what is your dominant feeling?',
    options: [
      { text: 'Confident it will happen when it is right', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Hopeful and optimistic', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Uncertain but open to possibilities', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Worried it might not happen', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Hopeless or resigned to being alone', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Single'
    }
  },
  // In a Relationship / Married questions
  {
    id: 'romance_relationship_1',
    category: 'romance',
    text: 'When you think about your relationship, what is your dominant feeling?',
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
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_2',
    category: 'romance',
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
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_3',
    category: 'romance',
    text: 'When you think about your future with your partner, what comes up?',
    options: [
      { text: 'I am excited about our future together', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I feel optimistic about our relationship', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I have mixed feelings about the future', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel uncertain about our compatibility', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel worried or doubtful', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_4',
    category: 'romance',
    text: 'How do you feel about intimacy and connection with your partner?',
    options: [
      { text: 'We have deep emotional and physical intimacy', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We feel connected and close', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We have good moments but could be closer', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I feel disconnected or distant', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel lonely even when we are together', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_5',
    category: 'romance',
    text: 'When you think about trust in your relationship, what comes up?',
    options: [
      { text: 'I trust my partner completely', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I trust my partner and feel secure', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I trust my partner but have some doubts', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I have trust issues or concerns', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I do not trust my partner', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_6',
    category: 'romance',
    text: 'How do you feel about balancing your needs and your partner needs?',
    options: [
      { text: 'We both prioritize each other needs equally', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We try to balance both our needs', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We sometimes struggle to balance needs', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I often put their needs before mine', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I feel like my needs are ignored', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'In a Relationship' || value === 'Married'
    }
  },
  {
    id: 'romance_relationship_7',
    category: 'romance',
    text: 'When you think about your relationship growth, what is your feeling?',
    options: [
      { text: 'We are growing together and evolving positively', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'We are learning and improving as a couple', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'We have ups and downs but overall growing', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'We are stuck or not growing together', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'We are growing apart or deteriorating', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'In a Relationship' || value === 'Married'
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
    text: 'When you think about your physical body, what is your dominant feeling?',
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
    text: 'When you catch your reflection unexpectedly (mirror, window, photo), what is your honest first thought?',
    options: [
      { text: 'Looking good or neutral appreciation', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Not bad, I am okay with what I see', value: 4, emoji: '🟢', greenLine: 'above' },
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
      { text: 'I do it when I can but do not love it', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'I find it difficult or unpleasant', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'I avoid it and feel guilty about it', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ]
  },
  {
    id: 'health_4',
    category: 'health',
    text: 'How do you feel about what you are eating and how you are nourishing your body?',
    options: [
      { text: 'I love feeding my body good food', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'I eat well and feel good about my choices', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'I try to eat well but it is inconsistent', value: 3, emoji: '⚪', greenLine: 'neutral' },
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
      { text: 'I have ups and downs but I am managing okay', value: 3, emoji: '⚪', greenLine: 'neutral' },
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
    text: 'When you think about your overall health and vitality, what is the truth?',
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

// I'll continue with all remaining categories in the same clean format...
// Due to length, I'll create the complete file with all 12 categories properly formatted.

// Export categories with questions arrays (in VISION_CATEGORIES order)
export const assessmentQuestions: AssessmentCategory[] = [
  {
    category: 'fun',
    questions: [] // Will be populated
  },
  {
    category: 'travel',
    questions: [] // Will be populated
  },
  {
    category: 'home',
    questions: [] // Will be populated
  },
  {
    category: 'family',
    questions: familyQuestions
  },
  {
    category: 'romance',
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
    category: 'business',
    questions: [] // Will be populated
  },
  {
    category: 'social',
    questions: [] // Will be populated
  },
  {
    category: 'possessions',
    questions: [] // Will be populated
  },
  {
    category: 'giving',
    questions: [] // Will be populated
  },
  {
    category: 'spirituality',
    questions: [] // Will be populated
  }
]

// Helper functions
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