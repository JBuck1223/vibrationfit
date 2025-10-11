// /src/app/billing/success/page.tsx
// Checkout success page

'use client'

import { useEffect } from 'react'
import { PageLayout, Container, Card, Button } from '@/lib/design-system/components'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Refresh user session to get updated subscription
    setTimeout(() => {
      router.refresh()
    }, 2000)
  }, [router])

  return (
    <PageLayout>
      <Container size="md" className="py-16">
        <Card variant="elevated" className="p-12 text-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary-500" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to VibrationFit! 🎉
          </h1>

          {/* Description */}
          <p className="text-xl text-neutral-300 mb-8 max-w-lg mx-auto">
            Your subscription is now active. Get ready to actualize your vision across all 12 life categories.
          </p>

          {/* What's Next */}
          <div className="bg-neutral-800 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              What's Next
            </h3>
            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <div>
                  <div className="font-medium text-white">Complete Your Profile</div>
                  <div className="text-xs text-neutral-400">Help VIVA understand your current state</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <div>
                  <div className="font-medium text-white">Take the Assessment</div>
                  <div className="text-xs text-neutral-400">Discover your Green Line status</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <div>
                  <div className="font-medium text-white">Build Your Vision with VIVA</div>
                  <div className="text-xs text-neutral-400">Let AI guide your creation process</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/assessment">
                Take Assessment
              </Link>
            </Button>
          </div>
        </Card>

        {/* Receipt */}
        <p className="text-center text-sm text-neutral-500 mt-8">
          A receipt has been sent to your email. Need help? <a href="mailto:support@vibrationfit.com" className="text-primary-500 hover:text-primary-400">Contact us</a>
        </p>
      </Container>
    </PageLayout>
  )
}

