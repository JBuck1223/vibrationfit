'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Badge, Button, Input, Textarea, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ArrowLeft, User, Mail, Phone, Calendar, Clock, Shield, CreditCard,
  MessageSquare, Send, ChevronDown, ChevronUp, CheckCircle, XCircle,
  FileText, Hash, DollarSign, Activity, Globe, Copy, ExternalLink,
  AlertTriangle, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { CRM_SENDERS } from '@/lib/crm/senders'

// ── Types ──

interface MemberData {
  user_id: string
  email: string
  phone: string | null
  full_name: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  date_of_birth: string | null
  role: string
  sms_opt_in: boolean
  sms_opt_in_date: string | null
  email_opt_in: boolean
  is_active: boolean
  household_id: string | null
  is_household_admin: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string | null
  activity_metrics: Record<string, unknown>
  revenue_metrics: Record<string, unknown>
}

interface ProfileData {
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  gender: string | null
  date_of_birth: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  employment_type: string | null
  occupation: string | null
  company: string | null
  household_income: string | null
  relationship_status: string | null
  education: string | null
  [key: string]: unknown
}

interface ConversationMessage {
  type: 'sms' | 'email'
  id: string
  content: string
  htmlContent?: string
  subject?: string
  direction: string
  timestamp: string
  metadata: Record<string, unknown>
}

interface Template {
  id: string
  slug: string
  name: string
  body: string
  subject?: string
  html_body?: string
  text_body?: string
  variables: string[]
  category: string
  status: string
}

// ── Helpers ──

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

// ── Collapsible Section ──

function Section({ title, icon: Icon, children, defaultOpen = true, count, badge }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
  badge?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {count !== undefined && (
            <Badge variant="neutral" className="text-xs">{count}</Badge>
          )}
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-neutral-700/50 pt-4">{children}</div>}
    </Card>
  )
}

function DataRow({ label, value, mono, copyable }: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyable?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-neutral-800 last:border-0">
      <span className="text-neutral-400 text-sm w-44 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`text-white text-sm ${mono ? 'font-mono text-xs' : ''} truncate`}>
          {value || <span className="text-neutral-600 italic">Not set</span>}
        </span>
        {copyable && (
          <button onClick={() => copyToClipboard(copyable)} className="text-neutral-500 hover:text-white flex-shrink-0">
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Compose Modal ──

function ComposeModal({ type, member, onClose, onSent }: {
  type: 'sms' | 'email'
  member: MemberData
  onClose: () => void
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [senderId, setSenderId] = useState<string>(CRM_SENDERS[0].id)
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  useEffect(() => {
    const endpoint = type === 'sms'
      ? '/api/admin/templates/sms?status=active'
      : '/api/admin/templates/email?status=active'
    fetch(endpoint)
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoadingTemplates(false))
  }, [type])

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId)
    if (!templateId) return
    const tmpl = templates.find(t => t.id === templateId)
    if (!tmpl) return

    const vars: Record<string, string> = {
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      full_name: member.full_name || '',
      email: member.email || '',
    }

    if (type === 'sms') {
      let body = tmpl.body || ''
      for (const [key, val] of Object.entries(vars)) {
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
      }
      setMessage(body)
    } else {
      let htmlBody = tmpl.html_body || tmpl.text_body || tmpl.body || ''
      for (const [key, val] of Object.entries(vars)) {
        htmlBody = htmlBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
      }
      setMessage(htmlBody)
      if (tmpl.subject) {
        let subj = tmpl.subject
        for (const [key, val] of Object.entries(vars)) {
          subj = subj.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
        }
        setSubject(subj)
      }
    }
  }

  async function handleSend() {
    if (!message.trim()) return
    if (type === 'email' && !subject.trim()) return

    setSending(true)
    try {
      if (type === 'sms') {
        const res = await fetch(`/api/crm/members/${member.user_id}/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: member.phone, message }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to send SMS')
        }
        toast.success('SMS sent successfully')
      } else {
        const isHtml = message.includes('<') && message.includes('>')
        const res = await fetch(`/api/crm/members/${member.user_id}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: member.email,
            subject,
            ...(isHtml ? { htmlBody: message } : { textBody: message }),
            senderId,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to send email')
        }
        toast.success('Email sent successfully')
      }
      onSent()
      onClose()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to send'
      toast.error(errMsg)
    } finally {
      setSending(false)
    }
  }

  const canSend = type === 'sms'
    ? (!!member.phone && !!message.trim())
    : (!!member.email && !!subject.trim() && !!message.trim())

  const optedOut = type === 'sms' ? !member.sms_opt_in : !member.email_opt_in

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            {type === 'sms' ? <MessageSquare className="w-5 h-5 text-primary-400" /> : <Mail className="w-5 h-5 text-primary-400" />}
            <h2 className="text-lg font-semibold text-white">
              Send {type === 'sms' ? 'SMS' : 'Email'} to {member.first_name || member.full_name}
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {optedOut && (
            <div className="flex items-start gap-3 p-3 bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-[#FF0040] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">
                  {type === 'sms' ? 'SMS Opt-In: OFF' : 'Email Opt-In: OFF'}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  This member has not opted in to {type === 'sms' ? 'SMS' : 'email'} communications. Proceed with caution.
                </p>
              </div>
            </div>
          )}

          {type === 'sms' && !member.phone && (
            <div className="flex items-start gap-3 p-3 bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-xl">
              <XCircle className="w-5 h-5 text-[#FF0040] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white">No phone number on file. Cannot send SMS.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">To:</label>
            <div className="px-3 py-2 bg-neutral-800 rounded-lg text-sm text-neutral-300">
              {type === 'sms' ? (member.phone || 'No phone number') : member.email}
            </div>
          </div>

          {type === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-300">From:</label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {CRM_SENDERS.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({s.email})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Template:</label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Spinner size="sm" /> Loading templates...
              </div>
            ) : (
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">Write from scratch</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            )}
          </div>

          {type === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-300">Subject:</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject line..."
                disabled={sending}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'sms' ? 'Type your SMS...' : 'Type your email body...'}
              rows={type === 'sms' ? 6 : 10}
              disabled={sending}
            />
            {type === 'sms' && (
              <div className="flex items-center justify-between mt-1.5 text-xs text-neutral-500">
                <span>{message.length} characters</span>
                <span>{Math.ceil(message.length / 160) || 1} segment{Math.ceil(message.length / 160) !== 1 ? 's' : ''} (160 chars each)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-neutral-700/50">
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="primary" onClick={handleSend} disabled={!canSend || sending} loading={sending}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : `Send ${type === 'sms' ? 'SMS' : 'Email'}`}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ── Conversation Timeline with Tabs ──

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isOutbound = msg.direction === 'outbound'
  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
        isOutbound
          ? 'bg-primary-500/15 border border-primary-500/30'
          : 'bg-neutral-800 border border-neutral-700'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          {msg.type === 'sms' ? (
            <MessageSquare className="w-3.5 h-3.5 text-secondary-400" />
          ) : (
            <Mail className="w-3.5 h-3.5 text-accent-400" />
          )}
          <span className="text-xs font-medium text-neutral-400 uppercase">
            {msg.type} {isOutbound ? 'Sent' : 'Received'}
          </span>
          <span className="text-xs text-neutral-500">{formatDateTime(msg.timestamp)}</span>
        </div>
        {msg.subject && (
          <p className="text-xs text-neutral-300 font-medium mb-1">Re: {msg.subject}</p>
        )}
        <p className="text-sm text-white whitespace-pre-wrap break-words">{msg.content}</p>
        {msg.metadata?.from || msg.metadata?.to ? (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-600">
            {msg.metadata.from ? <span>From: {String(msg.metadata.from)}</span> : null}
            {msg.metadata.to ? <span>To: {String(msg.metadata.to)}</span> : null}
          </div>
        ) : null}
        {msg.metadata?.status ? (
          <div className="mt-1">
            <span className="text-xs text-neutral-500">{String(msg.metadata.status)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MessageList({ messages }: { messages: ConversationMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-500">
        <p className="text-sm italic">No messages in this channel</p>
      </div>
    )
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
      {sorted.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

type ConvoTab = 'all' | 'sms' | 'email'

function ConversationPanel({ messages, onCompose }: {
  messages: ConversationMessage[]
  onCompose: (type: 'sms' | 'email') => void
}) {
  const [tab, setTab] = useState<ConvoTab>('all')

  const smsMsgs = messages.filter(m => m.type === 'sms')
  const emailMsgs = messages.filter(m => m.type === 'email')

  const tabs: { key: ConvoTab; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'all', label: 'All', count: messages.length, icon: Activity },
    { key: 'sms', label: 'SMS', count: smsMsgs.length, icon: MessageSquare },
    { key: 'email', label: 'Email', count: emailMsgs.length, icon: Mail },
  ]

  const filtered = tab === 'sms' ? smsMsgs : tab === 'email' ? emailMsgs : messages

  return (
    <div>
      {/* Tab bar + compose buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-neutral-800/50 rounded-lg p-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                <span className={`text-xs ml-0.5 ${tab === t.key ? 'text-primary-400' : 'text-neutral-500'}`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => onCompose('email')}>
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Compose Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCompose('sms')}
            className="text-secondary-400 border-secondary-500/50 hover:bg-secondary-500/10"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Compose SMS
          </Button>
        </div>
      </div>

      <MessageList messages={filtered} />
    </div>
  )
}

// ── Main Content ──

function MemberDetailContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [member, setMember] = useState<MemberData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composeType, setComposeType] = useState<'sms' | 'email' | null>(null)

  async function loadMember() {
    try {
      const [memberRes, convoRes] = await Promise.all([
        fetch(`/api/crm/members/${id}`),
        fetch(`/api/crm/members/${id}/conversation`),
      ])

      if (!memberRes.ok) throw new Error('Failed to load member')
      const memberData = await memberRes.json()
      setMember(memberData.member)
      setProfile(memberData.profile)

      if (convoRes.ok) {
        const convoData = await convoRes.json()
        setConversation(convoData.conversation || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadMember()
  }, [id])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-neutral-400 mt-4">Loading member data...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !member) {
    return (
      <Container size="xl">
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error || 'Member not found'}</p>
          <Button variant="outline" onClick={() => router.push('/admin/crm/members')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Members
          </Button>
        </div>
      </Container>
    )
  }

  const revenue = member.revenue_metrics as Record<string, unknown>
  const activity = member.activity_metrics as Record<string, unknown>

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/crm/members')} className="self-start">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Members
        </Button>

        {/* ── Hero Header ── */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {member.profile_picture_url ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500/30">
                  <img src={member.profile_picture_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border-2 border-neutral-700">
                  <User className="w-8 h-8 text-neutral-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{member.full_name}</h1>
                <Badge variant={member.is_active ? 'success' : 'neutral'}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="neutral">{member.role}</Badge>
                {revenue.subscription_tier ? (
                  <Badge className="bg-accent-500/20 text-accent-400 border-accent-500/30">
                    {String(revenue.subscription_tier)}
                  </Badge>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-neutral-300">
                <button
                  onClick={() => copyToClipboard(member.email)}
                  className="flex items-center gap-2 hover:text-white transition-colors text-left"
                >
                  <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                  <Copy className="w-3 h-3 text-neutral-600" />
                </button>

                {member.phone ? (
                  <button
                    onClick={() => copyToClipboard(member.phone!)}
                    className="flex items-center gap-2 hover:text-white transition-colors text-left"
                  >
                    <Phone className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span>{member.phone}</span>
                    <Copy className="w-3 h-3 text-neutral-600" />
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-neutral-600">
                    <Phone className="w-4 h-4" /> No phone
                  </span>
                )}

                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" /> Joined {formatDate(member.created_at)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" /> Last login {timeAgo(member.last_login_at)}
                </span>
              </div>

              {/* Opt-in Status */}
              <div className="flex items-center gap-4 mt-3">
                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                  member.sms_opt_in ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                }`}>
                  {member.sms_opt_in ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  SMS {member.sms_opt_in ? 'Opted In' : 'Not Opted In'}
                  {member.sms_opt_in_date && <span className="text-neutral-500 ml-1">({formatDate(member.sms_opt_in_date)})</span>}
                </div>
                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                  member.email_opt_in ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                }`}>
                  {member.email_opt_in ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Email {member.email_opt_in ? 'Opted In' : 'Not Opted In'}
                </div>
              </div>

              <div className="text-xs text-neutral-600 font-mono mt-2">ID: {member.user_id}</div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-5 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">${Number(revenue.mrr || 0).toFixed(0)}</div>
                <div className="text-xs text-neutral-400">MRR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-400">${Number(revenue.ltv || 0).toFixed(0)}</div>
                <div className="text-xs text-neutral-400">LTV</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-400">{Number(activity.vision_count || 0)}</div>
                <div className="text-xs text-neutral-400">Visions</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-5 pt-4 border-t border-neutral-700/50 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setComposeType('email')}
            >
              <Mail className="w-4 h-4 mr-2" /> Send Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComposeType('sms')}
              disabled={!member.phone}
              className={member.phone ? 'text-secondary-400 border-secondary-500/50 hover:bg-secondary-500/10' : ''}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Send SMS
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/users/${member.user_id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Full User Profile
            </Button>
          </div>
        </Card>

        {/* ── Contact & Account Details ── */}
        <Section title="Contact & Account Details" icon={User} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <h3 className="text-sm font-semibold text-primary-400 mb-2">Contact Info</h3>
              <DataRow label="Email" value={member.email} copyable={member.email} />
              <DataRow label="Phone" value={member.phone} copyable={member.phone || undefined} />
              <DataRow label="First Name" value={member.first_name} />
              <DataRow label="Last Name" value={member.last_name} />
              <DataRow label="Date of Birth" value={formatDate(member.date_of_birth)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-400 mb-2">Account Settings</h3>
              <DataRow label="Role" value={member.role} />
              <DataRow label="SMS Opt-In" value={
                member.sms_opt_in
                  ? <span className="text-green-400">Yes ({formatDate(member.sms_opt_in_date)})</span>
                  : <span className="text-neutral-500">No</span>
              } />
              <DataRow label="Email Opt-In" value={
                member.email_opt_in
                  ? <span className="text-green-400">Yes</span>
                  : <span className="text-neutral-500">No</span>
              } />
              <DataRow label="Account Status" value={
                member.is_active
                  ? <span className="text-green-400">Active</span>
                  : <span className="text-red-400">Inactive</span>
              } />
              <DataRow label="Household Admin" value={member.is_household_admin ? 'Yes' : 'No'} />
              {member.household_id && <DataRow label="Household ID" value={member.household_id} mono copyable={member.household_id} />}
              <DataRow label="User ID" value={member.user_id} mono copyable={member.user_id} />
            </div>
          </div>

          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6 pt-4 border-t border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-2">Demographics</h3>
                <DataRow label="Gender" value={profile.gender} />
                <DataRow label="Relationship" value={profile.relationship_status} />
                <DataRow label="Education" value={profile.education} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-2">Location</h3>
                <DataRow label="City" value={profile.city} />
                <DataRow label="State" value={profile.state} />
                <DataRow label="Country" value={profile.country} />
                <DataRow label="Postal Code" value={profile.postal_code} />
              </div>
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4 pt-4 border-t border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-2">Work & Finance</h3>
                <DataRow label="Employment" value={profile.employment_type} />
                <DataRow label="Occupation" value={profile.occupation} />
                <DataRow label="Company" value={profile.company} />
                <DataRow label="Household Income" value={profile.household_income} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-2">Dates</h3>
                <DataRow label="Account Created" value={formatDateTime(member.created_at)} />
                <DataRow label="Last Login" value={formatDateTime(member.last_login_at)} />
                <DataRow label="Last Updated" value={formatDateTime(member.updated_at)} />
              </div>
            </div>
          )}
        </Section>

        {/* ── Revenue & Subscription ── */}
        <Section title="Revenue & Subscription" icon={CreditCard} defaultOpen={true}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Subscription', value: String(revenue.subscription_tier || 'Free'), color: 'text-accent-400' },
              { label: 'MRR', value: `$${Number(revenue.mrr || 0).toFixed(2)}`, color: 'text-primary-400' },
              { label: 'LTV', value: `$${Number(revenue.ltv || 0).toFixed(2)}`, color: 'text-secondary-400' },
              { label: 'Total Spent', value: `$${Number(revenue.total_spent || 0).toFixed(2)}`, color: 'text-white' },
              { label: 'Days as Customer', value: String(revenue.days_as_customer || 0), color: 'text-white' },
            ].map(item => (
              <div key={item.label} className="bg-neutral-800 rounded-xl p-4 text-center">
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-neutral-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <DataRow label="Subscription Status" value={String(revenue.subscription_status || 'None')} />
              <DataRow label="Active Subscriptions" value={String(revenue.subscription_count || 0)} />
              <DataRow label="Monthly Tokens" value={String(revenue.monthly_tokens || 0)} />
              <DataRow label="Storage" value={`${revenue.storage_gb || 0} GB`} />
            </div>
            <div>
              {revenue.stripe_customer_id ? (
                <DataRow label="Stripe Customer" value={String(revenue.stripe_customer_id)} mono copyable={String(revenue.stripe_customer_id)} />
              ) : null}
              {revenue.stripe_subscription_id ? (
                <DataRow label="Stripe Subscription" value={String(revenue.stripe_subscription_id)} mono copyable={String(revenue.stripe_subscription_id)} />
              ) : null}
              <DataRow label="Sub Start Date" value={formatDate(revenue.subscription_start_date as string)} />
            </div>
          </div>
        </Section>

        {/* ── Activity Metrics ── */}
        <Section title="Activity Metrics" icon={Activity} defaultOpen={true}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Profile Completion', value: `${activity.profile_completion_percent || 0}%` },
              { label: 'Visions', value: activity.vision_count || 0 },
              { label: 'Journal Entries', value: activity.journal_entry_count || 0 },
              { label: 'Audio Generated', value: activity.audio_generated_count || 0 },
              { label: 'Vision Board', value: activity.vision_board_image_count || 0 },
              { label: 'Days Since Login', value: activity.days_since_last_login ?? 'N/A' },
            ].map(item => (
              <div key={item.label} className="bg-neutral-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{String(item.value)}</div>
                <div className="text-xs text-neutral-400">{item.label}</div>
              </div>
            ))}
          </div>

          {activity.engagement_status ? (
            <div className="mt-4 flex items-center gap-4">
              <DataRow label="Engagement Status" value={
                <Badge className="text-xs">{String(activity.engagement_status)}</Badge>
              } />
              {activity.health_status ? (
                <DataRow label="Health Status" value={
                  <Badge className="text-xs">{String(activity.health_status)}</Badge>
                } />
              ) : null}
            </div>
          ) : null}

          {activity.admin_notes ? (
            <div className="mt-4 p-3 bg-accent-500/10 border border-accent-500/30 rounded-xl">
              <div className="text-xs text-accent-400 font-semibold mb-1">Admin Notes</div>
              <p className="text-sm text-white">{String(activity.admin_notes)}</p>
            </div>
          ) : null}

          {Array.isArray(activity.custom_tags) && (activity.custom_tags as string[]).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(activity.custom_tags as string[]).map((tag: string) => (
                <Badge key={tag} variant="neutral" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </Section>

        {/* ── Conversation History ── */}
        <Section
          title="Conversation History"
          icon={MessageSquare}
          count={conversation.length}
          defaultOpen={true}
        >
          <ConversationPanel
            messages={conversation}
            onCompose={(type) => setComposeType(type)}
          />
        </Section>

      </Stack>

      {/* Compose Modal */}
      {composeType && (
        <ComposeModal
          type={composeType}
          member={member}
          onClose={() => setComposeType(null)}
          onSent={loadMember}
        />
      )}
    </Container>
  )
}

export default function MemberDetailPage() {
  return (
    <AdminWrapper>
      <MemberDetailContent />
    </AdminWrapper>
  )
}
