'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Badge, Stack, PageHero, Button, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Mail,
  Send,
  MessageSquare,
  Database,
  Plus,
  List,
  ArrowUpRight,
  Clock,
  CheckCircle,
  FileText,
  Zap,
  ArrowDown,
  ArrowUp,
  GitBranch,
  Radio,
  Megaphone,
} from 'lucide-react'

interface TemplateStats {
  emailTotal: number
  emailActive: number
  emailDraft: number
  emailArchived: number
  smsTotal: number
  smsActive: number
  smsDraft: number
  smsArchived: number
  emailCategories: Record<string, number>
  smsCategories: Record<string, number>
}

interface RecentEmail {
  id: string
  to_email: string
  subject: string
  status: string
  direction: string
  created_at: string
}

function AdminEmailsContent() {
  const router = useRouter()
  const [stats, setStats] = useState<TemplateStats | null>(null)
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/templates/email').then(r => r.json()),
      fetch('/api/admin/templates/sms').then(r => r.json()),
      fetch('/api/admin/emails/log').then(r => r.json()),
    ])
      .then(([emailData, smsData, logData]) => {
        const emailTemplates = emailData.templates || []
        const smsTemplates = smsData.templates || []

        const emailCats: Record<string, number> = {}
        emailTemplates.forEach((t: { category: string }) => {
          emailCats[t.category] = (emailCats[t.category] || 0) + 1
        })

        const smsCats: Record<string, number> = {}
        smsTemplates.forEach((t: { category: string }) => {
          smsCats[t.category] = (smsCats[t.category] || 0) + 1
        })

        setStats({
          emailTotal: emailTemplates.length,
          emailActive: emailTemplates.filter((t: { status: string }) => t.status === 'active').length,
          emailDraft: emailTemplates.filter((t: { status: string }) => t.status === 'draft').length,
          emailArchived: emailTemplates.filter((t: { status: string }) => t.status === 'archived').length,
          smsTotal: smsTemplates.length,
          smsActive: smsTemplates.filter((t: { status: string }) => t.status === 'active').length,
          smsDraft: smsTemplates.filter((t: { status: string }) => t.status === 'draft').length,
          smsArchived: smsTemplates.filter((t: { status: string }) => t.status === 'archived').length,
          emailCategories: emailCats,
          smsCategories: smsCats,
        })

        setRecentEmails((logData.emails || []).slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const allCategories = new Set([
    ...Object.keys(stats?.emailCategories || {}),
    ...Object.keys(stats?.smsCategories || {}),
  ])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Messaging Hub"
          subtitle="Database-driven email and SMS templates -- edit live, no deploys needed"
        />

        {/* Architecture Banner */}
        <Card className="p-4 md:p-5 border-primary-500/30 bg-primary-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-500 mb-1">
                Database-Driven Templates
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                All email and SMS templates are stored in Supabase. Edit content, subject lines,
                and HTML directly from this admin panel. Changes go live instantly -- no code
                pushes or deployments required.
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-xs md:text-sm text-neutral-400">Email Templates</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{stats?.emailTotal || 0}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-primary-500/20 text-primary-500 text-[10px] px-1.5 py-0.5">
                {stats?.emailActive || 0} active
              </Badge>
              {(stats?.emailDraft || 0) > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5">
                  {stats?.emailDraft} draft
                </Badge>
              )}
            </div>
          </Card>

          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-secondary-500" />
              </div>
              <p className="text-xs md:text-sm text-neutral-400">SMS Templates</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{stats?.smsTotal || 0}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-secondary-500/20 text-secondary-500 text-[10px] px-1.5 py-0.5">
                {stats?.smsActive || 0} active
              </Badge>
              {(stats?.smsDraft || 0) > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5">
                  {stats?.smsDraft} draft
                </Badge>
              )}
            </div>
          </Card>

          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs md:text-sm text-neutral-400">Emails Sent</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{recentEmails.length > 0 ? '100+' : '0'}</p>
            <p className="text-[10px] text-neutral-500 mt-2">Logged in email_messages</p>
          </Card>

          <Card variant="elevated" className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-500" />
              </div>
              <p className="text-xs md:text-sm text-neutral-400">Categories</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{allCategories.size}</p>
            <p className="text-[10px] text-neutral-500 mt-2">Across both channels</p>
          </Card>
        </div>

        {/* Quick Actions -- Email */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Email
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/emails/list')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-primary-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <List className="w-6 h-6 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Email Templates</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Browse, edit, and preview all {stats?.emailTotal || 0} email templates
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/emails/new')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-primary-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">New Email Template</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Create a new template directly in the database
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/emails/sent')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-secondary-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-secondary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Sent Email Log</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  View delivery history and message status
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions -- SMS */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            SMS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/sms')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-secondary-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-secondary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">SMS Templates</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Browse, edit, and manage all {stats?.smsTotal || 0} SMS templates
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/sms/new')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-secondary-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">New SMS Template</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Create a new SMS template in the database
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions -- Automation */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Automation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/automations')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-accent-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-6 h-6 text-accent-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Automation Rules</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Event-driven triggers: one event fires one send
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/sequences')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-accent-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-6 h-6 text-accent-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Sequences</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Multi-step drip campaigns with timed steps
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/messaging-campaigns')}
              className="flex items-start gap-4 p-5 bg-neutral-900 rounded-2xl border-2 border-neutral-800 hover:border-accent-500 transition-all hover:-translate-y-0.5 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-6 h-6 text-accent-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Campaigns</h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Bulk sends to filtered audiences
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold">Recent Emails</h2>
              <Button
                onClick={() => router.push('/admin/emails/sent')}
                variant="ghost"
                size="sm"
              >
                View All
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {recentEmails.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No emails sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-start gap-3 p-3 bg-neutral-900 rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      email.direction === 'inbound'
                        ? 'bg-secondary-500/20'
                        : 'bg-primary-500/20'
                    }`}>
                      {email.direction === 'inbound' ? (
                        <ArrowDown className="w-4 h-4 text-secondary-500" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-primary-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {email.to_email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${
                        email.status === 'sent' || email.status === 'delivered'
                          ? 'bg-primary-500/20 text-primary-500'
                          : email.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}>
                        {email.status}
                      </Badge>
                      <span className="text-[10px] text-neutral-600">
                        {new Date(email.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Category Breakdown */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-semibold mb-6">Template Categories</h2>

            {allCategories.size === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No templates yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(allCategories).sort().map((category) => {
                  const emailCount = stats?.emailCategories[category] || 0
                  const smsCount = stats?.smsCategories[category] || 0
                  const total = emailCount + smsCount

                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {emailCount > 0 && (
                          <Badge className="bg-primary-500/20 text-primary-500 text-[10px] px-1.5 py-0.5">
                            {emailCount} email
                          </Badge>
                        )}
                        {smsCount > 0 && (
                          <Badge className="bg-secondary-500/20 text-secondary-500 text-[10px] px-1.5 py-0.5">
                            {smsCount} sms
                          </Badge>
                        )}
                        <span className="text-xs text-neutral-500 w-6 text-right">{total}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* How It Works */}
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Stored in Supabase</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Templates live in <code className="text-secondary-500">email_templates</code> and{' '}
                  <code className="text-secondary-500">sms_templates</code> tables with full version history.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Edit Live</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Update subject lines, HTML content, and variables from this panel.
                  Changes take effect immediately.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">No Deploys</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  The app fetches templates at runtime. No code changes or builds required
                  to update messaging.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

export default function AdminEmailsPage() {
  return (
    <AdminWrapper>
      <AdminEmailsContent />
    </AdminWrapper>
  )
}
