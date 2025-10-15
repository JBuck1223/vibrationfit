'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/middleware/admin'

interface AdminAuthState {
  isAdmin: boolean
  isLoading: boolean
  user: any | null
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    user: null
  })

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          setState({
            isAdmin: false,
            isLoading: false,
            user: null
          })
          return
        }

        const isAdmin = isAdminEmail(user.email || '') || user.user_metadata?.is_admin === true
        
        setState({
          isAdmin,
          isLoading: false,
          user
        })

      } catch (error) {
        console.error('Admin auth check failed:', error)
        setState({
          isAdmin: false,
          isLoading: false,
          user: null
        })
      }
    }

    checkAdminAuth()
  }, [])

  return state
}
