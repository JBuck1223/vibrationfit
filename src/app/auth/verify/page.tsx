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
      const intensive = searchParams.get('intensive')

      if (!tokenHash || !type) {
        setError('Invalid verification link')
        return
      }

      console.log('Client-side: Verifying magic link token...')

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

        console.log('✅ Client-side verification successful:', data.user?.email)
        console.log('✅ Session established:', !!data.session)

        // Small delay to ensure session is fully established
        setTimeout(() => {
          if (intensive === 'true') {
            // Skip password setup for now - go straight to intensive dashboard
            // User can set password later from their profile
            window.location.href = '/intensive/dashboard'
          } else {
            router.push('/dashboard')
          }
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
      <>
        <Container size="sm" className="py-16 text-center">
          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Verification Failed</h1>
            <p className="text-neutral-300">{error}</p>
            <p className="text-sm text-neutral-500 mt-4">Redirecting to login...</p>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="sm" className="py-16 text-center">
        <div className="bg-primary-500/10 border-2 border-primary-500 rounded-2xl p-12">
          <Spinner variant="primary" size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying Your Account</h1>
          <p className="text-neutral-300">Please wait while we log you in...</p>
        </div>
      </Container>
    </>
  )
}

