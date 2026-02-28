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
import { ArrowLeft, Plus, Mail, MessageSquare, Zap } from 'lucide-react'

const EVENT_NAMES = [
  'intensive.purchased',
  'lead.created',
  'user.created',
  'subscription.created',
  'subscription.past_due',
  'subscription.cancelled',
  'session.created',
  'household.invited',
  'support.ticket_created',
  'support.ticket_replied',
]

interface AutomationRule {
  id: string
  name: string
  event_name: string
  channel: 'email' | 'sms'
  template_id: string
  delay_minutes: number
  status: 'active' | 'paused' | 'archived'
  total_sent?: number
  last_sent_at?: string | null
  created_at: string
}

type FilterTab = 'all' | 'active' | 'paused'

function AutomationsListContent() {
  const router = useRouter()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    const url = filter === 'all'
      ? '/api/admin/automations'
      : `/api/admin/automations?status=${filter}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setRules(data.rules || []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filteredRules = rules

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-primary-500/20 text-primary-500 text-[10px] px-1.5 py-0.5">Active</Badge>
    }
    if (status === 'paused') {
      return <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5">Paused</Badge>
    }
    return <Badge className="bg-neutral-600 text-neutral-400 text-[10px] px-1.5 py-0.5">Archived</Badge>
  }

  const getChannelBadge = (channel: string) => {
    if (channel === 'email') {
      return (
        <Badge className="bg-primary-500/20 text-primary-500 text-[10px] px-1.5 py-0.5">
          <Mail className="w-3 h-3 mr-1 inline" />
          Email
        </Badge>
      )
    }
    return (
      <Badge className="bg-secondary-500/20 text-secondary-500 text-[10px] px-1.5 py-0.5">
        <MessageSquare className="w-3 h-3 mr-1 inline" />
        SMS
      </Badge>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="AUTOMATION RULES"
          title="Automation Rules"
          subtitle="Event-triggered email and SMS automations"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/admin/emails')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Messaging Hub
            </Button>
            <Button
              onClick={() => router.push('/admin/automations/new')}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </div>
        </PageHero>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-neutral-800 pb-2">
          {(['all', 'active', 'paused'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
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
        ) : filteredRules.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
            <h3 className="text-lg font-medium text-white mb-2">No automation rules</h3>
            <p className="text-neutral-400 mb-6">
              Create your first rule to trigger emails or SMS when events occur.
            </p>
            <Button
              onClick={() => router.push('/admin/automations/new')}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRules.map((rule) => (
              <Card
                key={rule.id}
                variant="elevated"
                className="p-4 md:p-6 cursor-pointer hover:border-primary-500/50 transition-all hover:-translate-y-0.5"
                onClick={() => router.push(`/admin/automations/${rule.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-semibold text-white truncate">{rule.name}</h3>
                  {getStatusBadge(rule.status)}
                </div>
                <p className="text-xs text-neutral-500 font-mono mb-2">{rule.event_name}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {getChannelBadge(rule.channel)}
                  <span className="text-xs text-neutral-500">
                    {rule.delay_minutes > 0 ? `${rule.delay_minutes}m delay` : 'Immediate'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  Template: {rule.template_id.slice(0, 8)}...
                </p>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}

export default function AutomationsPage() {
  return (
    <AdminWrapper>
      <AutomationsListContent />
    </AdminWrapper>
  )
}
