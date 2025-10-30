'use client'

import { useState } from 'react'
import { Code, Copy, Check } from 'lucide-react'
import {
  Card,
  Button,
  Stack,
  Icon,
  Badge,
} from '@/lib/design-system/components'
import type { LayoutTemplateMetadata } from '../../layout-templates'
import { renderTemplateExample } from './template-examples'

interface TemplateShowcaseProps {
  template: LayoutTemplateMetadata
}

export function TemplateShowcase({ template }: TemplateShowcaseProps) {
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const templateCode = getTemplateCode(template)

  const handleCopy = () => {
    navigator.clipboard.writeText(templateCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Stack gap="lg">
      {/* Live Example */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Live Example
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
              >
                <Icon icon={Code} size="sm" className="mr-2" />
                {showCode ? 'Hide' : 'Show'} Code
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                title="Copy template code"
              >
                <Icon
                  icon={copied ? Check : Copy}
                  size="sm"
                  className={copied ? 'text-primary-500' : ''}
                />
              </Button>
            </div>
          </div>

          {showCode && (
            <div className="relative">
              <pre className="bg-neutral-900 rounded-lg p-4 overflow-x-auto border border-neutral-700">
                <code className="text-xs md:text-sm text-neutral-300 font-mono">
                  {templateCode}
                </code>
              </pre>
            </div>
          )}

          <div className="pt-4">
            {renderTemplateExample(template.id)}
          </div>
        </Stack>
      </Card>

      {/* Usage Notes */}
      <Card variant="outlined" className="p-4 md:p-6 bg-neutral-900/50">
        <Stack gap="sm">
          <h4 className="text-base md:text-lg font-semibold text-white">
            Usage Notes
          </h4>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-1">•</span>
              <span>
                This template is extracted from production code and is ready to use
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-1">•</span>
              <span>
                All components used are from the design system - no custom code required
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-1">•</span>
              <span>
                Modify colors, text, and content to match your use case
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-1">•</span>
              <span>
                All templates follow mobile-first responsive design principles
              </span>
            </li>
          </ul>
        </Stack>
      </Card>
    </Stack>
  )
}

function getTemplateCode(template: LayoutTemplateMetadata): string {
  // Generate code snippets based on template ID
  switch (template.id) {
    case 'guarantee-cards':
      return `// Guarantee Cards Template
// Uses: Card, Stack, TwoColumn, Heading, Text, Icon

<Card variant="elevated" className="bg-[#1F1F1F] border-[#333] p-6 md:p-8">
  <Stack gap="xs" className="md:gap-3" align="center">
    <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
      <Icon icon={Shield} size="lg" color="#000000" />
    </div>
    <Heading level={2} className="text-center mb-0">Our Guarantees</Heading>
    
    <TwoColumn gap="lg">
      {/* First Guarantee Card */}
      <Card 
        variant="elevated" 
        className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 relative pt-28 md:pt-32 mt-24 md:mt-28"
      >
        <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
          {/* Badge image goes here */}
        </div>
        <Stack gap="md" align="center">
          <Heading level={3} className="text-white text-center">
            72‑Hour Activation Guarantee
          </Heading>
          <Text size="base" className="text-white text-center">
            Your guarantee description here
          </Text>
        </Stack>
      </Card>

      {/* Second Guarantee Card */}
      <Card 
        variant="elevated" 
        className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30 relative pt-28 md:pt-32 mt-24 md:mt-28"
      >
        {/* Similar structure */}
      </Card>
    </TwoColumn>
  </Stack>
</Card>`

    case 'pricing-cards-toggle':
      return `// Pricing Cards with Toggle Template
// Uses: Card, Stack, Toggle (or custom), Heading, Text, Button, Badge

const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')

{/* Toggle */}
<div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700 mx-auto mb-8">
  <button onClick={() => setBillingPeriod('annual')}>
    Annual
  </button>
  <button onClick={() => setBillingPeriod('28day')}>
    28-Day
  </button>
</div>

{/* Conditional Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {billingPeriod === 'annual' && (
    <Card className="border-2 border-[#39FF14]">
      <Heading level={3}>Vision Pro Annual</Heading>
      {/* Pricing details */}
    </Card>
  )}
  {billingPeriod === '28day' && (
    <Card className="border-2 border-[#00FFFF]">
      <Heading level={3}>Vision Pro 28-Day</Heading>
      {/* Pricing details */}
    </Card>
  )}
</div>`

    case 'payment-options':
      return `// Payment Options Selector Template
// Uses: Button, Stack, Inline

const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')

<Stack gap="md" align="center">
  <Heading level={3}>Payment Options</Heading>
  <div className="flex flex-row flex-wrap gap-2 justify-center w-full">
    <Button
      variant={paymentPlan === 'full' ? 'primary' : 'outline'}
      size="sm"
      className="flex-1 min-w-0"
      onClick={() => setPaymentPlan('full')}
    >
      Pay in Full
    </Button>
    <Button
      variant={paymentPlan === '2pay' ? 'primary' : 'outline'}
      size="sm"
      className="flex-1 min-w-0"
      onClick={() => setPaymentPlan('2pay')}
    >
      2 Payments
    </Button>
    <Button
      variant={paymentPlan === '3pay' ? 'primary' : 'outline'}
      size="sm"
      className="flex-1 min-w-0"
      onClick={() => setPaymentPlan('3pay')}
    >
      3 Payments
    </Button>
  </div>
</Stack>`

    case 'category-selection-grid':
      return `// Category Selection Grid Template
// Uses: Card, Grid, Icon
// Responsive: 4 cols mobile, 6 cols tablet, 14 cols desktop (when Forward/Conclusion included)

import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
const hasForwardConclusion = VISION_CATEGORIES.some(
  cat => cat.key === 'forward' || cat.key === 'conclusion'
)

<div className={\`grid grid-cols-4 md:grid-cols-6 gap-2 \${
  hasForwardConclusion
    ? 'lg:grid-cols-[repeat(14,minmax(0,1fr))]'
    : 'lg:grid-cols-[repeat(12,minmax(0,1fr))]'
}\`}>
  {VISION_CATEGORIES.map((category) => {
    const IconComponent = category.icon
    return (
      <Card
        key={category.key}
        variant="outlined"
        hover
        className={\`cursor-pointer aspect-square \${
          selectedCategory === category.key 
            ? 'border border-primary-500' 
            : ''
        }\`}
        onClick={() => setSelectedCategory(category.key)}
      >
        <div className="flex flex-col items-center gap-2 p-2 justify-center h-full">
          <Icon 
            icon={IconComponent} 
            size="sm" 
            color={selectedCategory === category.key ? '#39FF14' : '#14B8A6'} 
          />
          <span className="text-xs font-medium text-center text-neutral-300">
            {category.label}
          </span>
        </div>
      </Card>
    )
  })}
</div>`

    default:
      return `// ${template.name}\n// Full code available in template-examples.tsx`
  }
}

