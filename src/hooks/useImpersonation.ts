'use client'

import { useState, useEffect, useCallback } from 'react'

const COOKIE_UID = 'vf-impersonate-uid'
const COOKIE_EMAIL = 'vf-impersonate-email'
const COOKIE_NAME = 'vf-impersonate-name'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function useImpersonation() {
  const [initialized, setInitialized] = useState(false)
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [targetUserEmail, setTargetUserEmail] = useState<string | null>(null)
  const [targetUserName, setTargetUserName] = useState<string | null>(null)

  useEffect(() => {
    setTargetUserId(getCookie(COOKIE_UID))
    setTargetUserEmail(getCookie(COOKIE_EMAIL))
    setTargetUserName(getCookie(COOKIE_NAME))
    setInitialized(true)
  }, [])

  const isImpersonating = !!targetUserId

  const stopImpersonating = useCallback(async () => {
    await fetch('/api/admin/impersonate', { method: 'DELETE' })
    window.location.href = '/admin/users'
  }, [])

  return {
    initialized,
    isImpersonating,
    targetUserId,
    targetUserEmail,
    targetUserName,
    stopImpersonating,
  }
}
