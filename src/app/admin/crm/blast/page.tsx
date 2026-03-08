'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
} from '@/lib/design-system/components'
import {
  Send,
  Users,
  UserPlus,
  Filter,
  Plus,
  Trash2,
  Search,
  FileText,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  X,
  Mail,
  User,
  ExternalLink,
  MousePointerClick,
  MailOpen,
  Ban,
} from 'lucide-react'
import { toast } from 'sonner'
import type { BlastFilters, Audience } from '@/lib/crm/blast-filters'
import { CRM_SENDERS, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

interface Recipient {
  email: string
  name: string
  type: 'member' | 'lead'
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

type FilterField =
  | 'engagement_status'
  | 'health_status'
  | 'subscription_tier'
  | 'lead_status'
  | 'lead_type'
  | 'utm_source'
  | 'days_since_last_login_gt'
  | 'days_since_last_login_lt'
  | 'created_after'
  | 'created_before'

interface FilterRow {
  id: string
  field: FilterField
  value: string
}

const MEMBER_FILTER_OPTIONS: { value: FilterField; label: string }[] = [
  { value: 'engagement_status', label: 'Engagement Status' },
  { value: 'health_status', label: 'Health Status' },
  { value: 'subscription_tier', label: 'Subscription Tier' },
  { value: 'days_since_last_login_gt', label: 'Days Since Login (more than)' },
  { value: 'days_since_last_login_lt', label: 'Days Since Login (less than)' },
]

const LEAD_FILTER_OPTIONS: { value: FilterField; label: string }[] = [
  { value: 'lead_status', label: 'Lead Status' },
  { value: 'lead_type', label: 'Lead Type' },
  { value: 'utm_source', label: 'UTM Source' },
]

const SHARED_FILTER_OPTIONS: { value: FilterField; label: string }[] = [
  { value: 'created_after', label: 'Created After' },
  { value: 'created_before', label: 'Created Before' },
]

const ENGAGEMENT_VALUES = ['active', 'at_risk', 'champion', 'inactive']
const HEALTH_VALUES = ['healthy', 'needs_attention', 'churned']
const LEAD_STATUS_VALUES = ['new', 'contacted', 'qualified', 'converted', 'lost']
const LEAD_TYPE_VALUES = ['contact', 'demo', 'intensive_intake']

function getFilterOptions(audience: Audience): { value: FilterField; label: string }[] {
  const shared = [...SHARED_FILTER_OPTIONS]
  if (audience === 'members') return [...MEMBER_FILTER_OPTIONS, ...shared]
  if (audience === 'leads') return [...LEAD_FILTER_OPTIONS, ...shared]
  return [...MEMBER_FILTER_OPTIONS, ...LEAD_FILTER_OPTIONS, ...shared]
}

function getValueOptions(field: FilterField): string[] | null {
  switch (field) {
    case 'engagement_status': return ENGAGEMENT_VALUES
    case 'health_status': return HEALTH_VALUES
    case 'lead_status': return LEAD_STATUS_VALUES
    case 'lead_type': return LEAD_TYPE_VALUES
    default: return null
  }
}

function isDateField(field: FilterField) {
  return field === 'created_after' || field === 'created_before'
}

function isNumberField(field: FilterField) {
  return field === 'days_since_last_login_gt' || field === 'days_since_last_login_lt'
}

const selectClass =
  'w-full px-4 py-3 text-sm bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14] transition-all duration-200'
const inputClass =
  'w-full px-4 py-3 text-sm bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200'
const btnPrimary =
  'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none'
const btnOutline =
  'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-transparent border-2 border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 disabled:opacity-50'
const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

export default function BlastPage() {
  const router = useRouter()

  const [audience, setAudience] = useState<Audience>('members')
  const [filterRows, setFilterRows] = useState<FilterRow[]>([])
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showRecipients, setShowRecipients] = useState(false)

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')

  const [senderId, setSenderId] = useState<string>(DEFAULT_CRM_SENDER.id)
  const [subject, setSubject] = useState('')
  const [textBody, setTextBody] = useState('')

  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignData, setCampaignData] = useState<{
    campaign: {
      audienceCount: number
      sentCount: number
      failedCount: number
      status: string
      subject: string
    }
    stats: { total: number; delivered: number; bounced: number; opened: number; clicked: number; failed: number }
    pending: number
  } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const pollCampaign = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/crm/blast/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setCampaignData(data)

      const isSending = data.campaign.status === 'sending' || data.pending > 0
      const delay = isSending ? 3000 : 10000
      pollRef.current = setTimeout(() => pollCampaign(id), delay)
    } catch {
      pollRef.current = setTimeout(() => pollCampaign(id), 5000)
    }
  }, [])

  useEffect(() => {
    if (campaignId) {
      pollCampaign(campaignId)
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [campaignId, pollCampaign])

  useEffect(() => {
    setPreviewCount(null)
    setRecipients([])
    setShowRecipients(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runPreview()
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, filterRows])

  function buildFilters(): BlastFilters {
    const f: BlastFilters = { audience }
    for (const row of filterRows) {
      if (!row.value) continue
      switch (row.field) {
        case 'engagement_status': f.engagement_status = row.value; break
        case 'health_status': f.health_status = row.value; break
        case 'subscription_tier': f.subscription_tier = row.value; break
        case 'days_since_last_login_gt': f.days_since_last_login_gt = parseInt(row.value); break
        case 'days_since_last_login_lt': f.days_since_last_login_lt = parseInt(row.value); break
        case 'lead_status': f.lead_status = row.value; break
        case 'lead_type': f.lead_type = row.value; break
        case 'utm_source': f.utm_source = row.value; break
        case 'created_after': f.created_after = row.value; break
        case 'created_before': f.created_before = row.value; break
      }
    }
    return f
  }

  async function runPreview() {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/crm/blast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildFilters()),
      })
      if (!res.ok) throw new Error('Preview failed')
      const data = await res.json()
      setPreviewCount(data.count)
      setRecipients(data.recipients)
    } catch {
      setPreviewCount(null)
      setRecipients([])
    } finally {
      setLoadingPreview(false)
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/templates/email?status=active')
      if (!res.ok) return
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch {
      /* ignore */
    }
  }

  function addFilter() {
    const opts = getFilterOptions(audience)
    const usedFields = new Set(filterRows.map((r) => r.field))
    const next = opts.find((o) => !usedFields.has(o.value))
    if (!next) {
      toast.error('All available filters are already added')
      return
    }
    setFilterRows([
      ...filterRows,
      { id: crypto.randomUUID(), field: next.value, value: '' },
    ])
  }

  function removeFilter(id: string) {
    setFilterRows(filterRows.filter((r) => r.id !== id))
  }

  function updateFilter(id: string, key: 'field' | 'value', val: string) {
    setFilterRows(
      filterRows.map((r) =>
        r.id === id
          ? { ...r, [key]: val, ...(key === 'field' ? { value: '' } : {}) }
          : r
      )
    )
  }

  function applyTemplate(template: EmailTemplate) {
    setSubject(template.subject)
    setTextBody(template.text_body || template.html_body?.replace(/<[^>]*>/g, '') || '')
    setShowTemplates(false)
    setTemplateSearch('')
    toast.success(`Template "${template.name}" loaded`)
  }

  const filteredTemplates = templates.filter((t) => {
    if (!templateSearch.trim()) return true
    const q = templateSearch.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    )
  })

  async function handleSend() {
    if (!subject.trim() || !textBody.trim() || !previewCount) return
    setSending(true)
    setCampaignId(null)
    setCampaignData(null)
    try {
      const res = await fetch('/api/crm/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: buildFilters(),
          subject: subject.trim(),
          textBody: textBody.trim(),
          senderId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setCampaignId(data.campaignId)
      toast.success(`Blast queued: ${data.recipientCount} recipients`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send blast'
      toast.error(msg)
    } finally {
      setSending(false)
      setShowConfirm(false)
    }
  }

  const canSend = subject.trim() && textBody.trim() && previewCount && previewCount > 0

  return (
    <>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero title="Email Blast" subtitle="Send targeted emails to filtered audiences">
            <button
              type="button"
              onClick={() => router.push('/admin/crm')}
              className={btnGhost}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to CRM
            </button>
          </PageHero>

          {/* Section 1: Audience & Filters */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#39FF14]" />
              <h2 className="text-lg font-semibold text-white">Audience & Filters</h2>
            </div>

            {/* Audience toggle */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">Audience</label>
              <div className="flex gap-2">
                {[
                  { value: 'members' as Audience, label: 'Members', icon: Users },
                  { value: 'leads' as Audience, label: 'Leads', icon: UserPlus },
                  { value: 'both' as Audience, label: 'Both', icon: Users },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAudience(value)
                      setFilterRows([])
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full border-2 transition-all duration-300 ${
                      audience === value
                        ? 'bg-[#39FF14] text-black border-transparent'
                        : 'bg-transparent border-[#333] text-neutral-400 hover:border-[#39FF14] hover:text-[#39FF14]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter rows */}
            <div className="space-y-3">
              {filterRows.map((row) => {
                const options = getFilterOptions(audience)
                const valueOptions = getValueOptions(row.field)

                return (
                  <div key={row.id} className="flex items-center gap-3">
                    <select
                      value={row.field}
                      onChange={(e) => updateFilter(row.id, 'field', e.target.value)}
                      className={selectClass + ' max-w-[220px]'}
                    >
                      {options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    {valueOptions ? (
                      <select
                        value={row.value}
                        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
                        className={selectClass + ' flex-1'}
                      >
                        <option value="">Select...</option>
                        {valueOptions.map((v) => (
                          <option key={v} value={v}>
                            {v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    ) : isDateField(row.field) ? (
                      <input
                        type="date"
                        value={row.value}
                        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
                        className={inputClass + ' flex-1'}
                      />
                    ) : isNumberField(row.field) ? (
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
                        placeholder="e.g. 30"
                        min={0}
                        className={inputClass + ' flex-1'}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
                        placeholder="Enter value..."
                        className={inputClass + ' flex-1'}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeFilter(row.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={addFilter}
              className={`${btnGhost} mt-4`}
            >
              <Plus className="w-4 h-4" />
              Add Filter
            </button>
          </Card>

          {/* Section 2: Recipient Preview */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00FFFF]" />
                <h2 className="text-lg font-semibold text-white">Recipients</h2>
              </div>
              {loadingPreview ? (
                <Spinner size="sm" />
              ) : previewCount !== null ? (
                <Badge className="bg-[#39FF14] text-black px-3 py-1 text-sm font-bold">
                  {previewCount} recipient{previewCount !== 1 ? 's' : ''}
                </Badge>
              ) : null}
            </div>

            {previewCount !== null && previewCount > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRecipients(!showRecipients)}
                  className={btnGhost}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRecipients ? 'rotate-180' : ''}`} />
                  {showRecipients ? 'Hide' : 'Preview'} Recipients
                </button>

                {showRecipients && (
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#333] bg-[#1A1A1A]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#333]">
                          <th className="text-left py-2 px-4 text-neutral-400 font-medium">Name</th>
                          <th className="text-left py-2 px-4 text-neutral-400 font-medium">Email</th>
                          <th className="text-left py-2 px-4 text-neutral-400 font-medium">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((r, i) => (
                          <tr key={i} className="border-b border-[#333] last:border-0">
                            <td className="py-2 px-4 text-white truncate max-w-[160px]">{r.name}</td>
                            <td className="py-2 px-4 text-neutral-400 truncate max-w-[220px]">{r.email}</td>
                            <td className="py-2 px-4">
                              <Badge
                                className={`text-xs px-2 py-0.5 ${
                                  r.type === 'member'
                                    ? 'bg-[#39FF14]/20 text-[#39FF14]'
                                    : 'bg-[#BF00FF]/20 text-[#BF00FF]'
                                }`}
                              >
                                {r.type}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {previewCount > recipients.length && (
                          <tr>
                            <td colSpan={3} className="py-2 px-4 text-neutral-500 text-center text-xs">
                              + {previewCount - recipients.length} more not shown
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {previewCount === 0 && !loadingPreview && (
              <p className="text-neutral-500 text-sm">No recipients match the current filters.</p>
            )}
          </Card>

          {/* Section 3: Compose & Send */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-[#BF00FF]" />
              <h2 className="text-lg font-semibold text-white">Compose</h2>
            </div>

            {/* Template picker */}
            <div className="mb-4 relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className={btnGhost}
              >
                <FileText className="w-4 h-4" />
                Load Template
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>

              {showTemplates && (
                <div className="absolute z-50 top-full left-0 mt-2 w-full max-w-md bg-[#1A1A1A] border-2 border-[#333] rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-[#333]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-[#404040] border border-[#666] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                      <p className="text-sm text-neutral-500 p-4 text-center">No templates found</p>
                    ) : (
                      filteredTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className="w-full text-left px-4 py-3 hover:bg-[#333] transition-colors border-b border-[#333] last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{t.name}</span>
                            {t.text_body ? (
                              <Badge className="bg-[#39FF14]/20 text-[#39FF14] text-xs px-2 py-0.5">
                                Plain Text
                              </Badge>
                            ) : (
                              <Badge className="bg-[#FFB701]/20 text-[#FFB701] text-xs px-2 py-0.5">
                                HTML
                              </Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-xs text-neutral-500 mt-1 truncate">{t.description}</p>
                          )}
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">
                            Subject: {t.subject}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sender */}
            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-1">From</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500 shrink-0" />
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  disabled={sending}
                  className={inputClass}
                >
                  {CRM_SENDERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line..."
                className={inputClass}
              />
            </div>

            {/* Body */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-1">
                Plain Text Body
              </label>
              <textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Write your message..."
                rows={10}
                className={inputClass + ' resize-none font-mono'}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Plain text sends land in the Primary inbox.
              </p>
            </div>

            {/* Send */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={!canSend || sending}
                onClick={() => setShowConfirm(true)}
                className={btnPrimary}
              >
                <Send className="w-4 h-4" />
                {sending
                  ? 'Sending...'
                  : `Send to ${previewCount ?? 0} Recipient${previewCount !== 1 ? 's' : ''}`}
              </button>

              {previewCount !== null && previewCount > 500 && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Max 500 recipients per blast
                </p>
              )}
            </div>

            {/* Campaign progress & stats */}
            {campaignId && campaignData && (
              <div className="mt-6 p-5 rounded-xl border border-[#333] bg-[#1A1A1A] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {campaignData.campaign.status === 'sending' || campaignData.pending > 0 ? (
                      <Spinner size="sm" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                    )}
                    <span className="font-semibold text-white">
                      {campaignData.campaign.status === 'sending' || campaignData.pending > 0
                        ? `Sending... ${campaignData.campaign.sentCount} / ${campaignData.campaign.audienceCount}`
                        : `Blast complete: ${campaignData.campaign.sentCount} sent`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/crm/blast/${campaignId}`)}
                    className={btnGhost}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Full Report
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#39FF14] rounded-full transition-all duration-500"
                    style={{
                      width: `${campaignData.campaign.audienceCount
                        ? Math.round(((campaignData.campaign.sentCount + campaignData.campaign.failedCount) / campaignData.campaign.audienceCount) * 100)
                        : 0}%`,
                    }}
                  />
                </div>

                {/* Stats badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <StatBadge
                    icon={<Send className="w-4 h-4" />}
                    label="Sent"
                    value={campaignData.stats.total}
                    color="#39FF14"
                  />
                  <StatBadge
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Delivered"
                    value={campaignData.stats.delivered}
                    total={campaignData.stats.total}
                    color="#00FFFF"
                  />
                  <StatBadge
                    icon={<MailOpen className="w-4 h-4" />}
                    label="Opened"
                    value={campaignData.stats.opened}
                    total={campaignData.stats.total}
                    color="#BF00FF"
                  />
                  <StatBadge
                    icon={<MousePointerClick className="w-4 h-4" />}
                    label="Clicked"
                    value={campaignData.stats.clicked}
                    total={campaignData.stats.total}
                    color="#FFFF00"
                  />
                  <StatBadge
                    icon={<Ban className="w-4 h-4" />}
                    label="Bounced"
                    value={campaignData.stats.bounced}
                    total={campaignData.stats.total}
                    color="#FF0040"
                  />
                </div>
              </div>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowConfirm(false)} />
          <div className="relative z-[10000] w-full max-w-md bg-[#1A1A1A] rounded-2xl border-2 border-[#333] p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Confirm Send</h2>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-neutral-300">
                You are about to send an email to{' '}
                <span className="font-bold text-[#39FF14]">{previewCount}</span> recipient
                {previewCount !== 1 ? 's' : ''}.
              </p>
              <div className="bg-[#404040] rounded-xl p-4 space-y-2 text-sm">
                <p>
                  <span className="text-neutral-400">Subject:</span>{' '}
                  <span className="text-white">{subject}</span>
                </p>
                <p>
                  <span className="text-neutral-400">From:</span>{' '}
                  <span className="text-white">{CRM_SENDERS.find((s) => s.id === senderId)?.email ?? DEFAULT_CRM_SENDER.email}</span>
                </p>
                <p>
                  <span className="text-neutral-400">Audience:</span>{' '}
                  <span className="text-white capitalize">{audience}</span>
                </p>
              </div>
              <p className="text-sm text-neutral-500">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className={btnOutline + ' flex-1'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className={btnPrimary + ' flex-1 justify-center'}
              >
                {sending ? (
                  <>
                    <Spinner size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Blast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatBadge({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total?: number
  color: string
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null

  return (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[#333] bg-[#1E1E1E]"
    >
      <div style={{ color }}>{icon}</div>
      <span className="text-lg font-bold text-white">{value}</span>
      <span className="text-xs text-neutral-500">
        {label}
        {pct !== null && ` (${pct}%)`}
      </span>
    </div>
  )
}
