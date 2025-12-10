export const componentProps = {
  name: 'CategoryGrid',
  description: 'Responsive grid for displaying category cards with three distinct modes: selection (default filtering), completion (progress tracking), and draft (change highlighting). Used across life-vision, profile, journal, and vision-board features.',
  props: [
    {
      name: 'categories',
      type: 'VisionCategory[]',
      optional: false,
      description: 'Array of category objects with key, label, and icon properties. Can use VISION_CATEGORIES or create custom arrays (e.g., add "Personal" and "Media" for profile pages)'
    },
    {
      name: 'selectedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of selected category keys (highlights with green border/background)'
    },
    {
      name: 'completedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of completed category keys (only used in "completion" mode)'
    },
    {
      name: 'refinedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of refined/changed category keys (only used in "draft" mode)'
    },
    {
      name: 'onCategoryClick',
      type: '(categoryKey: string) => void',
      optional: true,
      description: 'Callback when a category card is clicked'
    },
    {
      name: 'layout',
      type: '"14-column" | "12-column"',
      optional: true,
      description: '14-column = all categories (including forward/conclusion), 12-column = exclude forward/conclusion. Default: "14-column"'
    },
    {
      name: 'mode',
      type: '"selection" | "completion" | "draft"',
      optional: true,
      description: 'Determines badge behavior: selection = no badges, completion = green checkmarks for completed, draft = yellow checkmarks for changed. Default: "selection"'
    },
    {
      name: 'variant',
      type: '"default" | "elevated" | "outlined"',
      optional: true,
      description: 'Visual style of category cards. Default: "outlined"'
    },
    {
      name: 'withCard',
      type: 'boolean',
      optional: true,
      description: 'Whether to wrap grid in a Card component. Default: true'
    },
    {
      name: 'showSelectAll',
      type: 'boolean',
      optional: true,
      description: 'Show "Select All / Deselect All" button above grid. Default: false'
    },
    {
      name: 'onSelectAll',
      type: '() => void',
      optional: true,
      description: 'Callback for Select All button (required if showSelectAll is true)'
    },
    {
      name: 'selectAllLabel',
      type: 'string',
      optional: true,
      description: 'Custom label for Select All button (auto-detects selected state by default)'
    },
    {
      name: 'completionBadgeColor',
      type: 'string',
      optional: true,
      description: 'Custom color for completion badges in "completion" mode. Default: "#39FF14" (green)'
    },
    {
      name: 'refinementBadgeColor',
      type: 'string',
      optional: true,
      description: 'Custom color for refinement badges in "draft" mode. Default: "#FFFF00" (yellow)'
    }
  ],
  usage: `import { CategoryGrid } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { User, Camera } from 'lucide-react'

// Standard usage with VISION_CATEGORIES
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selectedCategories}
  onCategoryClick={handleToggle}
  mode="selection"
/>

// Custom categories (Profile edit pages)
const profileCategories = [
  { key: 'personal', label: 'Personal', icon: User },
  ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13),
  { key: 'photos-notes', label: 'Media', icon: Camera }
]

<CategoryGrid
  categories={profileCategories}
  selectedCategories={selectedCategories}
  completedCategories={completedSections}
  onCategoryClick={handleSectionChange}
  mode="completion"
/>`,
  notes: [
    'Replaces ~40 lines of grid HTML + map logic across 17+ files',
    'Three distinct modes: selection (filtering), completion (progress), draft (changes)',
    'Responsive: 4 cols (mobile) → 7 cols (tablet) → 14 cols (desktop)',
    '12-column layout excludes "forward" and "conclusion" categories',
    'Automatically shows green highlight for selected categories',
    'Mode-based badges: green checkmarks (completion), yellow checkmarks (draft)',
    'Select All button automatically detects if all categories are selected',
    'Supports custom categories: Pass any array with {key, label, icon} structure',
    'Profile pages add "Personal" and "Media" to standard VISION_CATEGORIES',
    'Used throughout: life-vision (5 files), profile (3 files), journal (3 files), vision-board (3 files)'
  ],
  examples: [
    '/life-vision/[id]/page.tsx - Selection mode for viewing specific categories',
    '/life-vision/[id]/draft/page.tsx - Draft mode showing refined categories',
    '/profile/[id]/edit/page.tsx - Completion mode with custom categories (Personal + Media)',
    '/journal/page.tsx - Selection mode for filtering entries (12-column)',
    '/vision-board/page.tsx - Selection mode for filtering items (12-column)'
  ]
}

