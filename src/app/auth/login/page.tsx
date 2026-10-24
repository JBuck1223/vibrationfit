'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { AUTH_LINK, AUTH_PRIMARY_BUTTON, AUTH_SECONDARY_BUTTON, AuthField, AuthNotice, AuthScreen } from '@/components/auth/AuthScreen'
import { PageLoading } from '@/components/app-shell/ShellPageSkeleton'
import { MEMBER_HOME, resolveMemberHome } from '@/lib/life-activation/home'

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? searchParams.get('redirect')
  const supabase = createClient()

  // If redirected with magic link errors (e.g., otp_expired), auto-switch to code entry
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || ''
    const hasOtpError = hash.includes('otp_expired') || hash.includes('access_denied') || hash.includes('error=')
    if (hasOtpError) {
      setShowCodeEntry(true)
      setError('Your link may have expired or been pre-opened. Enter the 6-digit code from your email.')
    }
  }, [])

  const redirectAfterLogin = async () => {
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')) {
      router.push(returnTo)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(MEMBER_HOME)
      return
    }
    // New members stay in Getting Started until onboarding is complete
    router.push(await resolveMemberHome(supabase, user.id))
  }

  const getLoginErrorMessage = (error: { message?: string; code?: string } | null, fallback: string): string => {
    if (!error?.message) return fallback
    const msg = error.message
    if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')) {
      return 'Connection error. Please check your internet and try again.'
    }
    if (msg === 'Invalid login credentials' || msg.toLowerCase().includes('invalid login') || error.code === 'invalid_credentials') {
      return 'Incorrect email or password. Please try again.'
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please confirm your email address before signing in. Check your inbox for the verification link.'
    }
    if (msg.includes('User not found') || msg.toLowerCase().includes('user not found')) {
      return 'No account found with this email. Please check the address or sign up.'
    }
    return msg
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false)
        setError('Login request timed out. Please try again.')
      }, 30000) // 30 second timeout

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      clearTimeout(timeoutId)

      if (error) {
        setError(getLoginErrorMessage(error, 'Sign-in failed. Please try again.'))
        setLoading(false)
      } else {
        await redirectAfterLogin()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(getLoginErrorMessage({ message }, 'An unexpected error occurred. Please try again.'))
      setLoading(false)
    }
  }

  const handleSendAuth = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setMagicLinkLoading(true)
    setError('')


    try {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setMagicLinkLoading(false)
        setError('Request timed out. Please try again.')
      }, 30000) // 30 second timeout

      const callbackUrl = returnTo
        ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
        : `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      })

      clearTimeout(timeoutId)


      if (error) {
        setError(`Failed to send auth email: ${error.message}`)
        setMagicLinkLoading(false)
      } else {
        setMagicLinkSent(true)
        setMagicLinkLoading(false)
        setShowCodeEntry(true) // Show code entry after email is sent
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setMagicLinkLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!email || !code) {
      setError('Enter your email and the 6-digit code')
      return
    }

    setCodeLoading(true)
    setError('')

    try {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setCodeLoading(false)
        setError('Verification request timed out. Please try again.')
      }, 30000) // 30 second timeout

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })

      clearTimeout(timeoutId)

      if (error) {
        setError(`Code verification failed: ${error.message}`)
        setCodeLoading(false)
        return
      }

      setTimeout(() => redirectAfterLogin(), 300)
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setCodeLoading(false)
    }
  }

  const checkoutComplete = searchParams.get('checkout') === 'complete'

  return (
    <AuthScreen
      title="Welcome back"
      subtitle={
        checkoutComplete
          ? 'Sign in with your purchase email to finish setup. No password yet? Use the email sign-in below.'
          : 'Sign in to pick up where you left off.'
      }
      footer={
        <span className="hide-in-native">
          New here? <Link href="/#pricing" className={AUTH_LINK}>Get started</Link>
        </span>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthField
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <AuthField
          type={showPassword ? 'text' : 'password'}
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          }
        />

        <div className="-mt-1 px-1 text-right">
          <Link href="/auth/forgot-password" className="text-sm text-white/60 transition-colors hover:text-white">
            Forgot password?
          </Link>
        </div>

        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        {magicLinkSent && <AuthNotice tone="success">Check your email. Tap the link, or enter the 6-digit code below.</AuthNotice>}

        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? 'Signing in' : 'Sign in'}
        </button>

        <div className="flex items-center gap-3 py-1 text-xs text-white/45">
          <span className="h-px flex-1 bg-white/15" />
          or
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button type="button" disabled={magicLinkLoading} onClick={handleSendAuth} className={AUTH_SECONDARY_BUTTON}>
          {magicLinkLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-[18px] w-[18px]" />}
          {magicLinkLoading ? 'Sending' : 'Email me a sign-in link'}
        </button>

        {showCodeEntry && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <AuthField
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="123456"
              className="text-center tracking-[0.3em]"
              required
            />
            <button type="button" disabled={codeLoading} onClick={handleVerifyCode} className={AUTH_PRIMARY_BUTTON}>
              {codeLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {codeLoading ? 'Verifying' : 'Verify code'}
            </button>
          </div>
        )}
      </form>
    </AuthScreen>
  )
}