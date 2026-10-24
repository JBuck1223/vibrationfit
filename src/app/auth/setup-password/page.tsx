'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AUTH_LINK, AUTH_PRIMARY_BUTTON, AuthField, AuthNotice, AuthScreen } from '@/components/auth/AuthScreen'
import { PageLoading } from '@/components/app-shell/ShellPageSkeleton'

export default function SetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasIntensive, setHasIntensive] = useState(false)

  function getPostPasswordRedirect(hasActiveIntensive: boolean): string {
    if (hasActiveIntensive) return '/begin'
    if (returnTo && returnTo.startsWith('/')) return returnTo
    return '/begin'
  }

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()

      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserEmail(user.email || null)

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      setHasIntensive(!!checklist)

      if (user.user_metadata?.has_password === true) {
        window.location.href = getPostPasswordRedirect(!!checklist)
        return
      }

      setChecking(false)
    }

    checkUser()
  }, [router])

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { has_password: true },
      })

      if (updateError) throw updateError

      console.log('Password set for:', data.user?.email)
      setSuccess(true)

      setTimeout(() => {
        window.location.href = getPostPasswordRedirect(hasIntensive)
      }, 1500)
    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <PageLoading />
  }

  const isHouseholdInvite = returnTo?.includes('/household/invite')

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

  const footer = (
    <>
      Need help? Contact{' '}
      <a href="mailto:support@vibrationfit.com" className={AUTH_LINK}>
        support@vibrationfit.com
      </a>
    </>
  )

  if (success) {
    return (
      <AuthScreen
        title="Password set"
        subtitle={<>Redirecting{isHouseholdInvite ? ' to your invitation' : ' to Getting Started'}...</>}
        footer={footer}
      >
        <div className="flex justify-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#39FF14]/40 bg-[rgba(57,255,20,0.12)]">
            <CheckCircle className="h-8 w-8 text-[#39FF14]" />
          </div>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Welcome to Vibration Fit"
      subtitle={
        isHouseholdInvite
          ? 'Create your password to accept your household invitation.'
          : 'Set your password to secure your account.'
      }
      footer={footer}
    >
      <form onSubmit={handleSetupPassword} className="space-y-4">
        {userEmail && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/65">
            Setting password for <span className="font-medium text-white">{userEmail}</span>
          </div>
        )}

        <AuthField
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Create password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={loading}
          trailing={toggleButton(showPassword, () => setShowPassword(!showPassword))}
        />
        <p className="-mt-2 px-1 text-xs text-white/45">Must be at least 8 characters</p>

        <AuthField
          id="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          disabled={loading}
          trailing={toggleButton(showConfirm, () => setShowConfirm(!showConfirm))}
        />

        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? 'Setting password' : 'Set password and continue'}
        </button>
      </form>
    </AuthScreen>
  )
}
