'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // setup-password checks DB for intensive enrollment itself
        const needsSetup = searchParams.get('setup_password')
        if (needsSetup === 'true') {
          router.push('/auth/setup-password')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  )
}

