'use client'

/**
 * Create New SMS Template
 * 
 * Form for creating a new SMS template
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Input,
  Textarea,
  Spinner,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { MessageSquare, Save, ArrowLeft, Plus, X, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'reminders', label: 'Reminders' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'billing', label: 'Billing' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'household', label: 'Household' },
  { value: 'intensive', label: 'Intensive' },
  { value: 'other', label: 'Other' },
]

export default function NewSMSTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'other',
    status: 'draft',
    body: '',
    variables: [] as string[],
    triggers: [] as string[],
  })

  const [newVariable, setNewVariable] = useState('')
  const [newTrigger, setNewTrigger] = useState('')

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, name, slug }))
  }

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable],
      }))
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable),
    }))
  }

  const addTrigger = () => {
    if (newTrigger && !formData.triggers.includes(newTrigger)) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, newTrigger],
      }))
      setNewTrigger('')
    }
  }

  const removeTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t !== trigger),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name || !formData.slug || !formData.body) {
        throw new Error('Name, slug, and message body are required')
      }

      const response = await fetch('/api/admin/templates/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template')
      }

      router.push(`/admin/texts/templates/${data.template.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="SMS TEMPLATES"
            title="Create New Template"
            subtitle="Build a new SMS template for automated messaging"
          >
            <Button onClick={() => router.back()} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </PageHero>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-medium text-white mb-4">Basic Info</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Template Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Session Reminder"
                        className="bg-neutral-800 border-neutral-700"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Slug *
                      </label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g., session-reminder"
                        className="bg-neutral-800 border-neutral-700 font-mono"
                        required
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Unique identifier used in code
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Description
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="What is this template for?"
                        className="bg-neutral-800 border-neutral-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Category
                        </label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-medium text-white mb-4">Message Content</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Message Body *
                    </label>
                    <Textarea
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Your SMS message... Use {{variableName}} for dynamic content."
                      rows={5}
                      className="bg-neutral-800 border-neutral-700 font-mono text-sm"
                      required
                    />
                    <div className="flex justify-between mt-2 text-xs">
                      <p className="text-neutral-500">
                        {formData.body.length} / 160 characters
                        {formData.body.length > 160 && (
                          <span className="text-yellow-500 ml-2">
                            ({Math.ceil(formData.body.length / 160)} SMS segments)
                          </span>
                        )}
                      </p>
                      {formData.body.length > 0 && formData.body.length <= 160 && (
                        <p className="text-primary-500">Single SMS</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-medium text-white mb-4">Variables</h2>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="variableName"
                      className="bg-neutral-800 border-neutral-700 font-mono text-sm flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addVariable}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-xs text-secondary-500 font-mono"
                      >
                        {`{{${variable}}}`}
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {formData.variables.length === 0 && (
                      <p className="text-xs text-neutral-500">No variables added</p>
                    )}
                  </div>
                </Card>

                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-medium text-white mb-4">Triggers</h2>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      placeholder="When is this sent?"
                      className="bg-neutral-800 border-neutral-700 text-sm flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addTrigger}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.triggers.map((trigger) => (
                      <div
                        key={trigger}
                        className="flex items-center justify-between p-2 bg-neutral-800 rounded text-sm"
                      >
                        <span className="text-neutral-300">{trigger}</span>
                        <button
                          type="button"
                          onClick={() => removeTrigger(trigger)}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.triggers.length === 0 && (
                      <p className="text-xs text-neutral-500">No triggers added</p>
                    )}
                  </div>
                </Card>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Template
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}



