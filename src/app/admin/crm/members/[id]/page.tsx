// /src/app/admin/crm/members/[id]/page.tsx
// Member intelligence page

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Textarea , Stack, PageHero } from '@/lib/design-system/components'

interface Member {
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

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [smsMessages, setSmsMessages] = useState<any[]>([])
  const [emailMessages, setEmailMessages] = useState<any[]>([])
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
  
  // Message composer state
  const [messageBody, setMessageBody] = useState('')
  const [sending, setSending] = useState(false)
  
  // Email composer state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchMember()
  }, [params.id])

  async function fetchMember() {
    try {
      const response = await fetch(`/api/crm/members/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch member')

      const data = await response.json()
      setMember(data.member)
      setSmsMessages(data.smsMessages || [])
      setEmailMessages(data.emailMessages || [])
      setTickets(data.tickets || [])
      setLead(data.lead)

      // Initialize form state
      setEngagementStatus(data.member.activity_metrics?.engagement_status || '')
      setHealthStatus(data.member.activity_metrics?.health_status || '')
      setTags(data.member.activity_metrics?.custom_tags || [])
      setNotes(data.member.activity_metrics?.admin_notes || '')
    } catch (error) {
      console.error('Error fetching member:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    setUpdating(true)
    try {
      const response = await fetch(`/api/crm/members/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagement_status: engagementStatus || null,
          health_status: healthStatus || null,
          custom_tags: tags,
          admin_notes: notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to update member')

      alert('Member updated successfully!')
      fetchMember()
    } catch (error: any) {
      console.error('Error updating member:', error)
      alert('Failed to update member')
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

  async function handleSendMessage() {
    if (!messageBody.trim() || !member?.phone) return

    setSending(true)
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.phone,
          body: messageBody.trim(),
          user_id: member.user_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      // Clear message and refresh
      setMessageBody('')
      await fetchMember()
    } catch (error: any) {
      alert(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleSendEmail() {
    if (!emailSubject.trim() || !emailBody.trim() || !member?.email) return

    setSendingEmail(true)
    try {
      const response = await fetch(`/api/crm/members/${member.user_id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.email,
          subject: emailSubject.trim(),
          htmlBody: emailBody.replace(/\n/g, '<br>'),
          textBody: emailBody.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      // Clear and close
      setEmailSubject('')
      setEmailBody('')
      setShowEmailModal(false)
      alert('Email sent successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  async function handleSendSMS() {
    if (!member?.phone) {
      alert('No phone number for this member')
      return
    }

    const message = prompt('Enter message to send:')
    if (!message) return

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.phone,
          message,
          userId: member.user_id,
        }),
      })

      if (!response.ok) throw new Error('Failed to send SMS')

      alert('SMS sent successfully!')
      fetchMember()
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS')
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!member) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero title="Member Not Found" subtitle="The requested member could not be found" />
        <Card className="text-center p-8 md:p-12">
          <p className="text-sm md:text-base text-neutral-400">This member may have been deleted or the ID is incorrect.</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/crm/members')}
            className="mt-4"
          >
            ← Back to Members
          </Button>
        </Card>
        </Stack>
      </Container>
    )
  }

  const activity = member.activity_metrics || {}
  const revenue = member.revenue_metrics || {}
  const daysSinceLogin = activity.days_since_last_login

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero 
          title={member.full_name || 'Unknown Member'}
          subtitle={`${member.email}${member.phone ? ` • ${member.phone}` : ''}`}
        >
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/crm/members')}
            >
              ← Back to Members
            </Button>
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
        </PageHero>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#333] pb-4">
        {['overview', 'activity', 'features', 'revenue', 'messages', 'email', 'support'].map((tab) => (
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
                {new Date(member.created_at).toLocaleDateString()} 
                {' '}({Math.floor((Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24))} days)
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
                {revenue.subscription_tier || member.subscription_tier || 'Free'}
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
        <Card className="p-4 md:p-6 lg:p-8 flex flex-col h-[600px]">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">SMS Conversation</h2>
          
          {/* Message Thread - Scrollable */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
            {smsMessages.length === 0 ? (
              <p className="text-sm md:text-base text-neutral-400 text-center py-8">
                No messages yet. Start the conversation below!
              </p>
            ) : (
              smsMessages.map((msg) => (
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
              ))
            )}
          </div>

          {/* Message Composer */}
          <div className="border-t border-[#333] pt-4">
            {!member?.phone ? (
              <p className="text-sm text-yellow-500 text-center py-2">
                No phone number on file. Add phone number to send messages.
              </p>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    To: {member.phone}
                  </span>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageBody.trim() || sending}
                    loading={sending}
                    variant="primary"
                    size="sm"
                  >
                    {sending ? 'Sending...' : 'Send SMS'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'email' && (
        <Card className="p-4 md:p-6 lg:p-8 flex flex-col h-[600px]">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Email Conversation</h2>
          
          {!member?.email ? (
            <p className="text-sm text-yellow-500 text-center py-8">
              No email on file
            </p>
          ) : (
            <>
              {/* Email Thread - Scrollable */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {emailMessages.length === 0 ? (
                  <p className="text-sm md:text-base text-neutral-400 text-center py-8">
                    No emails yet. Start the conversation below!
                  </p>
                ) : (
                  emailMessages.map((email) => (
                    <div
                      key={email.id}
                      className={`border-l-4 ${
                        email.direction === 'outbound' 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : 'border-secondary-500 bg-secondary-500/10'
                      } p-3 md:p-4 rounded-lg`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs md:text-sm font-semibold text-neutral-300">
                            {email.direction === 'outbound' ? '→ Sent' : '← Received'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {email.direction === 'outbound' ? `To: ${email.to_email}` : `From: ${email.from_email}`}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {new Date(email.sent_at || email.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm md:text-base font-semibold mb-2">{email.subject}</p>
                      <div 
                        className="text-sm md:text-base text-neutral-300 prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: email.body_html || email.body_text?.replace(/\n/g, '<br>') || '' }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Email Composer */}
              <div className="border-t border-[#333] pt-4 space-y-3">
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject..."
                  disabled={sendingEmail}
                />
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  disabled={sendingEmail}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                    loading={sendingEmail}
                    variant="primary"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                </div>
              </div>
            </>
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

