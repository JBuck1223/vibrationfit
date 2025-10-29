// Layout Templates - Reusable combinations of design system components
// These are real-world templates found in the codebase that combine multiple components

import { 
  Layout, CreditCard, Shield, Sparkles, Grid as GridIcon, 
  Package, Box, Layers
} from 'lucide-react'

export interface LayoutTemplateMetadata {
  id: string
  name: string
  description: string
  icon: typeof Layout
  sourcePath: string // Where this template is used
  componentsUsed: string[] // Component names that make up this template
  category: 'Pricing' | 'Marketing' | 'Product' | 'Navigation' | 'Content'
  path: string
}

export const LAYOUT_TEMPLATES: LayoutTemplateMetadata[] = [
  {
    id: 'guarantee-cards',
    name: 'Guarantee Cards',
    description: 'Two-column guarantee cards with floating badges and gradient backgrounds (used in homepage guarantees section)',
    icon: Shield,
    sourcePath: '/page.tsx (Guarantees Section)',
    componentsUsed: ['Card', 'Stack', 'TwoColumn', 'Heading', 'Text', 'Icon'],
    category: 'Marketing',
    path: '/design-system/template/guarantee-cards'
  },
  {
    id: 'pricing-cards-toggle',
    name: 'Pricing Cards with Toggle',
    description: 'Interactive pricing cards that show/hide based on billing period toggle (Annual vs 28-Day)',
    icon: CreditCard,
    sourcePath: '/page.tsx (Pricing Section)',
    componentsUsed: ['Card', 'Stack', 'Toggle', 'Heading', 'Text', 'Button', 'Badge'],
    category: 'Pricing',
    path: '/design-system/template/pricing-cards-toggle'
  },
  {
    id: 'payment-options',
    name: 'Payment Options Selector',
    description: 'Horizontal button group for selecting payment plans (Full, 2 Payments, 3 Payments)',
    icon: CreditCard,
    sourcePath: '/page.tsx (Pricing Section)',
    componentsUsed: ['Button', 'Stack', 'Inline'],
    category: 'Pricing',
    path: '/design-system/template/payment-options'
  },
]

export function getTemplateById(id: string): LayoutTemplateMetadata | undefined {
  return LAYOUT_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCategory(category: LayoutTemplateMetadata['category']): LayoutTemplateMetadata[] {
  return LAYOUT_TEMPLATES.filter(template => template.category === category)
}

export const TEMPLATE_CATEGORIES: LayoutTemplateMetadata['category'][] = [
  'Pricing',
  'Marketing',
  'Product',
  'Navigation',
  'Content'
]

