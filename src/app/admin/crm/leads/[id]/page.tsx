// Lead detail page with conversation thread and email composer
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
} from '@/lib/design-system/components'
import { ArrowLeft, Mail, MessageSquare, Phone, Calendar, RefreshCw, Send, FileText, ChevronDown, Search, Eye, EyeOff, X, User } from 'lucide-react'
import { ConversationThread } from '@/components/crm/ConversationThread'
import { useConversationRealtime } from '@/hooks/useConversationRealtime'
import { CRM_SENDERS, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'
import { toast } from 'sonner'

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

interface EmailTemplate {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  subject: string
  html_body: string
  text_body: string | null
  variables: string[]
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<Lead | null>(null)
  const [conversation, setConversation] = useState<any[]>([])
  const [loadingConversation, setLoadingConversation] = useState(false)

  // Email composer
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [senderId, setSenderId] = useState(DEFAULT_CRM_SENDER.id)

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')

  useConversationRealtime({
    onUpdate: fetchConversation,
    email: lead?.email,
    enabled: !!lead,
  })

  useEffect(() => {
    if (leadId) {
      fetchLead()
      fetchConversation()
      fetchTemplates()
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
      toast.error('Failed to load lead')
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

  async function fetchTemplates() {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/admin/templates/email?status=active')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  function substituteVars(text: string): string {
    const firstName = lead?.first_name || ''
    const lastName = lead?.last_name || ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    const vars: Record<string, string> = {
      firstName,
      lastName,
      name: fullName,
      fullName,
      email: lead?.email || '',
    }

    let result = text
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return result
  }

  function applyTemplate(template: EmailTemplate) {
    const subject = substituteVars(template.subject)
    const html = substituteVars(template.html_body || '')
    const text = substituteVars(template.text_body || '')

    setEmailSubject(subject)
    setEmailBody(text || html.replace(/<[^>]*>/g, ''))
    setEmailHtml('')
    setShowTemplates(false)
    setTemplateSearch('')
    setShowPreview(false)
    toast.success(`Template "${template.name}" loaded`)
  }

  function clearTemplate() {
    setEmailHtml('')
    setEmailBody('')
    setEmailSubject('')
    setShowPreview(false)
  }

  const filteredTemplates = templates.filter((t) => {
    if (!templateSearch.trim()) return true
    const q = templateSearch.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    )
  })

  async function handleSendEmail() {
    const hasContent = emailHtml.trim() || emailBody.trim()
    if (!emailSubject.trim() || !hasContent || !lead?.email) return

    setSendingEmail(true)
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject: emailSubject.trim(),
          textBody: emailBody.trim(),
          senderId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      setEmailSubject('')
      setEmailBody('')
      setEmailHtml('')
      setShowPreview(false)
      toast.success('Email sent')

      // Auto-update status in UI if it was 'new'
      if (lead.status === 'new') {
        setLead({ ...lead, status: 'contacted' })
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send email'
      toast.error(msg)
    } finally {
      setSendingEmail(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new':
        return 'bg-[#8B5CF6] text-white'
      case 'contacted':
        return 'bg-[#FFB701] text-black'
      case 'qualified':
        return 'bg-secondary-500 text-black'
      case 'converted':
        return 'bg-primary-500 text-black'
      case 'lost':
        return 'bg-[#666666] text-white'
      default:
        return 'bg-neutral-600 text-white'
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
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 px-5 py-3 text-sm font-semibold rounded-full bg-transparent border-2 border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300"
          >
            Go Back
          </button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-8 md:py-12">
      <Stack gap="lg">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Lead Info */}
        <PageHero
          title={`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email}
          subtitle={lead.type}
        >
          <div className="flex flex-wrap gap-3">
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

        {/* Email Composer */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-500" />
            Send Email
          </h2>

          {!lead.email ? (
            <p className="text-sm text-yellow-500">No email on file.</p>
          ) : (
            <div className="space-y-4">
              {/* Template Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowTemplates(!showTemplates); setTemplateSearch('') }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#404040] border-2 border-[#666666] text-neutral-300 hover:border-[#39FF14] hover:text-white transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  Load Template
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </button>

                {showTemplates && (
                  <div className="absolute z-50 mt-2 w-full max-w-lg bg-[#2A2A2A] border-2 border-[#444] rounded-xl shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-[#444]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates..."
                          autoFocus
                          className="w-full pl-10 pr-4 py-2 text-sm bg-[#1A1A1A] border border-[#555] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all"
                        />
                      </div>
                    </div>

                    {loadingTemplates ? (
                      <div className="p-4 text-center">
                        <Spinner size="sm" />
                      </div>
                    ) : filteredTemplates.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-400">
                        {templateSearch ? 'No templates match your search' : 'No active templates found'}
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {filteredTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => applyTemplate(t)}
                            className="w-full text-left px-4 py-3 hover:bg-[#3A3A3A] transition-colors border-b border-[#444] last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{t.name}</span>
                              <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-[#333] px-1.5 py-0.5 rounded">
                                {t.category}
                              </span>
                            </div>
                            {t.description && (
                              <div className="text-xs text-neutral-400 mt-0.5">{t.description}</div>
                            )}
                            <div className="text-xs text-neutral-500 mt-0.5">
                              Subject: {t.subject}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sender */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500 shrink-0" />
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  disabled={sendingEmail}
                  className="flex-1 px-4 py-2.5 text-sm bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14] transition-all duration-200 disabled:opacity-50"
                >
                  {CRM_SENDERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject..."
                disabled={sendingEmail}
                className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200 disabled:opacity-50"
              />

              {/* HTML Preview or Text Editor */}
              {emailHtml ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPreview ? 'Edit Plain Text' : 'Preview HTML'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={clearTemplate}
                      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Clear Template
                    </button>
                  </div>

                  {showPreview ? (
                    <div className="rounded-xl border-2 border-[#666666] overflow-hidden max-h-[500px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
                    </div>
                  ) : (
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Plain text version..."
                      rows={6}
                      disabled={sendingEmail}
                      className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200 resize-none disabled:opacity-50"
                    />
                  )}
                </div>
              ) : (
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your email..."
                  rows={6}
                  disabled={sendingEmail}
                  className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200 resize-none disabled:opacity-50"
                />
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500">
                    To: {lead.email}
                  </span>
                  {emailHtml && (
                    <span className="text-[10px] uppercase tracking-wider text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">
                      HTML Template
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!emailSubject.trim() || (!emailBody.trim() && !emailHtml.trim()) || sendingEmail}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <Spinner size="sm" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Conversation Thread */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Conversation ({conversation.length})
            </h2>
            <button
              type="button"
              onClick={fetchConversation}
              disabled={loadingConversation}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConversation ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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
