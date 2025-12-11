// /src/app/admin/crm/customers/[id]/page.tsx
// Customer intelligence page

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Textarea , Stack, PageHero } from '@/lib/design-system/components'

interface Customer {
  user_id: string
  email: string
  full_name: string
  phone: string
  subscription_tier: string
  created_at: string
  activity_metrics: {
    profile_completion_percent: number
    vision_count: number
    vision_refinement_count: number
    audio_generated_count: number
    journal_entry_count: number
    vision_board_image_count: number
    last_login_at: string
    total_logins: number
    days_since_last_login: number
    s3_file_count: number
    total_storage_mb: number
    tokens_used: number
    tokens_remaining: number
    engagement_status: string
    health_status: string
    custom_tags: string[]
    admin_notes: string
  }
  revenue_metrics: {
    subscription_tier: string
    subscription_status: string
    mrr: number
    ltv: number
    total_spent: number
    subscription_start_date: string
    months_subscribed: number
  }
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [updating, setUpdating] = useState(false)

  // Form state for manual updates
  const [engagementStatus, setEngagementStatus] = useState('')
  const [healthStatus, setHealthStatus] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  async function fetchCustomer() {
    try {
      const response = await fetch(`/api/crm/customers/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch customer')

      const data = await response.json()
      setCustomer(data.customer)
      setMessages(data.messages || [])
      setTickets(data.tickets || [])
      setLead(data.lead)

      // Initialize form state
      setEngagementStatus(data.customer.activity_metrics?.engagement_status || '')
      setHealthStatus(data.customer.activity_metrics?.health_status || '')
      setTags(data.customer.activity_metrics?.custom_tags || [])
      setNotes(data.customer.activity_metrics?.admin_notes || '')
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    setUpdating(true)
    try {
      const response = await fetch(`/api/crm/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagement_status: engagementStatus || null,
          health_status: healthStatus || null,
          custom_tags: tags,
          admin_notes: notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to update customer')

      alert('Customer updated successfully!')
      fetchCustomer()
    } catch (error: any) {
      console.error('Error updating customer:', error)
      alert('Failed to update customer')
    } finally {
      setUpdating(false)
    }
  }

  function addTag() {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleSendSMS() {
    if (!customer?.phone) {
      alert('No phone number for this customer')
      return
    }

    const message = prompt('Enter message to send:')
    if (!message) return

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.phone,
          message,
          userId: customer.user_id,
        }),
      })

      if (!response.ok) throw new Error('Failed to send SMS')

      alert('SMS sent successfully!')
      fetchCustomer()
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS')
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Stack gap="lg">
          <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
        <Spinner size="lg" />
        </Stack>
      </Container>
    )
  }

  if (!customer) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
        <Card className="text-center p-8 md:p-12">
          <p className="text-sm md:text-base text-neutral-400">Customer not found</p>
        </Card>
        </Stack>
      </Container>
    )
  }

  const activity = customer.activity_metrics || {}
  const revenue = customer.revenue_metrics || {}
  const daysSinceLogin = activity.days_since_last_login

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/crm/customers')}
          className="mb-4"
        >
          ← Back to Customers
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 truncate">
              {customer.full_name || 'Unknown'}
            </h1>
            <p className="text-sm md:text-base text-neutral-400 break-all">{customer.email}</p>
            {customer.phone && (
              <p className="text-sm md:text-base text-neutral-400">{customer.phone}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {activity.engagement_status && (
                <Badge className="bg-primary-500 text-white px-3 py-1 text-xs">
                  {activity.engagement_status}
                </Badge>
              )}
              {revenue.subscription_tier && (
                <Badge className="bg-secondary-500 text-white px-3 py-1 text-xs">
                  {revenue.subscription_tier}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {customer.phone && (
              <Button variant="secondary" size="sm" onClick={handleSendSMS}>
                📱 Text
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = `mailto:${customer.email}`}
            >
              ✉️ Email
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#333] pb-4">
        {['overview', 'activity', 'features', 'revenue', 'messages', 'support'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-[#1F1F1F]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4 md:space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="text-center p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-primary-500">
                {activity.vision_count || 0}
              </div>
              <div className="text-xs md:text-sm text-neutral-400">Visions</div>
            </Card>
            <Card className="text-center p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-secondary-500">
                {activity.total_logins || 0}
              </div>
              <div className="text-xs md:text-sm text-neutral-400">Logins</div>
            </Card>
            <Card className="text-center p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-[#FFB701]">
                {daysSinceLogin !== null ? `${daysSinceLogin}d` : 'N/A'}
              </div>
              <div className="text-xs md:text-sm text-neutral-400">Last Login</div>
            </Card>
            <Card className="text-center p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-[#8B5CF6]">
                ${revenue.mrr?.toFixed(0) || '0'}
              </div>
              <div className="text-xs md:text-sm text-neutral-400">MRR</div>
            </Card>
          </div>

          {/* Manual Classification */}
          <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Manual Classification</h2>
            
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-2">Engagement Status</label>
                  <select
                    value={engagementStatus}
                    onChange={(e) => setEngagementStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm md:text-base"
                  >
                    <option value="">Not Set</option>
                    <option value="active">Active</option>
                    <option value="at_risk">At Risk</option>
                    <option value="champion">Champion</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium mb-2">Health Status</label>
                  <select
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm md:text-base"
                  >
                    <option value="">Not Set</option>
                    <option value="healthy">Healthy</option>
                    <option value="needs_attention">Needs Attention</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-[#8B5CF6] text-white px-3 py-1 text-xs cursor-pointer hover:bg-[#7C3AED]"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="ghost" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Your Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add observations, action items, etc..."
                  rows={4}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Activity Metrics</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs md:text-sm text-neutral-500">Total Logins</div>
                <div className="text-lg md:text-xl font-bold text-primary-500">
                  {activity.total_logins || 0}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-neutral-500">Last Login</div>
                <div className="text-sm md:text-base font-semibold text-neutral-300">
                  {activity.last_login_at
                    ? new Date(activity.last_login_at).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-neutral-500">Days Since Login</div>
                <div className={`text-lg md:text-xl font-bold ${
                  daysSinceLogin > 14 ? 'text-[#D03739]' :
                  daysSinceLogin > 7 ? 'text-[#FFB701]' :
                  'text-primary-500'
                }`}>
                  {daysSinceLogin !== null ? `${daysSinceLogin}d` : 'N/A'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#333]">
              <div className="text-xs md:text-sm text-neutral-500 mb-2">Member Since</div>
              <div className="text-sm md:text-base text-neutral-300">
                {new Date(customer.created_at).toLocaleDateString()} 
                {' '}({Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))} days)
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'features' && (
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Feature Usage</h2>
          
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-[#333]">
              <div>
                <div className="text-sm md:text-base font-medium">Profile Complete</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {activity.profile_completion_percent || 0}% complete
                </div>
              </div>
              <div className="text-xl md:text-2xl">
                {(activity.profile_completion_percent || 0) >= 70 ? '✓' : '○'}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#333]">
              <div>
                <div className="text-sm md:text-base font-medium">Life Visions</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {activity.vision_count || 0} created, {activity.vision_refinement_count || 0} refinements
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-primary-500">
                {activity.vision_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#333]">
              <div>
                <div className="text-sm md:text-base font-medium">Vision Audio</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {activity.audio_generated_count || 0} generated
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-secondary-500">
                {activity.audio_generated_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#333]">
              <div>
                <div className="text-sm md:text-base font-medium">Journal Entries</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Total entries written
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-[#FFB701]">
                {activity.journal_entry_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#333]">
              <div>
                <div className="text-sm md:text-base font-medium">Vision Board Images</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Images uploaded
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-[#8B5CF6]">
                {activity.vision_board_image_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm md:text-base font-medium">Storage</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {activity.s3_file_count || 0} files, {activity.total_storage_mb?.toFixed(1) || '0'} MB
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-neutral-300">
                {activity.s3_file_count || 0}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'revenue' && (
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Revenue & Subscription</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Subscription Tier</div>
              <div className="text-base md:text-lg font-semibold text-neutral-300">
                {revenue.subscription_tier || customer.subscription_tier || 'Free'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Status</div>
              <div className="text-base md:text-lg font-semibold text-neutral-300">
                {revenue.subscription_status || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Monthly Revenue</div>
              <div className="text-xl md:text-2xl font-bold text-primary-500">
                ${revenue.mrr?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Lifetime Value</div>
              <div className="text-xl md:text-2xl font-bold text-secondary-500">
                ${revenue.ltv?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Total Spent</div>
              <div className="text-base md:text-lg font-semibold text-neutral-300">
                ${revenue.total_spent?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-neutral-500 mb-1">Months Subscribed</div>
              <div className="text-base md:text-lg font-semibold text-neutral-300">
                {revenue.months_subscribed || 0}
              </div>
            </div>
          </div>

          {activity.tokens_used !== undefined && (
            <div className="mt-6 pt-6 border-t border-[#333]">
              <h3 className="text-base md:text-lg font-semibold mb-4">Token Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs md:text-sm text-neutral-500 mb-1">Tokens Used</div>
                  <div className="text-base md:text-lg font-semibold text-neutral-300">
                    {activity.tokens_used || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs md:text-sm text-neutral-500 mb-1">Tokens Remaining</div>
                  <div className="text-base md:text-lg font-semibold text-neutral-300">
                    {activity.tokens_remaining || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'messages' && (
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">SMS Conversation</h2>
          
          {messages.length === 0 ? (
            <p className="text-sm md:text-base text-neutral-400 text-center py-8">
              No messages yet
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                      msg.direction === 'outbound'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#1F1F1F] text-neutral-300'
                    }`}
                  >
                    <p className="text-sm md:text-base break-words">{msg.body}</p>
                    <p className={`text-xs mt-1 md:mt-2 ${
                      msg.direction === 'outbound' ? 'text-white/70' : 'text-neutral-500'
                    }`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'support' && (
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Support Tickets</h2>
          
          {tickets.length === 0 ? (
            <p className="text-sm md:text-base text-neutral-400 text-center py-8">
              No support tickets
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-[#1F1F1F] rounded-xl hover:bg-[#2A2A2A] cursor-pointer transition-colors gap-3"
                  onClick={() => window.open(`/admin/crm/support/${ticket.id}`, '_blank')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm text-neutral-500 mb-1">{ticket.ticket_number}</div>
                    <div className="font-medium text-sm md:text-base truncate">{ticket.subject}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`px-2 py-1 text-xs ${
                      ticket.status === 'resolved' ? 'bg-primary-500' :
                      ticket.status === 'in_progress' ? 'bg-[#FFB701]' :
                      'bg-[#666666]'
                    } text-white`}>
                      {ticket.status}
                    </Badge>
                    <span className="text-xs md:text-sm text-neutral-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      </Stack>
    </Container>
  )
}








