'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import {
  ArrowLeft,
  Save,
  Trash2,
  ChevronDown,
  Users,
  Send,
  AlertTriangle,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string | null
  channel: 'email' | 'sms'
  template_id: string
  audience_filter: Record<string, unknown>
  audience_count: number
  sent_count: number
  failed_count: number
  scheduled_for: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  created_at: string
}

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

const AUDIENCE_FILTER_EXAMPLE = '{"source": "user_profiles", "subscription_status": "active"}'
const AUDIENCE_FILTER_LEADS_EXAMPLE = '{"source": "leads", "status": "new"}'

function CampaignDetailContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult] = useState<{
    queued: number
    failed: number
    total_recipients: number
  } | null>(null)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    if (!id) return
    fetch(`/api/admin/messaging-campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const c = data.campaign
        if (c) {
          setCampaign(c)
          setFormData({
            name: c.name,
            description: c.description || '',
            channel: c.channel,
            template_id: c.template_id,
            audience_filter: JSON.stringify(c.audience_filter || {}, null, 2),
            scheduled_for: c.scheduled_for
              ? new Date(c.scheduled_for).toISOString().slice(0, 16)
              : '',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/templates/email').then((r) => r.json()),
      fetch('/api/admin/templates/sms').then((r) => r.json()),
    ]).then(([emailData, smsData]) => {
      setEmailTemplates(emailData.templates || [])
      setSmsTemplates(smsData.templates || [])
    })
  }, [])

  const templates = formData.channel === 'email' ? emailTemplates : smsTemplates
  const canSend =
    campaign && (campaign.status === 'draft' || campaign.status === 'scheduled')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)

    try {
      let audienceFilter: Record<string, unknown> = {}
      try {
        audienceFilter = JSON.parse(formData.audience_filter || '{}')
      } catch {
        throw new Error('Invalid JSON in audience filter')
      }

      const response = await fetch(`/api/admin/messaging-campaigns/${id}`, {
        method: 'PUT',
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
        throw new Error(data.error || 'Failed to update campaign')
      }

      setCampaign(data.campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!id) return
    setPreviewLoading(true)
    setPreviewCount(null)
    try {
      const res = await fetch(`/api/admin/messaging-campaigns/${id}/preview`)
      const data = await res.json()
      if (res.ok) {
        setPreviewCount(data.count ?? 0)
        if (campaign) {
          setCampaign((prev) =>
            prev ? { ...prev, audience_count: data.count ?? prev.audience_count } : null
          )
        }
      }
    } catch {
      setPreviewCount(-1)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSend = async () => {
    if (!id) return
    setShowSendConfirm(false)
    setSendLoading(true)
    setSendResult(null)
    try {
      const res = await fetch(`/api/admin/messaging-campaigns/${id}/send`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setSendResult({
          queued: data.queued ?? 0,
          failed: data.failed ?? 0,
          total_recipients: data.total_recipients ?? 0,
        })
        setCampaign((prev) =>
          prev
            ? {
                ...prev,
                status: 'sent',
                sent_count: data.queued ?? prev.sent_count,
                failed_count: data.failed ?? prev.failed_count,
                audience_count: data.total_recipients ?? prev.audience_count,
              }
            : null
        )
      } else {
        setError(data.error || 'Failed to send campaign')
      }
    } catch {
      setError('Failed to send campaign')
    } finally {
      setSendLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setShowDeleteConfirm(false)
    try {
      const res = await fetch(`/api/admin/messaging-campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/messaging-campaigns')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete campaign')
      }
    } catch {
      setError('Failed to delete campaign')
    }
  }

  if (loading || !campaign) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Container>
    )
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
            title={campaign.name}
            subtitle={`${campaign.channel} campaign - ${campaign.status}`}
          />
        </div>

        {campaign.status === 'sending' && (
          <Card className="p-4 border-purple-500/30 bg-purple-500/10">
            <div className="flex items-center gap-3">
              <Spinner size="md" />
              <span className="text-purple-400 font-medium">Sending campaign...</span>
            </div>
          </Card>
        )}

        {campaign.status === 'sent' && (
          <Card variant="elevated" className="p-6">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Campaign Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary-500">{campaign.sent_count}</p>
                <p className="text-xs text-neutral-500">Sent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{campaign.failed_count}</p>
                <p className="text-xs text-neutral-500">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaign.audience_count}</p>
                <p className="text-xs text-neutral-500">Audience</p>
              </div>
            </div>
          </Card>
        )}

        {sendResult && (
          <Card className="p-4 border-primary-500/30 bg-primary-500/10">
            <div className="flex items-center gap-2 text-primary-500 mb-2">
              <Send className="w-5 h-5" />
              <span className="font-medium">Campaign sent</span>
            </div>
            <p className="text-sm text-neutral-300">
              Queued: {sendResult.queued} | Failed: {sendResult.failed} | Total:{' '}
              {sendResult.total_recipients}
            </p>
          </Card>
        )}

        <Card variant="elevated" className="p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, audience_filter: e.target.value }))
                }
                placeholder='{"source": "user_profiles", "subscription_status": "active"}'
                rows={6}
                helperText="JSON object to filter recipients. See examples below."
              />
              <div className="p-3 rounded-lg bg-neutral-800/50 text-xs text-neutral-400 space-y-2">
                <p>
                  <strong className="text-neutral-300">user_profiles:</strong> keys like
                  subscription_status, role. Example: {AUDIENCE_FILTER_EXAMPLE}
                </p>
                <p>
                  <strong className="text-neutral-300">leads:</strong> source: &quot;leads&quot;,
                  status, lead_type. Example: {AUDIENCE_FILTER_LEADS_EXAMPLE}
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

            <div className="flex flex-wrap gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={saving} className="flex items-center gap-2">
                {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={previewLoading}
                className="flex items-center gap-2"
              >
                {previewLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Preview Audience
                {previewCount !== null && previewCount >= 0 && (
                  <span className="ml-1 text-primary-500">({previewCount})</span>
                )}
              </Button>
              {canSend && (
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => setShowSendConfirm(true)}
                  disabled={sendLoading}
                  className="flex items-center gap-2"
                >
                  {sendLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                  Send Campaign
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </form>
        </Card>
      </Stack>

      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" className="p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Send Campaign?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  This will send to {(previewCount ?? campaign.audience_count) || 0} recipients.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="accent"
                onClick={handleSend}
                disabled={sendLoading}
                className="flex-1"
              >
                {sendLoading ? <Spinner size="sm" /> : 'Send'}
              </Button>
              <Button variant="outline" onClick={() => setShowSendConfirm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" className="p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Campaign?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  This will permanently delete &quot;{campaign.name}&quot;. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete} className="flex-1">
                Delete
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}

export default function CampaignDetailPage() {
  return (
    <AdminWrapper>
      <CampaignDetailContent />
    </AdminWrapper>
  )
}
