// /src/app/admin/crm/campaigns/page.tsx
// Campaign management list page

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Stack, PageHero } from '@/lib/design-system/components'

interface Campaign {
  id: string
  name: string
  slug: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  campaign_type: string
  utm_campaign: string
  start_date: string
  end_date: string
  budget: number
  total_leads: number
  total_conversions: number
  calculated_cpl: number
  calculated_roi: number
  created_at: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchCampaigns()
  }, [filter])

  async function fetchCampaigns() {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/crm/campaigns?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')

      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-primary-500'
      case 'completed':
        return 'bg-secondary-500'
      case 'paused':
        return 'bg-[#FFB701]'
      case 'draft':
        return 'bg-[#666666]'
      case 'archived':
        return 'bg-[#404040]'
      default:
        return 'bg-[#666666]'
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Marketing Campaigns"
          subtitle="Manage campaigns and track ROI"
        >
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/crm/campaigns/new')}
            >
              + New Campaign
            </Button>
          </div>
        </PageHero>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
        {['all', 'active', 'draft', 'paused', 'completed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <Card className="text-center p-8 md:p-12">
          <p className="text-neutral-400 mb-4 text-sm md:text-base">No campaigns yet</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/admin/crm/campaigns/new')}
          >
            Create Your First Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-4 md:p-6 hover:border-primary-500 cursor-pointer transition-all"
              onClick={() => router.push(`/admin/crm/campaigns/${campaign.id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg md:text-xl font-semibold truncate">{campaign.name}</h3>
                    <Badge className={`${getStatusColor(campaign.status)} text-white px-2 md:px-3 py-1 text-xs`}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-neutral-400 text-xs md:text-sm mb-3 md:mb-4 truncate">
                    {campaign.utm_campaign || campaign.slug}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:gap-4 md:gap-6 text-xs md:text-sm space-y-2 sm:space-y-0">
                    <div>
                      <span className="text-neutral-500">Type:</span>{' '}
                      <span className="text-neutral-300">{campaign.campaign_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Budget:</span>{' '}
                      <span className="text-neutral-300">
                        ${campaign.budget?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <span className="text-neutral-500">Duration:</span>{' '}
                      <span className="text-neutral-300">
                        {campaign.start_date
                          ? new Date(campaign.start_date).toLocaleDateString()
                          : 'N/A'}{' '}
                        -{' '}
                        {campaign.end_date
                          ? new Date(campaign.end_date).toLocaleDateString()
                          : 'Ongoing'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 text-center">
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-primary-500">
                      {campaign.total_leads || 0}
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">Leads</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-secondary-500">
                      {campaign.total_conversions || 0}
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">Conv.</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-[#FFB701]">
                      ${campaign.calculated_cpl?.toFixed(0) || '0'}
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">CPL</div>
                  </div>
                  <div>
                    <div className={`text-lg md:text-2xl font-bold ${
                      (campaign.calculated_roi || 0) > 0 ? 'text-primary-500' : 'text-[#D03739]'
                    }`}>
                      {((campaign.calculated_roi || 0) * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">ROI</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </Stack>
    </Container>
  )
}

