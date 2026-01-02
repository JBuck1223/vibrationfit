'use client'

/**
 * Email Templates List
 * 
 * View and manage all email templates (database-driven) with create/duplicate functionality
 */

import { useState, useEffect } from 'react'
import { Container, Card, Badge, Button, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Plus, Copy, ArrowLeft, Code } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmailTemplate {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  status: string
  subject: string
  html_body: string
  text_body: string | null
  variables: string[]
  triggers: string[]
  total_sent: number
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export default function EmailTemplatesListPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all')
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates/email')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDuplicating(id)

    try {
      const response = await fetch(`/api/admin/templates/email/${id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/emails/templates/${data.template.id}`)
      }
    } catch (err) {
      console.error('Error duplicating template:', err)
    } finally {
      setDuplicating(null)
    }
  }

  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.status === filter)

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-primary-500'
      case 'draft':
        return 'bg-yellow-500'
      case 'archived':
        return 'bg-neutral-600'
      default:
        return 'bg-neutral-600'
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'sessions':
        return 'text-purple-400 bg-purple-500/20'
      case 'reminders':
        return 'text-blue-400 bg-blue-500/20'
      case 'notifications':
        return 'text-orange-400 bg-orange-500/20'
      case 'onboarding':
        return 'text-green-400 bg-green-500/20'
      case 'billing':
        return 'text-yellow-400 bg-yellow-500/20'
      default:
        return 'text-neutral-400 bg-neutral-500/20'
    }
  }

  if (loading) {
    return (
      <AdminWrapper>
        <Container size="xl">
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        </Container>
      </AdminWrapper>
    )
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          {/* Hero */}
          <PageHero
            eyebrow="ADMIN CRM"
            title="Email Templates"
            subtitle={`${templates.length} templates · ${templates.filter(t => t.status === 'active').length} active`}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/admin/emails/new')}
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-primary-500 to-secondary-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
              <Button onClick={() => router.push('/admin/emails/sent')} variant="secondary" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Sent Emails
              </Button>
              <Button onClick={() => router.push('/admin/emails')} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
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
              All Templates ({templates.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('active')}
              className="justify-start sm:justify-center"
            >
              Active ({templates.filter(t => t.status === 'active').length})
            </Button>
            <Button
              variant={filter === 'draft' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('draft')}
              className="justify-start sm:justify-center"
            >
              Draft ({templates.filter(t => t.status === 'draft').length})
            </Button>
          </div>

          {/* Template Cards */}
          {filteredTemplates.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
              <p className="text-neutral-400 mb-6">
                {filter === 'all'
                  ? 'Create your first email template to get started.'
                  : `No ${filter} templates yet.`}
              </p>
              <Button
                onClick={() => router.push('/admin/emails/new')}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Card>
          ) : (
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
                        <h3 className="text-base md:text-lg font-semibold text-white">
                          {template.name}
                        </h3>
                        <Badge className={`${getStatusColor(template.status)} text-white px-2 md:px-3 py-1 text-xs`}>
                          {template.status}
                        </Badge>
                        <Badge className={`${getCategoryColor(template.category)} px-2 md:px-3 py-1 text-xs`}>
                          {template.category}
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-neutral-400 text-xs md:text-sm">{template.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicate(template.id, e)}
                        disabled={duplicating === template.id}
                        title="Duplicate template"
                      >
                        {duplicating === template.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Subject Preview */}
                  <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg">
                    <p className="text-xs text-neutral-500 mb-1">Subject</p>
                    <p className="text-sm text-neutral-300">{template.subject}</p>
                  </div>

                  {/* Triggers */}
                  {template.triggers && template.triggers.length > 0 && (
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
                  )}

                  {/* Variables */}
                  {template.variables && template.variables.length > 0 && (
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
                  )}

                  {/* Stats & Slug */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      {template.status === 'active' && (
                        <>
                          <div>
                            <span>Last Sent: </span>
                            <span className="text-white">
                              {template.last_sent_at
                                ? new Date(template.last_sent_at).toLocaleDateString()
                                : 'Never'}
                            </span>
                          </div>
                          <div>
                            <span>Total Sent: </span>
                            <span className="text-white">{template.total_sent || 0}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Code className="w-3 h-3" />
                      <code className="text-secondary-500">{template.slug}</code>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
