'use client'

// One-time household sharing setup, shown after accepting an invitation or
// upgrading to a household plan. Members who already completed setup are
// sent straight to the household page.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Container, Spinner, Stack } from '@/lib/design-system/components'
import { HouseholdSharingBuilder } from '@/components/household/HouseholdSharingBuilder'

export default function HouseholdWelcomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [householdName, setHouseholdName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/household/sharing-settings')
        if (res.status === 401) {
          router.push('/auth/login?returnTo=/household/welcome')
          return
        }
        if (res.status === 404) {
          // No household — nothing to set up.
          router.push('/account/household')
          return
        }
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.setupCompleted) {
          router.push('/account/household')
          return
        }

        const householdRes = await fetch('/api/household')
        if (householdRes.ok) {
          const householdJson = await householdRes.json()
          if (!cancelled) setHouseholdName(householdJson.household?.name ?? null)
        }
      } catch {
        // Show the builder anyway; it handles its own load/save errors.
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Container size="lg" className="pt-8 pb-12">
      <Stack gap="lg">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-secondary-500" />
          </div>
        </div>
        <HouseholdSharingBuilder
          redirectTo="/account/household"
          householdName={householdName}
        />
      </Stack>
    </Container>
  )
}
