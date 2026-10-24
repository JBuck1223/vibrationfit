'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AUTH_PRIMARY_BUTTON, AuthField, AuthNotice, AuthScreen } from '@/components/auth/AuthScreen'
import { PageLoading } from '@/components/app-shell/ShellPageSkeleton'

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
    return <PageLoading />
  }

  const toggleButton = (shown: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
    >
      {shown ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
    </button>
  )

  if (phase === 'invalid') {
    return (
      <AuthScreen
        title="Link expired"
        subtitle="This password reset link is invalid or has expired. Request a new one to continue."
      >
        <Link href="/auth/forgot-password" className={AUTH_PRIMARY_BUTTON}>
          Request a new link
        </Link>
      </AuthScreen>
    )
  }

  if (phase === 'done') {
    return (
      <AuthScreen title="Password updated" subtitle="Redirecting you to your dashboard...">
        <div className="flex justify-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#39FF14]/40 bg-[rgba(57,255,20,0.12)]">
            <CheckCircle className="h-8 w-8 text-[#39FF14]" />
          </div>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title="Set a new password" subtitle="Choose a strong password you don't use elsewhere.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          type={showPassword ? 'text' : 'password'}
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your new password"
          required
          trailing={toggleButton(showPassword, () => setShowPassword(!showPassword))}
        />
        <p className="-mt-2 px-1 text-xs text-white/45">Must be at least 8 characters</p>

        <AuthField
          type={showConfirm ? 'text' : 'password'}
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          required
          trailing={toggleButton(showConfirm, () => setShowConfirm(!showConfirm))}
        />

        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? 'Updating' : 'Update password'}
        </button>
      </form>
    </AuthScreen>
  )
}
