// /src/app/admin/crm/members/[id]/page.tsx
// Member intelligence page

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Textarea, Stack, PageHero, TrackingMilestoneCard } from '@/lib/design-system/components'
import { ConversationThread } from '@/components/crm/ConversationThread'
import { RefreshCw, MessageSquare, Mail, Target, Activity, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

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
    subscription_tiers: string[]
    subscription_count: number
    subscription_status: string
    mrr: number
    monthly_tokens: number
    storage_gb: number
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
  const [conversation, setConversation] = useState<any[]>([])
  const [loadingConversation, setLoadingConversation] = useState(false)
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
    fetchConversation()
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

  async function fetchConversation() {
    setLoadingConversation(true)
    try {
      const response = await fetch(`/api/crm/members/${params.id}/conversation`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Conversation API error:', response.status, errorData)
        
        // Don't show error for 404 - just means no conversation yet
        if (response.status === 404) {
          setConversation([])
          return
        }
        
        throw new Error('Failed to fetch conversation')
      }

      const data = await response.json()
      setConversation(data.conversation || [])
    } catch (error) {
      console.error('Error fetching conversation:', error)
      setConversation([]) // Set empty array on error
    } finally {
      setLoadingConversation(false)
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

      toast.success('Member updated successfully')
      fetchMember()
    } catch (error: any) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
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
          message: messageBody.trim(),
          userId: member.user_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      // Clear message
      setMessageBody('')
      
      // Refresh after a delay to allow DB commit
      setTimeout(async () => {
        await fetchConversation()
        await fetchMember()
      }, 1500)
    } catch (error: any) {
      toast.error('Failed to send message')
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

      // Clear form
      setEmailSubject('')
      setEmailBody('')
      
      // Refresh after a delay to allow DB commit
      setTimeout(async () => {
        await fetchConversation()
      }, 1500)
      
      toast.success('Email sent successfully')
    } catch (error: any) {
      toast.error('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  async function handleSendSMS() {
    if (!member?.phone) {
      toast.error('No phone number for this member')
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

      toast.success('SMS sent successfully')
      fetchMember()
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      toast.error('Failed to send SMS')
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
              <Badge className="bg-primary-500/20 text-primary-500 border border-primary-500/30 px-3 py-1 text-xs font-semibold">
                {activity.engagement_status}
              </Badge>
            )}
            {revenue.subscription_tiers && revenue.subscription_tiers.length > 0 && revenue.subscription_tiers.map((tier, index) => (
              <Badge 
                key={index}
                className="bg-secondary-500/20 text-secondary-500 border border-secondary-500/30 px-3 py-1 text-xs font-semibold"
              >
                {tier}
              </Badge>
            ))}
          </div>
        </PageHero>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#333] pb-4">
        {['overview', 'activity', 'features', 'revenue', 'conversation', 'support'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors border-2 ${
              activeTab === tab
                ? 'border-primary-500 text-primary-500 bg-primary-500/10'
                : 'border-[#333] text-neutral-400 hover:text-white hover:border-[#666] hover:bg-[#1F1F1F]'
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <TrackingMilestoneCard
              label="Visions"
              value={activity.vision_count || 0}
              theme="primary"
              icon={<Target className="w-6 h-6" />}
            />
            <TrackingMilestoneCard
              label="Last Login"
              value={daysSinceLogin !== null ? `${daysSinceLogin}d ago` : 'Never'}
              theme="secondary"
              icon={<Clock className="w-6 h-6" />}
            />
            <TrackingMilestoneCard
              label="MRR"
              value={`$${revenue.mrr?.toFixed(0) || '0'}`}
              theme="accent"
              icon={<DollarSign className="w-6 h-6" />}
            />
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
                      className="bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30 px-3 py-1 text-xs cursor-pointer hover:bg-[#8B5CF6]/30 font-semibold"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
                <div className="text-xs md:text-sm text-secondary-500 uppercase tracking-wide mb-2">Last Login</div>
                <div className="text-sm md:text-base font-semibold text-white">
                  {activity.last_login_at
                    ? new Date(activity.last_login_at).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                daysSinceLogin > 14 ? 'bg-[#D03739]/10 border-[#D03739]/25' :
                daysSinceLogin > 7 ? 'bg-[#FFB701]/10 border-[#FFB701]/25' :
                'bg-primary-500/10 border-primary-500/25'
              }`}>
                <div className={`text-xs md:text-sm uppercase tracking-wide mb-2 ${
                  daysSinceLogin > 14 ? 'text-[#EF4444]' :
                  daysSinceLogin > 7 ? 'text-[#FCD34D]' :
                  'text-primary-500'
                }`}>Days Since Login</div>
                <div className="text-lg md:text-xl font-bold text-white">
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
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-primary-500/10 border border-primary-500/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Profile Complete</div>
                <div className="text-xs md:text-sm text-primary-500">
                  {activity.profile_completion_percent || 0}% complete
                </div>
              </div>
              <div className="text-xl md:text-2xl text-primary-500">
                {(activity.profile_completion_percent || 0) >= 70 ? '✓' : '○'}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-primary-500/10 border border-primary-500/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Life Visions</div>
                <div className="text-xs md:text-sm text-primary-500">
                  {activity.vision_count || 0} created, {activity.vision_refinement_count || 0} refinements
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-primary-500">
                {activity.vision_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Vision Audio</div>
                <div className="text-xs md:text-sm text-secondary-500">
                  {activity.audio_generated_count || 0} generated
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-secondary-500">
                {activity.audio_generated_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#FFB701]/10 border border-[#FFB701]/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Journal Entries</div>
                <div className="text-xs md:text-sm text-[#FCD34D]">
                  Total entries written
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-[#FCD34D]">
                {activity.journal_entry_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Vision Board Images</div>
                <div className="text-xs md:text-sm text-[#C4B5FD]">
                  Images uploaded
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-[#C4B5FD]">
                {activity.vision_board_image_count || 0}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-neutral-600/10 border border-neutral-600/25">
              <div>
                <div className="text-sm md:text-base font-medium text-white">Storage</div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {activity.s3_file_count || 0} files, {activity.total_storage_mb?.toFixed(1) || '0'} MB
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-neutral-400">
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
            <div className="p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
              <div className="text-xs md:text-sm text-secondary-500 mb-1 uppercase tracking-wide">Subscription Tier</div>
              <div className="text-base md:text-lg font-semibold text-white">
                {revenue.subscription_tier || member.subscription_tier || 'Free'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-600/10 border border-neutral-600/25">
              <div className="text-xs md:text-sm text-neutral-400 mb-1 uppercase tracking-wide">Status</div>
              <div className="text-base md:text-lg font-semibold text-white">
                {revenue.subscription_status || 'N/A'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/25">
              <div className="text-xs md:text-sm text-primary-500 mb-1 uppercase tracking-wide">Monthly Revenue</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                ${revenue.mrr?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
              <div className="text-xs md:text-sm text-secondary-500 mb-1 uppercase tracking-wide">Lifetime Value</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                ${revenue.ltv?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FFB701]/10 border border-[#FFB701]/25">
              <div className="text-xs md:text-sm text-[#FCD34D] mb-1 uppercase tracking-wide">Total Spent</div>
              <div className="text-base md:text-lg font-semibold text-white">
                ${revenue.total_spent?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25">
              <div className="text-xs md:text-sm text-[#C4B5FD] mb-1 uppercase tracking-wide">Active Subscriptions</div>
              <div className="text-base md:text-lg font-semibold text-white">
                {revenue.subscription_count || 0}
              </div>
            </div>
            {revenue.monthly_tokens > 0 && (
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/25">
                <div className="text-xs md:text-sm text-primary-500 mb-1 uppercase tracking-wide">Monthly Tokens</div>
                <div className="text-base md:text-lg font-semibold text-white">
                  {(revenue.monthly_tokens / 1000).toFixed(0)}k
                </div>
              </div>
            )}
            {revenue.storage_gb > 0 && (
              <div className="p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
                <div className="text-xs md:text-sm text-secondary-500 mb-1 uppercase tracking-wide">Storage Quota</div>
                <div className="text-base md:text-lg font-semibold text-white">
                  {revenue.storage_gb} GB
                </div>
              </div>
            )}
          </div>

          {activity.tokens_used !== undefined && (
            <div className="mt-6 pt-6 border-t border-[#333]">
              <h3 className="text-base md:text-lg font-semibold mb-4">Token Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/25">
                  <div className="text-xs md:text-sm text-primary-500 mb-1 uppercase tracking-wide">Tokens Used</div>
                  <div className="text-base md:text-lg font-semibold text-white">
                    {activity.tokens_used || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/25">
                  <div className="text-xs md:text-sm text-secondary-500 mb-1 uppercase tracking-wide">Tokens Remaining</div>
                  <div className="text-base md:text-lg font-semibold text-white">
                    {activity.tokens_remaining || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'conversation' && (
        <div className="space-y-6">
          {/* Quick Messaging - Moved to Top */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMS Composer */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Send SMS
              </h3>
              
              {!member?.phone ? (
                <p className="text-sm text-yellow-500">
                  No phone number on file.
                </p>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your SMS..."
                    rows={4}
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Email Composer */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Email
              </h3>
              
              {!member?.email ? (
                <p className="text-sm text-yellow-500">
                  No email on file.
                </p>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject..."
                    disabled={sendingEmail}
                  />
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your email..."
                    rows={3}
                    disabled={sendingEmail}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      To: {member.email}
                    </span>
                    <Button
                      onClick={handleSendEmail}
                      disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                      loading={sendingEmail}
                      variant="primary"
                      size="sm"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Conversation History - Moved Below Messaging */}
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                Conversation History ({conversation.length})
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
              messages={[...conversation].reverse()} 
              loading={loadingConversation}
            />
          </Card>
        </div>
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

