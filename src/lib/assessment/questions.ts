// /src/lib/assessment/questions.ts

// VibrationFit Vibrational Assessment - Complete Question Bank
// 12 Categories × 7 Questions = 84 Total Questions
// Updated to match site-wide category structure

import { CategoryQuestions, AssessmentQuestion, AssessmentCategory } from '@/types/assessment'

export const ASSESSMENT_QUESTIONS: CategoryQuestions[] = [
  // ============================================================================
  // 💰 MONEY & WEALTH
  // ============================================================================
  {
    category: 'money',
    title: 'Money / Wealth',
    description: 'Financial goals and wealth',
    icon: '💰',
    questions: [
      {
        id: 'money_1',
        category: 'money',
        text: 'You open your banking app. What happens in your body?',
        options: [
          { text: 'I feel calm, curious to see the balance', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, just checking numbers', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I hesitate for a second before opening it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'My stomach tightens', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I avoid it entirely unless I absolutely have to', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_2',
        category: 'money',
        text: 'Someone asks "How much do you make?" What\'s your honest reaction?',
        options: [
          { text: 'I share openly, no shame', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m comfortable sharing with close people', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I deflect or give a vague answer', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I feel uncomfortable or defensive', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I lie or exaggerate', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_3',
        category: 'money',
        text: 'You see someone driving a car you\'d love to own. What thought comes first?',
        options: [
          { text: '"That\'s coming for me too"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Good for them, that\'s awesome"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Nice car" (no emotional charge)', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Must be nice..." (with a twinge of resentment)', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"They probably inherited it / got lucky / married rich"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_4',
        category: 'money',
        text: 'You want to buy something that costs more than usual. What do you do?',
        options: [
          { text: 'Buy it immediately if I want it', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Consider it briefly, then decide yes/no', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Sleep on it, budget for it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Talk myself out of it', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Feel guilty even thinking about it', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_5',
        category: 'money',
        text: 'Money shows up unexpectedly (refund, gift, bonus). Your first thought is:',
        options: [
          { text: '"Hell yes, more abundance coming!"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"This is awesome, what do I want to do with it?"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Cool, I\'ll save/invest it"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Better save this for the next emergency"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"It won\'t last" or "What\'s the catch?"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_6',
        category: 'money',
        text: 'Someone owes you money and doesn\'t pay you back. How do you feel?',
        options: [
          { text: 'Unbothered, money flows easily to me', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I bring it up directly without anger', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Annoyed but I let it go', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Betrayed, I trusted them', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Furious, they took advantage of me', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'money_7',
        category: 'money',
        text: 'You\'re at dinner with friends. The bill comes. What happens internally?',
        options: [
          { text: 'I happily pay for everyone', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m fine with splitting evenly', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I calculate exactly what I owe', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I hope someone else grabs it', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I feel anxious about the amount', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 💪 HEALTH & VITALITY
  // ============================================================================
  {
    category: 'health',
    title: 'Health / Vitality',
    description: 'Physical and mental well-being',
    icon: '💪',
    questions: [
      {
        id: 'health_1',
        category: 'health',
        text: 'You catch your reflection unexpectedly (store window, car mirror). What\'s the instant thought?',
        options: [
          { text: '"Looking good" or neutral', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Not bad"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'No particular thought', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Critical thought about specific body part', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Immediate disgust or disappointment', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_2',
        category: 'health',
        text: 'Someone suggests trying a physical activity you\'ve never done. Your gut reaction?',
        options: [
          { text: '"Let\'s do it!"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Could be fun, why not"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Maybe... let me think about it"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"I\'d be terrible at that"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"Absolutely not"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_3',
        category: 'health',
        text: 'You\'re getting dressed. How many outfit changes before you leave?',
        options: [
          { text: 'First outfit, done', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'One or two changes, then I\'m good', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Three or four tries', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Five or more, still not satisfied', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I hate everything I own', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_4',
        category: 'health',
        text: 'You feel a pain in your body. What\'s your immediate thought?',
        options: [
          { text: '"My body is telling me something, let me listen"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Probably slept weird, it\'ll pass"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"I\'ll keep an eye on it"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Something\'s wrong, I should worry"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"This is going to be serious"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_5',
        category: 'health',
        text: 'Someone compliments your appearance. What do you feel?',
        options: [
          { text: '"Thank you!" (I believe them)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Grateful, I accept it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Awkward but I say thanks', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'They\'re just being nice', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'They\'re lying or didn\'t look closely', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_6',
        category: 'health',
        text: 'You\'re invited to the beach/pool. What\'s your honest feeling?',
        options: [
          { text: 'Excited, love being in water', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Sounds fun, I\'m in', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'ll go but stay covered up', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious about being seen in swimwear', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I avoid it or make excuses', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'health_7',
        category: 'health',
        text: 'You skip a workout you planned. What happens?',
        options: [
          { text: 'No guilt, I listen to my body', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"I\'ll do it tomorrow" (no drama)', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Mild disappointment', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I feel like a failure', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Self-hatred spiral', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 👨‍👩‍👧‍👦 FAMILY & PARENTING
  // ============================================================================
  {
    category: 'family',
    title: 'Family / Parenting',
    description: 'Family relationships and life',
    icon: '👨‍👩‍👧‍👦',
    questions: [
      {
        id: 'family_1',
        category: 'family',
        text: 'Your phone rings. It\'s a family member. What\'s your gut reaction?',
        options: [
          { text: 'Happy, I want to answer', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, I\'ll take the call', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Depends on who it is', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Slight dread, "What do they want?"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I let it go to voicemail', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_2',
        category: 'family',
        text: 'Family gathering coming up. How do you feel about it?',
        options: [
          { text: 'Excited, can\'t wait', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Looking forward to it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'It\'s fine, I\'ll go', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Obligated, already dreading it', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Anxious, considering excuses to skip', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_3',
        category: 'family',
        text: 'A family member asks for your help (money, time, favor). What\'s your immediate feeling?',
        options: [
          { text: 'Happy to help, no hesitation', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Willing, I\'ll figure it out', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'ll do it but it\'s inconvenient', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Resentful, they always ask me', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Angry, I feel used', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_4',
        category: 'family',
        text: 'Your family criticizes a decision you made. What happens?',
        options: [
          { text: 'I listen, take what\'s useful, let go of the rest', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly annoyed but I\'m confident in my choice', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Defensive but I hear them out', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hurt, they don\'t support me', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Furious or devastated', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_5',
        category: 'family',
        text: 'You think about your childhood. What\'s the dominant feeling?',
        options: [
          { text: 'Grateful, good memories', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Mixed but mostly positive', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, it was what it was', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Painful, lots of wounds', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Traumatic, I avoid thinking about it', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_6',
        category: 'family',
        text: 'A family member succeeds at something big. What\'s your honest reaction?',
        options: [
          { text: 'Genuinely thrilled for them', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Happy, I celebrate with them', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"That\'s nice" (no strong feeling)', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Envious or compared to my life', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Bitter, "Why not me?"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'family_7',
        category: 'family',
        text: 'You think about your family\'s influence on your life. What comes up?',
        options: [
          { text: 'Grateful for their support and guidance', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'They\'ve shaped me in positive ways', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Mixed feelings, some good some challenging', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'They\'ve held me back in some ways', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I need to break free from their influence', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // ❤️ LOVE & ROMANCE
  // ============================================================================
  {
    category: 'romance',
    title: 'Love / Romance',
    description: 'Romantic relationships',
    icon: '❤️',
    questions: [
      {
        id: 'romance_1',
        category: 'romance',
        text: 'You see couples being affectionate in public. What\'s your immediate feeling?',
        options: [
          { text: '"That\'s beautiful" (genuinely happy for them)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, no charge', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Get a room" (half-joking)', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Envious or sad', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Annoyed, bitter, or triggered', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'romance_2',
        category: 'romance',
        text: 'Someone you\'re attracted to shows interest. What\'s your first thought?',
        options: [
          { text: '"Of course they do, why wouldn\'t they?"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"This is exciting!"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Really? Me?"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"What do they want from me?"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"They must be desperate / have low standards"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value === 'single' || !value
        }
      },
      {
        id: 'romance_3',
        category: 'romance',
        text: 'Your partner criticizes something you did. What happens in your body?',
        options: [
          { text: 'Curious, open to hearing it', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Slight discomfort but I stay present', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Defensive but I listen', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hurt, shut down', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Rage, attack back', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_4',
        category: 'romance',
        text: 'You want something from your partner (time, affection, help). What do you do?',
        options: [
          { text: 'Ask directly and clearly', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Bring it up when the moment feels right', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Drop hints, hope they notice', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Wait for them to offer first', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Suffer in silence, keep score', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_5',
        category: 'romance',
        text: 'You imagine your partner with someone else (even hypothetically). What do you feel?',
        options: [
          { text: 'Unbothered, I trust completely', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Slight discomfort but no real fear', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I don\'t like thinking about it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Jealous, insecure', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Panicked, devastated', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_6',
        category: 'romance',
        text: 'Your partner goes out with friends without you. What\'s your honest reaction?',
        options: [
          { text: '"Have fun!" (genuinely happy for them)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Cool, I\'ll do my thing"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Fine on the surface, slightly annoyed', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Left out, jealous', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Anxious they\'ll meet someone better', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_7',
        category: 'romance',
        text: 'Someone flirts with your partner in front of you. What happens?',
        options: [
          { text: 'Amused, I\'m secure', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'No charge, it\'s whatever', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly territorial', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Threatened, angry', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Devastated, I compare myself', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      // BACKUP QUESTIONS (used when others are filtered out)
      {
        id: 'romance_backup_1',
        category: 'romance',
        text: 'You think about your ideal relationship. What comes up?',
        options: [
          { text: 'I know exactly what I want and deserve', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I have a clear vision of partnership', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m figuring out what I want', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I\'m not sure what\'s realistic', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I don\'t believe in ideal relationships', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'romance_backup_2',
        category: 'romance',
        text: 'How do you feel about vulnerability in relationships?',
        options: [
          { text: 'I embrace it, it\'s where connection happens', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m comfortable being open', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'It\'s scary but I try', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I avoid it, too risky', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I never let my guard down', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'romance_backup_3',
        category: 'romance',
        text: 'You\'re attracted to someone new. What\'s your approach?',
        options: [
          { text: 'I express interest directly and confidently', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I find ways to connect and see what happens', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I wait for them to make the first move', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I hope they notice me but don\'t act', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I assume they\'re not interested in me', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value === 'single' || !value
        }
      },
      // Additional backup questions to ensure 7 questions for each relationship status
      {
        id: 'romance_backup_4',
        category: 'romance',
        text: 'How do you handle conflict in relationships?',
        options: [
          { text: 'I communicate openly and work through it together', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I stay calm and try to understand their perspective', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I get defensive but eventually work it out', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I shut down or avoid the conversation', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I get angry and make it worse', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_backup_5',
        category: 'romance',
        text: 'What\'s your approach to dating and relationships?',
        options: [
          { text: 'I know what I want and go after it', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m open to meeting people and seeing what happens', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m cautious but willing to try', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I\'m skeptical, relationships are complicated', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I avoid dating, it\'s too risky', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value === 'single' || !value
        }
      },
      {
        id: 'romance_backup_6',
        category: 'romance',
        text: 'How do you maintain intimacy in your relationship?',
        options: [
          { text: 'I prioritize quality time and deep connection', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I make effort to stay connected and present', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I try but life gets busy', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I struggle to maintain intimacy', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I don\'t know how to be intimate', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value !== 'single' && value
        }
      },
      {
        id: 'romance_backup_7',
        category: 'romance',
        text: 'How do you feel about being single?',
        options: [
          { text: 'I love my independence and freedom', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'m content and open to what comes', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'It\'s okay, I\'m working on myself', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I\'m lonely but trying to stay positive', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I hate being single, it\'s miserable', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value === 'single' || !value
        }
      },
      {
        id: 'romance_backup_8',
        category: 'romance',
        text: 'You imagine introducing a new partner to your family. How do you feel?',
        options: [
          { text: 'Excited, they\'ll love them', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Confident, it\'ll be fine', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Nervous but hopeful', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious, my family is judgmental', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Dreading it, they\'ll ruin it', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ],
        conditionalLogic: {
          field: 'relationship_status',
          condition: (value) => value === 'single' || !value
        }
      }
    ]
  },

  // ============================================================================
  // 👥 SOCIAL & FRIENDS
  // ============================================================================
  {
    category: 'social',
    title: 'Social / Friends',
    description: 'Social connections and friendships',
    icon: '👥',
    questions: [
      {
        id: 'social_1',
        category: 'social',
        text: 'You\'re invited to a party where you don\'t know many people. What\'s your gut feeling?',
        options: [
          { text: 'Excited, I love meeting new people', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Open to it, could be fun', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I\'ll go but stick with who I know', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious, I\'d rather not', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I immediately look for an excuse to decline', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_2',
        category: 'social',
        text: 'A friend cancels plans last minute. What\'s your honest reaction?',
        options: [
          { text: '"No worries!" (genuinely unbothered)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Disappointed but understanding', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Annoyed but I let it go', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hurt, they don\'t value me', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Furious, they always do this', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_3',
        category: 'social',
        text: 'You haven\'t heard from a friend in months. What do you think?',
        options: [
          { text: '"I\'ll reach out!" (no story)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"They\'re busy, life happens"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Guess we\'re drifting apart"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"They don\'t care about me anymore"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"I must have done something wrong"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_4',
        category: 'social',
        text: 'A friend succeeds at something you\'ve been working toward. How do you feel?',
        options: [
          { text: 'Genuinely excited for them', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Happy, inspired by their win', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, good for them', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Envious, comparing myself', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Bitter, "It\'s not fair"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_5',
        category: 'social',
        text: 'You share something vulnerable with a friend. What\'s your internal state?',
        options: [
          { text: 'Safe, I trust them completely', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Comfortable, they\'ll understand', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Nervous but I do it anyway', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Scared they\'ll judge me', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I don\'t share, it\'s not safe', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_6',
        category: 'social',
        text: 'Someone new wants to be your friend. What\'s your first thought?',
        options: [
          { text: '"Great! I\'m open to new connections"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Let\'s see where this goes"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Cautiously optimistic', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"What do they want from me?"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Suspicious, I keep distance', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'social_7',
        category: 'social',
        text: 'You\'re at a social event. Where are you?',
        options: [
          { text: 'Working the room, meeting everyone', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Talking to a few people, enjoying myself', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Sticking with one or two people I know', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'On my phone, waiting to leave', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I didn\'t go, made an excuse', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 💼 BUSINESS & CAREER
  // ============================================================================
  {
    category: 'business',
    title: 'Business / Career',
    description: 'Work and career aspirations',
    icon: '💼',
    questions: [
      {
        id: 'career_1',
        category: 'business',
        text: 'Sunday night. Tomorrow is Monday. What do you feel?',
        options: [
          { text: 'Excited for the week ahead', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, ready to go', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slight resistance but manageable', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Dread, the weekend went too fast', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Anxiety, I can\'t sleep', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_2',
        category: 'business',
        text: 'You get an email from your boss. What\'s your immediate reaction?',
        options: [
          { text: 'Curious, neutral', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Fine, just another email', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slight tension before opening', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious, "What did I do?"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Panic, my stomach drops', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_3',
        category: 'business',
        text: 'Someone at work gets promoted. What\'s your honest feeling?',
        options: [
          { text: 'Happy for them, inspired', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Good for them, no charge', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, doesn\'t affect me', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Jealous, I deserved it more', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Resentful, bitter', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_4',
        category: 'business',
        text: 'You\'re asked to take on a new project. What happens?',
        options: [
          { text: 'Excited, I love new challenges', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Interested, let me hear more', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Cautious, is this more work?', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Overwhelmed, I\'m already drowning', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Resentful, they always dump on me', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_5',
        category: 'business',
        text: 'You make a mistake at work. What\'s your internal response?',
        options: [
          { text: '"Okay, how do I fix this?"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Briefly frustrated, then move forward', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Embarrassed but I address it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Ashamed, I replay it obsessively', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Devastated, I\'m a failure', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_6',
        category: 'business',
        text: 'You imagine quitting your job. What do you feel?',
        options: [
          { text: 'Empowered, I could do it anytime', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Curious, exploring options', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'It\'s a nice fantasy', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Terrified, I\'m trapped', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Hopeless, I\'ll never escape', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'career_7',
        category: 'business',
        text: 'Your work is praised publicly. What happens?',
        options: [
          { text: 'Proud, I own it', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Grateful, feels good', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Uncomfortable but I accept it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Embarrassed, I deflect', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Suspicious, they want something', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 🎉 FUN & RECREATION
  // ============================================================================
  {
    category: 'fun',
    title: 'Fun / Recreation',
    description: 'Hobbies and joyful activities',
    icon: '🎉',
    questions: [
      {
        id: 'fun_1',
        category: 'fun',
        text: 'It\'s Friday at 5pm. What\'s your dominant feeling?',
        options: [
          { text: 'Excited, the weekend is here!', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Relieved, time to recharge', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, just another transition', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Exhausted, I need to recover', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Numb, I have no energy for fun', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_2',
        category: 'fun',
        text: 'Someone suggests a spontaneous adventure. What\'s your gut response?',
        options: [
          { text: '"Let\'s go!" (immediately yes)', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Why not? Sounds fun"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Let me check my schedule"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"I can\'t, I have things to do"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Anxious, I need to plan everything', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_3',
        category: 'fun',
        text: 'You\'re doing something fun. What\'s happening internally?',
        options: [
          { text: 'Fully present, enjoying every moment', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Relaxed, having a good time', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Distracted by work/responsibilities', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Guilty for "wasting time"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Can\'t relax, constantly checking phone', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_4',
        category: 'fun',
        text: 'How often do you laugh—really laugh—in a week?',
        options: [
          { text: 'Daily, multiple times', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Several times a week', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Once or twice a week', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Rarely, can\'t remember last time', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Almost never, nothing\'s funny', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_5',
        category: 'fun',
        text: 'Someone asks "What do you do for fun?" What\'s your honest answer?',
        options: [
          { text: 'I immediately have 3+ things to share', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I have a few hobbies/activities', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Uh... watch TV?"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I struggle to answer', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"I don\'t really have time for fun"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_6',
        category: 'fun',
        text: 'You have a completely free day. No obligations. What do you feel?',
        options: [
          { text: 'Excited, so many options!', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Relaxed, I\'ll enjoy it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Lost, I don\'t know what to do', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious, I should be productive', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Guilty, I\'m wasting the day', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'fun_7',
        category: 'fun',
        text: 'You try something new and you suck at it. What happens?',
        options: [
          { text: 'Laugh, keep trying, it\'s fun', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"I\'ll get better with practice"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Frustrated but I continue', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Embarrassed, I quit', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Humiliated, I never try again', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // ✈️ TRAVEL & ADVENTURE
  // ============================================================================
  {
    category: 'travel',
    title: 'Travel / Adventure',
    description: 'Places to explore and adventures',
    icon: '✈️',
    questions: [
      {
        id: 'travel_1',
        category: 'travel',
        text: 'Someone shows you photos from an amazing trip. What\'s your immediate thought?',
        options: [
          { text: '"I\'m going there!"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"That looks incredible, adding to my list"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Must be nice" (neutral)', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"I could never afford that"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"Must be nice to have time/money for that" (bitter)', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_2',
        category: 'travel',
        text: 'You\'re planning a trip. What\'s your dominant feeling?',
        options: [
          { text: 'Excitement, counting down days', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Happy anticipation', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Logistics stress but looking forward to it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious about everything that could go wrong', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Overwhelmed, I\'d rather stay home', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_3',
        category: 'travel',
        text: 'You\'re lost in a foreign place. What happens?',
        options: [
          { text: '"This is part of the adventure!"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly inconvenient but I figure it out', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Frustrated but I manage', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Stressed, I need to fix this now', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Panic, this is a disaster', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_4',
        category: 'travel',
        text: 'Someone suggests going somewhere you\'ve never been. What\'s your reaction?',
        options: [
          { text: '"Yes! When do we leave?"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Interested, let me hear more', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Maybe, depends on details', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hesitant, I prefer familiar places', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'No way, too risky', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_5',
        category: 'travel',
        text: 'Your travel plans fall through last minute. How do you feel?',
        options: [
          { text: '"Adventure! What\'s plan B?"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Disappointed but adaptable', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Annoyed, scrambling to adjust', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Stressed, everything\'s ruined', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Devastated, can\'t handle the change', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_6',
        category: 'travel',
        text: 'You imagine yourself living in another country. What do you feel?',
        options: [
          { text: 'Thrilled, I\'d do it tomorrow', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Curious, I\'d seriously consider it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Interesting idea but unlikely', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Terrifying, too much change', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Impossible, I\'m stuck here', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'travel_7',
        category: 'travel',
        text: 'You\'re on vacation. What\'s your style?',
        options: [
          { text: 'Spontaneous, going with the flow', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Loose plan, open to changes', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Everything scheduled, no surprises', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious if things aren\'t planned', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I work even on vacation', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 🏠 HOME & ENVIRONMENT
  // ============================================================================
  {
    category: 'home',
    title: 'Home / Environment',
    description: 'Living space and environment',
    icon: '🏠',
    questions: [
      {
        id: 'home_1',
        category: 'home',
        text: 'Someone drops by your place unannounced. What\'s your immediate feeling?',
        options: [
          { text: '"Come in! Let me give you a tour!"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"No problem, welcome"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly uncomfortable but I let them in', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Mortified, I make excuses', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I don\'t answer the door', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_2',
        category: 'home',
        text: 'You walk into your home after being away. What do you feel?',
        options: [
          { text: 'Relief, peace, "I\'m home"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Comfortable, content', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, it\'s just my place', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Disappointed by what I see', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Depressed or trapped', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_3',
        category: 'home',
        text: 'You see a house/apartment you\'d love to live in. What\'s your thought?',
        options: [
          { text: '"That\'s mine, just a matter of time"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"Someday I\'ll have something like that"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Must be nice"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"I\'ll never afford that"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"People like me don\'t get to live there"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_4',
        category: 'home',
        text: 'Someone compliments your space. What do you feel?',
        options: [
          { text: 'Proud, "Thanks! I love it too"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Grateful for the acknowledgment', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Awkward, I deflect', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"It\'s not that great"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'They\'re lying or being polite', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_5',
        category: 'home',
        text: 'You need to clean/organize your space. What happens?',
        options: [
          { text: 'I do it immediately, it feels good', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I schedule it and follow through', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I procrastinate but eventually do it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I avoid it until I can\'t anymore', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Overwhelming, I shut down', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_6',
        category: 'home',
        text: 'You\'re at someone\'s home that\'s way nicer than yours. How do you feel?',
        options: [
          { text: 'Inspired, "This is possible for me"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Happy for them, I enjoy being there', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, just different', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Envious, inadequate', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Resentful, "It\'s not fair"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'home_7',
        category: 'home',
        text: 'You think about moving to a new place. What\'s your dominant feeling?',
        options: [
          { text: 'Excited, open to possibility', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Curious, exploring options', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Indifferent, I\'m fine where I am', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Anxious, overwhelmed by logistics', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Trapped, I can\'t afford to move', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 📦 POSSESSIONS & STUFF
  // ============================================================================
  {
    category: 'possessions',
    title: 'Possessions / Stuff',
    description: 'Material belongings and things',
    icon: '📦',
    questions: [
      {
        id: 'possessions_1',
        category: 'possessions',
        text: 'You see someone with something you want (watch, car, gadget). What\'s your immediate thought?',
        options: [
          { text: '"I\'ll have that soon"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"That\'s cool, good for them"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, just an observation', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Must be nice to afford that" (resentful)', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"They\'re showing off / don\'t deserve it"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_2',
        category: 'possessions',
        text: 'You want to buy something nice for yourself. What happens?',
        options: [
          { text: 'I buy it, I deserve nice things', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'I consider it, then decide without guilt', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'I debate for days, then maybe buy it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'I talk myself out of it', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Guilt overwhelms me, I never buy it', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_3',
        category: 'possessions',
        text: 'Someone asks where you got something you own. What do you feel?',
        options: [
          { text: 'Proud, happy to share', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, I tell them', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly uncomfortable', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Embarrassed it\'s not expensive enough', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Defensive, I lie about the price', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_4',
        category: 'possessions',
        text: 'You look at your closet/garage/storage. What\'s your dominant feeling?',
        options: [
          { text: 'Satisfied, I love what I have', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Content, it\'s enough', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, just stuff', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Disappointed, wishing for more/better', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Ashamed of what I don\'t have', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_5',
        category: 'possessions',
        text: 'Something you own breaks or gets damaged. What happens?',
        options: [
          { text: '"No big deal, I\'ll replace it"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly annoyed but I handle it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Frustrated, this is inconvenient', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Upset, I can\'t afford to replace it', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Devastated, nothing good lasts for me', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_6',
        category: 'possessions',
        text: 'You imagine your ideal lifestyle. What do you feel?',
        options: [
          { text: 'Excited, it\'s already unfolding', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Hopeful, I\'m working toward it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Wistful, maybe someday', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Sad, feels out of reach', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Hopeless, I\'ll never have that', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'possessions_7',
        category: 'possessions',
        text: 'Someone criticizes how you spend your money. What\'s your reaction?',
        options: [
          { text: 'Unbothered, my money my choice', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Confident, I explain my reasoning', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Defensive but I stand my ground', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hurt, maybe they\'re right', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Ashamed, I hide future purchases', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // 🎁 GIVING & LEGACY
  // ============================================================================
  {
    category: 'giving',
    title: 'Giving / Legacy',
    description: 'Contribution and legacy',
    icon: '🎁',
    questions: [
      {
        id: 'giving_1',
        category: 'giving',
        text: 'Someone asks you to donate or volunteer. What\'s your immediate feeling?',
        options: [
          { text: 'Happy to contribute, tell me more', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Open to it, I\'ll consider', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Hesitant, depends on the cause', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Guilty, I should but I can\'t', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Resentful, leave me alone', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_2',
        category: 'giving',
        text: 'You help someone and they don\'t thank you. What happens?',
        options: [
          { text: 'Unbothered, I gave freely', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Neutral, gratitude wasn\'t why I helped', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Slightly disappointed', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Hurt, they\'re ungrateful', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Furious, I\'ll never help again', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_3',
        category: 'giving',
        text: 'You think about the impact you\'re making in the world. What comes up?',
        options: [
          { text: 'Proud, I\'m making a difference', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Positive, I\'m contributing', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Uncertain, am I doing enough?', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Guilty, I\'m not doing anything', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Hopeless, nothing I do matters', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_4',
        category: 'giving',
        text: 'Someone less fortunate asks you for help. What\'s your honest reaction?',
        options: [
          { text: 'Compassionate, how can I help?', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Empathetic, I do what I can', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Uncomfortable but I might help', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Suspicious of their motives', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Judgmental, it\'s their own fault', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_5',
        category: 'giving',
        text: 'You imagine being remembered after you\'re gone. What do you feel?',
        options: [
          { text: 'Confident I\'ll leave a positive legacy', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Hopeful I\'m building something meaningful', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Uncertain what my legacy will be', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Worried I won\'t matter', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I\'ll be forgotten, nothing I do matters', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_6',
        category: 'giving',
        text: 'Someone you helped succeeds because of your support. How do you feel?',
        options: [
          { text: 'Fulfilled, this is why I give', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Happy, I\'m glad I could help', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Pleased, that worked out', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'They didn\'t acknowledge my help', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Resentful, now they\'re ahead of me', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'giving_7',
        category: 'giving',
        text: 'You have an opportunity to mentor/guide someone. What\'s your reaction?',
        options: [
          { text: 'Honored, I\'d love to', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Excited to share what I know', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Willing but hesitant about time', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Inadequate, I don\'t know enough', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Why would anyone want my guidance?', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  },

  // ============================================================================
  // ✨ SPIRITUALITY & GROWTH
  // ============================================================================
  {
    category: 'spirituality',
    title: 'Spirituality',
    description: 'Spiritual growth and expansion',
    icon: '✨',
    questions: [
      {
        id: 'spirituality_1',
        category: 'spirituality',
        text: 'You experience a difficult challenge. How do you frame it?',
        options: [
          { text: '"This is happening FOR me, not TO me"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"There\'s a lesson here"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"This sucks but I\'ll get through it"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Why is this happening to me?"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"I\'m cursed, nothing ever works out"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_2',
        category: 'spirituality',
        text: 'Someone mentions meditation, prayer, or spiritual practice. What\'s your reaction?',
        options: [
          { text: 'Resonates deeply, I practice regularly', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Interested, I\'m exploring it', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Open but haven\'t started', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Skeptical, not for me', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Dismissive, it\'s nonsense', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_3',
        category: 'spirituality',
        text: 'You think about your purpose in life. What do you feel?',
        options: [
          { text: 'Clear, I know why I\'m here', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Aligned, it\'s revealing itself', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Curious, still figuring it out', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Lost, I have no idea', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Empty, maybe there is no purpose', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_4',
        category: 'spirituality',
        text: 'Something "coincidental" or synchronistic happens. What\'s your thought?',
        options: [
          { text: '"The universe is communicating with me"', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: '"That\'s interesting, I\'m paying attention"', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: '"Weird coincidence"', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: '"Just random chance"', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'I don\'t notice these things', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_5',
        category: 'spirituality',
        text: 'You\'re offered a book/course on personal growth. What happens?',
        options: [
          { text: 'Excited, I consume it immediately', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Interested, I check it out', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Maybe later, not right now', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Skeptical, probably won\'t work', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: '"I\'m beyond help" or "That\'s for other people"', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_6',
        category: 'spirituality',
        text: 'You reflect on who you were 5 years ago. What do you feel?',
        options: [
          { text: 'Grateful for how far I\'ve come', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Proud of my growth', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Some growth, still working on it', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Disappointed, not much has changed', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'Regretful, I\'ve gone backwards', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      },
      {
        id: 'spirituality_7',
        category: 'spirituality',
        text: 'You\'re asked "Do you believe in something greater than yourself?" What\'s your answer?',
        options: [
          { text: 'Absolutely, I feel connected', value: 10, emoji: '🟢', greenLine: 'above' },
          { text: 'Yes, I\'m exploring what that means', value: 8, emoji: '🟢', greenLine: 'above' },
          { text: 'Unsure, maybe', value: 6, emoji: '⚪', greenLine: 'neutral' },
          { text: 'Probably not', value: 4, emoji: '🔴', greenLine: 'below' },
          { text: 'No, this is all there is', value: 2, emoji: '🔴', greenLine: 'below' },
          { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
        ]
      }
    ]
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get questions for a specific category
 */
export function getQuestionsForCategory(category: AssessmentCategory): AssessmentQuestion[] {
  const categoryData = ASSESSMENT_QUESTIONS.find(c => c.category === category)
  return categoryData?.questions || []
}

/**
 * Get all categories
 */
export function getAllCategories(): CategoryQuestions[] {
  return ASSESSMENT_QUESTIONS
}

/**
 * Filter questions based on conditional logic using profile data
 */
export function filterQuestionsByProfile(
  questions: AssessmentQuestion[],
  profile: any
): AssessmentQuestion[] {
  return questions.filter(question => {
    if (!question.conditionalLogic) return true
    const { field, condition } = question.conditionalLogic
    const profileValue = profile[field]
    return condition(profileValue)
  })
}

/**
 * Get total number of questions (without conditionals applied)
 */
export function getTotalQuestionCount(): number {
  return ASSESSMENT_QUESTIONS.reduce((total, category) => {
    return total + category.questions.length
  }, 0)
}

/**
 * Calculate category score from responses
 */
export function calculateCategoryScore(responses: { value: number }[]): number {
  return responses.reduce((sum, response) => sum + response.value, 0)
}

/**
 * Determine if score is above, below, or in transition on the Green Line
 */
export function getGreenLineStatus(score: number): 'above' | 'transition' | 'below' {
  const percentage = (score / 70) * 100
  if (percentage >= 80) return 'above' // 56-70 points
  if (percentage >= 60) return 'transition' // 42-55 points
  return 'below' // 14-41 points
}

/**
 * Get category by ID
 */
export function getCategoryById(category: AssessmentCategory): CategoryQuestions | undefined {
  return ASSESSMENT_QUESTIONS.find(c => c.category === category)
}

/**
 * Get question by ID across all categories
 */
export function getQuestionById(questionId: string): AssessmentQuestion | undefined {
  for (const category of ASSESSMENT_QUESTIONS) {
    const question = category.questions.find(q => q.id === questionId)
    if (question) return question
  }
  return undefined
}

/**
 * Validate that all questions have been answered for a category
 */
export function isCategoryComplete(
  category: AssessmentCategory,
  responses: Map<string, number>,
  profile: any
): boolean {
  const questions = getQuestionsForCategory(category)
  const filteredQuestions = filterQuestionsByProfile(questions, profile)
  return filteredQuestions.every(question => responses.has(question.id))
}

/**
 * Calculate overall assessment progress
 */
export function calculateProgress(
  responses: Map<string, number>,
  profile: any
): { completed: number; total: number; percentage: number } {
  let totalQuestions = 0
  let answeredQuestions = 0

  for (const category of ASSESSMENT_QUESTIONS) {
    const filteredQuestions = filterQuestionsByProfile(category.questions, profile)
    totalQuestions += filteredQuestions.length
    answeredQuestions += filteredQuestions.filter(q => responses.has(q.id)).length
  }

  return {
    completed: answeredQuestions,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default ASSESSMENT_QUESTIONS