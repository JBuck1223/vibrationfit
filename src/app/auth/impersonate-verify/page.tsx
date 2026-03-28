'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Spinner } from '@/lib/design-system/components'

export default function ImpersonateVerifyPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      const tokenHash = searchParams.get('token_hash')
      const isReturn = searchParams.get('return') === 'admin'

      if (!tokenHash) {
        setError('Missing verification token')
        return
      }

      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
      })

      if (verifyError) {
        console.error('Impersonate verify failed:', verifyError)
        setError('Session verification failed. The link may have expired.')
        return
      }

      if (isReturn) {
        localStorage.removeItem('vf-impersonation')
        window.location.href = '/admin/users'
      } else {
        window.location.href = '/dashboard'
      }
    }

    verify()
  }, [searchParams])

  if (error) {
    return (
      <Container size="sm" className="py-16 text-center">
        <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Verification Failed</h1>
          <p className="text-neutral-300 mb-6">{error}</p>
          <a
            href="/admin/users"
            className="inline-block px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors"
          >
            Back to Admin
          </a>
        </div>
      </Container>
    )
  }

  return (
    <Container size="sm" className="py-16 text-center">
      <div className="bg-secondary-500/10 border-2 border-secondary-500/30 rounded-2xl p-12">
        <Spinner variant="primary" size="lg" className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Switching Session</h1>
        <p className="text-neutral-300">Please wait...</p>
      </div>
    </Container>
  )
}
