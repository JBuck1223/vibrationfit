'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/middleware/admin'

interface AdminAuthState {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: string
  isLoading: boolean
  user: any | null
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isSuperAdmin: false,
    role: 'member',
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
            isSuperAdmin: false,
            role: 'member',
            isLoading: false,
            user: null
          })
          return
        }

        // Check database for role
        const { data: account } = await supabase
          .from('user_accounts')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = account?.role || 'member'
        const isAdmin = role === 'admin' || role === 'super_admin'
        const isSuperAdmin = role === 'super_admin'
        
        // Fallback to email check if no account record yet
        const isEmailAdmin = isAdminEmail(user.email || '')
        
        setState({
          isAdmin: isAdmin || isEmailAdmin,
          isSuperAdmin: isSuperAdmin,
          role: isAdmin ? role : (isEmailAdmin ? 'admin' : 'member'),
          isLoading: false,
          user
        })

      } catch (error) {
        console.error('Admin auth check failed:', error)
        setState({
          isAdmin: false,
          isSuperAdmin: false,
          role: 'member',
          isLoading: false,
          user: null
        })
      }
    }

    checkAdminAuth()
  }, [])

  return state
}
