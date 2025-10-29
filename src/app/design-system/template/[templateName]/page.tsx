'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  Button,
  Stack,
  Icon,
  Badge,
} from '@/lib/design-system/components'
import {
  LAYOUT_TEMPLATES,
  getTemplateById,
  type LayoutTemplateMetadata
} from '../../layout-templates'
import { TemplateShowcase } from './TemplateShowcase'

export default function TemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateName = params.templateName as string
  const template = getTemplateById(templateName)

  if (!template) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Template Not Found
        </h1>
        <p className="text-neutral-400 mb-6">
          The template "{templateName}" doesn't exist.
        </p>
        <Button onClick={() => router.push('/design-system')}>
          Back to Design System
        </Button>
      </Card>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card className="p-4 md:p-6">
        <Stack gap="md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/design-system')}
            className="flex items-center gap-2 w-fit"
          >
            <Icon icon={ArrowLeft} size="sm" />
            Back to Design System
          </Button>
          <Badge variant="premium">{template.category}</Badge>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent-500/20 rounded-xl flex items-center justify-center">
                <Icon icon={template.icon} size="lg" color="#BF00FF" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                  {template.name}
                </h1>
                <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                  {template.description}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-700">
            <Stack gap="xs">
              <p className="text-xs text-neutral-500">Source Location:</p>
              <code className="text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded">
                {template.sourcePath}
              </code>
              <p className="text-xs text-neutral-500 mt-2">Components Used:</p>
              <div className="flex flex-wrap gap-2">
                {template.componentsUsed.map((comp) => (
                  <Badge key={comp} variant="secondary" className="text-xs">
                    {comp}
                  </Badge>
                ))}
              </div>
            </Stack>
          </div>
        </Stack>
      </Card>

      {/* Template Showcase */}
      <TemplateShowcase template={template} />
    </Stack>
  )
}

