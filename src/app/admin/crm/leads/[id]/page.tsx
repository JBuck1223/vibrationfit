// /src/app/admin/crm/leads/[id]/page.tsx
// Lead detail page with attribution

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, Container, Input, Textarea } from '@/lib/design-system/components'

interface Lead {
  id: string
  type: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  message: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  referrer: string
  landing_page: string
  video_engagement: any
  pages_visited: string[]
  time_on_site: number
  notes: string
  created_at: string
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [campaign, setCampaign] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchLead()
  }, [params.id])

  async function fetchLead() {
    try {
      const response = await fetch(`/api/crm/leads/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch lead')

      const data = await response.json()
      setLead(data.lead)
      setCampaign(data.campaign)
      setMessages(data.messages || [])
      setNotes(data.lead.notes || '')
      setStatus(data.lead.status || 'new')
    } catch (error) {
      console.error('Error fetching lead:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!lead) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to update lead')

      alert('Lead updated successfully!')
      fetchLead()
    } catch (error: any) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead')
    } finally {
      setUpdating(false)
    }
  }

  async function handleSendSMS() {
    if (!lead?.phone) {
      alert('No phone number for this lead')
      return
    }

    const message = prompt('Enter message to send:')
    if (!message) return

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.phone,
          message,
          leadId: lead.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to send SMS')

      alert('SMS sent successfully!')
      fetchLead()
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS')
    }
  }

  if (loading) {
    return (
      <Container className="py-12">
        <p className="text-neutral-300">Loading lead...</p>
      </Container>
    )
  }

  if (!lead) {
    return (
      <Container className="py-12">
        <p className="text-neutral-300">Lead not found</p>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/crm/leads')}
          className="mb-4"
        >
          ← Back to Leads
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-neutral-400">{lead.email}</p>
            {lead.phone && (
              <p className="text-neutral-400">{lead.phone}</p>
            )}
          </div>
          <div className="flex gap-3">
            {lead.phone && (
              <Button variant="secondary" onClick={handleSendSMS}>
                📱 Text
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => window.location.href = `mailto:${lead.email}`}
            >
              ✉️ Email
            </Button>
          </div>
        </div>
      </div>

      {/* Lead Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Lead Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-neutral-500">Type:</span>{' '}
              <Badge className="ml-2 bg-[#404040] text-white px-3 py-1">
                {lead.type}
              </Badge>
            </div>
            <div>
              <span className="text-neutral-500">Status:</span>{' '}
              <Badge className={`ml-2 px-3 py-1 text-white ${
                lead.status === 'converted' ? 'bg-primary-500' :
                lead.status === 'qualified' ? 'bg-secondary-500' :
                'bg-[#666666]'
              }`}>
                {lead.status}
              </Badge>
            </div>
            {lead.company && (
              <div>
                <span className="text-neutral-500">Company:</span>{' '}
                <span className="text-neutral-300">{lead.company}</span>
              </div>
            )}
            <div>
              <span className="text-neutral-500">Submitted:</span>{' '}
              <span className="text-neutral-300">
                {new Date(lead.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">Attribution</h2>
          <div className="space-y-3">
            {campaign && (
              <div>
                <span className="text-neutral-500">Campaign:</span>{' '}
                <button
                  onClick={() => router.push(`/admin/crm/campaigns/${campaign.id}`)}
                  className="text-primary-500 hover:underline"
                >
                  {campaign.name} →
                </button>
              </div>
            )}
            {lead.utm_source && (
              <div>
                <span className="text-neutral-500">Source:</span>{' '}
                <span className="text-neutral-300">{lead.utm_source}</span>
              </div>
            )}
            {lead.utm_medium && (
              <div>
                <span className="text-neutral-500">Medium:</span>{' '}
                <span className="text-neutral-300">{lead.utm_medium}</span>
              </div>
            )}
            {lead.utm_campaign && (
              <div>
                <span className="text-neutral-500">Campaign:</span>{' '}
                <span className="text-neutral-300">{lead.utm_campaign}</span>
              </div>
            )}
            {lead.utm_content && (
              <div>
                <span className="text-neutral-500">Content:</span>{' '}
                <span className="text-neutral-300">{lead.utm_content}</span>
              </div>
            )}
            {lead.utm_term && (
              <div>
                <span className="text-neutral-500">Term:</span>{' '}
                <span className="text-neutral-300">{lead.utm_term}</span>
              </div>
            )}
            {lead.referrer && (
              <div>
                <span className="text-neutral-500">Referrer:</span>{' '}
                <span className="text-neutral-300 text-sm break-all">{lead.referrer}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Message */}
      {lead.message && (
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Message</h2>
          <p className="text-neutral-300 whitespace-pre-wrap">{lead.message}</p>
        </Card>
      )}

      {/* Engagement */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Engagement</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-neutral-500 text-sm">Landing Page</div>
            <div className="text-neutral-300 text-sm break-all">
              {lead.landing_page || '—'}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-sm">Pages Visited</div>
            <div className="text-neutral-300">
              {lead.pages_visited?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-sm">Time on Site</div>
            <div className="text-neutral-300">
              {lead.time_on_site ? `${Math.floor(lead.time_on_site / 60)}m ${lead.time_on_site % 60}s` : '—'}
            </div>
          </div>
        </div>

        {lead.video_engagement && (
          <div className="mt-4 pt-4 border-t border-[#333]">
            <div className="text-neutral-500 text-sm mb-2">Video Engagement</div>
            <pre className="text-xs text-neutral-400 bg-[#1F1F1F] p-3 rounded">
              {JSON.stringify(lead.video_engagement, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* SMS Messages */}
      {messages.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SMS Conversation</h2>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.direction === 'outbound'
                      ? 'bg-primary-500 text-white'
                      : 'bg-[#1F1F1F] text-neutral-300'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className={`text-xs mt-2 ${
                    msg.direction === 'outbound' ? 'text-white/70' : 'text-neutral-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Management */}
      <Card>
        <h2 className="text-2xl font-semibold mb-6">Lead Management</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={4}
            />
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </Container>
  )
}


