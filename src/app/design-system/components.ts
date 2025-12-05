// Design System Component Metadata
// Defines all components available in the design system with their metadata

import { 
  Layout, Grid as GridIcon, Square, MousePointer, Tag, Edit, 
  Activity, Play, Monitor, CreditCard, List, CheckCircle, 
  Sparkles, Smartphone, PanelTop, FileText, Music, Type, 
  Users, Eye, Trash2, Zap, HardDrive, Headphones, Palette,
  ArrowRight, Image
} from 'lucide-react'

export interface ComponentMetadata {
  id: string
  name: string
  description: string
  category: 'Layout' | 'UI' | 'Feedback' | 'Media' | 'Typography' | 'Navigation' | 'Special' | 'Patterns'
  icon: typeof Layout
  exportName: string
  path: string
}

export const DESIGN_SYSTEM_COMPONENTS: ComponentMetadata[] = [
  // Layout Primitives
  {
    id: 'stack',
    name: 'Stack',
    description: 'Vertical rhythm with consistent gaps - the foundation of most layouts',
    category: 'Layout',
    icon: Layout,
    exportName: 'Stack',
    path: '/design-system/component/stack'
  },
  {
    id: 'inline',
    name: 'Inline',
    description: 'Mobile-first responsive horizontal row that stacks on mobile',
    category: 'Layout',
    icon: GridIcon,
    exportName: 'Inline',
    path: '/design-system/component/inline'
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Auto-wrapping responsive grid with intelligent breakpoints',
    category: 'Layout',
    icon: GridIcon,
    exportName: 'Grid',
    path: '/design-system/component/grid'
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Responsive two column layout that stacks on mobile',
    category: 'Layout',
    icon: PanelTop,
    exportName: 'TwoColumn',
    path: '/design-system/component/two-column'
  },
  {
    id: 'four-column',
    name: 'Four Column (Deprecated)',
    description: 'Responsive four column layout (2x2 on mobile, 4x1 on desktop). DEPRECATED: Use Grid with responsiveCols={{mobile: 2, desktop: 4}} instead.',
    category: 'Layout',
    icon: GridIcon,
    exportName: 'FourColumn',
    path: '/design-system/component/four-column'
  },
  {
    id: 'switcher',
    name: 'Switcher (Deprecated)',
    description: 'Toggles from row to column when items don\'t fit. DEPRECATED: Use Grid with responsiveCols or mode="flex-row" className="flex-col md:flex-row" instead.',
    category: 'Layout',
    icon: GridIcon,
    exportName: 'Switcher',
    path: '/design-system/component/switcher'
  },
  {
    id: 'cover',
    name: 'Cover',
    description: 'Hero section that centers content with min-height',
    category: 'Layout',
    icon: Square,
    exportName: 'Cover',
    path: '/design-system/component/cover'
  },
  {
    id: 'frame',
    name: 'Frame',
    description: 'Aspect ratio media wrapper for consistent image/video sizing',
    category: 'Layout',
    icon: Square,
    exportName: 'Frame',
    path: '/design-system/component/frame'
  },
  {
    id: 'container',
    name: 'Container',
    description: 'Page width container with responsive gutters',
    category: 'Layout',
    icon: PanelTop,
    exportName: 'Container',
    path: '/design-system/component/container'
  },
  {
    id: 'page-layout',
    name: 'Page Layout',
    description: 'Complete page structure with header, footer, and responsive container',
    category: 'Layout',
    icon: Layout,
    exportName: 'PageLayout',
    path: '/design-system/component/page-layout'
  },

  // UI Components
  {
    id: 'card',
    name: 'Card',
    description: 'Foundation container component with variants and hover states',
    category: 'UI',
    icon: Square,
    exportName: 'Card',
    path: '/design-system/component/card'
  },
  {
    id: 'feature-card',
    name: 'Feature Card',
    description: 'Card with icon on top, title under icon, and body text under title',
    category: 'UI',
    icon: Square,
    exportName: 'FeatureCard',
    path: '/design-system/component/feature-card'
  },
  {
    id: 'tracking-milestone-card',
    name: 'Tracking Milestone Card',
    description: 'Metric card with themed border/background for displaying tracking stats and milestones',
    category: 'UI',
    icon: Activity,
    exportName: 'TrackingMilestoneCard',
    path: '/design-system/component/tracking-milestone-card'
  },
  {
    id: 'button',
    name: 'Button',
    description: 'Primary interactive element with multiple variants and sizes',
    category: 'UI',
    icon: MousePointer,
    exportName: 'Button',
    path: '/design-system/component/button'
  },
  {
    id: 'save-button',
    name: 'SaveButton',
    description: 'Specialized button for save/saved states with automatic styling based on change status',
    category: 'UI',
    icon: CheckCircle,
    exportName: 'SaveButton',
    path: '/design-system/component/save-button'
  },
  {
    id: 'viva-button',
    name: 'VIVA Button',
    description: 'Special AI assistant button with animated sparkles icon',
    category: 'UI',
    icon: Sparkles,
    exportName: 'VIVAButton',
    path: '/design-system/component/viva-button'
  },
  {
    id: 'icon',
    name: 'Icon',
    description: 'Consistent icon wrapper with sizing and color variants',
    category: 'UI',
    icon: Square,
    exportName: 'Icon',
    path: '/design-system/component/icon'
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Status indicators and labels with semantic color variants',
    category: 'UI',
    icon: Tag,
    exportName: 'Badge',
    path: '/design-system/component/badge'
  },
  {
    id: 'input',
    name: 'Input',
    description: 'Text input field with label, error states, and helper text',
    category: 'UI',
    icon: Edit,
    exportName: 'Input',
    path: '/design-system/component/input'
  },
  {
    id: 'date-picker',
    name: 'DatePicker',
    description: 'Custom branded date picker with neon calendar, month navigation, and min/max date support',
    category: 'UI',
    icon: Edit,
    exportName: 'DatePicker',
    path: '/design-system/component/date-picker'
  },
  {
    id: 'radio',
    name: 'Radio',
    description: 'Custom branded radio buttons with electric green accents, hover states, and RadioGroup container',
    category: 'UI',
    icon: CheckCircle,
    exportName: 'Radio',
    path: '/design-system/component/radio'
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Custom branded checkboxes with electric green fill, gray checkmark, and hover states',
    category: 'UI',
    icon: CheckCircle,
    exportName: 'Checkbox',
    path: '/design-system/component/checkbox'
  },
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Multi-line text input with validation and helper text',
    category: 'UI',
    icon: Edit,
    exportName: 'Textarea',
    path: '/design-system/component/textarea'
  },
  {
    id: 'auto-resize-textarea',
    name: 'Auto Resize Textarea',
    description: 'Textarea that automatically adjusts height based on content',
    category: 'UI',
    icon: Edit,
    exportName: 'AutoResizeTextarea',
    path: '/design-system/component/auto-resize-textarea'
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Custom dropdown matching input field styling with click-outside-to-close and smooth transitions',
    category: 'UI',
    icon: Edit,
    exportName: 'Select',
    path: '/design-system/component/select'
  },
  {
    id: 'item-list-card',
    name: 'Item List Card',
    description: 'Specialized card for displaying items in a list with actions',
    category: 'UI',
    icon: Square,
    exportName: 'ItemListCard',
    path: '/design-system/component/item-list-card'
  },
  {
    id: 'flow-cards',
    name: 'Flow Cards',
    description: 'Vertically stacked cards with arrows showing a flow or process',
    category: 'UI',
    icon: ArrowRight,
    exportName: 'FlowCards',
    path: '/design-system/component/flow-cards'
  },
  {
    id: 'proof-wall',
    name: 'Proof Wall',
    description: 'Interactive carousel with before/after photos and actualization stories',
    category: 'UI',
    icon: Image,
    exportName: 'ProofWall',
    path: '/design-system/component/proof-wall'
  },
  {
    id: 'swipeable-cards',
    name: 'Swipeable Cards',
    description: 'Mobile-optimized swipeable card stack with touch gestures, haptic feedback, and responsive grid',
    category: 'UI',
    icon: Smartphone,
    exportName: 'SwipeableCards',
    path: '/design-system/component/swipeable-cards'
  },
  {
    id: 'pricing-card',
    name: 'Pricing Card',
    description: 'Card component for displaying pricing tiers and plans',
    category: 'UI',
    icon: CreditCard,
    exportName: 'PricingCard',
    path: '/design-system/component/pricing-card'
  },
  {
    id: 'offer-stack',
    name: 'Offer Stack',
    description: 'Stack of offer cards with spacing and hover effects',
    category: 'UI',
    icon: Square,
    exportName: 'OfferStack',
    path: '/design-system/component/offer-stack'
  },
  {
    id: 'action-buttons',
    name: 'Action Buttons',
    description: 'Standardized View/Delete/Edit button pairs for list items',
    category: 'UI',
    icon: Eye,
    exportName: 'ActionButtons',
    path: '/design-system/component/action-buttons'
  },
  {
    id: 'toggle',
    name: 'Toggle',
    description: 'Toggle between options with active/inactive states (e.g., Annual/28-Day billing)',
    category: 'UI',
    icon: Edit,
    exportName: 'Toggle',
    path: '/design-system/component/toggle'
  },

  // Feedback Components
  {
    id: 'spinner',
    name: 'Spinner',
    description: 'Loading indicator with multiple sizes and color variants',
    category: 'Feedback',
    icon: Activity,
    exportName: 'Spinner',
    path: '/design-system/component/spinner'
  },
  {
    id: 'progress-bar',
    name: 'Progress Bar',
    description: 'Progress indicator with labels, variants, and animations',
    category: 'Feedback',
    icon: Activity,
    exportName: 'ProgressBar',
    path: '/design-system/component/progress-bar'
  },

  // Media Components
  {
    id: 'video',
    name: 'Video',
    description: 'Video player with controls, autoplay, and responsive sizing',
    category: 'Media',
    icon: Play,
    exportName: 'Video',
    path: '/design-system/component/video'
  },
  {
    id: 'audio-player',
    name: 'Audio Player',
    description: 'Audio player with controls, progress tracking, and playlist support',
    category: 'Media',
    icon: Music,
    exportName: 'AudioPlayer',
    path: '/design-system/component/audio-player'
  },
  {
    id: 'playlist-player',
    name: 'Playlist Player',
    description: 'Playlist player with track navigation and queue management',
    category: 'Media',
    icon: Headphones,
    exportName: 'PlaylistPlayer',
    path: '/design-system/component/playlist-player'
  },

  // Typography
  {
    id: 'heading',
    name: 'Heading',
    description: 'Responsive heading component with consistent sizing',
    category: 'Typography',
    icon: Type,
    exportName: 'Heading',
    path: '/design-system/component/heading'
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Responsive text component with size variants',
    category: 'Typography',
    icon: FileText,
    exportName: 'Text',
    path: '/design-system/component/text'
  },
  {
    id: 'title',
    name: 'Title',
    description: 'Large title component with optional subtitle',
    category: 'Typography',
    icon: Type,
    exportName: 'Title',
    path: '/design-system/component/title'
  },
  {
    id: 'bulleted-list',
    name: 'Bulleted List',
    description: 'Unordered list with consistent styling and spacing',
    category: 'Typography',
    icon: List,
    exportName: 'BulletedList',
    path: '/design-system/component/bulleted-list'
  },
  {
    id: 'ordered-list',
    name: 'Ordered List',
    description: 'Numbered list with consistent styling and spacing',
    category: 'Typography',
    icon: List,
    exportName: 'OrderedList',
    path: '/design-system/component/ordered-list'
  },
  {
    id: 'list-item',
    name: 'List Item',
    description: 'Individual list item component with optional icons',
    category: 'Typography',
    icon: List,
    exportName: 'ListItem',
    path: '/design-system/component/list-item'
  },

  // Navigation
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Persistent sidebar navigation with collapsible sections',
    category: 'Navigation',
    icon: PanelTop,
    exportName: 'Sidebar',
    path: '/design-system/component/sidebar'
  },
  {
    id: 'mobile-bottom-nav',
    name: 'Mobile Bottom Nav',
    description: 'Mobile-first bottom navigation bar for primary actions',
    category: 'Navigation',
    icon: Smartphone,
    exportName: 'MobileBottomNav',
    path: '/design-system/component/mobile-bottom-nav'
  },
  {
    id: 'sidebar-layout',
    name: 'Sidebar Layout',
    description: 'Complete layout with sidebar and main content area',
    category: 'Navigation',
    icon: Layout,
    exportName: 'SidebarLayout',
    path: '/design-system/component/sidebar-layout'
  },

  // Special Components
  {
    id: 'modal',
    name: 'Modal',
    description: 'Overlay dialog component with multiple sizes and close actions',
    category: 'Special',
    icon: Monitor,
    exportName: 'Modal',
    path: '/design-system/component/modal'
  },
  {
    id: 'delete-confirmation-dialog',
    name: 'Delete Confirmation Dialog',
    description: 'Specialized modal for delete confirmations with danger styling',
    category: 'Special',
    icon: Trash2,
    exportName: 'DeleteConfirmationDialog',
    path: '/design-system/component/delete-confirmation-dialog'
  },
  {
    id: 'insufficient-tokens-dialog',
    name: 'Insufficient Tokens Dialog',
    description: 'Dialog shown when user runs out of AI tokens',
    category: 'Special',
    icon: Zap,
    exportName: 'InsufficientTokensDialog',
    path: '/design-system/component/insufficient-tokens-dialog'
  },
  {
    id: 'insufficient-storage-dialog',
    name: 'Insufficient Storage Dialog',
    description: 'Dialog shown when user runs out of storage space',
    category: 'Special',
    icon: HardDrive,
    exportName: 'InsufficientStorageDialog',
    path: '/design-system/component/insufficient-storage-dialog'
  },
  {
    id: 'color-palette',
    name: 'Color Palette',
    description: 'Complete VibrationFit brand color palette with all variants, gradients, and semantic colors',
    category: 'Special',
    icon: Palette,
    exportName: 'ColorPalette',
    path: '/design-system/component/color-palette'
  },
]

export function getComponentById(id: string): ComponentMetadata | undefined {
  return DESIGN_SYSTEM_COMPONENTS.find(comp => comp.id === id)
}

export function getComponentsByCategory(category: ComponentMetadata['category']): ComponentMetadata[] {
  return DESIGN_SYSTEM_COMPONENTS.filter(comp => comp.category === category)
}

export const COMPONENT_CATEGORIES: ComponentMetadata['category'][] = [
  'Layout',
  'UI',
  'Feedback',
  'Media',
  'Typography',
  'Navigation',
  'Special',
  'Patterns'
]

