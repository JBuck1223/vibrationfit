'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if this is from an intensive purchase
        const intensive = searchParams.get('intensive')
        if (intensive === 'true') {
          router.push('/auth/setup-password?intensive=true')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  return <>{children}</>
}

