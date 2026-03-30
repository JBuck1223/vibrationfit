'use client'

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  CheckCircle,
  ArrowLeft,
  X,
  Mail,
  MessageSquare,
  User,
  ExternalLink,
  MousePointerClick,
  MailOpen,
  Ban,
  ShieldOff,
  Layers,
  AlertCircle,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import type { BlastFilters, Audience } from '@/lib/crm/blast-filters'
import { CRM_SENDERS, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'
import {
  getFilterOptions,
  getValueOptions,
  isDateField,
  isNumberField,
  isBooleanField,
  isDynamicSelectField,
  formatFilterValue,
  type FilterField,
} from '@/lib/crm/blast-constants'

type BlastChannel = 'email' | 'sms' | 'both'

interface Recipient {
  email: string
  name: string
  type: 'member' | 'lead'
  phone?: string
  smsOptIn?: boolean
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

interface SegmentOption {
  id: string
  name: string
  filters: BlastFilters
  exclude_segment_id: string | null
  recipient_count: number | null
}

interface FilterRow {
  id: string
  field: FilterField
  value: string
}

const FILTER_TO_KEY: Record<FilterField, keyof BlastFilters> = {
  engagement_status: 'engagement_status',
  health_status: 'health_status',
  subscription_tier: 'subscription_tier',
  subscription_status: 'subscription_status',
  intensive_status: 'intensive_status',
  days_since_last_login_gt: 'days_since_last_login_gt',
  days_since_last_login_lt: 'days_since_last_login_lt',
  has_phone: 'has_phone',
  sms_opt_in: 'sms_opt_in',
  email_opt_in: 'email_opt_in',
  has_vision: 'has_vision',
  has_journal_entry: 'has_journal_entry',
  profile_completion_gte: 'profile_completion_gte',
  lead_status: 'lead_status',
  lead_type: 'lead_type',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  created_after: 'created_after',
  created_before: 'created_before',
}

function filtersToRows(filters: BlastFilters): FilterRow[] {
  const rows: FilterRow[] = []
  for (const [field, key] of Object.entries(FILTER_TO_KEY)) {
    const val = filters[key as keyof BlastFilters]
    if (val !== undefined && val !== null && val !== '') {
      rows.push({ id: crypto.randomUUID(), field: field as FilterField, value: String(val) })
    }
  }
  return rows
}

const MERGE_TAGS = [
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{name}}', label: 'Full Name' },
  { tag: '{{email}}', label: 'Email' },
]

function insertAtCursor(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  value: string,
  tag: string,
  setValue: (v: string) => void
) {
  const el = ref.current
  if (!el) {
    setValue(value + tag)
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? value.length
  const next = value.slice(0, start) + tag + value.slice(end)
  setValue(next)
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + tag.length
    el.setSelectionRange(pos, pos)
  })
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
  const searchParams = useSearchParams()

  const [channel, setChannel] = useState<BlastChannel>('email')
  const [audience, setAudience] = useState<Audience>('members')
  const [filterRows, setFilterRows] = useState<FilterRow[]>([])
  const [excludeLeads, setExcludeLeads] = useState(false)
  const [excludeSegmentId, setExcludeSegmentId] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [suppressedCount, setSuppressedCount] = useState(0)
  const [emailCount, setEmailCount] = useState(0)
  const [smsCount, setSmsCount] = useState(0)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showRecipients, setShowRecipients] = useState(false)

  const [segments, setSegments] = useState<SegmentOption[]>([])
  const [loadedSegmentId, setLoadedSegmentId] = useState('')

  const [tierNames, setTierNames] = useState<string[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')

  const [senderId, setSenderId] = useState<string>(DEFAULT_CRM_SENDER.id)
  const [subject, setSubject] = useState('')
  const [textBody, setTextBody] = useState('')
  const [smsBody, setSmsBody] = useState('')

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
      channel: string
    }
    stats: { total: number; delivered: number; bounced: number; complaint: number; opened: number; clicked: number; failed: number }
    smsStats: { total: number; sent: number; failed: number }
    pending: number
  } | null>(null)

  const subjectRef = useRef<HTMLInputElement | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const smsBodyRef = useRef<HTMLTextAreaElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sendsEmail = channel === 'email' || channel === 'both'
  const sendsSms = channel === 'sms' || channel === 'both'

  useEffect(() => {
    fetchTemplates()
    fetchSegments()
    fetchTierNames()
  }, [])

  useEffect(() => {
    const segId = searchParams.get('segmentId')
    if (segId && segments.length > 0) {
      loadSegment(segId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, segments])

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
    setSuppressedCount(0)
    setEmailCount(0)
    setSmsCount(0)
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
  }, [audience, filterRows, excludeLeads, excludeSegmentId])

  function buildFilters(): BlastFilters {
    const f: BlastFilters = { audience, exclude_leads: excludeLeads || undefined }
    for (const row of filterRows) {
      if (!row.value) continue
      const key = FILTER_TO_KEY[row.field]
      if (isNumberField(row.field)) {
        ;(f as unknown as Record<string, unknown>)[key] = parseInt(row.value)
      } else {
        ;(f as unknown as Record<string, unknown>)[key] = row.value
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
        body: JSON.stringify({
          filters: buildFilters(),
          excludeSegmentId: excludeSegmentId || undefined,
          channel,
        }),
      })
      if (!res.ok) throw new Error('Preview failed')
      const data = await res.json()
      setPreviewCount(data.count)
      setSuppressedCount(data.suppressedCount || 0)
      setEmailCount(data.emailCount || 0)
      setSmsCount(data.smsCount || 0)
      setRecipients(data.recipients)
    } catch {
      setPreviewCount(null)
      setSuppressedCount(0)
      setEmailCount(0)
      setSmsCount(0)
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
    } catch { /* ignore */ }
  }

  async function fetchSegments() {
    try {
      const res = await fetch('/api/crm/segments')
      if (!res.ok) return
      const data = await res.json()
      setSegments(data.segments || [])
    } catch { /* ignore */ }
  }

  async function fetchTierNames() {
    try {
      const res = await fetch('/api/crm/tier-names')
      if (!res.ok) return
      const data = await res.json()
      setTierNames(data.tiers || [])
    } catch { /* ignore */ }
  }

  function loadSegment(id: string) {
    const seg = segments.find((s) => s.id === id)
    if (!seg) return
    setLoadedSegmentId(id)
    setAudience(seg.filters.audience)
    setFilterRows(filtersToRows(seg.filters))
    setExcludeLeads(!!seg.filters.exclude_leads)
    setExcludeSegmentId(seg.exclude_segment_id || '')
    toast.success(`Loaded segment "${seg.name}"`)
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
    if (sendsEmail && (!subject.trim() || !textBody.trim())) return
    if (sendsSms && !smsBody.trim()) return
    if (!previewCount) return

    setSending(true)
    setCampaignId(null)
    setCampaignData(null)
    try {
      const res = await fetch('/api/crm/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: buildFilters(),
          channel,
          subject: sendsEmail ? subject.trim() : undefined,
          textBody: sendsEmail ? textBody.trim() : undefined,
          smsBody: sendsSms ? smsBody.trim() : undefined,
          senderId,
          excludeSegmentId: excludeSegmentId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setCampaignId(data.campaignId)
      const parts = []
      if (data.emailCount) parts.push(`${data.emailCount} emails`)
      if (data.smsCount) parts.push(`${data.smsCount} texts`)
      const suppMsg = data.suppressedCount ? ` (${data.suppressedCount} suppressed)` : ''
      toast.success(`Blast queued: ${parts.join(' + ') || data.recipientCount + ' recipients'}${suppMsg}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send blast'
      toast.error(msg)
    } finally {
      setSending(false)
      setShowConfirm(false)
    }
  }

  const canSend =
    previewCount && previewCount > 0 &&
    (!sendsEmail || (subject.trim() && textBody.trim())) &&
    (!sendsSms || smsBody.trim())

  function renderFilterValueInput(row: FilterRow) {
    const valueOptions = getValueOptions(row.field)

    if (isBooleanField(row.field)) {
      return (
        <div className="flex gap-2 flex-1">
          {['yes', 'no'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => updateFilter(row.id, 'value', v)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-full border-2 transition-all duration-200 ${
                row.value === v
                  ? v === 'yes'
                    ? 'bg-[#39FF14] text-black border-transparent'
                    : 'bg-[#FF0040] text-white border-transparent'
                  : 'bg-transparent border-[#555] text-neutral-400 hover:border-[#39FF14] hover:text-white'
              }`}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )
    }

    if (isDynamicSelectField(row.field)) {
      return (
        <select
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={selectClass + ' flex-1'}
        >
          <option value="">Select...</option>
          {tierNames.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )
    }

    if (valueOptions) {
      return (
        <select
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={selectClass + ' flex-1'}
        >
          <option value="">Select...</option>
          {valueOptions.map((v) => (
            <option key={v} value={v}>{formatFilterValue(v)}</option>
          ))}
        </select>
      )
    }

    if (isDateField(row.field)) {
      return (
        <input
          type="date"
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={inputClass + ' flex-1'}
        />
      )
    }

    if (isNumberField(row.field)) {
      return (
        <input
          type="number"
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          placeholder={row.field === 'profile_completion_gte' ? 'e.g. 50' : 'e.g. 30'}
          min={0}
          max={row.field === 'profile_completion_gte' ? 100 : undefined}
          className={inputClass + ' flex-1'}
        />
      )
    }

    return (
      <input
        type="text"
        value={row.value}
        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
        placeholder="Enter value..."
        className={inputClass + ' flex-1'}
      />
    )
  }

  return (
    <>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero title="Blast" subtitle="Send targeted emails and texts to your audience">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/crm')}
                className={btnGhost}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to CRM
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/crm/segments')}
                className={btnGhost}
              >
                <Layers className="w-4 h-4" />
                Segments
              </button>
            </div>
          </PageHero>

          {/* Channel Toggle */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400 shrink-0">Channel:</span>
              <div className="flex gap-2">
                {([
                  { value: 'email' as BlastChannel, label: 'Email', icon: Mail },
                  { value: 'sms' as BlastChannel, label: 'SMS', icon: Smartphone },
                  { value: 'both' as BlastChannel, label: 'Both', icon: MessageSquare },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChannel(value)}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full border-2 transition-all duration-300 ${
                      channel === value
                        ? value === 'sms'
                          ? 'bg-[#00FFFF] text-black border-transparent'
                          : value === 'both'
                            ? 'bg-[#BF00FF] text-white border-transparent'
                            : 'bg-[#39FF14] text-black border-transparent'
                        : 'bg-transparent border-[#333] text-neutral-400 hover:border-[#39FF14] hover:text-[#39FF14]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Load Segment */}
          {segments.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-[#BF00FF]" />
                <label className="text-sm text-neutral-400">Load Segment:</label>
                <select
                  value={loadedSegmentId}
                  onChange={(e) => {
                    if (e.target.value) loadSegment(e.target.value)
                  }}
                  className={selectClass + ' max-w-xs'}
                >
                  <option value="">Select a segment...</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.recipient_count ?? '?'} recipients)
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          )}

          {/* Audience & Filters */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#39FF14]" />
              <h2 className="text-lg font-semibold text-white">Audience & Filters</h2>
            </div>

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

            <div className="space-y-3">
              {filterRows.map((row) => {
                const options = getFilterOptions(audience)

                return (
                  <div key={row.id} className="flex items-center gap-3">
                    <select
                      value={row.field}
                      onChange={(e) => updateFilter(row.id, 'field', e.target.value)}
                      className={selectClass + ' max-w-[240px]'}
                    >
                      {options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    {renderFilterValueInput(row)}

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

            {/* Exclusions */}
            <div className="mt-6 pt-6 border-t border-[#333]">
              <div className="flex items-center gap-2 mb-4">
                <ShieldOff className="w-4 h-4 text-[#FF0040]" />
                <h3 className="text-sm font-semibold text-neutral-300">Exclusions</h3>
              </div>
              <div className="space-y-3">
                {(audience === 'members' || audience === 'both') && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeLeads}
                      onChange={(e) => setExcludeLeads(e.target.checked)}
                      className="w-4 h-4 rounded border-[#666] bg-[#404040] text-[#39FF14] focus:ring-[#39FF14]"
                    />
                    <span className="text-sm text-neutral-300">
                      Exclude emails also found in leads
                    </span>
                  </label>
                )}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400 shrink-0">Exclude segment:</label>
                  <select
                    value={excludeSegmentId}
                    onChange={(e) => setExcludeSegmentId(e.target.value)}
                    className={selectClass + ' max-w-xs'}
                  >
                    <option value="">None</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Recipients */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00FFFF]" />
                <h2 className="text-lg font-semibold text-white">Recipients</h2>
              </div>
              {loadingPreview ? (
                <Spinner size="sm" />
              ) : previewCount !== null ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-[#39FF14] text-black px-3 py-1 text-sm font-bold">
                    {previewCount.toLocaleString()} recipient{previewCount !== 1 ? 's' : ''}
                  </Badge>
                  {sendsEmail && emailCount > 0 && (
                    <Badge className="bg-[#BF00FF]/20 text-[#BF00FF] px-3 py-1 text-sm font-bold">
                      {emailCount.toLocaleString()} emails
                    </Badge>
                  )}
                  {sendsSms && (
                    <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] px-3 py-1 text-sm font-bold">
                      {smsCount.toLocaleString()} SMS
                    </Badge>
                  )}
                  {suppressedCount > 0 && (
                    <Badge className="bg-[#FF0040]/20 text-[#FF0040] px-3 py-1 text-sm font-bold">
                      {suppressedCount} suppressed
                    </Badge>
                  )}
                </div>
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
                              + {(previewCount - recipients.length).toLocaleString()} more not shown
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

          {/* Compose & Send */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              {sendsSms && !sendsEmail ? (
                <Smartphone className="w-5 h-5 text-[#00FFFF]" />
              ) : (
                <Mail className="w-5 h-5 text-[#BF00FF]" />
              )}
              <h2 className="text-lg font-semibold text-white">Compose</h2>
            </div>

            {/* Email compose section */}
            {sendsEmail && (
              <>
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
                      onChange={(e) => setSenderId(e.target.value as typeof senderId)}
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
                    ref={subjectRef}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line..."
                    className={inputClass}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-neutral-500">Merge tags:</span>
                    {MERGE_TAGS.map((m) => (
                      <button
                        key={m.tag}
                        type="button"
                        onClick={() => insertAtCursor(subjectRef, subject, m.tag, setSubject)}
                        className="px-2 py-0.5 text-xs rounded-full border border-[#555] text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-all duration-200"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Body */}
                <div className={sendsSms ? 'mb-6 pb-6 border-b border-[#333]' : 'mb-6'}>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Plain Text Body
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="text-xs text-neutral-500">Merge tags:</span>
                    {MERGE_TAGS.map((m) => (
                      <button
                        key={m.tag}
                        type="button"
                        onClick={() => insertAtCursor(bodyRef, textBody, m.tag, setTextBody)}
                        className="px-2 py-0.5 text-xs rounded-full border border-[#555] text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-all duration-200"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={bodyRef}
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    placeholder="Write your message... Use merge tags like {{first_name}} for personalization."
                    rows={10}
                    className={inputClass + ' resize-none font-mono'}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Plain text sends land in the Primary inbox. Merge tags are replaced per recipient.
                  </p>
                </div>
              </>
            )}

            {/* SMS compose section */}
            {sendsSms && (
              <div className="mb-6">
                {sendsEmail && (
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-4 h-4 text-[#00FFFF]" />
                    <h3 className="text-sm font-semibold text-[#00FFFF]">SMS Message</h3>
                  </div>
                )}
                <label className="block text-sm text-neutral-400 mb-1">
                  SMS Body
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-xs text-neutral-500">Merge tags:</span>
                  {MERGE_TAGS.map((m) => (
                    <button
                      key={m.tag}
                      type="button"
                      onClick={() => insertAtCursor(smsBodyRef, smsBody, m.tag, setSmsBody)}
                      className="px-2 py-0.5 text-xs rounded-full border border-[#555] text-neutral-300 hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all duration-200"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={smsBodyRef}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder="Write your SMS... Keep under 160 chars for a single segment."
                  rows={4}
                  className={inputClass + ' resize-none'}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-neutral-500">
                    Only sent to members with phone + SMS opt-in.
                  </p>
                  <span className={`text-xs font-mono ${smsBody.length > 160 ? 'text-[#FF0040]' : 'text-neutral-500'}`}>
                    {smsBody.length}/160
                  </span>
                </div>
              </div>
            )}

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
                  : channel === 'both'
                    ? `Send ${emailCount.toLocaleString()} Emails + ${smsCount.toLocaleString()} Texts`
                    : channel === 'sms'
                      ? `Send to ${smsCount.toLocaleString()} Phone${smsCount !== 1 ? 's' : ''}`
                      : `Send to ${(previewCount ?? 0).toLocaleString()} Recipient${previewCount !== 1 ? 's' : ''}`}
              </button>

              {previewCount !== null && previewCount > 1000 && (
                <p className="text-sm text-[#00FFFF] flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Large blast -- will be queued and sent in background
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

                {/* Email stats */}
                {(campaignData.campaign.channel === 'email' || campaignData.campaign.channel === 'both') && (
                  <div>
                    {campaignData.campaign.channel === 'both' && (
                      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email Stats
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <StatBadge icon={<Send className="w-4 h-4" />} label="Sent" value={campaignData.stats.total} color="#39FF14" />
                      <StatBadge icon={<CheckCircle className="w-4 h-4" />} label="Delivered" value={campaignData.stats.delivered} total={campaignData.stats.total} color="#00FFFF" />
                      <StatBadge icon={<MailOpen className="w-4 h-4" />} label="Opened" value={campaignData.stats.opened} total={campaignData.stats.total} color="#BF00FF" />
                      <StatBadge icon={<MousePointerClick className="w-4 h-4" />} label="Clicked" value={campaignData.stats.clicked} total={campaignData.stats.total} color="#FFFF00" />
                      <StatBadge icon={<Ban className="w-4 h-4" />} label="Bounced" value={campaignData.stats.bounced} total={campaignData.stats.total} color="#FF0040" />
                      <StatBadge icon={<AlertCircle className="w-4 h-4" />} label="Complaint" value={campaignData.stats.complaint} total={campaignData.stats.total} color="#FF6B00" />
                    </div>
                  </div>
                )}

                {/* SMS stats */}
                {(campaignData.campaign.channel === 'sms' || campaignData.campaign.channel === 'both') && campaignData.smsStats && (
                  <div>
                    {campaignData.campaign.channel === 'both' && (
                      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1 mt-3">
                        <Smartphone className="w-3 h-3" /> SMS Stats
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <StatBadge icon={<Smartphone className="w-4 h-4" />} label="Total SMS" value={campaignData.smsStats.total} color="#00FFFF" />
                      <StatBadge icon={<CheckCircle className="w-4 h-4" />} label="Sent" value={campaignData.smsStats.sent} total={campaignData.smsStats.total} color="#39FF14" />
                      <StatBadge icon={<Ban className="w-4 h-4" />} label="Failed" value={campaignData.smsStats.failed} total={campaignData.smsStats.total} color="#FF0040" />
                    </div>
                  </div>
                )}
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
                {channel === 'both' ? (
                  <>
                    You are about to send{' '}
                    <span className="font-bold text-[#39FF14]">{emailCount.toLocaleString()}</span> emails and{' '}
                    <span className="font-bold text-[#00FFFF]">{smsCount.toLocaleString()}</span> text messages.
                  </>
                ) : channel === 'sms' ? (
                  <>
                    You are about to send a text to{' '}
                    <span className="font-bold text-[#00FFFF]">{smsCount.toLocaleString()}</span> phone{smsCount !== 1 ? 's' : ''}.
                  </>
                ) : (
                  <>
                    You are about to send an email to{' '}
                    <span className="font-bold text-[#39FF14]">{previewCount?.toLocaleString()}</span> recipient
                    {previewCount !== 1 ? 's' : ''}.
                  </>
                )}
              </p>
              {suppressedCount > 0 && (
                <p className="text-sm text-[#FF0040]">
                  {suppressedCount} address{suppressedCount !== 1 ? 'es' : ''} suppressed (bounced/complained).
                </p>
              )}
              <div className="bg-[#404040] rounded-xl p-4 space-y-2 text-sm">
                <p>
                  <span className="text-neutral-400">Channel:</span>{' '}
                  <span className="text-white capitalize">{channel}</span>
                </p>
                {sendsEmail && (
                  <>
                    <p>
                      <span className="text-neutral-400">Subject:</span>{' '}
                      <span className="text-white">{subject}</span>
                    </p>
                    <p>
                      <span className="text-neutral-400">From:</span>{' '}
                      <span className="text-white">{CRM_SENDERS.find((s) => s.id === senderId)?.email ?? DEFAULT_CRM_SENDER.email}</span>
                    </p>
                  </>
                )}
                {sendsSms && (
                  <p>
                    <span className="text-neutral-400">SMS:</span>{' '}
                    <span className="text-white">{smsBody.length > 60 ? smsBody.slice(0, 60) + '...' : smsBody}</span>
                  </p>
                )}
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
