export const componentProps = {
  name: 'PageHeader',
  description: 'Centered page header with eyebrow, title, badges, metadata, and actions. Based on the life-vision page header pattern.',
  props: [
    {
      name: 'eyebrow',
      type: 'React.ReactNode',
      optional: true,
      description: 'Small uppercase text displayed above the title'
    },
    {
      name: 'title',
      type: 'React.ReactNode',
      optional: false,
      description: 'Main page title (large, centered, bold)'
    },
    {
      name: 'subtitle',
      type: 'React.ReactNode',
      optional: true,
      description: 'Descriptive text displayed below the title'
    },
    {
      name: 'badges',
      type: 'PageHeaderBadge[]',
      optional: true,
      description: 'Array of status badges displayed in the metadata section'
    },
    {
      name: 'metaItems',
      type: 'PageHeaderMetaItem[]',
      optional: true,
      description: 'Array of metadata items (label/value pairs) with optional icons'
    },
    {
      name: 'actions',
      type: 'PageHeaderAction[]',
      optional: true,
      description: 'Array of action buttons displayed below the metadata'
    },
    {
      name: 'gradient',
      type: 'boolean',
      optional: true,
      description: 'Whether to show the gradient background (default: true)'
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      optional: true,
      description: 'Additional custom content displayed below the actions'
    },
    {
      name: 'className',
      type: 'string',
      optional: true,
      description: 'Additional CSS classes to apply to the container'
    }
  ],
  types: [
    {
      name: 'PageHeaderBadge',
      definition: `{
  label: React.ReactNode
  variant?: BadgeProps['variant']
  icon?: LucideIcon
  className?: string
}`
    },
    {
      name: 'PageHeaderMetaItem',
      definition: `{
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}`
    },
    {
      name: 'PageHeaderAction',
      definition: `{
  label: string
  onClick?: () => void
  href?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  className?: string
}`
    }
  ],
  usage: `import { PageHeader } from '@/lib/design-system/components'
import { CheckCircle, Calendar, Edit } from 'lucide-react'

<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
  subtitle="Your complete life vision across 12 categories"
  badges={[
    { label: 'V2', variant: 'primary' },
    { label: 'Active', variant: 'success', icon: CheckCircle }
  ]}
  metaItems={[
    { label: 'Created', value: 'Jan 15, 2024', icon: Calendar }
  ]}
  actions={[
    {
      label: 'Edit Vision',
      onClick: () => console.log('edit'),
      variant: 'primary',
      icon: Edit
    }
  ]}
/>`,
  notes: [
    'Based on the /life-vision/[id] page header pattern',
    'All content is centered for maximum impact',
    'Badges and metadata items are displayed in a pill-shaped container',
    'Action buttons automatically distribute space and stack on mobile',
    'Optional gradient background provides visual hierarchy',
    'Supports both href (link) and onClick (button) actions'
  ]
}

