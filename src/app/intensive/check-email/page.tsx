'use client'

import { useSearchParams } from 'next/navigation'
import { Card, Container, Button, Stack, PageHero } from '@/lib/design-system/components'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <Container size="sm">
      <Stack gap="lg">
        <PageHero
          eyebrow="INTENSIVE PROGRAM"
          title="Check Your Email!"
          subtitle="Your payment was successful! 🎉"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-3xl md:text-4xl">📧</span>
          </div>
        </PageHero>

        <Card variant="elevated" className="max-w-md mx-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6">
            <div className="bg-primary-500/10 border-l-4 border-primary-500 p-4 md:p-6 rounded">
              <h2 className="text-base md:text-lg font-semibold mb-2">📬 Magic Link Sent</h2>
              <p className="text-neutral-300 text-xs md:text-sm">
                We've sent a secure login link to:
              </p>
              {email && (
                <p className="text-primary-500 font-semibold mt-2 text-sm md:text-base break-all">
                  {email}
                </p>
              )}
            </div>

            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-base md:text-lg">What's Next?</h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">Check your inbox</p>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Look for an email from VibrationFit
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">Click the magic link</p>
                    <p className="text-xs md:text-sm text-neutral-400">
                      This will automatically log you in
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">Set your password</p>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Create a secure password for future logins
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-energy-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">Start your 72-hour intensive!</p>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Begin your Vision Activation journey
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 p-3 md:p-4 rounded-xl">
              <p className="text-xs md:text-sm text-neutral-400">
                <span className="font-semibold text-white">💡 Pro Tip:</span> Check your spam folder if you don't see the email within 2 minutes.
              </p>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6 md:mt-8 space-y-3 md:space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Didn't receive the email? Resend
          </Button>
          
          <p className="text-xs md:text-sm text-neutral-400">
            Need help? Contact{' '}
            <a href="mailto:support@vibrationfit.com" className="text-primary-500 hover:underline">
              support@vibrationfit.com
            </a>
          </p>
        </div>
      </Stack>
    </Container>
  )
}

