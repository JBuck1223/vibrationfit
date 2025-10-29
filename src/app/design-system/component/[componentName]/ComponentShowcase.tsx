'use client'

// Component Showcase - Renders examples and documentation for a component
// This will be dynamically generated based on component type

import { useState } from 'react'
import { Code, Eye, Copy, Check } from 'lucide-react'
import {
  Card,
  Button,
  Stack,
  Grid,
  Inline,
  Badge,
  Icon,
} from '@/lib/design-system/components'
import type { ComponentMetadata } from '../../components'
import { renderComponentExamples } from './component-examples'
import { getComponentProps } from './component-props'

interface ComponentShowcaseProps {
  component: ComponentMetadata
}

// Props Documentation Component
function ComponentPropsDocs({ componentId }: { componentId: string }) {
  const props = getComponentProps(componentId)

  if (props.length === 0) {
    return (
      <div className="text-center p-8 text-neutral-400">
        <p className="text-sm md:text-base mb-2">
          Props documentation coming soon
        </p>
        <p className="text-xs text-neutral-500">
          All components accept standard HTML attributes plus component-specific props
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-neutral-800 border-b border-neutral-700 text-xs md:text-sm font-semibold text-neutral-300">
          <div>Prop Name</div>
          <div>Type</div>
          <div>Required</div>
          <div>Default</div>
          <div>Description</div>
        </div>
        <div className="divide-y divide-neutral-700">
          {props.map((prop, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 text-xs md:text-sm hover:bg-neutral-800/50 transition-colors"
            >
              <div className="font-medium text-primary-500 font-mono">
                {prop.name}
              </div>
              <div className="text-neutral-300 font-mono text-xs">
                {prop.type}
              </div>
              <div>
                {prop.required ? (
                  <Badge variant="danger">Required</Badge>
                ) : (
                  <Badge variant="neutral">Optional</Badge>
                )}
              </div>
              <div className="text-neutral-400 font-mono text-xs">
                {prop.defaultValue || '—'}
              </div>
              <div className="text-neutral-400">
                {prop.description || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ComponentShowcase({ component }: ComponentShowcaseProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  // This will be expanded to render actual component examples
  // For now, creating a template structure
  
  const importCode = `import { ${component.exportName} } from '@/lib/design-system/components'`

  const handleCopy = () => {
    navigator.clipboard.writeText(importCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Stack gap="md">
      {/* View Toggle */}
      <Card className="p-4">
        <Inline gap="sm">
          <Button
            variant={viewMode === 'preview' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="flex items-center gap-2"
          >
            <Icon icon={Eye} size="sm" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'code' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('code')}
            className="flex items-center gap-2"
          >
            <Icon icon={Code} size="sm" />
            Code
          </Button>
        </Inline>
      </Card>

      {/* Import Code */}
      <Card className="p-4 md:p-6">
        <Stack gap="sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-semibold text-white">
              Import
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              <Icon icon={copied ? Check : Copy} size="sm" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
            <code className="text-xs md:text-sm text-primary-500 font-mono">
              {importCode}
            </code>
          </div>
        </Stack>
      </Card>

      {/* Examples Section - Dynamically rendered based on component */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <h3 className="text-base md:text-lg font-semibold text-white">
            Examples
          </h3>
          {renderComponentExamples(component)}
        </Stack>
      </Card>

      {/* Props Documentation - Auto-generated from TypeScript types */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-semibold text-white">
              Props
            </h3>
            <Badge variant="info">From TypeScript types</Badge>
          </div>
          <div className="text-xs text-neutral-400 mb-2">
            Props documentation is extracted from the TypeScript interfaces defined in{' '}
            <code className="bg-neutral-800 px-1 py-0.5 rounded text-primary-500">components.tsx</code>.
            This registry is maintained to match the actual component prop types.
          </div>
          <ComponentPropsDocs componentId={component.id} />
        </Stack>
      </Card>

      {/* Usage Guidelines */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <h3 className="text-base md:text-lg font-semibold text-white">
            Usage Guidelines
          </h3>
          <Stack gap="sm">
            <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-500 mb-2">
                ✅ Mobile-First
              </h4>
              <p className="text-xs md:text-sm text-neutral-300">
                All components follow mobile-first design principles. Test on 375px viewport minimum.
              </p>
            </div>
            <div className="bg-secondary-500/10 border border-secondary-500/20 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-secondary-500 mb-2">
                📱 Responsive
              </h4>
              <p className="text-xs md:text-sm text-neutral-300">
                Components automatically adapt to different screen sizes with responsive classes.
              </p>
            </div>
            <div className="bg-accent-500/10 border border-accent-500/20 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-accent-500 mb-2">
                ♿ Accessible
              </h4>
              <p className="text-xs md:text-sm text-neutral-300">
                All components include proper ARIA attributes and keyboard navigation support.
              </p>
            </div>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}

