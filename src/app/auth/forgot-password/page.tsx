'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MailCheck } from 'lucide-react'
import { AUTH_LINK, AUTH_PRIMARY_BUTTON, AuthField, AuthNotice, AuthScreen } from '@/components/auth/AuthScreen'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      // Avoid leaking whether an account exists; only surface true network issues.
      const msg = resetError.message || ''
      if (/fetch|network/i.test(msg)) {
        setError('Connection error. Please check your internet and try again.')
        return
      }
    }

    // Always show success to prevent email enumeration.
    setSent(true)
  }

  return (
    <AuthScreen
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={
        sent ? (
          <>
            If an account exists for <span className="text-white">{email}</span>, a link to set a new password is on its way. It may take a minute to arrive.
          </>
        ) : (
          'Enter your email and we will send you a link to set a new password.'
        )
      }
      footer={
        <>
          {sent ? 'Back to ' : 'Remembered it? '}
          <Link href="/auth/login" className={AUTH_LINK}>Sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="flex justify-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#39FF14]/40 bg-[rgba(57,255,20,0.12)]">
            <MailCheck className="h-8 w-8 text-[#39FF14]" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {loading ? 'Sending' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthScreen>
  )
}
