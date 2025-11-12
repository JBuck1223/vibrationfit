#!/usr/bin/env python3
"""
Build comprehensive conditional questions system for VibrationFit Assessment
"""

def create_questions_file():
    """Create the complete questions.ts file with conditional logic"""
    
    # Start building the TypeScript file content
    ts_content = '''export interface QuestionOption {
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

export const assessmentQuestions: AssessmentQuestion[] = [
'''

    # Define all questions with conditional logic
    questions = []
    
    # MONEY/WEALTH QUESTIONS (7 questions - no conditionals)
    money_questions = [
        {
            'id': 'money_1',
            'category': 'money',
            'text': 'You open your banking app. What happens in your body?',
            'options': [
                {'text': 'I feel calm, curious to see the balance', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Neutral, just checking numbers', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I hesitate for a second before opening it', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'My stomach tightens', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I avoid it entirely unless I absolutely have to', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_2',
            'category': 'money',
            'text': 'Someone asks "How much do you make?" What\'s your honest reaction?',
            'options': [
                {'text': 'I share openly, no shame', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I\'m comfortable sharing with close people', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I deflect or give a vague answer', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I feel uncomfortable or defensive', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I lie or exaggerate', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_3',
            'category': 'money',
            'text': 'You see someone driving a car you\'d love to own. What thought comes first?',
            'options': [
                {'text': '"That\'s coming for me too"', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': '"Good for them, that\'s awesome"', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': '"Nice car" (no emotional charge)', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': '"Must be nice..." (with a twinge of resentment)', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': '"They probably inherited it / got lucky / married rich"', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_4',
            'category': 'money',
            'text': 'You want to buy something that costs more than usual. What do you do?',
            'options': [
                {'text': 'Buy it immediately if I want it', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Consider it briefly, then decide yes/no', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Sleep on it, budget for it', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Talk myself out of it', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Feel guilty even thinking about it', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_5',
            'category': 'money',
            'text': 'Money shows up unexpectedly (refund, gift, bonus). Your first thought is:',
            'options': [
                {'text': '"Hell yes, more abundance coming!"', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': '"This is awesome, what do I want to do with it?"', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': '"Cool, I\'ll save/invest it"', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': '"Better save this for the next emergency"', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': '"It won\'t last" or "What\'s the catch?"', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_6',
            'category': 'money',
            'text': 'Someone owes you money and doesn\'t pay you back. How do you feel?',
            'options': [
                {'text': 'Unbothered, money flows easily to me', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I bring it up directly without anger', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Annoyed but I let it go', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Betrayed, I trusted them', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Furious, they took advantage of me', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        },
        {
            'id': 'money_7',
            'category': 'money',
            'text': 'You\'re at dinner with friends. The bill comes. What happens internally?',
            'options': [
                {'text': 'I happily pay for everyone', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I\'m fine with splitting evenly', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I calculate exactly what I owe', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I hope someone else grabs it', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I feel anxious about the amount', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ]
        }
    ]
    
    # FAMILY QUESTIONS - Conditional based on children
    # Non-parents (7 questions)
    family_non_parents = [
        {
            'id': 'family_non_parents_1',
            'category': 'family',
            'text': 'Your phone rings. It\'s a family member. What\'s your gut reaction?',
            'options': [
                {'text': 'Happy, I want to answer', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Neutral, I\'ll take the call', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Depends on who it is', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Slight dread, "What do they want?"', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I let it go to voicemail', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_2',
            'category': 'family',
            'text': 'Family gathering coming up. How do you feel about it?',
            'options': [
                {'text': 'Excited, can\'t wait', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Looking forward to it', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'It\'s fine, I\'ll go', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Obligated, already dreading it', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Anxious, considering excuses to skip', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_3',
            'category': 'family',
            'text': 'A family member asks for your help (money, time, favor). What\'s your immediate feeling?',
            'options': [
                {'text': 'Happy to help, no hesitation', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Willing, I\'ll figure it out', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I\'ll do it but it\'s inconvenient', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Resentful, they always ask me', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Angry, I feel used', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_4',
            'category': 'family',
            'text': 'Your family criticizes a decision you made. What happens?',
            'options': [
                {'text': 'I listen, take what\'s useful, let go of the rest', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Slightly annoyed but I\'m confident in my choice', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Defensive but I hear them out', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Hurt, they don\'t support me', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Furious or devastated', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_5',
            'category': 'family',
            'text': 'You think about your childhood. What\'s the dominant feeling?',
            'options': [
                {'text': 'Grateful, good memories', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Mixed but mostly positive', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Neutral, it was what it was', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Painful, lots of wounds', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Traumatic, I avoid thinking about it', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_6',
            'category': 'family',
            'text': 'A family member succeeds at something big. What\'s your honest reaction?',
            'options': [
                {'text': 'Genuinely thrilled for them', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Happy, I celebrate with them', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': '"That\'s nice" (no strong feeling)', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Envious or compared to my life', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Bitter, "Why not me?"', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        },
        {
            'id': 'family_non_parents_7',
            'category': 'family',
            'text': 'You think about your family\'s influence on your life. What comes up?',
            'options': [
                {'text': 'Grateful for their support and guidance', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'They\'ve shaped me in positive ways', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Mixed feelings, some good some challenging', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'They\'ve held me back in some ways', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I need to break free from their influence', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => !value'
            }
        }
    ]
    
    # Parents with young children (1-9 years old) - 7 questions
    family_parents_young = [
        {
            'id': 'family_parents_young_1',
            'category': 'family',
            'text': 'Your child comes to you upset about something. What\'s your immediate response?',
            'options': [
                {'text': 'I listen fully and help them process their feelings', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I comfort them and ask what they need', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I try to fix the problem quickly', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I feel overwhelmed and want to escape', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I get frustrated and tell them to toughen up', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_2',
            'category': 'family',
            'text': 'You have to discipline your child. How do you approach it?',
            'options': [
                {'text': 'I stay calm and explain the consequences', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I set clear boundaries with love', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I try to be fair but it\'s hard', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I feel guilty and inconsistent', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I lose my temper and regret it', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_3',
            'category': 'family',
            'text': 'You think about your child\'s future. What\'s your dominant feeling?',
            'options': [
                {'text': 'Excited about their potential', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Hopeful and optimistic', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Mixed feelings, some worry', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Anxious about the world they\'ll face', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Terrified I\'m not preparing them well', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_4',
            'category': 'family',
            'text': 'Your child achieves something significant. What\'s your reaction?',
            'options': [
                {'text': 'Proud and celebrating their growth', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Happy and encouraging', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Pleased but trying not to overreact', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'Relieved they\'re doing well', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'Worried about expectations', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_5',
            'category': 'family',
            'text': 'You have to balance work and parenting. How do you feel?',
            'options': [
                {'text': 'I\'ve found a rhythm that works', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'It\'s challenging but manageable', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Some days are better than others', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I feel pulled in too many directions', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I\'m constantly failing at both', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_6',
            'category': 'family',
            'text': 'Your child makes a mistake or gets in trouble. What happens?',
            'options': [
                {'text': 'I help them learn from it', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I stay calm and address it', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I feel disappointed but try to help', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I worry about what this means', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I feel like I\'ve failed as a parent', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        },
        {
            'id': 'family_parents_young_7',
            'category': 'family',
            'text': 'You think about your parenting style. How do you feel?',
            'options': [
                {'text': 'Confident in my approach', 'value': 5, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'Mostly good with room to grow', 'value': 4, 'emoji': '🟢', 'greenLine': 'above'},
                {'text': 'I\'m figuring it out as I go', 'value': 3, 'emoji': '⚪', 'greenLine': 'neutral'},
                {'text': 'I doubt myself a lot', 'value': 2, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'I feel like I\'m doing it wrong', 'value': 1, 'emoji': '🔴', 'greenLine': 'below'},
                {'text': 'None of these specifically resonate', 'value': 0, 'emoji': '🤔', 'greenLine': 'neutral', 'isCustom': True}
            ],
            'conditionalLogic': {
                'field': 'has_children',
                'condition': '(value) => value === true'
            }
        }
    ]
    
    # Add all questions to the main list
    questions.extend(money_questions)
    questions.extend(family_non_parents)
    questions.extend(family_parents_young)
    
    # Convert questions to TypeScript format
    for i, question in enumerate(questions):
        ts_content += f'''  {{
    id: '{question['id']}',
    category: '{question['category']}',
    text: '{question['text']}',
    options: [
'''
        
        for option in question['options']:
            ts_content += f'''      {{
        text: '{option['text']}',
        value: {option['value']},
        emoji: '{option['emoji']}',
        greenLine: '{option['greenLine']}'{', isCustom: true' if option.get('isCustom') else ''}
      }},
'''
        
        ts_content += '    ]'
        
        if 'conditionalLogic' in question:
            ts_content += f''',
    conditionalLogic: {{
      field: '{question['conditionalLogic']['field']}',
      condition: {question['conditionalLogic']['condition']}
    }}'''
        
        ts_content += '\n  }'
        
        if i < len(questions) - 1:
            ts_content += ','
        ts_content += '\n'
    
    # Close the array and export
    ts_content += ''']

export default assessmentQuestions
'''
    
    return ts_content

if __name__ == '__main__':
    content = create_questions_file()
    print(f'Generated questions file with {content.count("id:")} questions')
    print('Categories included: money, family (conditional)')
