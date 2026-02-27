'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Spinner } from '@/lib/design-system/components'

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
      <Container size="sm" className="py-16 text-center">
        <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Verification Failed</h1>
          <p className="text-neutral-300">{error}</p>
          <p className="text-sm text-neutral-500 mt-4">Redirecting to login...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container size="sm" className="py-16 text-center">
      <div className="bg-primary-500/10 border-2 border-primary-500 rounded-2xl p-12">
        <Spinner variant="primary" size="lg" className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Verifying Your Account</h1>
        <p className="text-neutral-300">Please wait while we log you in...</p>
      </div>
    </Container>
  )
}
