'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Input, Button } from '@/lib/design-system'
import { MailCheck } from 'lucide-react'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Image
            src={ASSETS.brand.logoWhite}
            alt="Vibration Fit"
            width={453}
            height={40}
            className="mx-auto mb-4"
            priority
            loading="eager"
          />
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20">
              <MailCheck className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-xl font-bold text-white">Check your email</h1>
            <p className="mt-3 text-sm text-neutral-400">
              If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a
              link to reset your password. It may take a minute to arrive.
            </p>
            <a
              href="/auth/login"
              className="mt-6 inline-block text-sm text-green-500 transition-colors hover:text-green-400"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white">Reset your password</h1>
              <p className="mt-2 text-sm text-neutral-400">
                Enter your email and we&apos;ll send you a link to set a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              {error && (
                <div className="rounded-lg border border-error-600 bg-error-600/10 px-4 py-3 !text-[#FF0040]">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-neutral-400">
              Remembered it?{' '}
              <a href="/auth/login" className="text-green-500 transition-colors hover:text-green-400">
                Back to sign in
              </a>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
