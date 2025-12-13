// /src/app/admin/crm/campaigns/[id]/edit/page.tsx
// Edit campaign page

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Input, Textarea, Container, Stack, PageHero } from '@/lib/design-system/components'

export default function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'paid_ad',
    status: 'draft',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    objective: '',
    target_audience: '',
    start_date: '',
    end_date: '',
    budget: '',
    cost_per_lead_target: '',
    total_spent: '',
    landing_page_url: '',
    notes: '',
  })

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  async function fetchCampaign() {
    try {
      const response = await fetch(`/api/crm/campaigns/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch campaign')

      const data = await response.json()
      const campaign = data.campaign

      setFormData({
        name: campaign.name || '',
        campaign_type: campaign.campaign_type || 'paid_ad',
        status: campaign.status || 'draft',
        utm_source: campaign.utm_source || '',
        utm_medium: campaign.utm_medium || '',
        utm_campaign: campaign.utm_campaign || '',
        utm_content: campaign.utm_content || '',
        utm_term: campaign.utm_term || '',
        objective: campaign.objective || '',
        target_audience: campaign.target_audience || '',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget?.toString() || '',
        cost_per_lead_target: campaign.cost_per_lead_target?.toString() || '',
        total_spent: campaign.total_spent?.toString() || '',
        landing_page_url: campaign.landing_page_url || '',
        notes: campaign.notes || '',
      })
    } catch (error) {
      console.error('Error fetching campaign:', error)
      alert('Failed to load campaign')
    } finally {
      setFetching(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/crm/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          cost_per_lead_target: formData.cost_per_lead_target
            ? parseFloat(formData.cost_per_lead_target)
            : null,
          total_spent: formData.total_spent ? parseFloat(formData.total_spent) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update campaign')
      }

      router.push(`/admin/crm/campaigns/${params.id}`)
    } catch (error: any) {
      console.error('Error updating campaign:', error)
      alert(error.message || 'Failed to update campaign')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container className="py-12 max-w-4xl">
      <Stack gap="lg">
        <PageHero eyebrow="CRM / CAMPAIGNS" title="Edit Campaign" subtitle="Update campaign details and settings">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </PageHero>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
          <h2 className="text-2xl font-semibold mb-6">Campaign Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Summer 2025 Facebook Ads"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Type *</label>
                <select
                  value={formData.campaign_type}
                  onChange={(e) => handleChange('campaign_type', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500"
                  required
                >
                  <option value="paid_ad">Paid Ad</option>
                  <option value="email">Email</option>
                  <option value="social_organic">Social (Organic)</option>
                  <option value="video">Video</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  placeholder="1000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Spent ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_spent}
                  onChange={(e) => handleChange('total_spent', e.target.value)}
                  placeholder="750.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target CPL ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_lead_target}
                  onChange={(e) => handleChange('cost_per_lead_target', e.target.value)}
                  placeholder="25.00"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-6">UTM Parameters</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">UTM Source</label>
              <Input
                value={formData.utm_source}
                onChange={(e) => handleChange('utm_source', e.target.value)}
                placeholder="facebook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">UTM Medium</label>
              <Input
                value={formData.utm_medium}
                onChange={(e) => handleChange('utm_medium', e.target.value)}
                placeholder="cpc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">UTM Campaign</label>
              <Input
                value={formData.utm_campaign}
                onChange={(e) => handleChange('utm_campaign', e.target.value)}
                placeholder="summer-2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">UTM Content</label>
                <Input
                  value={formData.utm_content}
                  onChange={(e) => handleChange('utm_content', e.target.value)}
                  placeholder="ad-variant-a"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">UTM Term</label>
                <Input
                  value={formData.utm_term}
                  onChange={(e) => handleChange('utm_term', e.target.value)}
                  placeholder="life-vision"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Landing Page URL</label>
              <Input
                type="url"
                value={formData.landing_page_url}
                onChange={(e) => handleChange('landing_page_url', e.target.value)}
                placeholder="https://vibrationfit.com/demo"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-6">Additional Info</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Objective</label>
              <Input
                value={formData.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="Generate 50 qualified leads"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <Input
                value={formData.target_audience}
                onChange={(e) => handleChange('target_audience', e.target.value)}
                placeholder="Women 25-45, interested in personal development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this campaign..."
                rows={4}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
      </Stack>
    </Container>
  )
}









