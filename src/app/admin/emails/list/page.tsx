// /src/app/admin/emails/list/page.tsx
// Email templates library - view and manage all email templates

'use client'

import { useState } from 'react'
import { Container, Card, Badge, Button, Stack, PageHero } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Eye, Settings, Send, Code } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EMAIL_TEMPLATES } from '@/lib/email/templates'

export default function EmailTemplatesListPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'planned'>('all')

  const filteredTemplates = filter === 'all' 
    ? EMAIL_TEMPLATES 
    : EMAIL_TEMPLATES.filter(t => t.status === filter)

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-primary-500'
      case 'planned':
        return 'bg-secondary-500'
      default:
        return 'bg-neutral-600'
    }
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          {/* Hero */}
          <PageHero 
            eyebrow="ADMIN CRM"
            title="Email Templates" 
            subtitle={`${EMAIL_TEMPLATES.length} templates • ${EMAIL_TEMPLATES.filter(t => t.status === 'active').length} active`}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => router.push('/admin/emails/sent')} variant="secondary" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Sent Emails
              </Button>
              <Button onClick={() => router.push('/admin/emails')} variant="ghost" size="sm">
                Back to Dashboard
              </Button>
            </div>
          </PageHero>

          {/* Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 border-b border-neutral-800 pb-4">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="justify-start sm:justify-center"
            >
              All Templates ({EMAIL_TEMPLATES.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('active')}
              className="justify-start sm:justify-center"
            >
              Active ({EMAIL_TEMPLATES.filter(t => t.status === 'active').length})
            </Button>
            <Button
              variant={filter === 'planned' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('planned')}
              className="justify-start sm:justify-center"
            >
              Planned ({EMAIL_TEMPLATES.filter(t => t.status === 'planned').length})
            </Button>
          </div>

          {/* Template Cards */}
          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-4 md:p-6 lg:p-8 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/emails/templates/${template.id}`)}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-white">{template.name}</h3>
                      <Badge className={`${getStatusColor(template.status)} text-white px-2 md:px-3 py-1 text-xs`}>
                        {template.status}
                      </Badge>
                      <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 md:px-3 py-1 text-xs">
                        {template.category}
                      </Badge>
                      {template.status === 'planned' && (
                        <Badge className="bg-[#FFB701] text-black px-2 md:px-3 py-1 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-neutral-400 text-xs md:text-sm">{template.description}</p>
                  </div>
                </div>

                {/* Triggers */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Triggered By
                  </h4>
                  <div className="space-y-1">
                    {template.triggers.map((trigger, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-neutral-400 flex items-start gap-2"
                      >
                        <span className="text-primary-500 mt-1">→</span>
                        <span>{trigger}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Available Variables ({template.variables.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <code
                        key={variable}
                        className="px-2 py-1 bg-neutral-900 rounded text-xs text-secondary-500 font-mono"
                      >
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Stats & File */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {template.status === 'active' && (
                      <>
                        <div>
                          <span>Last Sent: </span>
                          <span className="text-white">{template.lastSent || 'Never'}</span>
                        </div>
                        <div>
                          <span>Total Sent: </span>
                          <span className="text-white">{template.totalSent || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {template.templateFile && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Code className="w-3 h-3" />
                      <code className="text-secondary-500">{template.templateFile}</code>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
