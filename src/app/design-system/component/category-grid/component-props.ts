export const componentProps = {
  name: 'CategoryGrid',
  description: 'Horizontal pill strip for displaying life categories with four modes: selection (default filtering), completion (progress tracking), draft (change highlighting), and record (re-record tracking). Renders as scrollable pills on mobile and centered pills on desktop. Used across every category selection surface on the site.',
  props: [
    {
      name: 'categories',
      type: 'ReadonlyArray<{ key, label, icon }>',
      optional: false,
      description: 'Array of category objects with key, label, and icon properties. Can use VISION_CATEGORIES or create custom arrays.'
    },
    {
      name: 'selectedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of selected category keys (highlights with soft green primary styling)'
    },
    {
      name: 'completedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of completed category keys (shows green check badge in completion/record mode)'
    },
    {
      name: 'refinedCategories',
      type: 'string[]',
      optional: true,
      description: 'Array of refined/changed category keys (shows yellow badge in draft mode, amber refresh in record mode)'
    },
    {
      name: 'activeCategory',
      type: 'string',
      optional: true,
      description: 'Single active category key (treated as selected). Use for single-select navigation.'
    },
    {
      name: 'onCategoryClick',
      type: '(categoryKey: string) => void',
      optional: true,
      description: 'Callback when a category pill is clicked'
    },
    {
      name: 'mode',
      type: '"selection" | "completion" | "draft" | "record"',
      optional: true,
      description: 'Controls badge behavior. selection = no badges, completion = green check, draft = yellow check, record = green check if completed + amber refresh if needs re-record. Default: "selection"'
    },
    {
      name: 'showSelectAll',
      type: 'boolean',
      optional: true,
      description: 'Show an "All" pill at the start of the strip. Default: false'
    },
    {
      name: 'onSelectAll',
      type: '() => void',
      optional: true,
      description: 'Callback for the "All" pill (required if showSelectAll is true)'
    },
    {
      name: 'selectAllLabel',
      type: 'string',
      optional: true,
      description: 'Custom label for the All pill. Default: "All"'
    },
    {
      name: 'pillLabel',
      type: 'string',
      optional: true,
      description: 'When truthy, shows a mobile-only centered "Scroll to see all" line below the pills (string value is not displayed). Hidden on md+.'
    },
    {
      name: 'getPillClassName',
      type: '(categoryKey: string) => string | undefined',
      optional: true,
      description: 'Per-pill class override callback for edge cases like "intensive needed" state on vision-board/new'
    },
    {
      name: 'fillWidth',
      type: 'boolean',
      optional: true,
      description: 'When true, pills wrap on desktop and each pill stretches to share row width evenly (flex-1). Default: false (compact scrollable strip)'
    },
    {
      name: 'wrapOnDesktop',
      type: 'boolean',
      optional: true,
      description: 'When true without fillWidth, pills keep natural size and icons and wrap to multiple centered rows on md+. Mobile stays horizontal scroll. Default: false'
    },
    {
      name: 'completionBadgeColor',
      type: 'string',
      optional: true,
      description: 'Custom color for completion badges. Default: "#39FF14" (green)'
    },
    {
      name: 'refinementBadgeColor',
      type: 'string',
      optional: true,
      description: 'Custom color for refinement badges. Default: "#FFFF00" (yellow)'
    }
  ],
  usage: `import { CategoryGrid } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

// Basic pill strip for filtering
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selectedCategories}
  onCategoryClick={handleToggle}
/>

// With "All" pill and mobile label
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selectedCategories}
  onCategoryClick={handleToggle}
  showSelectAll
  onSelectAll={handleSelectAll}
  pillLabel="Life Areas"
/>

// Completion mode with badges
<CategoryGrid
  categories={VISION_CATEGORIES}
  activeCategory={currentSection}
  completedCategories={completedKeys}
  onCategoryClick={handleNav}
  mode="completion"
  fillWidth
/>`,
  notes: [
    'Renders as a horizontal pill strip -- scrollable on mobile, centered on desktop',
    'Four modes: selection (no badges), completion (green check), draft (yellow check), record (check + refresh)',
    'Badges render as small circles in the upper-right corner of each pill',
    'Use fillWidth when you want pills to stretch and fill the row (replaces the old grid fill behavior)',
    'pillLabel (truthy) adds a mobile-only centered "Scroll to see all" hint below the pills',
    'getPillClassName allows per-pill class overrides for special states (e.g., intensive mode needed categories)',
    'Supports custom categories: pass any array with {key, label, icon} structure',
    'Used across ~28 files: life-vision, profile, journal, vision-board, audio, assessment, vibe-tribe, and more'
  ],
  examples: [
    '/life-vision/[id]/page.tsx - Selection with "All" pill and pillLabel',
    '/life-vision/[id]/refine/page.tsx - Draft mode showing refined categories with yellow badges',
    '/audio/record/page.tsx - Record mode with completion + re-record badges',
    '/profile/[id]/edit/page.tsx - Completion mode with custom profile categories',
    '/vision-board/new/page.tsx - Selection with getPillClassName for intensive mode',
    '/journal/new/page.tsx - Simple selection with pillLabel'
  ]
}
