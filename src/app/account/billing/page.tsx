// /src/app/account/billing/page.tsx
// Billing & Subscription page

'use client'

import { Container, Stack, PageHero, Card, Button } from '@/lib/design-system/components'
import { CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const router = useRouter()

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Billing & Subscription"
          subtitle="Manage your subscription and payment methods"
        >
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={() => router.push('/account')}>
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {/* Current Plan */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Current Plan</h3>
          </div>

          <div className="text-center py-8">
            <p className="text-neutral-400 mb-4">
              Billing management coming soon
            </p>
            <p className="text-sm text-neutral-500">
              Contact support for any billing inquiries
            </p>
          </div>
        </Card>

      </Stack>
    </Container>
  )
}
