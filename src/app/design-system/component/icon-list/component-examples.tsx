import { IconList } from '@/lib/design-system/components'

export const IconListExamples = {
  basicStringArray: {
    title: '1. Basic String Array',
    description: 'Simple list of strings with default styling (primary-500 bullets, neutral-300 text)',
    component: (
      <IconList items={[
        'What does my body look and feel like at its best?',
        'How does my body move and perform through daily life?',
        'What does it feel like to have boundless energy?',
        'Describe my ideal nutrition and relationship with food'
      ]} />
    ),
    code: `<IconList items={[
  'What does my body look and feel like at its best?',
  'How does my body move and perform through daily life?',
  'What does it feel like to have boundless energy?',
  'Describe my ideal nutrition and relationship with food'
]} />`
  },

  customColors: {
    title: '2. Custom Colors',
    description: 'FAQ-style list with green bullets and white text',
    component: (
      <IconList 
        items={[
          'When does billing start?',
          'Can I switch or cancel my membership?',
          'What happens after 8 weeks?',
          'What if I want to upgrade before the 8 weeks are up?'
        ]}
        bulletColor="text-[#39FF14]"
        textColor="text-white"
        spacing="normal"
      />
    ),
    code: `<IconList 
  items={[
    'When does billing start?',
    'Can I switch or cancel my membership?',
    'What happens after 8 weeks?',
    'What if I want to upgrade before the 8 weeks are up?'
  ]}
  bulletColor="text-[#39FF14]"
  textColor="text-white"
  spacing="normal"
/>`
  },

  tightSpacing: {
    title: '3. Tight Spacing',
    description: 'Compact list with minimal spacing between items',
    component: (
      <IconList 
        items={[
          'Speed and efficiency',
          'Clean, maintainable code',
          'Perfect alignment',
          'Flexible customization'
        ]}
        spacing="tight"
        bulletColor="text-secondary-500"
      />
    ),
    code: `<IconList 
  items={[
    'Speed and efficiency',
    'Clean, maintainable code',
    'Perfect alignment',
    'Flexible customization'
  ]}
  spacing="tight"
  bulletColor="text-secondary-500"
/>`
  },

  relaxedSpacing: {
    title: '4. Relaxed Spacing',
    description: 'Generous spacing for feature lists or benefits',
    component: (
      <IconList 
        items={[
          'Complete life vision creation in 12 categories',
          'AI-powered clarity from contrast transformation',
          'Personalized audio and visual experiences',
          'Comprehensive progress tracking'
        ]}
        spacing="relaxed"
        bulletColor="text-accent-500"
      />
    ),
    code: `<IconList 
  items={[
    'Complete life vision creation in 12 categories',
    'AI-powered clarity from contrast transformation',
    'Personalized audio and visual experiences',
    'Comprehensive progress tracking'
  ]}
  spacing="relaxed"
  bulletColor="text-accent-500"
/>`
  },

  multilineText: {
    title: '5. Multi-line Text Alignment',
    description: 'Long text that wraps maintains perfect alignment',
    component: (
      <IconList 
        items={[
          'This is a longer text item that will wrap to multiple lines, and you can see how the bullet stays perfectly aligned at the top while the text wraps naturally below.',
          'Another long item demonstrating perfect vertical alignment even when text spans multiple lines. The line-height matching ensures the bullet aligns with the first line.',
          'Short item',
          'And another very long item that clearly shows how the component handles multi-line content with grace and precision, maintaining perfect alignment throughout.'
        ]}
      />
    ),
    code: `<IconList 
  items={[
    'This is a longer text item that will wrap to multiple lines...',
    'Another long item demonstrating perfect vertical alignment...',
    'Short item',
    'And another very long item that clearly shows...'
  ]}
/>`
  },

  objectArray: {
    title: '6. Object Array with IDs',
    description: 'Using object array for unique keys (useful for dynamic lists)',
    component: (
      <IconList 
        items={[
          { id: 'q1', text: 'When does the 72-hour guarantee start?' },
          { id: 'q2', text: 'What qualifies for the activation guarantee?' },
          { id: 'q3', text: 'How do I track my progress?' },
          { id: 'q4', text: 'Can I add more tokens anytime?' }
        ]}
        bulletColor="text-[#FFB701]"
      />
    ),
    code: `<IconList 
  items={[
    { id: 'q1', text: 'When does the 72-hour guarantee start?' },
    { id: 'q2', text: 'What qualifies for the activation guarantee?' },
    { id: 'q3', text: 'How do I track my progress?' },
    { id: 'q4', text: 'Can I add more tokens anytime?' }
  ]}
  bulletColor="text-[#FFB701]"
/>`
  }
}




