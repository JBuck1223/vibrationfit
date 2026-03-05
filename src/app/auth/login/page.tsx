'use client'

import { createClient } from '@/lib/supabase/client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Input, Button, Spinner } from '@/lib/design-system'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Spinner variant="primary" size="lg" /></div>}>
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
  const returnTo = searchParams.get('returnTo')
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
    if (returnTo && returnTo.startsWith('/')) {
      router.push(returnTo)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: intensiveChecklist } = await supabase
        .from('intensive_checklist')
        .select('id, status, started_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      if (intensiveChecklist) {
        router.push(intensiveChecklist.started_at ? '/intensive/dashboard' : '/intensive/start')
        return
      }
    }
    router.push('/dashboard')
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

    console.log('🔍 Attempting to send auth email to:', email)
    console.log('🔍 Redirect URL:', `${window.location.origin}/auth/callback`)

    try {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setMagicLinkLoading(false)
        setError('Request timed out. Please try again.')
      }, 30000) // 30 second timeout

      const callbackUrl = returnTo
        ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
        : `${window.location.origin}/auth/callback`
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      })

      clearTimeout(timeoutId)

      console.log('🔍 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Auth email error:', error)
        setError(`Failed to send auth email: ${error.message}`)
        setMagicLinkLoading(false)
      } else {
        console.log('✅ Auth email sent successfully:', data)
        setMagicLinkSent(true)
        setMagicLinkLoading(false)
        setShowCodeEntry(true) // Show code entry after email is sent
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err)
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

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Image
            src={ASSETS.brand.logoWhite}
            alt="Vibration Fit"
            width={200}
            height={40}
            className="mx-auto mb-4"
            style={{ width: 'auto', height: '2.5rem' }}
            priority
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-1 text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="bg-error-600/10 border border-error-600 px-4 py-3 rounded-lg !text-[#FF0040]">
              {error}
            </div>
          )}

          {magicLinkSent && (
            <div className="bg-primary-500/10 border border-primary-500 text-primary-500 px-4 py-3 rounded-lg">
              ✨ Magic link sent! Click the link in your email, or enter the 6-digit code below.
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-900 text-neutral-400">or</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            loading={magicLinkLoading}
            onClick={handleSendAuth}
            className="w-full"
          >
            {magicLinkLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>

          {showCodeEntry && (
            <div className="space-y-3">
              <Input
                type="text"
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="Enter the code from your email"
                required
              />
              <Button type="button" loading={codeLoading} onClick={handleVerifyCode} className="w-full">
                {codeLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          )}
        </form>

        <p className="text-neutral-400 text-center mt-6">
          Don&apos;t have an account? <a href="/#pricing" className="text-green-500 hover:text-green-400 transition-colors">Get Started</a>
        </p>
      </Card>
    </div>
  )
}