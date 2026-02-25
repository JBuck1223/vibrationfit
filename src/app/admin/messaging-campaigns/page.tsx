'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Badge,
  Button,
  Stack,
  PageHero,
  Spinner,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ArrowLeft,
  Plus,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Send,
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

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-500',
  scheduled: 'bg-blue-500/20 text-blue-400',
  sending: 'bg-purple-500/20 text-purple-400',
  sent: 'bg-primary-500/20 text-primary-500',
  cancelled: 'bg-neutral-600 text-neutral-400',
}

type FilterTab = 'all' | 'draft' | 'sent'

function MessagingCampaignsContent() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    const url = filter === 'all'
      ? '/api/admin/messaging-campaigns'
      : `/api/admin/messaging-campaigns?status=${filter}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const filteredCampaigns = campaigns

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/emails')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHero
              title="Messaging Campaigns"
              subtitle="Create and manage bulk email and SMS campaigns"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/admin/messaging-campaigns/new')}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'draft', 'sent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === tab
                  ? 'bg-primary-500/20 text-primary-500 border-2 border-primary-500/50'
                  : 'bg-neutral-800 text-neutral-400 border-2 border-transparent hover:border-neutral-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <Send className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
            <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-neutral-400 mb-6">
              Create your first messaging campaign to send bulk emails or SMS.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/admin/messaging-campaigns/new')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                variant="elevated"
                className="p-6 cursor-pointer hover:border-primary-500/50 transition-all"
                onClick={() => router.push(`/admin/messaging-campaigns/${campaign.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white truncate flex-1">
                    {campaign.name}
                  </h3>
                  <Badge className={STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}>
                    {campaign.status}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    className={
                      campaign.channel === 'email'
                        ? 'bg-primary-500/20 text-primary-500'
                        : 'bg-secondary-500/20 text-secondary-500'
                    }
                  >
                    {campaign.channel === 'email' ? (
                      <Mail className="w-3 h-3 mr-1 inline" />
                    ) : (
                      <MessageSquare className="w-3 h-3 mr-1 inline" />
                    )}
                    {campaign.channel}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {campaign.audience_count ?? 0} audience
                  </span>
                  {campaign.status === 'sent' && (
                    <span className="flex items-center gap-1 text-primary-500">
                      <Send className="w-3.5 h-3.5" />
                      {campaign.sent_count} sent
                    </span>
                  )}
                  {campaign.scheduled_for && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(campaign.scheduled_for).toLocaleString()}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}

export default function MessagingCampaignsPage() {
  return (
    <AdminWrapper>
      <MessagingCampaignsContent />
    </AdminWrapper>
  )
}
