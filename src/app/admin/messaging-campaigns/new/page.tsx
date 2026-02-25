'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Spinner,
  Input,
  Textarea,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft, Save, ChevronDown } from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  slug: string
}

interface SmsTemplate {
  id: string
  name: string
  slug: string
}

const AUDIENCE_FILTER_EXAMPLE = `{
  "source": "user_profiles",
  "subscription_status": "active"
}`

const AUDIENCE_FILTER_LEADS_EXAMPLE = `{
  "source": "leads",
  "status": "new"
}`

function NewCampaignContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'email' as 'email' | 'sms',
    template_id: '',
    audience_filter: '{}',
    scheduled_for: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/templates/email').then((r) => r.json()),
      fetch('/api/admin/templates/sms').then((r) => r.json()),
    ]).then(([emailData, smsData]) => {
      setEmailTemplates(emailData.templates || [])
      setSmsTemplates(smsData.templates || [])
    })
  }, [])

  useEffect(() => {
    if (formData.channel === 'email' && emailTemplates.length > 0 && !formData.template_id) {
      setFormData((prev) => ({ ...prev, template_id: emailTemplates[0].id }))
    } else if (formData.channel === 'sms' && smsTemplates.length > 0 && !formData.template_id) {
      setFormData((prev) => ({ ...prev, template_id: smsTemplates[0].id }))
    } else if (
      formData.channel === 'email' &&
      formData.template_id &&
      !emailTemplates.some((t) => t.id === formData.template_id)
    ) {
      setFormData((prev) => ({
        ...prev,
        template_id: emailTemplates[0]?.id || '',
      }))
    } else if (
      formData.channel === 'sms' &&
      formData.template_id &&
      !smsTemplates.some((t) => t.id === formData.template_id)
    ) {
      setFormData((prev) => ({
        ...prev,
        template_id: smsTemplates[0]?.id || '',
      }))
    }
  }, [formData.channel, emailTemplates, smsTemplates, formData.template_id])

  const templates = formData.channel === 'email' ? emailTemplates : smsTemplates

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let audienceFilter: Record<string, unknown> = {}
      try {
        audienceFilter = JSON.parse(formData.audience_filter || '{}')
      } catch {
        throw new Error('Invalid JSON in audience filter')
      }

      if (!formData.name || !formData.channel || !formData.template_id) {
        throw new Error('Name, channel, and template are required')
      }

      const response = await fetch('/api/admin/messaging-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          channel: formData.channel,
          template_id: formData.template_id,
          audience_filter: audienceFilter,
          scheduled_for: formData.scheduled_for || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      router.push(`/admin/messaging-campaigns/${data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/messaging-campaigns')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <PageHero
            title="New Campaign"
            subtitle="Create a new email or SMS messaging campaign"
          />
        </div>

        <Card variant="elevated" className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Campaign Name"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Welcome Series - Week 1"
            />

            <Textarea
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this campaign"
              rows={3}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#E5E7EB]">Channel</label>
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
                  className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white appearance-none focus:outline-none focus:border-primary-500 pr-10"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#E5E7EB]">Template</label>
              <div className="relative">
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, template_id: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white appearance-none focus:outline-none focus:border-primary-500 pr-10"
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                label="Audience Filter (JSON)"
                value={formData.audience_filter}
                onChange={(e) => setFormData((prev) => ({ ...prev, audience_filter: e.target.value }))}
                placeholder='{"source": "user_profiles", "subscription_status": "active"}'
                rows={6}
                helperText="JSON object to filter recipients. See examples below."
              />
              <div className="p-3 rounded-lg bg-neutral-800/50 text-xs text-neutral-400 space-y-2">
                <p>
                  <strong className="text-neutral-300">user_profiles:</strong> keys like subscription_status, role.
                  Example: {AUDIENCE_FILTER_EXAMPLE}
                </p>
                <p>
                  <strong className="text-neutral-300">leads:</strong> source: &quot;leads&quot;, status, lead_type.
                  Example: {AUDIENCE_FILTER_LEADS_EXAMPLE}
                </p>
              </div>
            </div>

            <Input
              label="Scheduled For (optional)"
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_for: e.target.value }))}
              helperText="Leave empty to send manually"
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2">
                {loading ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                Create Campaign
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/messaging-campaigns')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}

export default function NewCampaignPage() {
  return (
    <AdminWrapper>
      <NewCampaignContent />
    </AdminWrapper>
  )
}
