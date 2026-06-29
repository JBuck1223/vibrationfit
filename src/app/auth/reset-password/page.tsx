'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Input, Button, Spinner } from '@/lib/design-system'
import { Lock, CheckCircle, Eye, EyeOff, Eye as EyeIcon } from 'lucide-react'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

type Phase = 'verifying' | 'ready' | 'invalid' | 'done'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('verifying')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // The Supabase browser client auto-detects the recovery code in the URL and
  // establishes a temporary session. Wait for that session before showing the form.
  useEffect(() => {
    let resolved = false

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        resolved = true
        setPhase('ready')
      }
    })

    const check = async () => {
      // Give the SDK a moment to process the URL hash/code.
      await new Promise((r) => setTimeout(r, 600))
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!resolved) {
        setPhase(session ? 'ready' : 'invalid')
      }
    }
    check()

    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { has_password: true },
    })
    setLoading(false)

    if (updateError) {
      setError(updateError.message || 'Could not update your password. Please try again.')
      return
    }

    setPhase('done')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (phase === 'verifying') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner variant="primary" size="lg" />
      </div>
    )
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

        {phase === 'invalid' && (
          <div className="text-center py-4">
            <h1 className="text-xl font-bold text-white">Link expired</h1>
            <p className="mt-3 text-sm text-neutral-400">
              This password reset link is invalid or has expired. Request a new one to continue.
            </p>
            <a
              href="/auth/forgot-password"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#39FF14] px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Request a new link
            </a>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Password updated</h1>
            <p className="mt-2 text-sm text-neutral-400">Redirecting you to your dashboard...</p>
          </div>
        )}

        {phase === 'ready' && (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20">
                <Lock className="h-8 w-8 text-primary-500" />
              </div>
              <h1 className="text-xl font-bold text-white">Set a new password</h1>
              <p className="mt-2 text-sm text-neutral-400">Choose a strong password you don&apos;t use elsewhere.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  helperText="Must be at least 8 characters"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-[3.375rem] -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-1 text-neutral-400 transition-colors hover:text-neutral-300"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <div className="rounded-lg border border-error-600 bg-error-600/10 px-4 py-3 !text-[#FF0040]">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
