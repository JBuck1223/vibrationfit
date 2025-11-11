'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Beaker, CheckCircle, Lightbulb } from 'lucide-react'
import {
  Card,
  Stack,
  Inline,
  Button,
  Icon,
  Badge,
  Heading,
  Text,
} from '@/lib/design-system/components'
import {
  getExperimentalComponentById,
  type ExperimentalComponentDefinition,
} from '@/lib/design-system/components-experiment'

const STATUS_CONFIG: Record<
  NonNullable<ExperimentalComponentDefinition['status']>,
  { label: string; badge: 'success' | 'info' | 'warning'; blurb: string; icon: typeof Lightbulb }
> = {
  exploratory: {
    label: 'Exploratory',
    badge: 'warning',
    blurb: 'Actively exploring alternative treatments. Expect rapid iteration and visual experimentation.',
    icon: Lightbulb,
  },
  'in-review': {
    label: 'In Review',
    badge: 'info',
    blurb: 'Under review for accessibility, responsiveness, and alignment with the brand kit.',
    icon: Beaker,
  },
  validated: {
    label: 'Validated',
    badge: 'success',
    blurb: 'Ready for promotion into the canonical design system once implementation is complete.',
    icon: CheckCircle,
  },
}

export default function ExperimentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const experimentId = params.experimentId as string
  const experiment = getExperimentalComponentById(experimentId)

  if (!experiment) {
    return (
      <Card className="p-8 text-center space-y-4">
        <Heading level={2} className="text-white">
          Experiment Not Found
        </Heading>
        <Text size="sm" className="text-neutral-400">
          The requested experiment `{experimentId}` does not exist. Return to the design system overview to see the current lab
          inventory.
        </Text>
        <Button onClick={() => router.push('/design-system')}>Back to Design System</Button>
      </Card>
    )
  }

  const status = experiment.status ?? 'exploratory'
  const statusConfig = STATUS_CONFIG[status]
  const Preview = experiment.component

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <Inline gap="sm" className="flex-wrap items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/design-system')}
              className="flex items-center gap-2"
            >
              <Icon icon={ArrowLeft} size="sm" />
              Back to Design System
            </Button>

            <Badge variant={statusConfig.badge} className="flex items-center gap-1">
              <Icon icon={statusConfig.icon} size="xs" />
              {statusConfig.label}
            </Badge>
          </Inline>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/15 border border-primary-500/40 flex items-center justify-center">
                <Icon icon={experiment.icon} size="lg" color="#39FF14" />
              </div>
              <div>
                <Heading level={1} className="text-white mb-2">
                  {experiment.name}
                </Heading>
                <Text size="sm" className="max-w-2xl text-neutral-400">
                  {experiment.description}
                </Text>
              </div>
            </div>
          </div>
        </Stack>
      </Card>

      {/* Overview */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <Heading level={3} className="text-white">
            Experiment Overview
          </Heading>
          <Text size="sm" className="max-w-3xl text-neutral-400">
            {statusConfig.blurb}
          </Text>
          <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
            <li>References live design tokens directly from `tokens.ts` for immediate theming parity.</li>
            <li>Intended for rapid iteration. Copy learnings back into the production component deliberately.</li>
            <li>Review responsiveness, focus states, and accessibility before promoting into the main library.</li>
          </ul>
        </Stack>
      </Card>

      {/* Preview */}
      <Card variant="outlined" className="p-4 md:p-6">
        <Stack gap="md">
          <Heading level={3} className="text-white">
            Live Preview
          </Heading>
          <Text size="sm" className="text-neutral-400">
            Interact with the experimental treatment below. Use this surface to evaluate spacing, motion, and color decisions.
          </Text>
          <div className="border border-neutral-700 rounded-2xl p-4 md:p-6 bg-neutral-900/40">
            <Preview />
          </div>
        </Stack>
      </Card>
    </Stack>
  )
}

