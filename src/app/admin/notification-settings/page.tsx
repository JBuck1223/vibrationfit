'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Container,
  Card,
  Button,
  Badge,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Bell,
  Settings,
  Mail,
  MessageSquare,
  ShieldAlert,
  Save,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  X,
  ArrowLeft,
  Users,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

interface NotificationConfig {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  email_enabled: boolean
  sms_enabled: boolean
  admin_sms_enabled: boolean
  email_template_slug: string | null
  sms_template_slug: string | null
  admin_sms_template_slug: string | null
  segment_id: string | null
  segment_name: string | null
  variables: string[]
  updated_at: string
}

interface SegmentOption {
  id: string
  name: string
  recipient_count: number | null
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  support: { label: 'Support', color: '#BF00FF' },
  intensive: { label: 'Intensive', color: '#FFFF00' },
  calibration_call: { label: 'Calibration Call', color: '#00FFFF' },
  alignment_gym: { label: 'Alignment Gym', color: '#39FF14' },
  sessions: { label: 'Sessions', color: '#14B8A6' },
  purchase: { label: 'Purchase', color: '#39FF14' },
  general: { label: 'General', color: '#999' },
}

function ChannelToggle({
  label,
  icon: Icon,
  enabled,
  onChange,
  templateSlug,
  templateType,
}: {
  label: string
  icon: typeof Mail
  enabled: boolean
  onChange: (val: boolean) => void
  templateSlug: string | null
  templateType: 'email' | 'sms'
}) {
  const editorPath = templateType === 'email' ? '/admin/emails' : '/admin/sms'

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!enabled)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
          enabled
            ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/40'
            : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:text-neutral-300 hover:border-neutral-500'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        {enabled ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </button>
      {templateSlug && (
        <Link
          href={editorPath}
          className="text-xs text-neutral-500 hover:text-[#39FF14] transition-colors flex items-center gap-1 font-mono"
          title={`Edit template: ${templateSlug}`}
        >
          {templateSlug}
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
      {!templateSlug && enabled && (
        <span className="text-xs text-[#FF0040]">No template linked</span>
      )}
    </div>
  )
}

function SegmentPicker({
  segmentId,
  segmentName,
  segments,
  onChange,
}: {
  segmentId: string | null
  segmentName: string | null
  segments: SegmentOption[]
  onChange: (id: string | null) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-400 font-medium flex items-center gap-2">
        <Users className="w-4 h-4" /> Audience Segment
      </p>
      <div className="flex items-center gap-3">
        <select
          value={segmentId || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="bg-neutral-900 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 min-w-[240px] focus:border-[#39FF14] focus:outline-none transition-colors"
        >
          <option value="">No segment (no audience)</option>
          {segments.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.recipient_count != null ? ` (~${s.recipient_count})` : ''}
            </option>
          ))}
        </select>
        <Link
          href="/admin/crm/segments/new"
          className="text-xs text-[#39FF14] hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <Plus className="w-3 h-3" /> Create Segment
        </Link>
      </div>
      {segmentId && segmentName && (
        <Link
          href={`/admin/crm/segments/${segmentId}/edit`}
          className="text-xs text-neutral-500 hover:text-[#39FF14] flex items-center gap-1 transition-colors"
        >
          Edit "{segmentName}" segment
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
      {!segmentId && (
        <p className="text-xs text-neutral-600">
          Broadcast notifications require a segment to determine who receives them.
        </p>
      )}
    </div>
  )
}

function ConfigCard({
  config,
  segments,
  onSave,
}: {
  config: NotificationConfig
  segments: SegmentOption[]
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [emailEnabled, setEmailEnabled] = useState(config.email_enabled)
  const [smsEnabled, setSmsEnabled] = useState(config.sms_enabled)
  const [adminSmsEnabled, setAdminSmsEnabled] = useState(config.admin_sms_enabled)
  const [segmentId, setSegmentId] = useState(config.segment_id)

  const markDirty = () => setDirty(true)

  const catMeta = CATEGORY_META[config.category] || CATEGORY_META.general

  const handleSave = async () => {
    setSaving(true)
    await onSave(config.id, {
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      admin_sms_enabled: adminSmsEnabled,
      segment_id: segmentId,
    })
    setSaving(false)
    setDirty(false)
  }

  const hasEmail = !!config.email_template_slug
  const hasSms = !!config.sms_template_slug
  const hasAdminSms = !!config.admin_sms_template_slug
  const isBroadcast = config.segment_id !== null || config.category === 'alignment_gym'

  const currentSegmentName = segmentId
    ? segments.find(s => s.id === segmentId)?.name || config.segment_name
    : null

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 md:p-6 flex items-center gap-4 hover:bg-neutral-800/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-semibold">{config.name}</span>
            <Badge
              variant="neutral"
              className="text-[10px] px-2 py-0"
              style={{ borderColor: catMeta.color + '40', color: catMeta.color }}
            >
              {catMeta.label}
            </Badge>
            {config.segment_name && (
              <Badge
                variant="neutral"
                className="text-[10px] px-2 py-0"
                style={{ borderColor: '#00FFFF40', color: '#00FFFF' }}
              >
                <Users className="w-3 h-3 mr-1 inline" />
                {config.segment_name}
              </Badge>
            )}
          </div>
          {config.description && (
            <p className="text-sm text-neutral-400 line-clamp-1">{config.description}</p>
          )}
        </div>

        {/* Channel indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasEmail && (
            <Mail
              className="w-4 h-4"
              style={{ color: emailEnabled ? '#39FF14' : '#555' }}
            />
          )}
          {hasSms && (
            <MessageSquare
              className="w-4 h-4"
              style={{ color: smsEnabled ? '#39FF14' : '#555' }}
            />
          )}
          {hasAdminSms && (
            <ShieldAlert
              className="w-4 h-4"
              style={{ color: adminSmsEnabled ? '#39FF14' : '#555' }}
            />
          )}
          {dirty && (
            <span className="w-2 h-2 rounded-full bg-[#FF0040] flex-shrink-0" />
          )}
        </div>

        {expanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
        )}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-neutral-800 p-4 md:p-6 space-y-6">
          {/* Segment picker for broadcast notifications */}
          {isBroadcast && (
            <SegmentPicker
              segmentId={segmentId}
              segmentName={currentSegmentName || null}
              segments={segments}
              onChange={(id) => { setSegmentId(id); markDirty() }}
            />
          )}

          {/* Channel toggles with template links */}
          <div className="space-y-3">
            <p className="text-sm text-neutral-400 font-medium">Channels & Templates</p>
            {(hasEmail || config.email_enabled) && (
              <ChannelToggle
                label="Email"
                icon={Mail}
                enabled={emailEnabled}
                onChange={(v) => { setEmailEnabled(v); markDirty() }}
                templateSlug={config.email_template_slug}
                templateType="email"
              />
            )}
            {(hasSms || config.sms_enabled) && (
              <ChannelToggle
                label="SMS"
                icon={MessageSquare}
                enabled={smsEnabled}
                onChange={(v) => { setSmsEnabled(v); markDirty() }}
                templateSlug={config.sms_template_slug}
                templateType="sms"
              />
            )}
            {(hasAdminSms || config.admin_sms_enabled) && (
              <ChannelToggle
                label="Admin SMS"
                icon={ShieldAlert}
                enabled={adminSmsEnabled}
                onChange={(v) => { setAdminSmsEnabled(v); markDirty() }}
                templateSlug={config.admin_sms_template_slug}
                templateType="sms"
              />
            )}
          </div>

          {/* Variables reference */}
          {config.variables.length > 0 && (
            <div>
              <p className="text-sm text-neutral-400 mb-2 font-medium">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {config.variables.map(v => (
                  <code
                    key={v}
                    className="px-2 py-0.5 bg-neutral-800 text-[#39FF14] text-xs rounded font-mono border border-neutral-700"
                  >
                    {'{{' + v + '}}'}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-neutral-600">
              Edit template content in{' '}
              <Link href="/admin/emails" className="text-[#39FF14] hover:underline">
                Email Templates
              </Link>
              {' or '}
              <Link href="/admin/sms" className="text-[#39FF14] hover:underline">
                SMS Templates
              </Link>
            </p>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function NotificationSettingsContent() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [segments, setSegments] = useState<SegmentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      const [configsRes, segmentsRes] = await Promise.all([
        fetch('/api/admin/notification-configs'),
        fetch('/api/crm/segments'),
      ])

      if (configsRes.ok) {
        const data = await configsRes.json()
        setConfigs(data.configs || [])
      }

      if (segmentsRes.ok) {
        const data = await segmentsRes.json()
        setSegments(
          (data.segments || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            recipient_count: s.recipient_count,
          }))
        )
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/notification-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setConfigs(prev =>
          prev.map(c => (c.id === id ? { ...c, ...data.config } : c))
        )
      }
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  const categories = ['all', ...new Set(configs.map(c => c.category))]
  const filtered =
    filterCategory === 'all' ? configs : configs.filter(c => c.category === filterCategory)

  const enabledCount = configs.filter(
    c => c.email_enabled || c.sms_enabled || c.admin_sms_enabled
  ).length

  if (loading) {
    return (
      <Container size="lg">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Link
            href="/admin/notifications"
            className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center gap-1 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Notifications
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Settings className="w-6 h-6 text-[#39FF14]" />
                Notification Settings
              </h1>
              <p className="text-neutral-400 mt-1">
                {configs.length} notifications configured &middot; {enabledCount} with active
                channels &middot; Audiences from{' '}
                <Link href="/admin/crm/segments" className="text-[#39FF14] hover:underline">
                  Segments
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> SMS to User
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> SMS to Admins
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Segment-driven audience
          </span>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => {
            const meta = cat === 'all' ? { label: 'All', color: '#fff' } : (CATEGORY_META[cat] || { label: cat, color: '#999' })
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  filterCategory === cat
                    ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/40'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
                }`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>

        {/* Config cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400">No notifications in this category</p>
            </Card>
          ) : (
            filtered.map(config => (
              <ConfigCard
                key={config.id}
                config={config}
                segments={segments}
                onSave={handleSave}
              />
            ))
          )}
        </div>
      </Stack>
    </Container>
  )
}

export default function NotificationSettingsPage() {
  return (
    <AdminWrapper>
      <NotificationSettingsContent />
    </AdminWrapper>
  )
}
