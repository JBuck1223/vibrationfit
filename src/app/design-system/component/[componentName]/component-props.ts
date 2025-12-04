// Component Props Documentation
// 
// This props registry is manually maintained to match the TypeScript interfaces
// defined in src/lib/design-system/components.tsx
//
// FUTURE: This could be auto-generated using:
// - TypeScript Compiler API (ts-morph)
// - AST parsing of component source
// - Runtime reflection (with additional tooling)
//
// For now, this ensures props documentation stays in sync with component definitions.

export interface PropDefinition {
  name: string
  type: string
  required: boolean
  defaultValue?: string
  description?: string
}

// Props are extracted from the actual component Props interfaces in components.tsx
// Example: ButtonProps, StackProps, CardProps, etc.
export const COMPONENT_PROPS: Record<string, PropDefinition[]> = {
  'stack': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Content to stack vertically' },
    { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'md'", description: 'Vertical spacing between items' },
    { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, defaultValue: "'stretch'", description: 'Horizontal alignment of items' },
    { name: 'className', type: 'string', required: false, description: 'Additional CSS classes' },
  ],

  'inline': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Content to arrange horizontally' },
    { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Horizontal spacing between items' },
    { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, defaultValue: "'center'", description: 'Vertical alignment' },
    { name: 'justify', type: "'start' | 'center' | 'end' | 'between' | 'around'", required: false, defaultValue: "'start'", description: 'Horizontal distribution' },
    { name: 'wrap', type: 'boolean', required: false, defaultValue: 'true', description: 'Allow items to wrap to new line' },
  ],

  'grid': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'minWidth', type: 'string', required: false, description: 'Minimum width per item (e.g., "200px")' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Gap between grid items' },
    { name: 'cols', type: 'number', required: false, description: 'Fixed number of columns (overrides minWidth)' },
  ],

  'card': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'variant', type: "'default' | 'elevated' | 'outlined' | 'glass'", required: false, defaultValue: "'default'", description: 'Visual style variant' },
    { name: 'hover', type: 'boolean', required: false, defaultValue: 'false', description: 'Enable hover effect (lift + border color change)' },
    { name: 'className', type: 'string', required: false },
  ],

  'feature-card': [
    { name: 'icon', type: 'React.ElementType', required: true, description: 'Icon component from lucide-react' },
    { name: 'title', type: 'string', required: true, description: 'Title text displayed under icon' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Body text content' },
    { name: 'iconColor', type: 'string', required: false, defaultValue: "'#39FF14'", description: 'Icon color (hex or CSS color)' },
    { name: 'iconSize', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'lg'", description: 'Icon size' },
    { name: 'variant', type: "'default' | 'elevated' | 'outlined' | 'glass'", required: false, defaultValue: "'default'", description: 'Card style variant' },
    { name: 'hover', type: 'boolean', required: false, defaultValue: 'false', description: 'Enable hover effect' },
    { name: 'number', type: 'number', required: false, description: 'Optional number to display above icon' },
    { name: 'className', type: 'string', required: false },
  ],

  'button': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Button content (text or icon)' },
    { name: 'variant', type: "'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'", required: false, defaultValue: "'primary'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'md'", description: 'Button size' },
    { name: 'fullWidth', type: 'boolean', required: false, defaultValue: 'false', description: 'Make button fill container width' },
    { name: 'loading', type: 'boolean', required: false, defaultValue: 'false', description: 'Show loading spinner' },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disable button interaction' },
    { name: 'onClick', type: '() => void', required: false, description: 'Click handler function' },
  ],

  'input': [
    { name: 'label', type: 'string', required: false, description: 'Input label text' },
    { name: 'error', type: 'string', required: false, description: 'Error message to display' },
    { name: 'helperText', type: 'string', required: false, description: 'Helper text below input' },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'type', type: 'string', required: false, defaultValue: "'text'", description: 'Input type (text, email, password, etc.)' },
    { name: 'value', type: 'string', required: false },
    { name: 'onChange', type: '(e: React.ChangeEvent<HTMLInputElement>) => void', required: false },
    { name: 'disabled', type: 'boolean', required: false },
  ],

  'date-picker': [
    { name: 'label', type: 'string', required: false, description: 'DatePicker label text' },
    { name: 'value', type: 'string', required: false, description: 'Selected date in ISO format (YYYY-MM-DD)' },
    { name: 'onChange', type: '(date: string) => void', required: false, description: 'Callback fired when date changes' },
    { name: 'minDate', type: 'string', required: false, description: 'Minimum selectable date (ISO format)' },
    { name: 'maxDate', type: 'string', required: false, description: 'Maximum selectable date (ISO format)' },
    { name: 'error', type: 'string', required: false, description: 'Error message to display' },
    { name: 'helperText', type: 'string', required: false, description: 'Helper text below picker' },
    { name: 'placeholder', type: 'string', required: false, defaultValue: "'Select date...'", description: 'Placeholder text' },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disable date picker' },
  ],

  'textarea': [
    { name: 'label', type: 'string', required: false },
    { name: 'error', type: 'string', required: false },
    { name: 'helperText', type: 'string', required: false },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'rows', type: 'number', required: false, description: 'Number of visible text lines' },
    { name: 'value', type: 'string', required: false },
    { name: 'onChange', type: '(e: React.ChangeEvent<HTMLTextAreaElement>) => void', required: false },
  ],

  'badge': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'variant', type: "'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'neutral'", required: false, defaultValue: "'primary'" },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
  ],

  'spinner': [
    { name: 'variant', type: "'primary' | 'secondary' | 'accent' | 'branded'", required: false, defaultValue: "'primary'", description: 'Color variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Spinner size' },
    { name: 'className', type: 'string', required: false },
  ],

  'progress-bar': [
    { name: 'value', type: 'number', required: true, description: 'Current progress value' },
    { name: 'max', type: 'number', required: false, defaultValue: '100', description: 'Maximum value' },
    { name: 'variant', type: "'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'", required: false, defaultValue: "'primary'" },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
    { name: 'showLabel', type: 'boolean', required: false, defaultValue: 'false', description: 'Show percentage label' },
    { name: 'label', type: 'string', required: false, description: 'Custom label text' },
  ],

  'modal': [
    { name: 'isOpen', type: 'boolean', required: true, description: 'Control modal visibility' },
    { name: 'onClose', type: '() => void', required: true, description: 'Function to close modal' },
    { name: 'title', type: 'string', required: false, description: 'Modal title' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'md'", description: 'Modal width' },
    { name: 'variant', type: "'default' | 'hero' | 'card'", required: false, defaultValue: "'default'" },
    { name: 'children', type: 'React.ReactNode', required: true },
  ],

  'heading': [
    { name: 'level', type: '1 | 2 | 3 | 4', required: false, defaultValue: '1', description: 'Heading level (h1-h4)' },
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'className', type: 'string', required: false },
  ],

  'text': [
    { name: 'size', type: "'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'", required: false, defaultValue: "'base'", description: 'Text size' },
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'className', type: 'string', required: false },
  ],

  'icon': [
    { name: 'icon', type: 'LucideIcon', required: true, description: 'Lucide icon component' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'md'", description: 'Icon size' },
    { name: 'color', type: 'string', required: false, defaultValue: "'currentColor'", description: 'Icon color (hex or CSS color)' },
    { name: 'className', type: 'string', required: false },
  ],

  'select': [
    { name: 'label', type: 'string', required: false, description: 'Select label text' },
    { name: 'value', type: 'string', required: false, description: 'Currently selected value' },
    { name: 'onChange', type: '(value: string) => void', required: false, description: 'Callback fired when selection changes' },
    { name: 'options', type: '{ value: string; label: string }[]', required: true, description: 'Dropdown options array' },
    { name: 'placeholder', type: 'string', required: false, defaultValue: "'Select...'", description: 'Placeholder text' },
    { name: 'error', type: 'string', required: false, description: 'Error message to display' },
    { name: 'helperText', type: 'string', required: false, description: 'Helper text below select' },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disable select interaction' },
  ],

  'video': [
    { name: 'src', type: 'string', required: true, description: 'Video source URL' },
    { name: 'poster', type: 'string', required: false, description: 'Poster image URL' },
    { name: 'controls', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'autoplay', type: 'boolean', required: false },
    { name: 'variant', type: "'default'", required: false },
    { name: 'trackingId', type: 'string', required: false, description: 'ID for video analytics tracking' },
    { name: 'onMilestoneReached', type: '(milestone: number, time: number) => void', required: false },
    { name: 'onLeadCapture', type: '(data: any) => void', required: false },
  ],

  // Layout Components
  'two-column': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Two child elements to display in columns' },
    { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Gap between columns' },
    { name: 'reverse', type: 'boolean', required: false, defaultValue: 'false', description: 'Reverse column order on mobile' },
    { name: 'className', type: 'string', required: false },
  ],

  'four-column': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Content to display in four columns' },
    { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Gap between columns' },
    { name: 'className', type: 'string', required: false },
  ],

  'switcher': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Gap between items' },
    { name: 'className', type: 'string', required: false },
  ],

  'cover': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'minHeight', type: 'string', required: false, defaultValue: "'400px'", description: 'Minimum height of the cover section' },
    { name: 'className', type: 'string', required: false },
  ],

  'frame': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'ratio', type: 'string', required: false, defaultValue: "'16/9'", description: 'Aspect ratio (e.g., "16/9", "4/3")' },
    { name: 'className', type: 'string', required: false },
  ],

  'container': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'size', type: "'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'", required: false, defaultValue: "'default'", description: 'Container max-width size' },
    { name: 'className', type: 'string', required: false },
  ],

  'page-layout': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'containerSize', type: "'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'", required: false, defaultValue: "'xl'", description: 'Inner container size' },
    { name: 'className', type: 'string', required: false },
  ],

  // UI Components
  'viva-button': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Button content' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", required: false, defaultValue: "'md'", description: 'Button size' },
    { name: 'asChild', type: 'boolean', required: false, defaultValue: 'false', description: 'Render as child element' },
    { name: 'className', type: 'string', required: false },
  ],

  'auto-resize-textarea': [
    { name: 'value', type: 'string', required: true, description: 'Current text value' },
    { name: 'onChange', type: '(value: string) => void', required: true, description: 'Change handler' },
    { name: 'label', type: 'string', required: false, description: 'Input label' },
    { name: 'error', type: 'string', required: false, description: 'Error message' },
    { name: 'helperText', type: 'string', required: false, description: 'Helper text' },
    { name: 'minHeight', type: 'number', required: false, defaultValue: '120', description: 'Minimum height in pixels' },
    { name: 'maxHeight', type: 'number', required: false, defaultValue: '400', description: 'Maximum height in pixels' },
    { name: 'placeholder', type: 'string', required: false },
  ],

  'item-list-card': [
    { name: 'title', type: 'string', required: true, description: 'Card title' },
    { name: 'items', type: 'string[]', required: true, description: 'Array of items to display' },
    { name: 'iconColor', type: 'string', required: false, defaultValue: "'#39FF14'", description: 'Color for check icons' },
    { name: 'variant', type: "'default' | 'elevated'", required: false, defaultValue: "'default'", description: 'Card style variant' },
    { name: 'className', type: 'string', required: false },
  ],

  'flow-cards': [
    { name: 'items', type: 'Array<{label: string, description: string, icon?: React.ElementType, iconColor?: string}>', required: true, description: 'Array of flow items with label, description, and optional icon' },
    { name: 'arrowColor', type: 'string', required: false, defaultValue: "'#39FF14'", description: 'Color for arrows between cards' },
    { name: 'className', type: 'string', required: false },
  ],

  'proof-wall': [
    { name: 'items', type: 'Array<ProofWallItem>', required: true, description: 'Array of before/after items with images and stories' },
    { name: 'title', type: 'string', required: false, description: 'Optional title for the proof wall' },
    { name: 'className', type: 'string', required: false },
  ],

  'swipeable-cards': [
    { name: 'cards', type: 'Array<SwipeableCard>', required: true, description: 'Array of swipeable card items with content, images, and optional badges' },
    { name: 'title', type: 'string', required: false, description: 'Optional title for the card stack' },
    { name: 'subtitle', type: 'string', required: false, description: 'Optional subtitle text' },
    { name: 'mobileOnly', type: 'boolean', required: false, defaultValue: 'true', description: 'Enable swipeable behavior on mobile only (desktop shows grid)' },
    { name: 'desktopCardsPerView', type: 'number', required: false, defaultValue: '3', description: 'Number of cards per view on desktop grid' },
    { name: 'swipeThreshold', type: 'number', required: false, defaultValue: '0.25', description: 'Swipe threshold (0-1) for triggering card change' },
    { name: 'hapticFeedback', type: 'boolean', required: false, defaultValue: 'true', description: 'Enable haptic feedback on swipe (mobile)' },
    { name: 'autoSnap', type: 'boolean', required: false, defaultValue: 'true', description: 'Auto-snap cards to center after swipe' },
    { name: 'showIndicators', type: 'boolean', required: false, defaultValue: 'true', description: 'Show card navigation indicators' },
    { name: 'cardVariant', type: "'default' | 'elevated' | 'outlined'", required: false, defaultValue: "'default'", description: 'Card style variant' },
    { name: 'onCardSwiped', type: '(cardId: string, direction: "left" | "right") => void', required: false, description: 'Callback when card is swiped' },
    { name: 'onCardClick', type: '(cardId: string) => void', required: false, description: 'Callback when card is clicked/tapped' },
    { name: 'className', type: 'string', required: false },
  ],

  'pricing-card': [
    { name: 'title', type: 'string', required: true, description: 'Plan title' },
    { name: 'price', type: 'string', required: true, description: 'Price display string' },
    { name: 'description', type: 'string', required: false, description: 'Plan description' },
    { name: 'badge', type: 'string', required: false, description: 'Optional badge text' },
    { name: 'icon', type: 'React.ElementType', required: false, description: 'Icon component' },
    { name: 'iconColor', type: 'string', required: false, defaultValue: "'#39FF14'", description: 'Icon color' },
    { name: 'selected', type: 'boolean', required: false, defaultValue: 'false', description: 'Whether card is selected' },
    { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
    { name: 'variant', type: "'default' | 'elevated'", required: false, defaultValue: "'default'" },
    { name: 'className', type: 'string', required: false },
  ],

  'action-buttons': [
    { name: 'versionType', type: "'draft' | 'completed'", required: true, description: 'Type of version being displayed' },
    { name: 'viewHref', type: 'string', required: true, description: 'URL for view action' },
    { name: 'onDelete', type: '() => void', required: true, description: 'Delete handler' },
    { name: 'editHref', type: 'string', required: false, description: 'URL for edit action (optional)' },
    { name: 'onCommit', type: '() => void', required: false, description: 'Commit handler (for drafts)' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'sm'" },
    { name: 'variant', type: "'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'", required: false, defaultValue: "'ghost'" },
    { name: 'showLabels', type: 'boolean', required: false, defaultValue: 'true', description: 'Show button text labels' },
    { name: 'deleteVariant', type: "'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'", required: false, defaultValue: "'danger'" },
    { name: 'commitVariant', type: "'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'", required: false, defaultValue: "'primary'" },
    { name: 'isCommitting', type: 'boolean', required: false, defaultValue: 'false', description: 'Loading state for commit' },
    { name: 'className', type: 'string', required: false },
  ],

  // Media Components
  'audio-player': [
    { name: 'track', type: 'AudioTrack', required: true, description: 'Audio track object with metadata' },
    { name: 'autoPlay', type: 'boolean', required: false, defaultValue: 'false', description: 'Auto-play on load' },
    { name: 'showInfo', type: 'boolean', required: false, defaultValue: 'true', description: 'Show track title and artist' },
    { name: 'onTrackEnd', type: '() => void', required: false, description: 'Callback when track ends' },
    { name: 'className', type: 'string', required: false },
  ],

  'playlist-player': [
    { name: 'tracks', type: 'AudioTrack[]', required: true, description: 'Array of audio tracks' },
    { name: 'autoPlay', type: 'boolean', required: false, defaultValue: 'false', description: 'Auto-play first track' },
    { name: 'className', type: 'string', required: false },
  ],

  // Typography
  'title': [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Title text' },
    { name: 'level', type: "'hero' | 'section' | 'card'", required: false, defaultValue: "'section'", description: 'Title size level' },
    { name: 'className', type: 'string', required: false },
  ],
  'page-titles': [
    { name: 'eyebrow', type: 'React.ReactNode', required: false, description: 'Optional overline/kicker text above the title' },
    { name: 'title', type: 'React.ReactNode', required: true, description: 'Primary page title content' },
    { name: 'subtitle', type: 'React.ReactNode', required: false, description: 'Supporting subtitle displayed under the title' },
    { name: 'supportingText', type: 'React.ReactNode', required: false, description: 'Additional helper copy shown below the subtitle' },
    { name: 'breadcrumbs', type: 'React.ReactNode', required: false, description: 'Breadcrumb navigation rendered above the title' },
    { name: 'status', type: "{ label: React.ReactNode; variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'premium' | 'neutral' }", required: false, description: 'Badge displayed next to the title' },
    { name: 'metaItems', type: "Array<{ label: string; value: string; icon?: LucideIcon }>", required: false, description: 'Compact metadata chips displayed under the subtitle' },
    { name: 'actions', type: 'PageTitleAction[]', required: false, description: 'Primary and secondary action buttons rendered alongside the title' },
    { name: 'alignment', type: "'left' | 'center'", required: false, defaultValue: "'left'", description: 'Controls text alignment and layout' },
    { name: 'children', type: 'React.ReactNode', required: false, description: 'Additional custom content rendered below the meta items' },
    { name: 'className', type: 'string', required: false, description: 'Additional CSS classes for the wrapper' },
  ],

  'page-header': [
    { name: 'eyebrow', type: 'React.ReactNode', required: false, description: 'Small uppercase text displayed above the title' },
    { name: 'title', type: 'React.ReactNode', required: true, description: 'Main page title (large, centered, bold)' },
    { name: 'subtitle', type: 'React.ReactNode', required: false, description: 'Descriptive text displayed below the title' },
    { name: 'badges', type: "Array<{ label: React.ReactNode; variant?: BadgeVariant; icon?: LucideIcon; className?: string }>", required: false, description: 'Array of status badges displayed in the metadata section' },
    { name: 'metaItems', type: "Array<{ label: string; value: string | number; icon?: LucideIcon; className?: string }>", required: false, description: 'Array of metadata items (label/value pairs) with optional icons' },
    { name: 'actions', type: "Array<{ label: string; onClick?: () => void; href?: string; variant?: ButtonVariant; size?: ButtonSize; icon?: LucideIcon; loading?: boolean; disabled?: boolean; className?: string }>", required: false, description: 'Array of action buttons displayed below the metadata' },
    { name: 'gradient', type: 'boolean', required: false, defaultValue: 'true', description: 'Whether to show the gradient background' },
    { name: 'children', type: 'React.ReactNode', required: false, description: 'Additional custom content displayed below the actions' },
    { name: 'className', type: 'string', required: false, description: 'Additional CSS classes to apply to the container' },
  ],

  'bulleted-list': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'variant', type: "'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'", required: false, defaultValue: "'default'", description: 'Color variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
    { name: 'spacing', type: "'tight' | 'normal' | 'loose'", required: false, defaultValue: "'normal'", description: 'Vertical spacing between items' },
    { name: 'className', type: 'string', required: false },
  ],

  'ordered-list': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'variant', type: "'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'", required: false, defaultValue: "'default'", description: 'Color variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
    { name: 'spacing', type: "'tight' | 'normal' | 'loose'", required: false, defaultValue: "'normal'", description: 'Vertical spacing between items' },
    { name: 'className', type: 'string', required: false },
  ],

  'list-item': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'variant', type: "'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'", required: false, defaultValue: "'default'" },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
    { name: 'icon', type: 'React.ComponentType<{ className?: string }>', required: false, description: 'Optional icon component' },
    { name: 'className', type: 'string', required: false },
  ],

  // Navigation
  'sidebar': [
    { name: 'navigation', type: 'NavItem[]', required: false, description: 'Custom navigation items' },
    { name: 'isAdmin', type: 'boolean', required: false, defaultValue: 'false', description: 'Use admin navigation' },
    { name: 'className', type: 'string', required: false },
  ],

  'mobile-bottom-nav': [
    { name: 'navigation', type: 'NavItem[]', required: false, description: 'Custom navigation items' },
    { name: 'isAdmin', type: 'boolean', required: false, defaultValue: 'false', description: 'Use admin navigation' },
    { name: 'className', type: 'string', required: false },
  ],

  'sidebar-layout': [
    { name: 'children', type: 'React.ReactNode', required: true },
    { name: 'navigation', type: 'NavItem[]', required: false, description: 'Custom navigation items' },
    { name: 'isAdmin', type: 'boolean', required: false, defaultValue: 'false', description: 'Use admin navigation' },
    { name: 'className', type: 'string', required: false },
  ],

  // Special Components
  'offer-stack': [
    { name: 'items', type: 'OfferStackItem[]', required: true, description: 'Array of offer items to display' },
    { name: 'title', type: 'string', required: false, description: 'Optional section title' },
    { name: 'subtitle', type: 'string', required: false, description: 'Optional section subtitle' },
    { name: 'defaultExpanded', type: 'string[]', required: false, defaultValue: '[]', description: 'Item IDs to expand by default' },
    { name: 'allowMultiple', type: 'boolean', required: false, defaultValue: 'true', description: 'Allow multiple items expanded at once' },
    { name: 'className', type: 'string', required: false },
  ],

  'delete-confirmation-dialog': [
    { name: 'isOpen', type: 'boolean', required: true, description: 'Control dialog visibility' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
    { name: 'onConfirm', type: '() => void', required: true, description: 'Confirm/delete handler' },
    { name: 'itemName', type: 'string', required: true, description: 'Name of item being deleted' },
    { name: 'itemType', type: 'string', required: false, defaultValue: "'Item'", description: 'Type of item (e.g., "Creation", "Entry")' },
    { name: 'isLoading', type: 'boolean', required: false, defaultValue: 'false', description: 'Loading state' },
    { name: 'loadingText', type: 'string', required: false, defaultValue: "'Deleting...'", description: 'Loading button text' },
  ],

  'insufficient-tokens-dialog': [
    { name: 'isOpen', type: 'boolean', required: true, description: 'Control dialog visibility' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
    { name: 'tokensRemaining', type: 'number', required: true, description: 'Current token balance' },
    { name: 'estimatedTokens', type: 'number', required: false, description: 'Tokens required for action' },
    { name: 'actionName', type: 'string', required: false, defaultValue: "'this action'", description: 'Description of action requiring tokens' },
  ],

  'insufficient-storage-dialog': [
    { name: 'isOpen', type: 'boolean', required: true, description: 'Control dialog visibility' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
    { name: 'storageUsedGB', type: 'number', required: true, description: 'Storage currently used (in GB)' },
    { name: 'storageQuotaGB', type: 'number', required: true, description: 'Total storage quota (in GB)' },
    { name: 'estimatedSizeGB', type: 'number', required: false, description: 'Size of file/action that would exceed quota' },
    { name: 'actionName', type: 'string', required: false, defaultValue: "'this action'", description: 'Description of action requiring storage' },
  ],

    'toggle': [
      { name: 'options', type: 'ToggleOption<T>[]', required: true, description: 'Array of toggle options with value, label, and optional badge' },
      { name: 'value', type: 'T', required: true, description: 'Currently selected option value' },
      { name: 'onChange', type: '(value: T) => void', required: true, description: 'Callback when option is selected' },
      { name: 'activeColor', type: 'string', required: false, defaultValue: "'#39FF14'", description: 'Color for active option (hex)' },
      { name: 'inactiveColor', type: 'string', required: false, defaultValue: "'neutral'", description: 'Color scheme for inactive options' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'", description: 'Size of toggle buttons' },
      { name: 'className', type: 'string', required: false },
    ],
    'color-palette': [
      { name: 'N/A', type: 'Reference Only', required: false, description: 'This is a documentation reference showing all available colors, gradients, and semantic meanings from the design tokens. Access colors via the tokens file: import { colors, gradients } from "@/lib/design-system/tokens"' },
    ],
}

export function getComponentProps(componentId: string): PropDefinition[] {
  return COMPONENT_PROPS[componentId] || []
}

