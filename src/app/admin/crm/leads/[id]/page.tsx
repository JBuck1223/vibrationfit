// Lead detail page with conversation thread
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
} from '@/lib/design-system/components'
import { ArrowLeft, Mail, MessageSquare, Phone, Calendar, RefreshCw } from 'lucide-react'
import { ConversationThread } from '@/components/crm/ConversationThread'

interface Lead {
  id: string
  type: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  utm_source: string
  utm_medium?: string
  utm_campaign?: string
  notes?: string
  created_at: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<Lead | null>(null)
  const [conversation, setConversation] = useState<any[]>([])
  const [loadingConversation, setLoadingConversation] = useState(false)

  useEffect(() => {
    if (leadId) {
      fetchLead()
      fetchConversation()
    }
  }, [leadId])

  async function fetchLead() {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`)
      if (!response.ok) throw new Error('Failed to fetch lead')

      const data = await response.json()
      setLead(data.lead)
    } catch (error) {
      console.error('Error fetching lead:', error)
      alert('Failed to load lead')
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversation() {
    setLoadingConversation(true)
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/conversation`)
      if (!response.ok) throw new Error('Failed to fetch conversation')

      const data = await response.json()
      setConversation(data.conversation || [])
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoadingConversation(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new':
        return 'bg-[#8B5CF6]'
      case 'contacted':
        return 'bg-[#FFB701]'
      case 'qualified':
        return 'bg-secondary-500'
      case 'converted':
        return 'bg-primary-500'
      case 'lost':
        return 'bg-[#666666]'
      default:
        return 'bg-neutral-600'
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!lead) {
    return (
      <Container size="xl" className="py-12">
        <Card className="p-8 text-center">
          <p className="text-neutral-400">Lead not found</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-8 md:py-12">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Lead Info */}
        <PageHero
          title={`${lead.first_name} ${lead.last_name}`}
          subtitle={lead.type}
        >
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge className={`${getStatusColor(lead.status)} px-3 py-1`}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            {lead.utm_source && (
              <Badge className="bg-neutral-800 text-neutral-300 px-3 py-1">
                Source: {lead.utm_source}
              </Badge>
            )}
          </div>
        </PageHero>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-primary-500" />
              <h3 className="text-sm font-semibold text-neutral-400">Email</h3>
            </div>
            <p className="text-base text-white">{lead.email || 'No email'}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-secondary-500" />
              <h3 className="text-sm font-semibold text-neutral-400">Phone</h3>
            </div>
            <p className="text-base text-white">{lead.phone || 'No phone'}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-accent-500" />
              <h3 className="text-sm font-semibold text-neutral-400">Created</h3>
            </div>
            <p className="text-base text-white">
              {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </Card>
        </div>

        {/* UTM Parameters */}
        {(lead.utm_medium || lead.utm_campaign) && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Attribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lead.utm_source && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Source</p>
                  <p className="text-base text-white">{lead.utm_source}</p>
                </div>
              )}
              {lead.utm_medium && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Medium</p>
                  <p className="text-base text-white">{lead.utm_medium}</p>
                </div>
              )}
              {lead.utm_campaign && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Campaign</p>
                  <p className="text-base text-white">{lead.utm_campaign}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Notes */}
        {lead.notes && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <p className="text-neutral-300 whitespace-pre-wrap">{lead.notes}</p>
          </Card>
        )}

        {/* Conversation Thread */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Conversation ({conversation.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConversation}
              disabled={loadingConversation}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConversation ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <ConversationThread 
            messages={conversation} 
            loading={loadingConversation}
          />
        </Card>
      </Stack>
    </Container>
  )
}
