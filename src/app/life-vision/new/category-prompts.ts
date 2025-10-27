export interface CategoryPrompt {
  category: string
  about: string
  feelingAmazingQuestions: string[]
  feelingBadQuestions: string[]
}

export const CATEGORY_PROMPTS: Record<string, CategoryPrompt> = {
  fun: {
    category: 'Fun',
    about: 'This is about hobbies, activities, and pure joy—the things that light you up just because they\'re fun. This is where you get to be unapologetically you—no productivity required.',
    feelingAmazingQuestions: [
      'What activities make you lose track of time?',
      'What did you love doing as a kid that you\'d love to bring back?',
      'What hobbies or interests have you been curious about?',
      'When do you laugh the hardest? What are you doing?',
      'What does "play" look like for you?',
      'How often are you having fun? Daily? Weekly?',
      'What kinds of things would you love to learn just for the joy of it?',
      'What does your ideal Saturday look like?'
    ],
    feelingBadQuestions: [
      'Do you feel like you don\'t have enough time for fun?',
      'Are you stuck in a rut doing the same things over and over?',
      'Do you feel guilty when you try to have fun?',
      'Is your schedule so packed there\'s no room for play?',
      'Do you wish you had more variety or excitement?',
      'Are you bored? Restless? Craving something new?'
    ]
  },
  health: {
    category: 'Health',
    about: 'This is about physical and mental well-being—how your body feels, looks, and performs. It\'s about energy, vitality, strength, and the deep satisfaction of feeling great in your own skin.',
    feelingAmazingQuestions: [
      'How does your body look and feel?',
      'What does it feel like to wake up energized?',
      'How do you move? Exercise? Play?',
      'What foods nourish and excite you?',
      'How does your skin, hair, and overall appearance make you feel?',
      'What physical activities do you enjoy that keep you healthy?',
      'How does it feel to be in peak physical condition?',
      'What does your body allow you to DO that lights you up?',
      'How do you take care of yourself? What does self-care look like?'
    ],
    feelingBadQuestions: [
      'Are you tired all the time? Low energy?',
      'Do you feel disconnected from your body?',
      'Are you struggling with pain, discomfort, or physical limitations?',
      'Do you hate how you look or feel?',
      'Are you stuck in unhealthy habits you can\'t seem to break?',
      'Do you feel guilty about food choices or exercise?',
      'Is your body not performing the way you want it to?',
      'Do you feel like you\'re fighting against your body instead of working with it?'
    ]
  },
  // Add more categories here as needed
}

