// /src/app/account/settings/password/page.tsx
// Password & Security settings

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, PageHero, Card, Button, Spinner } from '@/lib/design-system/components'
import { Key, Mail, Shield, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PasswordSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchUserEmail()
  }, [])

  const fetchUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setSending(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      
      setSent(true)
      toast.success('Password reset link sent to your email')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Password & Security"
          subtitle="Manage your password and account security"
        >
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={() => router.push('/account')}>
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {/* Password Reset */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Reset Password</h3>
          </div>

          <div className="max-w-md">
            <p className="text-neutral-400 mb-6">
              We'll send a secure link to your email address to reset your password.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-700">
                <Mail className="w-5 h-5 text-neutral-500" />
                <span className="text-white">{email}</span>
              </div>
            </div>

            {sent ? (
              <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <Check className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="font-medium text-white">Reset link sent!</div>
                  <div className="text-sm text-neutral-400">Check your email inbox</div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleResetPassword}
                disabled={sending}
                variant="primary"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Security Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Security Tips</h3>
          </div>

          <div className="space-y-4 text-neutral-400">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <p>Use a unique password you don't use on other websites</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <p>Include a mix of letters, numbers, and special characters</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <p>Consider using a password manager to generate and store secure passwords</p>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
