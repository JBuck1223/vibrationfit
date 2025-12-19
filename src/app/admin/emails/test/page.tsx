// Email testing page
'use client'

import { useState } from 'react'
import { Container, Card, Button, Input, Stack, PageHero, Badge } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react'

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleTest() {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/test-email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail || undefined }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="EMAIL SYSTEM"
            title="Email Test"
            subtitle="Test your AWS SES configuration and email sending"
          />

          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-secondary-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Send Test Email</h2>
                <p className="text-sm text-neutral-400">
                  This will send a test email and check if it's being logged to the database.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address (leave blank to use your account email)
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  disabled={testing}
                />
              </div>

              <Button
                variant="primary"
                onClick={handleTest}
                disabled={testing}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {testing ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </Card>

          {result && (
            <Card className={`p-4 md:p-6 lg:p-8 ${result.success ? 'border-primary-500' : 'border-red-500'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  result.success ? 'bg-primary-500/20' : 'bg-red-500/20'
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-primary-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    result.success ? 'text-primary-500' : 'text-red-500'
                  }`}>
                    {result.success ? 'Success!' : 'Failed'}
                  </h3>
                  
                  {result.message && (
                    <p className="text-neutral-300 mb-2">{result.message}</p>
                  )}

                  {result.warning && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-2">
                      <p className="text-yellow-500 text-sm">{result.warning}</p>
                    </div>
                  )}

                  {result.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-2">
                      <p className="text-red-500 text-sm font-mono">{result.error}</p>
                    </div>
                  )}

                  {result.to && (
                    <p className="text-sm text-neutral-400">
                      Sent to: <span className="text-white">{result.to}</span>
                    </p>
                  )}
                </div>
              </div>

              {result.success && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-sm text-neutral-400 mb-2">
                    ✅ Check the email inbox for: <strong className="text-white">{result.to}</strong>
                  </p>
                  <p className="text-sm text-neutral-400">
                    ✅ Check <a href="/admin/emails/sent" className="text-primary-500 hover:underline">email log</a> to see if it was recorded
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card className="p-4 md:p-6 lg:p-8 bg-neutral-900/50">
            <h3 className="text-sm font-bold text-white mb-3">Troubleshooting</h3>
            <div className="space-y-2 text-xs text-neutral-400">
              <p>
                <strong className="text-white">If the test fails:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your <code className="text-secondary-500 bg-black px-1 rounded">.env.local</code> file has all AWS SES variables</li>
                <li>Verify AWS SES is out of sandbox mode (or test email is verified)</li>
                <li>Check terminal logs for detailed error messages</li>
                <li>Confirm AWS SES credentials are correct</li>
              </ul>

              <p className="mt-3">
                <strong className="text-white">If email sends but doesn't log:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check that <code className="text-secondary-500 bg-black px-1 rounded">email_messages</code> table exists</li>
                <li>Verify RLS policies allow admin to insert</li>
              </ul>
            </div>
          </Card>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}




