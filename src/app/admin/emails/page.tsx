'use client'

import { useRouter } from 'next/navigation'
import { Container, Card, Badge, Stack, PageHero, Button } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Send, Eye, List, Settings } from 'lucide-react'

function AdminEmailsContent() {
  const router = useRouter()

  const stats = {
    totalTemplates: 6,
    activeTemplates: 1,
    plannedTemplates: 5,
    totalSent: 12,
    lastSent: '2025-11-14'
  }

  const quickActions = [
    {
      label: 'View All Templates',
      description: 'Browse and manage email templates',
      icon: List,
      onClick: () => router.push('/admin/emails/list'),
      variant: 'primary' as const
    },
    {
      label: 'Preview & Test',
      description: 'Test email templates with live preview',
      icon: Eye,
      onClick: () => router.push('/admin/emails/household-invitation'),
      variant: 'secondary' as const
    },
  ]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Email Management"
          subtitle="Manage transactional email templates and monitor delivery"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card variant="elevated" className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-neutral-400">Total Templates</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.totalTemplates}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-neutral-400">Active</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.activeTemplates}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-neutral-400">Planned</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.plannedTemplates}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="flex items-start gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-primary-500 transition-colors text-left"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                action.variant === 'primary' ? 'bg-primary-500/20' : 'bg-secondary-500/20'
              }`}>
                <action.icon className={`w-6 h-6 ${
                  action.variant === 'primary' ? 'text-primary-500' : 'text-secondary-500'
                }`} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">{action.label}</h3>
                <p className="text-xs md:text-sm text-neutral-400">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Recent Activity</h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-neutral-900 rounded-xl">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm md:text-base font-semibold mb-1">
                Household Invitation sent
              </p>
              <p className="text-xs md:text-sm text-neutral-400">
                Last sent on {new Date(stats.lastSent).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="success" className="text-xs">Active</Badge>
          </div>

          <div className="text-center py-8 text-neutral-500 text-sm">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>More activity coming soon as templates are deployed</p>
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
