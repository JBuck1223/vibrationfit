'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { AuthNotice, AuthScreen } from '@/components/auth/AuthScreen'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!tokenHash || !type) {
        setError('Invalid verification link')
        return
      }

      const supabase = createClient()

      try {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })

        if (verifyError) {
          console.error('Verification error:', verifyError)
          setError('Verification failed. Please try again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        // Session is now established client-side
        // Route based on DB state: setup-password checks everything itself
        setTimeout(() => {
          const hasPassword = data.user?.user_metadata?.has_password === true

          if (!hasPassword) {
            window.location.href = '/auth/setup-password'
            return
          }

          // Has password -- go to appropriate destination
          // setup-password page will also handle this, but skip the extra hop
          window.location.href = '/auth/setup-password'
        }, 500)
      } catch (err) {
        console.error('Verification error:', err)
        setError('An error occurred during verification')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    verifyToken()
  }, [router, searchParams])

  if (error) {
    return (
      <AuthScreen title="Verification failed" subtitle="Redirecting to sign in...">
        <AuthNotice tone="error">{error}</AuthNotice>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title="Verifying your account" subtitle="Please wait while we sign you in...">
      <div className="flex justify-center py-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
          <Loader2 className="h-8 w-8 animate-spin text-[#39FF14]" />
        </div>
      </div>
    </AuthScreen>
  )
}
