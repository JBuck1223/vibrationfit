// /src/app/account/privacy/page.tsx
// Privacy & Data page

'use client'

import { Container, Stack, PageHero, Card, Button } from '@/lib/design-system/components'
import { Shield, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Privacy & Data"
          subtitle="Learn how we protect your information"
        >
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={() => router.push('/account')}>
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {/* Privacy Policy */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
          </div>

          <div className="max-w-md">
            <p className="text-neutral-400 mb-6">
              Learn about how we collect, use, and protect your personal information.
            </p>
            <Button variant="outline" onClick={() => window.open('/privacy-policy', '_blank')}>
              View Privacy Policy
            </Button>
          </div>
        </Card>

        {/* Terms of Service */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Terms of Service</h3>
          </div>

          <div className="max-w-md">
            <p className="text-neutral-400 mb-6">
              Review the agreement between you and Vibration Fit.
            </p>
            <Button variant="outline" onClick={() => window.open('/terms-of-service', '_blank')}>
              View Terms of Service
            </Button>
          </div>
        </Card>

        {/* Data Protection */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">How We Protect Your Data</h3>
          </div>

          <div className="space-y-4 text-neutral-400">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <p>All data is encrypted in transit and at rest using industry-standard encryption</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <p>We never sell your personal data to third parties</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <p>You can delete your account and all associated data at any time</p>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
