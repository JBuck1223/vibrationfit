'use client'

/**
 * Email Template Detail/Edit Page
 * 
 * View and edit an email template (database-driven)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Input,
  Textarea,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Save, ArrowLeft, Plus, X, ChevronDown, Copy, Trash2, Send, Eye } from 'lucide-react'

const CATEGORIES = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'reminders', label: 'Reminders' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'billing', label: 'Billing' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'household', label: 'Household' },
  { value: 'intensive', label: 'Intensive' },
  { value: 'other', label: 'Other' },
]

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

export default function EmailTemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.id as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    status: 'draft',
    subject: '',
    html_body: '',
    text_body: '',
    variables: [] as string[],
    triggers: [] as string[],
  })

  const [newVariable, setNewVariable] = useState('')
  const [newTrigger, setNewTrigger] = useState('')

  // Fetch template
  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/templates/email/${templateId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch template')
      }

      setTemplate(data.template)
      setFormData({
        name: data.template.name,
        description: data.template.description || '',
        category: data.template.category,
        status: data.template.status,
        subject: data.template.subject,
        html_body: data.template.html_body,
        text_body: data.template.text_body || '',
        variables: data.template.variables || [],
        triggers: data.template.triggers || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId, fetchTemplate])

  // Track changes
  useEffect(() => {
    if (template) {
      const changed =
        formData.name !== template.name ||
        formData.description !== (template.description || '') ||
        formData.category !== template.category ||
        formData.status !== template.status ||
        formData.subject !== template.subject ||
        formData.html_body !== template.html_body ||
        formData.text_body !== (template.text_body || '') ||
        JSON.stringify(formData.variables) !== JSON.stringify(template.variables || []) ||
        JSON.stringify(formData.triggers) !== JSON.stringify(template.triggers || [])
      setHasChanges(changed)
    }
  }, [formData, template])

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable],
      }))
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable),
    }))
  }

  const addTrigger = () => {
    if (newTrigger && !formData.triggers.includes(newTrigger)) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, newTrigger],
      }))
      setNewTrigger('')
    }
  }

  const removeTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t !== trigger),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/templates/email/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setTemplate(data.template)
      setHasChanges(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/admin/templates/email/${templateId}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/emails/templates/${data.template.id}`)
      }
    } catch (err) {
      console.error('Error duplicating template:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/templates/email/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/emails/list')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) return
    
    setSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/admin/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: formData.subject,
          htmlBody: formData.html_body,
          textBody: formData.text_body,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email')
      }

      setSendResult({ success: true, message: `Test email sent to ${testEmail}` })
    } catch (err) {
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send test email',
      })
    } finally {
      setSending(false)
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

  if (error && !template) {
    return (
      <AdminWrapper>
        <Container size="xl">
          <Stack gap="lg">
            <PageHero
              eyebrow="EMAIL TEMPLATES"
              title="Template Not Found"
              subtitle={error}
            >
              <Button onClick={() => router.push('/admin/emails/list')} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </PageHero>
          </Stack>
        </Container>
      </AdminWrapper>
    )
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="EMAIL TEMPLATES"
            title={template?.name || 'Edit Template'}
            subtitle={template?.slug}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {hasChanges && (
                <Badge className="bg-yellow-500 text-black">Unsaved Changes</Badge>
              )}
              <Button onClick={() => router.push('/admin/emails/list')} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </PageHero>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Basic Info</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Template Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Slug
                    </label>
                    <Input
                      value={template?.slug || ''}
                      readOnly
                      className="bg-neutral-900 border-neutral-700 font-mono text-neutral-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Slug cannot be changed after creation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Description
                    </label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What is this template for?"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="archived">Archived</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Email Content</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>

                {showPreview ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">Subject</p>
                      <p className="text-white">{formData.subject}</p>
                    </div>
                    <div className="border border-neutral-700 rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={formData.html_body}
                        className="w-full h-[500px] bg-white"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Subject Line
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g., {{hostName}} has scheduled a session with you!"
                        className="bg-neutral-800 border-neutral-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        HTML Body
                      </label>
                      <Textarea
                        value={formData.html_body}
                        onChange={(e) => setFormData(prev => ({ ...prev, html_body: e.target.value }))}
                        placeholder="<p>Your HTML email content...</p>"
                        rows={12}
                        className="bg-neutral-800 border-neutral-700 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Plain Text Body
                      </label>
                      <Textarea
                        value={formData.text_body}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_body: e.target.value }))}
                        placeholder="Plain text fallback..."
                        rows={4}
                        className="bg-neutral-800 border-neutral-700 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Test Email */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Send Test Email</h2>
                
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="bg-neutral-800 border-neutral-700 flex-1"
                  />
                  <Button
                    onClick={handleSendTest}
                    variant="secondary"
                    disabled={sending || !testEmail}
                  >
                    {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                {sendResult && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    sendResult.success
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {sendResult.message}
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Variables</h2>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="variableName"
                    className="bg-neutral-800 border-neutral-700 font-mono text-sm flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addVariable}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-xs text-secondary-500 font-mono"
                    >
                      {`{{${variable}}}`}
                      <button
                        type="button"
                        onClick={() => removeVariable(variable)}
                        className="text-neutral-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.variables.length === 0 && (
                    <p className="text-xs text-neutral-500">No variables added</p>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Triggers</h2>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    placeholder="When is this sent?"
                    className="bg-neutral-800 border-neutral-700 text-sm flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addTrigger}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.triggers.map((trigger) => (
                    <div
                      key={trigger}
                      className="flex items-center justify-between p-2 bg-neutral-800 rounded text-sm"
                    >
                      <span className="text-neutral-300">{trigger}</span>
                      <button
                        type="button"
                        onClick={() => removeTrigger(trigger)}
                        className="text-neutral-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.triggers.length === 0 && (
                    <p className="text-xs text-neutral-500">No triggers added</p>
                  )}
                </div>
              </Card>

              {/* Stats */}
              {template && (
                <Card className="p-4 md:p-6">
                  <h2 className="text-sm font-medium text-neutral-400 mb-3">Stats</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total Sent</span>
                      <span className="text-white">{template.total_sent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Last Sent</span>
                      <span className="text-white">
                        {template.last_sent_at
                          ? new Date(template.last_sent_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Created</span>
                      <span className="text-white">
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  disabled={saving || !hasChanges}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDuplicate}
                  variant="secondary"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>

                <Button
                  onClick={handleDelete}
                  variant="danger"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
