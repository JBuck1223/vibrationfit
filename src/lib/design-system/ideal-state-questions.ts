/**
 * Static Ideal State Questions for Life Vision Imagination Step
 * 
 * These questions help users explore their ideal state in each life category.
 * Questions are conditional based on user profile data (relationship status, children, employment, etc.)
 * 
 * Last Updated: November 19, 2025
 */

export interface IdealStateQuestion {
  id: string
  text: string
  conditionalLogic?: {
    field: string
    condition: (value: any) => boolean
  }
}

export interface CategoryQuestions {
  category: string
  questions: IdealStateQuestion[]
}

// ============================================================================
// FUN & RECREATION
// ============================================================================
const funQuestions: IdealStateQuestion[] = [
  {
    id: 'fun_1',
    text: 'What do I love doing purely for fun, and how often do I make space for it?'
  },
  {
    id: 'fun_2',
    text: 'What skills or hobbies am I excited to learn or get better at?'
  },
  {
    id: 'fun_3',
    text: 'What foods and drinks bring me joy to eat or share?'
  },
  {
    id: 'fun_4',
    text: 'Where do I love eating and drinking — restaurants, picnics, home cooking, cafés, or beach nights?'
  },
  {
    id: 'fun_5',
    text: 'Who am I often with when I\'m having fun, and what is our energy like together?'
  },
  {
    id: 'fun_6',
    text: 'Why does fun matter to me?'
  }
]

// ============================================================================
// HEALTH & VITALITY
// ============================================================================
const healthQuestions: IdealStateQuestion[] = [
  {
    id: 'health_1',
    text: 'What does my body look and feel like at its best?'
  },
  {
    id: 'health_2',
    text: 'How does my body move and perform through daily life—strength, flexibility, stamina, balance?'
  },
  {
    id: 'health_3',
    text: 'When I\'m in peak health, how do I feel throughout the day—emotionally and physically?'
  },
  {
    id: 'health_4',
    text: 'What activities am I capable of that feel exciting and fun?'
  },
  {
    id: 'health_5',
    text: 'What habits or routines help me stay in optimal shape?'
  },
  {
    id: 'health_6',
    text: 'How does movement feel in my body when I\'m energized—light, strong, free, steady?'
  },
  {
    id: 'health_7',
    text: 'What foods or meals make me feel alive and balanced?'
  },
  {
    id: 'health_8',
    text: 'What am I most thankful for about my body right now?'
  }
]

// ============================================================================
// TRAVEL & ADVENTURE
// ============================================================================
const travelQuestions: IdealStateQuestion[] = [
  {
    id: 'travel_1',
    text: 'What do I love most about traveling—the freedom, the discovery, the newness?'
  },
  {
    id: 'travel_2',
    text: 'What international places am I most excited to explore?'
  },
  {
    id: 'travel_3',
    text: 'What parts of my own country do I feel drawn to visit?'
  },
  {
    id: 'travel_4',
    text: 'How do I love getting from place to place—plane, car, boat, or train?'
  },
  {
    id: 'travel_5',
    text: 'What kinds of activities or adventures do I most enjoy while exploring new places?'
  },
  {
    id: 'travel_6',
    text: 'What experiences or wonders am I excited to try or see in new destinations?'
  },
  {
    id: 'travel_7',
    text: 'When I\'m exploring, what emotions flow through me?'
  },
  {
    id: 'travel_8',
    text: 'What cultures or traditions am I fascinated by?'
  },
  {
    id: 'travel_9',
    text: 'What do I love learning when I travel—local stories, food, art, or history?'
  },
  {
    id: 'travel_10',
    text: 'What animals would I be thrilled to see in nature or sanctuaries?'
  },
  {
    id: 'travel_11',
    text: 'When I picture myself at the destination I\'m most excited to experience, where am I?'
  },
  {
    id: 'travel_12',
    text: 'Why does this specific travel experience excite me so much?'
  },
  {
    id: 'travel_13',
    text: 'How does adventure help me feel alive and connected to life itself?'
  }
]

// ============================================================================
// LOVE & ROMANCE (for people in relationships)
// ============================================================================
const loveQuestions: IdealStateQuestion[] = [
  {
    id: 'love_1',
    text: 'How does my partner love and support me as my authentic self?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_2',
    text: 'What qualities do I most appreciate in my partner?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_3',
    text: 'Who am I in this relationship when I\'m at my best?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_4',
    text: 'What do we genuinely love doing together for fun or connection?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_5',
    text: 'How does it feel to evolve and expand together?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_6',
    text: 'In what ways do we nurture our relationship\'s growth?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_7',
    text: 'Where do we feel most connected or inspired together—at home, in nature, on adventures?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_8',
    text: 'Why does this relationship feel so meaningful and expansive for both of us?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  },
  {
    id: 'love_9',
    text: 'What about our relationship am I most thankful for right now?',
    conditionalLogic: {
      field: 'relationship_status',
      condition: (value) => value === 'Married' || value === 'In a Relationship'
    }
  }
]

// ============================================================================
// FAMILY & PARENTING
// ============================================================================
const familyQuestions: IdealStateQuestion[] = [
  {
    id: 'family_1',
    text: 'Do I have children?',
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_2',
    text: 'What do we love doing together that makes us laugh, bond, or feel close?',
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_3',
    text: 'How does daily life in our home feel when everything is flowing easily?',
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_4',
    text: 'What does a happy, healthy relationship with my children look and feel like day-to-day?',
    conditionalLogic: {
      field: 'has_children',
      condition: (value) => value === true
    }
  },
  {
    id: 'family_5',
    text: 'What is my relationship with my parents like in its most loving and supportive form?'
  },
  {
    id: 'family_6',
    text: 'What\'s my relationship with my siblings like when we\'re in harmony?'
  },
  {
    id: 'family_7',
    text: 'How do my grandparents (or elders) influence or inspire our family connection?'
  },
  {
    id: 'family_8',
    text: 'How does it feel watching our family grow through the seasons of life?'
  },
  {
    id: 'family_9',
    text: 'In what ways do we learn, support, or evolve together as a family?'
  },
  {
    id: 'family_10',
    text: 'Who keeps our family grounded or brings balance when life feels busy?'
  },
  {
    id: 'family_11',
    text: 'What do I appreciate most about the unique personalities and gifts within our family?'
  }
]

// ============================================================================
// SOCIAL & FRIENDSHIPS
// ============================================================================
const socialQuestions: IdealStateQuestion[] = [
  {
    id: 'social_1',
    text: 'What kind of friendships fill my life?'
  },
  {
    id: 'social_2',
    text: 'What do I love doing with my friends that makes us laugh, connect, and feel alive?'
  },
  {
    id: 'social_3',
    text: 'What kinds of conversations do we have that leave me feeling inspired, understood, and uplifted?'
  },
  {
    id: 'social_4',
    text: 'What energy do I naturally bring into my friendships?'
  },
  {
    id: 'social_5',
    text: 'How do I feel in the company of my friends and even when we\'re apart?'
  },
  {
    id: 'social_6',
    text: 'What are my friends\' lives like—families, careers, passions?'
  },
  {
    id: 'social_7',
    text: 'How does my social circle expand my world?'
  },
  {
    id: 'social_8',
    text: 'What do I appreciate most about my friends and the way they show up for me?'
  }
]

// ============================================================================
// HOME & ENVIRONMENT
// ============================================================================
const homeQuestions: IdealStateQuestion[] = [
  {
    id: 'home_1',
    text: 'Where do I live in the world, and what surrounds me — city, coast, countryside?'
  },
  {
    id: 'home_2',
    text: 'How does it feel when I walk through my front door each day?'
  },
  {
    id: 'home_3',
    text: 'Describe your home — inside and out.'
  },
  {
    id: 'home_4',
    text: 'Who shares this home with me (partner, kids, pets)?'
  },
  {
    id: 'home_5',
    text: 'Do any pets share our space?'
  },
  {
    id: 'home_6',
    text: 'Where do I spend the most time in my home?'
  },
  {
    id: 'home_7',
    text: 'How and where do I unwind here?'
  },
  {
    id: 'home_8',
    text: 'Where in my home do I feel most creative or inspired?'
  },
  {
    id: 'home_9',
    text: 'Describe your sleep space — bed, textures, sounds, light.'
  },
  {
    id: 'home_10',
    text: 'What\'s the first feeling that greets me as I enter my home?'
  },
  {
    id: 'home_11',
    text: 'What small details or rituals make this space uniquely mine and fill me with gratitude?'
  },
  {
    id: 'home_12',
    text: 'Describe your outdoor space and what you love doing there.'
  },
  {
    id: 'home_13',
    text: 'When friends or family visit, where do we gather and what feeling fills the space?'
  },
  {
    id: 'home_14',
    text: 'How would I describe my home\'s personality or style (colors, textures, mood)?'
  },
  {
    id: 'home_15',
    text: 'What aromas and sounds define the atmosphere here?'
  },
  {
    id: 'home_16',
    text: 'Does anyone support our household flow (laundry, meals, cleaning)?'
  }
]

// ============================================================================
// WORK & CAREER
// ============================================================================
const workQuestions: IdealStateQuestion[] = [
  {
    id: 'work_1',
    text: 'What kind of work or creative expression do I love doing that feels natural, energizing, and fulfilling?'
  },
  {
    id: 'work_2',
    text: 'What does a fulfilling workday look and feel like—from morning to evening?'
  },
  {
    id: 'work_3',
    text: 'How does my body feel during a productive, purpose-driven day?'
  },
  {
    id: 'work_4',
    text: 'What strengths or natural gifts make me valuable and light me up when I use them?'
  },
  {
    id: 'work_5',
    text: 'How does my work bring value to clients, colleagues, or the world?'
  },
  {
    id: 'work_6',
    text: 'How do I naturally show up as my best self at work?'
  },
  {
    id: 'work_7',
    text: 'What does my ideal workspace look, sound, and feel like?'
  },
  {
    id: 'work_8',
    text: 'If I have a boss or business partner, how does our collaboration feel?',
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value !== 'Business Owner'
    }
  },
  {
    id: 'work_9',
    text: 'What\'s the energy like among my colleagues or team?'
  },
  {
    id: 'work_10',
    text: 'How do I feel in my role day-to-day?'
  },
  {
    id: 'work_11',
    text: 'What do I genuinely appreciate about the people I work with?'
  },
  {
    id: 'work_12',
    text: 'Who surrounds me at work?'
  },
  {
    id: 'work_13',
    text: 'How do I continue growing in my work?'
  },
  {
    id: 'work_14',
    text: 'What emotions arise as I grow?'
  },
  {
    id: 'work_15',
    text: 'If I lead a team, how does it feel to support them?',
    conditionalLogic: {
      field: 'employment_type',
      condition: (value) => value === 'Business Owner'
    }
  }
]

// ============================================================================
// MONEY & WEALTH
// ============================================================================
const moneyQuestions: IdealStateQuestion[] = [
  {
    id: 'money_1',
    text: 'What does my income look and feel like now—steady, abundant, expanding?'
  },
  {
    id: 'money_2',
    text: 'What do I love doing that brings in income easily and joyfully?'
  },
  {
    id: 'money_3',
    text: 'What feels most exciting or meaningful to spend money on?'
  },
  {
    id: 'money_4',
    text: 'How does financial security feel in my daily life?'
  },
  {
    id: 'money_5',
    text: 'What assets make me feel grounded and free?'
  },
  {
    id: 'money_6',
    text: 'Where are my investments focused—properties, markets, companies, or creative projects?'
  },
  {
    id: 'money_7',
    text: 'How do I handle my finances—myself or with trusted advisors?'
  },
  {
    id: 'money_8',
    text: 'How does financial abundance feel emotionally?'
  },
  {
    id: 'money_9',
    text: 'What causes, people, or experiences do I love supporting financially?'
  }
]

// ============================================================================
// STUFF & POSSESSIONS
// ============================================================================
const stuffQuestions: IdealStateQuestion[] = [
  {
    id: 'stuff_1',
    text: 'What kinds of things fill my life that genuinely make me happy and support how I live?'
  },
  {
    id: 'stuff_2',
    text: 'What kinds of things do I enjoy having and using daily?'
  },
  {
    id: 'stuff_3',
    text: 'What do my favorite things look and feel like?'
  },
  {
    id: 'stuff_4',
    text: 'Which items hold meaning or story for me?'
  },
  {
    id: 'stuff_5',
    text: 'What do I love using every day?'
  },
  {
    id: 'stuff_6',
    text: 'How does my space feel when it\'s filled only with things that spark ease, beauty, and inspiration?'
  },
  {
    id: 'stuff_7',
    text: 'What do I enjoy surrounding myself with?'
  },
  {
    id: 'stuff_8',
    text: 'How does it feel to have quality over quantity?'
  },
  {
    id: 'stuff_9',
    text: 'Do I have multiple properties?'
  },
  {
    id: 'stuff_10',
    text: 'What do I drive, and how does it feel when I\'m behind the wheel?'
  },
  {
    id: 'stuff_11',
    text: 'What possessions symbolize success or freedom for me?'
  }
]

// ============================================================================
// GIVING & LEGACY
// ============================================================================
const givingQuestions: IdealStateQuestion[] = [
  {
    id: 'giving_1',
    text: 'Who or what causes light me up to support?'
  },
  {
    id: 'giving_2',
    text: 'What unique gifts, skills, or experiences do I love sharing to uplift others?'
  },
  {
    id: 'giving_3',
    text: 'How do I love to give—through time, resources, creativity, or presence?'
  },
  {
    id: 'giving_4',
    text: 'How does it feel to witness the impact of what I give?'
  },
  {
    id: 'giving_5',
    text: 'What does giving from my overflow look and feel like in daily life?'
  },
  {
    id: 'giving_6',
    text: 'How do I like to contribute?'
  },
  {
    id: 'giving_7',
    text: 'In what ways do I weave generosity into everyday life?'
  },
  {
    id: 'giving_8',
    text: 'What emotions arise when I witness the results of my giving?'
  },
  {
    id: 'giving_9',
    text: 'How does my giving multiply through others?'
  }
]

// ============================================================================
// SPIRITUALITY
// ============================================================================
const spiritualityQuestions: IdealStateQuestion[] = [
  {
    id: 'spirituality_1',
    text: 'What daily moments or practices help me feel deeply connected to Source, Life, or my Higher Self?'
  },
  {
    id: 'spirituality_2',
    text: 'How do signs, synchronicities, or nudges from the Universe show up for me?'
  },
  {
    id: 'spirituality_3',
    text: 'How do I stay tuned to my guidance while moving through everyday life?'
  },
  {
    id: 'spirituality_4',
    text: 'When I\'m in alignment, what does it feel like?'
  },
  {
    id: 'spirituality_5',
    text: 'How do I recognize when I\'ve drifted out of alignment?'
  },
  {
    id: 'spirituality_6',
    text: 'Where do I feel most connected?'
  },
  {
    id: 'spirituality_7',
    text: 'How do I express gratitude to the Universe or to life itself?'
  },
  {
    id: 'spirituality_8',
    text: 'What truths or insights keep revealing themselves to me again and again?'
  },
  {
    id: 'spirituality_9',
    text: 'How does my spiritual alignment influence the way I show up for others?'
  }
]

// ============================================================================
// EXPORTS
// ============================================================================

export const IDEAL_STATE_QUESTIONS: Record<string, CategoryQuestions> = {
  fun: { category: 'fun', questions: funQuestions },
  health: { category: 'health', questions: healthQuestions },
  travel: { category: 'travel', questions: travelQuestions },
  love: { category: 'love', questions: loveQuestions },
  family: { category: 'family', questions: familyQuestions },
  social: { category: 'social', questions: socialQuestions },
  home: { category: 'home', questions: homeQuestions },
  work: { category: 'work', questions: workQuestions },
  money: { category: 'money', questions: moneyQuestions },
  stuff: { category: 'stuff', questions: stuffQuestions },
  giving: { category: 'giving', questions: givingQuestions },
  spirituality: { category: 'spirituality', questions: spiritualityQuestions }
}

/**
 * Get questions for a specific category
 */
export function getQuestionsForCategory(category: string): IdealStateQuestion[] {
  const categoryData = IDEAL_STATE_QUESTIONS[category]
  return categoryData ? categoryData.questions : []
}

/**
 * Filter questions based on user profile
 * Similar to assessment filterQuestionsByProfile
 */
export function filterQuestionsByProfile(
  questions: IdealStateQuestion[],
  profile: any
): IdealStateQuestion[] {
  if (!questions || !profile) return questions || []
  
  return questions.filter(question => {
    if (!question.conditionalLogic) return true
    
    const { field, condition } = question.conditionalLogic
    const fieldValue = profile[field]
    
    try {
      return condition(fieldValue)
    } catch (error) {
      console.error('Error evaluating conditional logic for ideal state question:', error)
      return true // Default to showing the question if there's an error
    }
  })
}

/**
 * Get all filtered questions for a category based on user profile
 */
export function getFilteredQuestionsForCategory(
  category: string,
  profile: any
): IdealStateQuestion[] {
  const questions = getQuestionsForCategory(category)
  return filterQuestionsByProfile(questions, profile)
}
