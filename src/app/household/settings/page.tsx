'use client'

import { useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

export default function HouseholdSettingsRedirectPage() {
  const router = useRouter()

  useLayoutEffect(() => {
    router.replace('/account/household')
  }, [router])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
      <Spinner size="md" />
      <p className="text-sm text-neutral-500">Redirecting to account settings</p>
    </div>
  )
}
