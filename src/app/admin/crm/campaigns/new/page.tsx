// /src/app/admin/crm/campaigns/new/page.tsx
// Create new campaign page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Textarea, Container } from '@/lib/design-system/components'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    landing_page_url: '',
    notes: '',
  })

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          cost_per_lead_target: formData.cost_per_lead_target
            ? parseFloat(formData.cost_per_lead_target)
            : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      const { campaign } = await response.json()
      router.push(`/admin/crm/campaigns/${campaign.id}`)
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      alert(error.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="md">
      <div className="mb-8 md:mb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back
        </Button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Create New Campaign</h1>
        <p className="text-sm md:text-base text-neutral-400">
          Set up a new marketing campaign with tracking
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Campaign Details</h2>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Campaign Name *</label>
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

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">Target Cost Per Lead ($)</label>
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

        <Card className="p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">UTM Parameters</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">UTM Source</label>
              <Input
                value={formData.utm_source}
                onChange={(e) => handleChange('utm_source', e.target.value)}
                placeholder="facebook"
              />
              <p className="text-xs text-neutral-500 mt-1">
                e.g., facebook, google, instagram
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">UTM Medium</label>
              <Input
                value={formData.utm_medium}
                onChange={(e) => handleChange('utm_medium', e.target.value)}
                placeholder="cpc"
              />
              <p className="text-xs text-neutral-500 mt-1">
                e.g., cpc, email, social
              </p>
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

        <Card className="p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Additional Info</h2>

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

        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Container>
  )
}

