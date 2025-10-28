'use client'

// Individual Design System Component Showcase Page
// Displays detailed information, examples, and props for a single component

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Code, Eye } from 'lucide-react'
import {
  Card,
  Button,
  Stack,
  Grid,
  Inline,
  Icon,
  Badge,
} from '@/lib/design-system/components'
import {
  DESIGN_SYSTEM_COMPONENTS,
  getComponentById,
  type ComponentMetadata,
} from '../../components'
import { ComponentShowcase } from './ComponentShowcase'

export default function ComponentPage() {
  const params = useParams()
  const router = useRouter()
  const componentName = params.componentName as string
  const component = getComponentById(componentName)

  if (!component) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Component Not Found
        </h1>
        <p className="text-neutral-400 mb-6">
          The component "{componentName}" doesn't exist.
        </p>
        <Button onClick={() => router.push('/experiment/design-system')}>
          Back to Components
        </Button>
      </Card>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <Inline gap="sm" className="flex-wrap items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/experiment/design-system')}
              className="flex items-center gap-2"
            >
              <Icon icon={ArrowLeft} size="sm" />
              Back to All Components
            </Button>
          <Badge variant="primary">{component.category}</Badge>
        </Inline>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Icon icon={component.icon} size="lg" color="#39FF14" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {component.name}
              </h1>
              <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                {component.description}
              </p>
            </div>
          </div>
        </div>
      </Stack>
      </Card>

      {/* Component Showcase */}
      <ComponentShowcase component={component} />
    </Stack>
  )
}

