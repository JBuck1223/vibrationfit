// /src/app/account/settings/password/page.tsx
// Password & Security settings

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, Card, Button, Spinner } from '@/lib/design-system/components'
import { Key, Mail, Shield, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function PasswordSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const supabase = createClient()

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
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Password and security</h1>

        <p className="text-sm text-neutral-500">
          Reset your password and keep your account secure.
        </p>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
              <Key className="h-5 w-5 text-cyan-400" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-white">Reset password</h2>
          </div>

          <div className="max-w-md">
            <p className="mb-5 text-sm leading-relaxed text-neutral-400">
              We will send a secure link to your email to reset your password.
            </p>

            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
                <Mail className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden />
                <span className="text-sm text-white">{email}</span>
              </div>
            </div>

            {sent ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
                <Check className="h-5 w-5 shrink-0 text-primary-500" aria-hidden />
                <div>
                  <div className="text-sm font-medium text-white">Reset link sent</div>
                  <div className="text-xs text-neutral-400">Check your email inbox</div>
                </div>
              </div>
            ) : (
              <Button onClick={handleResetPassword} disabled={sending} variant="primary">
                {sending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            )}
          </div>
        </Card>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
              <Shield className="h-5 w-5 text-[#39FF14]" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-white">Security tips</h2>
          </div>

          <div className="space-y-3.5 text-sm leading-relaxed text-neutral-400">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                1
              </div>
              <p>Use a unique password you do not reuse on other sites.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                2
              </div>
              <p>Use a mix of letters, numbers, and symbols.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                3
              </div>
              <p>Consider a password manager for strong, unique passwords.</p>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
