'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Container,
  Card,
  Button,
  Badge,
  Spinner,
  Stack,
  Textarea,
  Input,
  Modal,
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
  Eye,
  X,
  Check,
  ArrowLeft,
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
  email_subject: string | null
  email_body: string | null
  email_text_body: string | null
  sms_body: string | null
  admin_sms_body: string | null
  variables: string[]
  updated_at: string
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
}: {
  label: string
  icon: typeof Mail
  enabled: boolean
  onChange: (val: boolean) => void
}) {
  return (
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
  )
}

function ConfigCard({
  config,
  onSave,
}: {
  config: NotificationConfig
  onSave: (id: string, updates: Partial<NotificationConfig>) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const [emailEnabled, setEmailEnabled] = useState(config.email_enabled)
  const [smsEnabled, setSmsEnabled] = useState(config.sms_enabled)
  const [adminSmsEnabled, setAdminSmsEnabled] = useState(config.admin_sms_enabled)
  const [emailSubject, setEmailSubject] = useState(config.email_subject || '')
  const [emailBody, setEmailBody] = useState(config.email_body || '')
  const [emailTextBody, setEmailTextBody] = useState(config.email_text_body || '')
  const [smsBody, setSmsBody] = useState(config.sms_body || '')
  const [adminSmsBody, setAdminSmsBody] = useState(config.admin_sms_body || '')

  const markDirty = () => setDirty(true)

  const catMeta = CATEGORY_META[config.category] || CATEGORY_META.general

  const handleSave = async () => {
    setSaving(true)
    await onSave(config.id, {
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      admin_sms_enabled: adminSmsEnabled,
      email_subject: emailSubject || null,
      email_body: emailBody || null,
      email_text_body: emailTextBody || null,
      sms_body: smsBody || null,
      admin_sms_body: adminSmsBody || null,
    })
    setSaving(false)
    setDirty(false)
  }

  const hasEmail = !!(emailSubject || emailBody)
  const hasSms = !!smsBody
  const hasAdminSms = !!adminSmsBody

  return (
    <>
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

        {/* Expanded editor */}
        {expanded && (
          <div className="border-t border-neutral-800 p-4 md:p-6 space-y-6">
            {/* Channel toggles */}
            <div>
              <p className="text-sm text-neutral-400 mb-3 font-medium">Channels</p>
              <div className="flex flex-wrap gap-2">
                {hasEmail && (
                  <ChannelToggle
                    label="Email"
                    icon={Mail}
                    enabled={emailEnabled}
                    onChange={(v) => { setEmailEnabled(v); markDirty() }}
                  />
                )}
                {hasSms && (
                  <ChannelToggle
                    label="SMS"
                    icon={MessageSquare}
                    enabled={smsEnabled}
                    onChange={(v) => { setSmsEnabled(v); markDirty() }}
                  />
                )}
                {hasAdminSms && (
                  <ChannelToggle
                    label="Admin SMS"
                    icon={ShieldAlert}
                    enabled={adminSmsEnabled}
                    onChange={(v) => { setAdminSmsEnabled(v); markDirty() }}
                  />
                )}
              </div>
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

            {/* Email templates */}
            {hasEmail && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Template
                </p>
                <Input
                  label="Subject"
                  value={emailSubject}
                  onChange={(e) => { setEmailSubject(e.target.value); markDirty() }}
                  className="bg-neutral-900"
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-neutral-400">HTML Body</label>
                    <button
                      onClick={() => setPreviewHtml(emailBody)}
                      className="text-xs text-[#39FF14] hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => { setEmailBody(e.target.value); markDirty() }}
                    rows={6}
                    className="bg-neutral-900 font-mono text-xs"
                  />
                </div>
                <Textarea
                  label="Plain Text Body"
                  value={emailTextBody}
                  onChange={(e) => { setEmailTextBody(e.target.value); markDirty() }}
                  rows={3}
                  className="bg-neutral-900 font-mono text-xs"
                />
              </div>
            )}

            {/* SMS template */}
            {hasSms && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300 font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> SMS Template
                </p>
                <Textarea
                  value={smsBody}
                  onChange={(e) => { setSmsBody(e.target.value); markDirty() }}
                  rows={2}
                  className="bg-neutral-900 font-mono text-xs"
                />
                <p className="text-xs text-neutral-500">
                  {smsBody.length} characters
                  {smsBody.length > 160 && ' (will be split into multiple segments)'}
                </p>
              </div>
            )}

            {/* Admin SMS template */}
            {hasAdminSms && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Admin SMS Template
                </p>
                <Textarea
                  value={adminSmsBody}
                  onChange={(e) => { setAdminSmsBody(e.target.value); markDirty() }}
                  rows={2}
                  className="bg-neutral-900 font-mono text-xs"
                />
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-2">
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

      {/* Email preview modal */}
      <Modal
        isOpen={!!previewHtml}
        onClose={() => setPreviewHtml(null)}
        title="Email Preview"
        size="lg"
      >
        <div className="bg-neutral-800 rounded-lg overflow-hidden">
          <iframe
            srcDoc={previewHtml || ''}
            className="w-full min-h-[500px] border-0"
            title="Email preview"
            sandbox=""
          />
        </div>
      </Modal>
    </>
  )
}

function NotificationSettingsContent() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notification-configs')
      if (!res.ok) return
      const data = await res.json()
      setConfigs(data.configs || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const handleSave = async (id: string, updates: Partial<NotificationConfig>) => {
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
                channels
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
            <span className="w-2 h-2 rounded-full bg-[#39FF14] inline-block" /> Enabled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-600 inline-block" /> Disabled
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
