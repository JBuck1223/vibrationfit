'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Textarea } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'

function EditEmailContent() {
  const params = useParams()
  const router = useRouter()
  const emailId = params.id as string

  // Sample data for preview
  const [previewData, setPreviewData] = useState({
    inviterName: 'Jordan Buckingham',
    inviterEmail: 'jordan@vibrationfit.com',
    householdName: "The Buckingham Family",
    invitationLink: 'https://vibrationfit.com/household/invite/sample-token-123',
    expiresInDays: 7,
  })

  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Generate preview
  const emailContent = generateHouseholdInvitationEmail(previewData)

  async function handleSendTestEmail() {
    if (!testEmail) {
      setSendResult('Please enter an email address')
      return
    }

    setSending(true)
    setSendResult('')

    try {
      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          templateData: previewData,
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSendResult(`✅ Test email sent successfully to ${testEmail}!`)
        setTestEmail('')
      } else {
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
          onClick={() => router.push(`/admin/emails/${emailId}`)}
          className="mb-3 md:mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Email Details
        </Button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
              Edit Email Template
            </h1>
            <p className="text-sm md:text-base text-neutral-400">
              Household Invitation Template
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Editor */}
        <div className="space-y-6 md:space-y-8">
          {/* Preview Data Card */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Preview Data</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Inviter Name</label>
                <Input
                  value={previewData.inviterName}
                  onChange={(e) => setPreviewData({ ...previewData, inviterName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Inviter Email</label>
                <Input
                  type="email"
                  value={previewData.inviterEmail}
                  onChange={(e) => setPreviewData({ ...previewData, inviterEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Household Name</label>
                <Input
                  value={previewData.householdName}
                  onChange={(e) => setPreviewData({ ...previewData, householdName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Invitation Link</label>
                <Input
                  value={previewData.invitationLink}
                  onChange={(e) => setPreviewData({ ...previewData, invitationLink: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Expires In (Days)</label>
                <Input
                  type="number"
                  value={previewData.expiresInDays}
                  onChange={(e) => setPreviewData({ ...previewData, expiresInDays: parseInt(e.target.value) || 7 })}
                />
              </div>
            </div>
          </Card>

          {/* Send Test Email Card */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Send Test Email</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Test Email Address</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <Button
                size="sm"
                onClick={handleSendTestEmail}
                loading={sending}
                disabled={sending || !testEmail}
                className="w-full"
              >
                Send Test Email
              </Button>

              {sendResult && (
                <p className={`text-xs md:text-sm ${sendResult.startsWith('✅') ? 'text-primary-500' : 'text-red-500'}`}>
                  {sendResult}
                </p>
              )}
            </div>

            <div className="mt-6 p-4 bg-neutral-800/50 rounded-xl">
              <p className="text-xs text-neutral-400 mb-2">
                <strong>Subject:</strong>
              </p>
              <p className="text-xs md:text-sm text-neutral-200">
                {emailContent.subject}
              </p>
            </div>
          </Card>

          {/* Edit Template Button */}
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Template File</h2>
            <p className="text-xs md:text-sm text-neutral-400 mb-3 md:mb-4">
              Template file location:
            </p>
            <code className="block p-3 bg-black rounded text-xs text-primary-500 mb-3 md:mb-4 overflow-x-auto">
              /src/lib/email/templates/household-invitation.ts
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText('/Users/jordanbuckingham/Desktop/vibrationfit/src/lib/email/templates/household-invitation.ts')
              }}
            >
              Copy File Path
            </Button>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div>
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 sticky top-4">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-semibold">Live Preview</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showPreview ? (
              <div className="bg-white rounded-xl overflow-hidden">
                <iframe
                  srcDoc={emailContent.htmlBody}
                  className="w-full h-[600px] md:h-[800px] border-0"
                  title="Email Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-neutral-900 rounded-xl">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
                  <p className="text-neutral-400 text-sm">Click "Show" to preview email</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Container>
  )
}

export default function EditEmailPage() {
  return (
    <AdminWrapper>
      <EditEmailContent />
    </AdminWrapper>
  )
}






