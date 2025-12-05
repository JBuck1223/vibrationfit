'use client'

import { PageHeader } from '@/lib/design-system/components'
import { Calendar, CheckCircle, Edit, Download, Sparkles, VolumeX, Gem, Eye } from 'lucide-react'

export const PageHeaderExamples = {
  basic: {
    title: 'Basic Header',
    description: 'Simple page header with just title',
    component: (
      <PageHeader
        title="Page Title"
      />
    ),
    code: `<PageHeader
  title="Page Title"
/>`
  },

  withEyebrow: {
    title: 'With Eyebrow',
    description: 'Header with eyebrow text above title',
    component: (
      <PageHeader
        eyebrow="TRACKING"
        title="Daily Paper"
      />
    ),
    code: `<PageHeader
  eyebrow="TRACKING"
  title="Daily Paper"
/>`
  },

  withSubtitle: {
    title: 'With Subtitle',
    description: 'Header with descriptive subtitle',
    component: (
      <PageHeader
        eyebrow="THE LIFE I CHOOSE"
        title="Life Vision"
        subtitle="Your complete life vision across 12 categories of life"
      />
    ),
    code: `<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
  subtitle="Your complete life vision across 12 categories of life"
/>`
  },

  withBadges: {
    title: 'With Badges',
    description: 'Header with status badges',
    component: (
      <PageHeader
        eyebrow="THE LIFE I CHOOSE"
        title="Life Vision"
        badges={[
          { label: 'V2', variant: 'primary' },
          { label: 'Active', variant: 'success', icon: CheckCircle }
        ]}
      />
    ),
    code: `<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
  badges={[
    { label: 'V2', variant: 'primary' },
    { label: 'Active', variant: 'success', icon: CheckCircle }
  ]}
/>`
  },

  withMetadata: {
    title: 'With Metadata',
    description: 'Header with metadata items',
    component: (
      <PageHeader
        eyebrow="THE LIFE I CHOOSE"
        title="Life Vision"
        badges={[
          { label: 'V2', variant: 'primary' },
          { label: 'Active', variant: 'success' }
        ]}
        metaItems={[
          { label: 'Created', value: 'Jan 15, 2024', icon: Calendar }
        ]}
      />
    ),
    code: `<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
  badges={[
    { label: 'V2', variant: 'primary' },
    { label: 'Active', variant: 'success' }
  ]}
  metaItems={[
    { label: 'Created', value: 'Jan 15, 2024', icon: Calendar }
  ]}
/>`
  },

  withActions: {
    title: 'With Action Buttons',
    description: 'Header with action buttons',
    component: (
      <PageHeader
        eyebrow="THE LIFE I CHOOSE"
        title="Life Vision"
        subtitle="Your complete life vision across 12 categories"
        badges={[
          { label: 'V2', variant: 'primary' },
          { label: 'Active', variant: 'success' }
        ]}
        metaItems={[
          { label: 'Created', value: 'Jan 15, 2024', icon: Calendar }
        ]}
        actions={[
          {
            label: 'Audio Tracks',
            href: '/audio',
            variant: 'outline',
            icon: VolumeX
          },
          {
            label: 'Download PDF',
            href: '/pdf',
            variant: 'outline',
            icon: Download
          },
          {
            label: 'Refine with AI',
            onClick: () => alert('Refining...'),
            variant: 'primary',
            icon: Sparkles
          }
        ]}
      />
    ),
    code: `<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
  subtitle="Your complete life vision across 12 categories"
  badges={[
    { label: 'V2', variant: 'primary' },
    { label: 'Active', variant: 'success' }
  ]}
  metaItems={[
    { label: 'Created', value: 'Jan 15, 2024', icon: Calendar }
  ]}
  actions={[
    {
      label: 'Audio Tracks',
      href: '/audio',
      variant: 'outline',
      icon: VolumeX
    },
    {
      label: 'Download PDF',
      href: '/pdf',
      variant: 'outline',
      icon: Download
    },
    {
      label: 'Refine with AI',
      onClick: () => alert('Refining...'),
      variant: 'primary',
      icon: Sparkles
    }
  ]}
/>`
  },

  draftVision: {
    title: 'Draft Vision Header',
    description: 'Header for draft vision with yellow accents',
    component: (
      <PageHeader
        eyebrow="THE LIFE I CHOOSE"
        title="Refine Life Vision"
        subtitle="Refined categories will show in yellow. Once you are happy with your refinement(s), click 'Commit as Active Vision'."
        badges={[
          { label: 'V3', variant: 'primary' },
          { label: 'Draft', variant: 'warning' }
        ]}
        metaItems={[
          { label: 'Created', value: 'Jan 20, 2024', icon: Calendar }
        ]}
        actions={[
          {
            label: 'View Active',
            href: '/active',
            variant: 'outline',
            icon: Eye
          },
          {
            label: 'Continue Refining',
            onClick: () => alert('Refining...'),
            variant: 'outline',
            icon: Gem,
            className: 'bg-[#FFFF00]/20 text-[#FFFF00] hover:bg-[#FFFF00]/30'
          },
          {
            label: 'Commit as Active Vision',
            onClick: () => alert('Committing...'),
            variant: 'primary',
            icon: CheckCircle
          }
        ]}
      />
    ),
    code: `<PageHeader
  eyebrow="THE LIFE I CHOOSE"
  title="Refine Life Vision"
  subtitle="Refined categories will show in yellow..."
  badges={[
    { label: 'V3', variant: 'primary' },
    { label: 'Draft', variant: 'warning' }
  ]}
  metaItems={[
    { label: 'Created', value: 'Jan 20, 2024', icon: Calendar }
  ]}
  actions={[
    {
      label: 'View Active',
      href: '/active',
      variant: 'outline',
      icon: Eye
    },
    {
      label: 'Continue Refining',
      onClick: () => alert('Refining...'),
      variant: 'outline',
      icon: Gem,
      className: 'bg-[#FFFF00]/20 text-[#FFFF00] hover:bg-[#FFFF00]/30'
    },
    {
      label: 'Commit as Active Vision',
      onClick: () => alert('Committing...'),
      variant: 'primary',
      icon: CheckCircle
    }
  ]}
/>`
  },

  noGradient: {
    title: 'Without Gradient',
    description: 'Header without background gradient',
    component: (
      <PageHeader
        title="Simple Header"
        subtitle="No gradient background"
        gradient={false}
        actions={[
          {
            label: 'Action',
            onClick: () => {},
            variant: 'primary'
          }
        ]}
      />
    ),
    code: `<PageHeader
  title="Simple Header"
  subtitle="No gradient background"
  gradient={false}
  actions={[
    {
      label: 'Action',
      onClick: () => {},
      variant: 'primary'
    }
  ]}
/>`
  },
}

