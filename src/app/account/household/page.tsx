'use client'

import { Container } from '@/lib/design-system/components'
import { AccountHouseholdSettings } from '@/components/account-studio'

export default function AccountHouseholdPage() {
  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <h1 className="sr-only">Household</h1>
      <AccountHouseholdSettings />
    </Container>
  )
}
