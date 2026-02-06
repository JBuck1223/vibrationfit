// /src/app/admin/crm/campaigns/new/page.tsx
// Create new campaign page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Textarea, Container, Stack, PageHero, Select, DatePicker } from '@/lib/design-system/components'
import { Check, Copy } from 'lucide-react'

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
    promo_code: '',
    referral_source: '',
    plan_type: 'solo',
    continuity_plan: 'annual',
    objective: '',
    target_audience: '',
    start_date: '',
    end_date: '',
    budget: '',
    cost_per_lead_target: '',
    landing_page_url: '',
    notes: '',
  })
  const [copied, setCopied] = useState(false)

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function buildCampaignURL(planType: 'solo' | 'household'): string {
    const baseUrl = formData.landing_page_url || 'https://vibrationfit.com'
    const params = new URLSearchParams()

    // Add plan type if not solo (solo is default)
    if (planType === 'household') {
      params.append('plan', 'household')
    }

    // Add UTM parameters
    if (formData.utm_source) params.append('utm_source', formData.utm_source)
    if (formData.utm_medium) params.append('utm_medium', formData.utm_medium)
    if (formData.utm_campaign) {
      params.append('utm_campaign', formData.utm_campaign)
      params.append('campaign', formData.utm_campaign) // Also add campaign= for internal tracking
    }
    if (formData.utm_content) params.append('utm_content', formData.utm_content)
    if (formData.utm_term) params.append('utm_term', formData.utm_term)
    
    // Add VibrationFit tracking parameters
    if (formData.promo_code) params.append('promo', formData.promo_code)
    if (formData.referral_source) params.append('ref', formData.referral_source)
    if (formData.continuity_plan) params.append('continuity', formData.continuity_plan)

    const queryString = params.toString()
    const needsPricingAnchor = formData.promo_code || formData.referral_source
    const anchor = needsPricingAnchor ? '#pricing' : ''
    return queryString ? `${baseUrl}?${queryString}${anchor}` : baseUrl
  }

  async function copyURL(planType: 'solo' | 'household') {
    const url = buildCampaignURL(planType)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  function loadTemplate(template: string) {
    switch (template) {
      case 'intensive_solo':
        setFormData({
          ...formData,
          name: 'Solo Intensive Launch - Jan 2025',
          campaign_type: 'partnership',
          utm_source: 'partner',
          utm_medium: 'referral',
          utm_campaign: 'intensive_solo_jan2025',
          promo_code: 'INTENSIVE2025',
          plan_type: 'solo',
          continuity_plan: 'annual',
          objective: 'Drive solo intensive enrollments with $498 discount',
          target_audience: 'Individual seekers, personal development enthusiasts',
        })
        break
      case 'intensive_household':
        setFormData({
          ...formData,
          name: 'Household Intensive Launch - Jan 2025',
          campaign_type: 'partnership',
          utm_source: 'couples_coach',
          utm_medium: 'referral',
          utm_campaign: 'intensive_household_jan2025',
          promo_code: 'INTENSIVE2025',
          plan_type: 'household',
          continuity_plan: 'annual',
          objective: 'Drive household intensive enrollments (couples)',
          target_audience: 'Couples, families, households seeking transformation',
        })
        break
      case 'facebook_ad':
        setFormData({
          ...formData,
          name: 'Facebook Ads - Q1 2025',
          campaign_type: 'paid_ad',
          utm_source: 'facebook',
          utm_medium: 'cpc',
          utm_campaign: 'q1_2025_intensive',
          utm_content: 'ad_variant_a',
          utm_term: 'life-vision',
          plan_type: 'solo',
          continuity_plan: 'annual',
          objective: 'Generate intensive purchases via FB ads',
          target_audience: 'Women 25-45, personal development, manifestation',
        })
        break
      case 'email':
        setFormData({
          ...formData,
          name: 'Email Newsletter - Weekly',
          campaign_type: 'email',
          utm_source: 'newsletter',
          utm_medium: 'email',
          utm_campaign: 'weekly_newsletter',
          utm_content: 'cta_button',
          plan_type: 'solo',
          continuity_plan: 'annual',
          objective: 'Convert newsletter subscribers to paid members',
          target_audience: 'Email list subscribers',
        })
        break
    }
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
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="CRM / CAMPAIGNS"
          title="Create New Campaign"
          subtitle="Set up a new marketing campaign with tracking"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </PageHero>

        {/* Quick Templates */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">Quick Templates</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" size="sm" onClick={() => loadTemplate('intensive_solo')}>
              Solo Intensive
            </Button>
            <Button variant="accent" size="sm" onClick={() => loadTemplate('intensive_household')}>
              Household Intensive
            </Button>
            <Button variant="ghost" size="sm" onClick={() => loadTemplate('facebook_ad')}>
              Facebook Ad
            </Button>
            <Button variant="ghost" size="sm" onClick={() => loadTemplate('email')}>
              Email Campaign
            </Button>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-4 md:p-6 lg:p-8">
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
                <Select
                  value={formData.campaign_type}
                  onChange={(value) => handleChange('campaign_type', value)}
                  options={[
                    { value: 'paid_ad', label: 'Paid Ad' },
                    { value: 'email', label: 'Email' },
                    { value: 'social_organic', label: 'Social (Organic)' },
                    { value: 'video', label: 'Video' },
                    { value: 'partnership', label: 'Partnership' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Select campaign type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={formData.status}
                  onChange={(value) => handleChange('status', value)}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                  placeholder="Select status"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(date: string) => handleChange('start_date', date)}
                  placeholder="Select start date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <DatePicker
                  value={formData.end_date}
                  onChange={(date: string) => handleChange('end_date', date)}
                  placeholder="Select end date"
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

        <Card className="p-4 md:p-6 lg:p-8">
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
                placeholder="https://vibrationfit.com"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Leave blank to default to homepage
              </p>
            </div>
          </div>
        </Card>

        {/* VibrationFit Tracking Parameters */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
            🎯 VibrationFit Tracking
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Promo Code <span className="text-primary-500">(promo=)</span>
              </label>
              <Input
                value={formData.promo_code}
                onChange={(e) => handleChange('promo_code', e.target.value.toUpperCase())}
                placeholder="INTENSIVE2025 (Solo) or INTENSIVE2025-HOUSEHOLD"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Auto-applies discount at checkout. Use <strong>$498 off (Solo)</strong> or <strong>$698 off (Household)</strong> for $1 verification.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Referral Source <span className="text-secondary-500">(ref=)</span>
              </label>
              <Input
                value={formData.referral_source}
                onChange={(e) => handleChange('referral_source', e.target.value.toLowerCase())}
                placeholder="partner_john, Jordan, couples_coach"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Affiliate or partner identifier for commission tracking
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Continuity Plan <span className="text-accent-500">(continuity=)</span>
              </label>
              <Select
                value={formData.continuity_plan}
                onChange={(value) => handleChange('continuity_plan', value)}
                options={[
                  { value: 'annual', label: 'Annual - Solo: $999/year | Household: $1,399/year' },
                  { value: '28day', label: '28-Day - Solo: $99/cycle | Household: $139/cycle' },
                ]}
                placeholder="Select continuity plan"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Both links (Solo & Household) will use this continuity preference
              </p>
            </div>
          </div>
        </Card>

        {/* Generated URLs Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solo URL */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
            <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
              👤 Solo Link (1 Seat)
            </h2>
            
            <div className="bg-black/50 p-3 rounded-xl mb-3 border border-primary-500/30 min-h-[80px] flex items-center">
              <code className="text-xs text-primary-500 break-all">
                {buildCampaignURL('solo')}
              </code>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => copyURL('solo')}
              >
                {copied ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy Solo</>}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(buildCampaignURL('solo'), '_blank')}
              >
                Test →
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-700">
              <p className="text-xs text-neutral-400 mb-2">
                <strong>Solo Intensive Pricing:</strong>
              </p>
              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Intensive: {formData.promo_code ? <span className="text-primary-500">$1 (with {formData.promo_code})</span> : '$499'}</li>
                <li>• Continuity: {formData.continuity_plan === 'annual' ? '$999/year' : '$99/28 days'}</li>
              </ul>
            </div>
          </Card>

          {/* Household URL */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-accent-500/10 to-secondary-500/10 border-accent-500/30">
            <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
              👥 Household Link (2 Seats)
            </h2>
            
            <div className="bg-black/50 p-3 rounded-xl mb-3 border border-accent-500/30 min-h-[80px] flex items-center">
              <code className="text-xs text-accent-500 break-all">
                {buildCampaignURL('household')}
              </code>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={() => copyURL('household')}
              >
                {copied ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy Household</>}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(buildCampaignURL('household'), '_blank')}
              >
                Test →
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-700">
              <p className="text-xs text-neutral-400 mb-2">
                <strong>Household Intensive Pricing:</strong>
              </p>
              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Intensive: {formData.promo_code ? <span className="text-accent-500">$1 (with {formData.promo_code})</span> : '$699'}</li>
                <li>• Continuity: {formData.continuity_plan === 'annual' ? '$1,399/year' : '$139/28 days'}</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* What Gets Tracked */}
        <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-700">
          <h3 className="text-base font-semibold mb-3">📊 What Gets Tracked in Database</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-2">URL Parameters:</p>
              <ul className="text-xs text-neutral-300 space-y-1">
                {formData.promo_code && <li>• <span className="text-neutral-500">promo=</span><span className="text-primary-500">{formData.promo_code}</span></li>}
                {formData.referral_source && <li>• <span className="text-neutral-500">ref=</span><span className="text-secondary-500">{formData.referral_source}</span></li>}
                {formData.utm_campaign && <li>• <span className="text-neutral-500">campaign=</span><span className="text-accent-500">{formData.utm_campaign}</span></li>}
                <li>• <span className="text-neutral-500">continuity=</span><span className="text-neutral-300">{formData.continuity_plan}</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-2">Database Storage:</p>
              <ul className="text-xs text-neutral-300 space-y-1">
                <li>• order_items.promo_code</li>
                <li>• order_items.referral_source</li>
                <li>• order_items.campaign_name</li>
                <li>• customer_subscriptions (same fields)</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 lg:p-8">
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
      </Stack>
    </Container>
  )
}

