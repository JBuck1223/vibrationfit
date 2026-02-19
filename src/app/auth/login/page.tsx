'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Button } from '@/lib/design-system'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

export default function LoginPage() {
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
        setError(error.message)
        setLoading(false)
      } else {
        // Check if user has active intensive
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: intensiveChecklist } = await supabase
            .from('intensive_checklist')
            .select('id, status, started_at')
            .eq('user_id', user.id)
            .in('status', ['pending', 'in_progress'])
            .maybeSingle()
          
          if (intensiveChecklist) {
            if (!intensiveChecklist.started_at) {
              router.push('/intensive/start')
            } else {
              router.push('/intensive/dashboard')
            }
            return
          }
        }
        router.push('/dashboard')
        // Don't set loading to false here - let navigation handle it
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

      // Small delay to ensure session is established, then check for intensive
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: intensiveChecklist } = await supabase
            .from('intensive_checklist')
            .select('id, status, started_at')
            .eq('user_id', user.id)
            .in('status', ['pending', 'in_progress'])
            .maybeSingle()
          
          if (intensiveChecklist) {
            if (!intensiveChecklist.started_at) {
              router.push('/intensive/start')
            } else {
              router.push('/intensive/dashboard')
            }
            return
          }
        }
        router.push('/dashboard')
      }, 300)
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
              className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-0.5 text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-error-600/10 border border-error-600 text-error-600 px-4 py-3 rounded-lg">
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