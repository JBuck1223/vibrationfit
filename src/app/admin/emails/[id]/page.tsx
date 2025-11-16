'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Button, Badge, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft, Send, Eye, Code, Settings, Copy } from 'lucide-react'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'

// Email template metadata (same as list page)
const EMAIL_TEMPLATES_DATA: Record<string, any> = {
  'household-invitation': {
    id: 'household-invitation',
    name: 'Household Invitation',
    description: 'Invite family members to join your household account',
    category: 'Household',
    triggers: [
      {
        name: 'Manual Invitation',
        description: 'Admin clicks "Send Invitation" in Household Settings',
        type: 'user_action',
        location: '/household/settings',
      },
      {
        name: 'API Trigger',
        description: 'API endpoint called to create invitation',
        type: 'api',
        endpoint: 'POST /api/household/invite',
      },
    ],
    variables: [
      { name: 'inviterName', description: 'Name of the person sending invitation', example: 'Jordan Buckingham' },
      { name: 'inviterEmail', description: 'Email of the person sending invitation', example: 'jordan@vibrationfit.com' },
      { name: 'householdName', description: 'Name of the household', example: 'The Buckingham Family' },
      { name: 'invitationLink', description: 'Unique invitation acceptance link', example: 'https://vibrationfit.com/household/invite/abc123' },
      { name: 'expiresInDays', description: 'Days until invitation expires', example: '7' },
    ],
    status: 'active',
    templateFile: '/src/lib/email/templates/household-invitation.ts',
    hasPreview: true,
  },
  'welcome': {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome new users to VibrationFit',
    category: 'Onboarding',
    triggers: [
      {
        name: 'User Signup',
        description: 'Triggered when user completes signup flow',
        type: 'system',
        location: 'Auth system',
      },
    ],
    variables: [
      { name: 'userName', description: 'User\'s full name', example: 'Jordan Buckingham' },
      { name: 'verificationLink', description: 'Email verification link', example: 'https://vibrationfit.com/auth/verify/...' },
    ],
    status: 'planned',
    templateFile: 'Not yet created',
    hasPreview: false,
  },
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const emailId = params.id as string
  const email = EMAIL_TEMPLATES_DATA[emailId]

  if (!email) {
    return (
      <Container size="md">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Email Not Found</h1>
          <p className="text-sm md:text-base text-neutral-400 mb-4">
            The email template you're looking for doesn't exist.
          </p>
          <Button size="sm" onClick={() => router.push('/admin/emails/list')}>
            Back to Email List
          </Button>
        </Card>
      </Container>
    )
  }

  // Generate preview if available
  let emailContent: any = null
  if (email.hasPreview && emailId === 'household-invitation') {
    emailContent = generateHouseholdInvitationEmail({
      inviterName: 'Jordan Buckingham',
      inviterEmail: 'jordan@vibrationfit.com',
      householdName: 'The Buckingham Family',
      invitationLink: 'https://vibrationfit.com/household/invite/sample-token',
      expiresInDays: 7,
    })
  }

  async function handleSendTest() {
    if (!testEmail) return

    setSending(true)
    setSendResult('')

    try {
      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          templateData: {
            inviterName: 'Jordan Buckingham',
            inviterEmail: 'jordan@vibrationfit.com',
            householdName: 'The Buckingham Family',
            invitationLink: 'https://vibrationfit.com/household/invite/sample-token',
            expiresInDays: 7,
          },
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
    <Container size="xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/emails/list')}
          className="mb-3 md:mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Email List
        </Button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
              {email.name}
            </h1>
            <p className="text-sm md:text-base text-neutral-400">
              {email.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={email.status === 'active' ? 'success' : 'info'}>
              {email.status}
            </Badge>
            <Badge variant="secondary">{email.category}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Triggers Card */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Email Triggers</h2>
            
            <div className="space-y-4">
              {email.triggers.map((trigger: any, idx: number) => (
                <div key={idx} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="accent" className="text-xs">{trigger.type}</Badge>
                    <h3 className="text-sm md:text-base font-semibold">{trigger.name}</h3>
                  </div>
                  <p className="text-xs md:text-sm text-neutral-400 mb-2">
                    {trigger.description}
                  </p>
                  {trigger.location && (
                    <p className="text-xs text-primary-500">
                      📍 {trigger.location}
                    </p>
                  )}
                  {trigger.endpoint && (
                    <code className="block mt-2 p-2 bg-black rounded text-xs text-primary-500">
                      {trigger.endpoint}
                    </code>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Variables Card */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Template Variables</h2>
            
            <div className="space-y-3">
              {email.variables.map((variable: any, idx: number) => (
                <div key={idx} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm md:text-base text-primary-500">
                      {variable.name}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`{${variable.name}}`)}
                      className="text-xs text-neutral-500 hover:text-primary-500"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs md:text-sm text-neutral-400 mb-2">
                    {variable.description}
                  </p>
                  <div className="text-xs text-neutral-500">
                    Example: <span className="text-neutral-400">{variable.example}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Template File Card */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Template File</h2>
            
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-primary-500" />
                <code className="text-xs md:text-sm text-neutral-300">
                  {email.templateFile}
                </code>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(email.templateFile)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {email.status === 'planned' && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-xs md:text-sm text-yellow-500">
                  ⚠️ This email template hasn't been created yet. Template file coming soon!
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6 md:space-y-8">
          {/* Send Test Email */}
          {email.status === 'active' && (
            <Card variant="elevated" className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">Send Test Email</h3>
              
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleSendTest}
                  loading={sending}
                  disabled={!testEmail || sending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
                {sendResult && (
                  <p className={`text-xs ${sendResult.startsWith('✅') ? 'text-primary-500' : 'text-red-500'}`}>
                    {sendResult}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Preview Button */}
          {email.hasPreview && (
            <Card variant="elevated" className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">Preview</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </Card>
          )}

          {/* Edit Template */}
          {email.status === 'active' && (
            <Card variant="elevated" className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">Edit Template</h3>
              <Button
                size="sm"
                variant="accent"
                onClick={() => router.push(`/admin/emails/${email.id}/edit`)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Email Preview */}
      {showPreview && emailContent && (
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8 mt-6 md:mt-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Email Preview</h2>
          
          <div className="mb-4 p-4 bg-neutral-900 rounded-xl">
            <p className="text-xs text-neutral-400 mb-2"><strong>Subject:</strong></p>
            <p className="text-sm md:text-base text-neutral-200">{emailContent.subject}</p>
          </div>

          <div className="bg-white rounded-xl overflow-hidden">
            <iframe
              srcDoc={emailContent.htmlBody}
              className="w-full h-[600px] md:h-[800px] border-0"
              title="Email Preview"
            />
          </div>
        </Card>
      )}
    </Container>
  )
}

