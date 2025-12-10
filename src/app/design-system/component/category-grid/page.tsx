'use client'

// Category Grid Component Showcase Page
// Displays detailed information, examples, and props for the CategoryGrid component

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Code, Eye, Grid as GridIcon, Check, Copy } from 'lucide-react'
import {
  Card,
  Button,
  Stack,
  Grid,
  Inline,
  Icon,
  Badge,
  Container,
} from '@/lib/design-system/components'
import { CategoryGridExamples } from './component-examples'
import { componentProps } from './component-props'

export default function CategoryGridShowcase() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copiedExample, setCopiedExample] = useState<string | null>(null)

  const copyCode = (code: string, exampleKey: string) => {
    navigator.clipboard.writeText(code)
    setCopiedExample(exampleKey)
    setTimeout(() => setCopiedExample(null), 2000)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <Inline gap="sm" className="flex-wrap items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/design-system')}
                className="flex items-center gap-2"
              >
                <Icon icon={ArrowLeft} size="sm" />
                Back to All Components
              </Button>
              <Badge variant="primary">Patterns</Badge>
            </Inline>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Icon icon={GridIcon} size="lg" color="#39FF14" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                    {componentProps.name}
                  </h1>
                  <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                    {componentProps.description}
                  </p>
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Mode Overview */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Three Modes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="outlined" className="p-4">
                <h3 className="text-lg font-semibold text-primary-500 mb-2">Selection Mode</h3>
                <p className="text-sm text-neutral-400">
                  Default mode. No badges. Used for filtering content (life-vision, journal, vision-board).
                </p>
              </Card>
              <Card variant="outlined" className="p-4">
                <h3 className="text-lg font-semibold text-primary-500 mb-2">Completion Mode</h3>
                <p className="text-sm text-neutral-400">
                  Shows <span className="text-primary-500">green checkmarks</span> on completed sections. Used for progress tracking.
                </p>
              </Card>
              <Card variant="outlined" className="p-4">
                <h3 className="text-lg font-semibold text-[#FFFF00] mb-2">Draft Mode</h3>
                <p className="text-sm text-neutral-400">
                  Shows <span className="text-[#FFFF00]">yellow checkmarks</span> on changed sections. Used for highlighting refinements.
                </p>
              </Card>
            </div>
          </Stack>
        </Card>

        {/* Custom Categories */}
        <Card className="p-4 md:p-6 bg-primary-500/5 border-primary-500/20">
          <Stack gap="md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-500 text-xl">✨</span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Custom Categories Supported
                </h2>
                <p className="text-neutral-300 mb-4">
                  CategoryGrid accepts <strong>any category array</strong> with <code className="bg-neutral-900 px-2 py-0.5 rounded text-primary-500">{`{key, label, icon}`}</code> structure. 
                  You're not limited to <code className="bg-neutral-900 px-2 py-0.5 rounded text-secondary-500">VISION_CATEGORIES</code>.
                </p>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                  <p className="text-sm text-neutral-400 mb-3">
                    <strong className="text-white">Example:</strong> Profile edit pages add "Personal" and "Media" sections:
                  </p>
                  <pre className="text-xs text-neutral-300 overflow-x-auto">
                    <code>{`const profileCategories = [
  { key: 'personal', label: 'Personal', icon: User },
  ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13),
  { key: 'photos-notes', label: 'Media', icon: Camera }
]

<CategoryGrid categories={profileCategories} ... />`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Usage Example */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Basic Usage
            </h2>
            <div className="relative">
              <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-xl overflow-x-auto text-sm">
                <code>{componentProps.usage}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyCode(componentProps.usage, 'usage')}
              >
                {copiedExample === 'usage' ? (
                  <Icon icon={Check} size="sm" color="#39FF14" />
                ) : (
                  <Icon icon={Copy} size="sm" />
                )}
              </Button>
            </div>
          </Stack>
        </Card>

        {/* Props Documentation */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Props
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-neutral-400 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-semibold">Required</th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {componentProps.props.map((prop) => (
                    <tr key={prop.name} className="border-b border-neutral-800">
                      <td className="py-3 px-4 font-mono text-primary-500">{prop.name}</td>
                      <td className="py-3 px-4 font-mono text-sm text-neutral-400">{prop.type}</td>
                      <td className="py-3 px-4">
                        <Badge variant={prop.optional ? 'secondary' : 'primary'}>
                          {prop.optional ? 'Optional' : 'Required'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-neutral-300">{prop.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Stack>
        </Card>

        {/* Examples */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Examples
              </h2>
              <Inline gap="xs">
                <Button
                  variant={viewMode === 'preview' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                >
                  <Icon icon={Eye} size="sm" className="mr-2" />
                  Preview
                </Button>
                <Button
                  variant={viewMode === 'code' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('code')}
                >
                  <Icon icon={Code} size="sm" className="mr-2" />
                  Code
                </Button>
              </Inline>
            </div>

            <Stack gap="lg">
              {Object.entries(CategoryGridExamples).map(([key, example]) => (
                <Card key={key} variant="outlined" className="p-4 md:p-6">
                  <Stack gap="md">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {example.title}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {example.description}
                      </p>
                    </div>

                    {viewMode === 'preview' ? (
                      <div className="border-2 border-neutral-800 rounded-xl p-4 bg-black">
                        {example.component}
                      </div>
                    ) : (
                      <div className="relative">
                        <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-xl overflow-x-auto text-sm">
                          <code>{example.code}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(example.code, key)}
                        >
                          {copiedExample === key ? (
                            <Icon icon={Check} size="sm" color="#39FF14" />
                          ) : (
                            <Icon icon={Copy} size="sm" />
                          )}
                        </Button>
                      </div>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>

        {/* Notes & Best Practices */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Notes & Best Practices
            </h2>
            <ul className="space-y-2">
              {componentProps.notes.map((note, index) => (
                <li key={index} className="flex items-start gap-3 text-neutral-300">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </Stack>
        </Card>

        {/* Real-World Examples */}
        {componentProps.examples && (
          <Card className="p-4 md:p-6">
            <Stack gap="md">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Real-World Examples
              </h2>
              <ul className="space-y-2">
                {componentProps.examples.map((example, index) => (
                  <li key={index} className="flex items-start gap-3 text-neutral-300">
                    <span className="text-secondary-500 mt-1">→</span>
                    <code className="text-sm bg-neutral-900 px-2 py-1 rounded">{example}</code>
                  </li>
                ))}
              </ul>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

