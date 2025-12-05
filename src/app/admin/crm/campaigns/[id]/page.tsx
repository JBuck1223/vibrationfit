// /src/app/admin/crm/campaigns/[id]/page.tsx
// Campaign detail page

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, Container } from '@/lib/design-system/components'

interface Campaign {
  id: string
  name: string
  slug: string
  status: string
  campaign_type: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  objective: string
  target_audience: string
  start_date: string
  end_date: string
  budget: number
  cost_per_lead_target: number
  total_leads: number
  total_conversions: number
  total_spent: number
  calculated_cpl: number
  calculated_roi: number
  revenue_generated: number
  landing_page_url: string
  tracking_url: string
  notes: string
  created_at: string
}

interface Lead {
  id: string
  email: string
  first_name: string
  last_name: string
  status: string
  created_at: string
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  async function fetchCampaign() {
    try {
      const response = await fetch(`/api/crm/campaigns/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch campaign')

      const data = await response.json()
      setCampaign(data.campaign)
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-12">
        <p className="text-neutral-300">Loading campaign...</p>
      </Container>
    )
  }

  if (!campaign) {
    return (
      <Container className="py-12">
        <p className="text-neutral-300">Campaign not found</p>
      </Container>
    )
  }

  const conversionRate = campaign.total_leads > 0 
    ? ((campaign.total_conversions / campaign.total_leads) * 100).toFixed(1)
    : '0.0'

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/crm/campaigns')}
          className="mb-4"
        >
          ← Back to Campaigns
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{campaign.name}</h1>
              <Badge className={`px-3 py-1 ${
                campaign.status === 'active' ? 'bg-primary-500' : 'bg-[#666666]'
              } text-white`}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-neutral-400">
              {campaign.utm_campaign || campaign.slug}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/admin/crm/campaigns/${campaign.id}/edit`)}
          >
            Edit Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary-500 mb-2">
            {campaign.total_leads || 0}
          </div>
          <div className="text-neutral-400 text-sm">Total Leads</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-secondary-500 mb-2">
            {campaign.total_conversions || 0}
          </div>
          <div className="text-neutral-400 text-sm">Conversions</div>
          <div className="text-xs text-neutral-500 mt-1">{conversionRate}% rate</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-[#FFB701] mb-2">
            ${campaign.calculated_cpl?.toFixed(2) || '0.00'}
          </div>
          <div className="text-neutral-400 text-sm">Cost Per Lead</div>
          {campaign.cost_per_lead_target && (
            <div className="text-xs text-neutral-500 mt-1">
              Target: ${campaign.cost_per_lead_target.toFixed(2)}
            </div>
          )}
        </Card>

        <Card className="text-center">
          <div className={`text-3xl font-bold mb-2 ${
            (campaign.calculated_roi || 0) > 0 ? 'text-primary-500' : 'text-[#D03739]'
          }`}>
            {((campaign.calculated_roi || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-neutral-400 text-sm">ROI</div>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Campaign Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-neutral-500">Type:</span>{' '}
              <span className="text-neutral-300">{campaign.campaign_type || 'N/A'}</span>
            </div>
            <div>
              <span className="text-neutral-500">Duration:</span>{' '}
              <span className="text-neutral-300">
                {campaign.start_date
                  ? new Date(campaign.start_date).toLocaleDateString()
                  : 'N/A'}{' '}
                to{' '}
                {campaign.end_date
                  ? new Date(campaign.end_date).toLocaleDateString()
                  : 'Ongoing'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Budget:</span>{' '}
              <span className="text-neutral-300">
                ${campaign.budget?.toLocaleString() || '0'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Spent:</span>{' '}
              <span className="text-neutral-300">
                ${campaign.total_spent?.toLocaleString() || '0'}
              </span>
            </div>
            {campaign.objective && (
              <div>
                <span className="text-neutral-500">Objective:</span>{' '}
                <span className="text-neutral-300">{campaign.objective}</span>
              </div>
            )}
            {campaign.target_audience && (
              <div>
                <span className="text-neutral-500">Target Audience:</span>{' '}
                <span className="text-neutral-300">{campaign.target_audience}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">UTM Parameters</h2>
          <div className="space-y-3">
            {campaign.utm_source && (
              <div>
                <span className="text-neutral-500">Source:</span>{' '}
                <span className="text-neutral-300">{campaign.utm_source}</span>
              </div>
            )}
            {campaign.utm_medium && (
              <div>
                <span className="text-neutral-500">Medium:</span>{' '}
                <span className="text-neutral-300">{campaign.utm_medium}</span>
              </div>
            )}
            {campaign.utm_campaign && (
              <div>
                <span className="text-neutral-500">Campaign:</span>{' '}
                <span className="text-neutral-300">{campaign.utm_campaign}</span>
              </div>
            )}
            {campaign.utm_content && (
              <div>
                <span className="text-neutral-500">Content:</span>{' '}
                <span className="text-neutral-300">{campaign.utm_content}</span>
              </div>
            )}
            {campaign.utm_term && (
              <div>
                <span className="text-neutral-500">Term:</span>{' '}
                <span className="text-neutral-300">{campaign.utm_term}</span>
              </div>
            )}
            {campaign.landing_page_url && (
              <div>
                <span className="text-neutral-500">Landing Page:</span>{' '}
                <a 
                  href={campaign.landing_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  View →
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Notes */}
      {campaign.notes && (
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Notes</h2>
          <p className="text-neutral-300 whitespace-pre-wrap">{campaign.notes}</p>
        </Card>
      )}

      {/* Leads */}
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Leads ({leads.length})</h2>

        {leads.length === 0 ? (
          <p className="text-neutral-400">No leads yet for this campaign</p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-xl hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/crm/leads/${lead.id}`)}
              >
                <div>
                  <div className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div className="text-sm text-neutral-400">{lead.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={`px-3 py-1 ${
                    lead.status === 'converted' ? 'bg-primary-500' :
                    lead.status === 'qualified' ? 'bg-secondary-500' :
                    'bg-[#666666]'
                  } text-white`}>
                    {lead.status}
                  </Badge>
                  <span className="text-sm text-neutral-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  )
}





