// /src/app/admin/emails/templates/[id]/page.tsx
// Unified email template view/edit page

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Button, Badge, Input, Stack, PageHero, Textarea } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft, Send, Save, Copy, FileCode, Code } from 'lucide-react'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'
import { generateSupportTicketCreatedEmail } from '@/lib/email/templates/support-ticket-created'
import { generatePersonalMessageEmail } from '@/lib/email/templates/personal-message'
import { EMAIL_TEMPLATES } from '@/lib/email/templates'

export default function EmailTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const template = EMAIL_TEMPLATES.find(t => t.id === templateId)

  // Editor state
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [textBody, setTextBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  // Clone modal state
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneName, setCloneName] = useState('')
  const [cloning, setCloning] = useState(false)

  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  // Load initial template content
  useEffect(() => {
    if (template?.status === 'active') {
      let emailContent: { subject: string; htmlBody: string; textBody: string } | null = null
      
      if (templateId === 'household-invitation') {
        emailContent = generateHouseholdInvitationEmail({
          inviterName: 'Jordan Buckingham',
          inviterEmail: 'jordan@vibrationfit.com',
          householdName: 'The Buckingham Family',
          invitationLink: 'https://vibrationfit.com/household/invite/sample-token',
          expiresInDays: 7,
        })
      } else if (templateId === 'support-ticket-created') {
        emailContent = generateSupportTicketCreatedEmail({
          ticketNumber: 'SUPP-0001',
          ticketSubject: 'Need help with my account',
          ticketStatus: 'open',
          ticketUrl: 'https://vibrationfit.com/dashboard/support/tickets/sample-id',
          customerName: 'Jordan',
        })
      } else if (templateId === 'personal-message') {
        emailContent = generatePersonalMessageEmail({
          recipientName: 'Jordan',
          senderName: 'The VibrationFit Team',
          messageBody: 'I wanted to reach out personally to see how you\'re doing with your vision journey.\n\nI noticed you created your first life vision last week - that\'s amazing! How has the process been for you so far?\n\nIf you have any questions or just want to chat about your progress, feel free to reply to this email.',
          closingLine: 'Talk soon,',
        })
      }
      
      if (emailContent) {
        setSubject(emailContent.subject)
        setHtmlBody(emailContent.htmlBody)
        setTextBody(emailContent.textBody)
      }
    }
  }, [template, templateId])

  if (!template) {
    return (
      <AdminWrapper>
        <Container size="xl">
          <Stack gap="lg">
            <Card className="p-4 md:p-6 lg:p-8 text-center">
              <p className="text-neutral-400 mb-4 text-sm md:text-base">Template not found</p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/admin/emails/list')}>
                Back to Templates
              </Button>
            </Card>
          </Stack>
        </Container>
      </AdminWrapper>
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaveResult('')
    
    try {
      const response = await fetch(`/api/admin/emails/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlBody, textBody }),
      })
      
      const data = await response.json()
      
      if (data.code) {
        // Show code modal for manual copying
        setGeneratedCode(data.code)
        setShowCodeModal(true)
        setSaveResult('⚠️ Copy the code below and update your template file manually')
      } else {
        setSaveResult('❌ Failed to generate code')
      }
    } catch (error) {
      setSaveResult('❌ Error generating code')
    } finally {
      setSaving(false)
    }
  }

  function initiateClone() {
    setShowCloneModal(true)
    setCloneName('')
  }

  async function confirmClone() {
    if (!cloneName.trim()) return

    setCloning(true)

    try {
      const response = await fetch(`/api/admin/emails/templates/${templateId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: cloneName,
          subject,
          htmlBody,
          textBody 
        }),
      })
      
      const data = await response.json()
      
      if (data.code) {
        setShowCloneModal(false)
        setGeneratedCode(`File: ${data.filePath}\n\n${data.code}`)
        setShowCodeModal(true)
        setSaveResult(`📋 Copy the code and create file: ${data.fileName}`)
      } else {
        alert('❌ Failed to generate template')
      }
    } catch (error) {
      alert('❌ Error generating template')
    } finally {
      setCloning(false)
    }
  }

  function copyCodeToClipboard() {
    navigator.clipboard.writeText(generatedCode)
    alert('✅ Code copied to clipboard!')
  }

  async function handleSendTest() {
    if (!testEmail || !subject || !htmlBody) return

    setSending(true)
    setSendResult('')

    try {
      const response = await fetch('/api/admin/emails/test-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject,
          htmlBody,
          textBody,
        }),
      })

      if (response.ok) {
        setSendResult(`✅ Test email sent to ${testEmail}!`)
        setTestEmail('')
      } else {
        const data = await response.json()
        setSendResult(`❌ Failed: ${data.error}`)
      }
    } catch (error) {
      setSendResult('❌ Failed to send test email')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/emails/list')}
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Button>

          {/* Hero */}
          <PageHero
            eyebrow="EMAIL TEMPLATES"
            title={template.name}
            subtitle={template.description}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="secondary" size="sm" onClick={initiateClone}>
                <Copy className="w-4 h-4 mr-2" />
                Clone Template
              </Button>
            </div>
          </PageHero>

          {saveResult && (
            <div className={`p-3 rounded-xl text-sm ${saveResult.includes('✅') ? 'bg-primary-500/10 text-primary-500' : 'bg-red-500/10 text-red-500'}`}>
              {saveResult}
            </div>
          )}

          {/* Two-Column Layout: Editor (Left) | Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: Editor */}
            <div className="space-y-6">
              
              {/* Subject Line Editor */}
              <Card className="p-4 md:p-6">
                <h3 className="text-base font-bold text-white mb-3">Subject Line</h3>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line..."
                  className="font-medium"
                />
              </Card>

              {/* HTML Body Editor */}
              <Card className="p-4 md:p-6">
                <h3 className="text-base font-bold text-white mb-3">HTML Body</h3>
                <Textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder="HTML email body..."
                  rows={20}
                  className="font-mono text-xs"
                />
              </Card>

              {/* Plain Text Body Editor */}
              <Card className="p-4 md:p-6">
                <h3 className="text-base font-bold text-white mb-3">Plain Text Body</h3>
                <Textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Plain text fallback..."
                  rows={10}
                  className="font-mono text-xs"
                />
              </Card>

            </div>

            {/* RIGHT: Live Preview */}
            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              
              {/* Preview Card */}
              <Card className="p-4 md:p-6">
                <h3 className="text-base font-bold text-white mb-3">Live Preview</h3>
                
                {/* Subject Preview */}
                <div className="mb-4 p-3 bg-neutral-900 rounded-lg">
                  <p className="text-xs text-neutral-500 uppercase mb-1">Subject</p>
                  <p className="text-white text-sm">{subject || 'No subject'}</p>
                </div>

                {/* HTML Preview */}
                <div className="border-2 border-neutral-800 rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={htmlBody}
                    className="w-full h-[500px] bg-white"
                    title="Email Preview"
                  />
                </div>
              </Card>

              {/* Test Email */}
              <Card className="p-4 md:p-6">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary-500" />
                  Send Test Email
                </h3>
                
                <div className="flex flex-col gap-3">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendTest}
                    disabled={sending || !testEmail}
                    className="w-full"
                  >
                    {sending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>

                {sendResult && (
                  <p className={`mt-3 text-xs ${sendResult.includes('✅') ? 'text-primary-500' : 'text-red-500'}`}>
                    {sendResult}
                  </p>
                )}
              </Card>

            </div>

          </div>

          {/* Template Info (Full Width Below) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Variables */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base font-bold text-white mb-4">
                Available Variables ({template.variables.length})
              </h3>
              <div className="space-y-2">
                {template.variables.map((variable) => (
                  <div
                    key={variable}
                    className="flex items-center gap-2 p-2 bg-neutral-900 rounded-lg"
                  >
                    <code className="px-2 py-1 bg-black rounded text-secondary-500 font-mono text-xs">
                      {`{{${variable}}}`}
                    </code>
                    <span className="text-neutral-400 text-xs capitalize">
                      {variable.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Triggers */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base font-bold text-white mb-4">
                When This Sends
              </h3>
              <div className="space-y-2">
                {template.triggers.map((trigger, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-neutral-900 rounded-lg"
                  >
                    <span className="text-primary-500 text-sm flex-shrink-0">→</span>
                    <span className="text-neutral-300 text-xs">{trigger}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Template File Reference */}
          {template.templateFile && (
            <Card className="p-4 md:p-6 border border-neutral-800">
              <div className="flex items-start gap-3">
                <FileCode className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-2">Template Source File</h3>
                  <div className="bg-neutral-900 p-3 rounded-lg mb-2">
                    <code className="text-secondary-500 text-xs break-all">
                      /src/lib/email/templates/{template.templateFile}
                    </code>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Changes are saved to this file when you click "Save Changes"
                  </p>
                </div>
              </div>
            </Card>
          )}

          {template.status === 'planned' && (
            <Card className="p-4 md:p-6 bg-[#FFB701]/10 border-[#FFB701]/30">
              <p className="text-neutral-300 text-center text-xs md:text-sm">
                ⚠️ This template is planned but not yet implemented. 
                Create the TypeScript file at <code className="text-secondary-500 text-xs md:text-sm">/src/lib/email/templates/{templateId}.ts</code> to activate it.
              </p>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
            <Card className="max-w-md w-full my-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Copy className="w-8 h-8 text-secondary-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Clone Template</h3>
                <p className="text-neutral-300 mb-6 text-sm">
                  Enter a name for the new template. You'll receive code to create the file.
                </p>
                
                <div className="mb-6">
                  <Input
                    type="text"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    placeholder="e.g., Welcome Email"
                    className="w-full"
                    disabled={cloning}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && cloneName.trim()) {
                        confirmClone()
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCloneModal(false)}
                    className="flex-1 order-2 sm:order-1"
                    disabled={cloning}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={confirmClone}
                    disabled={!cloneName.trim() || cloning}
                    loading={cloning}
                    className="flex-1 order-1 sm:order-2"
                  >
                    {cloning ? 'Generating...' : 'Clone Template'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
            <Card className="max-w-4xl w-full my-auto">
              <div className="p-4 md:p-6 border-b border-neutral-800">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Code className="w-6 h-6 text-secondary-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">Generated Template Code</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      Copy this code and update your template file
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:p-6 max-h-[60vh] overflow-auto">
                <div className="bg-black p-4 rounded-xl border-2 border-neutral-800 overflow-auto">
                  <pre className="text-xs font-mono text-secondary-500 whitespace-pre-wrap">
                    {generatedCode}
                  </pre>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-neutral-800 flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCodeModal(false)} 
                  className="flex-1 order-2 sm:order-1"
                >
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={copyCodeToClipboard} 
                  className="flex-1 order-1 sm:order-2"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminWrapper>
  )
}

