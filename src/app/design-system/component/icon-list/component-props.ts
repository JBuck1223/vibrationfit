export const componentProps = {
  name: 'IconList',
  description: 'Perfect bullet-aligned list with consistent line heights and customizable colors. Uses matching line-height on bullet and text for pixel-perfect vertical alignment.',
  props: [
    {
      name: 'items',
      type: 'IconListItem[] | string[]',
      optional: false,
      description: 'Array of items to display. Can be strings or objects with {text, id} structure'
    },
    {
      name: 'bulletColor',
      type: 'string',
      optional: true,
      description: 'Tailwind color class for bullet. Default: "text-primary-500"'
    },
    {
      name: 'textColor',
      type: 'string',
      optional: true,
      description: 'Tailwind color class for text. Default: "text-neutral-300"'
    },
    {
      name: 'spacing',
      type: '"tight" | "normal" | "relaxed"',
      optional: true,
      description: 'Vertical spacing between items. tight=8px, normal=12px, relaxed=16px. Default: "normal"'
    },
    {
      name: 'className',
      type: 'string',
      optional: true,
      description: 'Additional CSS classes to apply to the list container'
    }
  ],
  usage: `import { IconList } from '@/lib/design-system/components'

// Simple string array
<IconList items={[
  'What does my body look and feel like at its best?',
  'How does my body move and perform through daily life?',
  'What does it feel like to have boundless energy?'
]} />

// With custom colors
<IconList 
  items={faqQuestions}
  bulletColor="text-[#39FF14]"
  textColor="text-white"
  spacing="relaxed"
/>

// With object array (for unique keys)
<IconList items={[
  { id: 'q1', text: 'When does billing start?' },
  { id: 'q2', text: 'Can I cancel anytime?' }
]} />`,
  notes: [
    'Perfect vertical alignment using matching line-height (leading-[1.75rem]) on bullet and text',
    'No margin hacks or position adjustments needed - clean flexbox architecture',
    'Bullet is text-lg font-bold for visual prominence and balance',
    'flex-shrink-0 on bullet prevents compression when text wraps',
    'Works with any content length - multi-line text stays properly aligned',
    'Three spacing presets: tight (space-y-2), normal (space-y-3), relaxed (space-y-4)',
    'Accepts both string arrays and object arrays for flexibility',
    'Used for inspiration questions, FAQ items, feature lists, and benefit lists'
  ],
  examples: [
    '/life-vision/new/category/[key]/imagination/page.tsx - Inspiration questions',
    '/page.tsx - FAQ section bullets (pricing)',
    'Design system - Perfect for any bulleted list that needs pixel-perfect alignment'
  ]
}




