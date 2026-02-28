'use client'

import { useState, useEffect } from 'react'
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
import { Save, ArrowLeft, ChevronDown } from 'lucide-react'

const EVENT_NAMES = [
  { value: 'intensive.purchased', label: 'Intensive Purchased' },
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'user.created', label: 'User Created' },
  { value: 'subscription.created', label: 'Subscription Created' },
  { value: 'subscription.past_due', label: 'Subscription Past Due' },
  { value: 'subscription.cancelled', label: 'Subscription Cancelled' },
  { value: 'session.created', label: 'Session Created' },
  { value: 'household.invited', label: 'Household Invited' },
  { value: 'support.ticket_created', label: 'Support Ticket Created' },
  { value: 'support.ticket_replied', label: 'Support Ticket Replied' },
]

interface Template {
  id: string
  name: string
  slug?: string
}

function NewAutomationContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    event_name: 'lead.created',
    channel: 'email' as 'email' | 'sms',
    template_id: '',
    delay_minutes: 0,
    conditions: '{}',
    status: 'paused' as 'active' | 'paused' | 'archived',
  })

  const [emailTemplates, setEmailTemplates] = useState<Template[]>([])
  const [smsTemplates, setSmsTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const templates = formData.channel === 'email' ? emailTemplates : smsTemplates

  useEffect(() => {
    setTemplatesLoading(true)
    const url = formData.channel === 'email'
      ? '/api/admin/templates/email'
      : '/api/admin/templates/sms'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = data.templates || []
        if (formData.channel === 'email') {
          setEmailTemplates(list)
        } else {
          setSmsTemplates(list)
        }
        if (list.length > 0 && !list.some((t: Template) => t.id === formData.template_id)) {
          setFormData((prev) => ({ ...prev, template_id: list[0].id }))
        }
      })
      .catch(() => {
        if (formData.channel === 'email') setEmailTemplates([])
        else setSmsTemplates([])
      })
      .finally(() => setTemplatesLoading(false))
  }, [formData.channel])

  useEffect(() => {
    if (templates.length > 0 && !formData.template_id) {
      setFormData((prev) => ({ ...prev, template_id: templates[0].id }))
    }
  }, [templates, formData.template_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let conditions = {}
      if (formData.conditions.trim()) {
        try {
          conditions = JSON.parse(formData.conditions)
        } catch {
          throw new Error('Conditions must be valid JSON')
        }
      }

      if (!formData.name || !formData.event_name || !formData.channel || !formData.template_id) {
        throw new Error('Name, event, channel, and template are required')
      }

      const response = await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          event_name: formData.event_name,
          channel: formData.channel,
          template_id: formData.template_id,
          delay_minutes: Number(formData.delay_minutes) || 0,
          conditions,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create rule')
      }

      router.push(`/admin/automations/${data.rule.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="AUTOMATION RULES"
          title="Create New Rule"
          subtitle="Trigger email or SMS when events occur"
        >
          <Button onClick={() => router.push('/admin/automations')} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </PageHero>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Rule Configuration</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Rule Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Welcome Email on Signup"
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Trigger Event *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.event_name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, event_name: e.target.value }))
                        }
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {EVENT_NAMES.map((ev) => (
                          <option key={ev.value} value={ev.value}>
                            {ev.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Channel *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.channel}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              channel: e.target.value as 'email' | 'sms',
                              template_id: '',
                            }))
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Delay (minutes)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.delay_minutes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            delay_minutes: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="bg-neutral-800 border-neutral-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Template *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.template_id}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, template_id: e.target.value }))
                        }
                        disabled={templatesLoading}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <option value="">Select template...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.slug ? `(${t.slug})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                    {templatesLoading && (
                      <p className="text-xs text-neutral-500 mt-1">Loading templates...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value as 'active' | 'paused' | 'archived',
                          }))
                        }
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Conditions (JSON, optional)
                    </label>
                    <Textarea
                      value={formData.conditions}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, conditions: e.target.value }))
                      }
                      placeholder='{"key": "value"}'
                      rows={4}
                      className="bg-neutral-800 border-neutral-700 text-sm font-mono"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Additional filters to apply when the event fires. Use empty object for no filters.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Rule
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/admin/automations')}
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
  )
}

export default function NewAutomationPage() {
  return (
    <AdminWrapper>
      <NewAutomationContent />
    </AdminWrapper>
  )
}
