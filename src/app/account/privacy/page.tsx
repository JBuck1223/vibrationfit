// /src/app/account/privacy/page.tsx
// Privacy & Data page

'use client'

import { Container, Stack, Card, Button } from '@/lib/design-system/components'
import { Shield, Eye } from 'lucide-react'

export default function PrivacyPage() {
  const cardClass =
    'border border-white/[0.06] p-4 shadow-none sm:p-5'

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Privacy and data</h1>

        <Card variant="glass" className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
              <Eye className="h-5 w-5 text-cyan-400" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-white">Privacy policy</h2>
          </div>

          <p className="mb-5 max-w-md text-sm leading-relaxed text-neutral-400">
            How we collect, use, and protect your personal information.
          </p>
          <Button variant="outline" onClick={() => window.open('/privacy-policy', '_blank')}>
            View privacy policy
          </Button>
        </Card>

        <Card variant="glass" className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15">
              <Shield className="h-5 w-5 text-[#BF00FF]" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-white">Terms of service</h2>
          </div>

          <p className="mb-5 max-w-md text-sm leading-relaxed text-neutral-400">
            The agreement between you and Vibration Fit.
          </p>
          <Button variant="outline" onClick={() => window.open('/terms-of-service', '_blank')}>
            View terms of service
          </Button>
        </Card>

        <Card variant="glass" className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
              <Shield className="h-5 w-5 text-[#39FF14]" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-white">How we protect your data</h2>
          </div>

          <div className="space-y-3.5 text-sm leading-relaxed text-neutral-400">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                1
              </div>
              <p>Data is encrypted in transit and at rest using industry-standard encryption.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                2
              </div>
              <p>We do not sell your personal data to third parties.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-500">
                3
              </div>
              <p>You can delete your account and associated data at any time from account settings.</p>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
