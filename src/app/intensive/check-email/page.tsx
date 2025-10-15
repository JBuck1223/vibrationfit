'use client'

import { useSearchParams } from 'next/navigation'
import { Card, Container, PageLayout, Button } from '@/lib/design-system/components'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <PageLayout>
      <Container size="sm" className="py-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">📧</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Check Your Email!
          </h1>
          <p className="text-xl text-neutral-300">
            Your payment was successful! 🎉
          </p>
        </div>

        <Card variant="elevated" className="max-w-md mx-auto">
          <div className="space-y-6">
            <div className="bg-primary-500/10 border-l-4 border-primary-500 p-6 rounded">
              <h2 className="text-lg font-semibold mb-2">📬 Magic Link Sent</h2>
              <p className="text-neutral-300 text-sm">
                We've sent a secure login link to:
              </p>
              {email && (
                <p className="text-primary-500 font-semibold mt-2">
                  {email}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Check your inbox</p>
                    <p className="text-sm text-neutral-400">
                      Look for an email from VibrationFit
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Click the magic link</p>
                    <p className="text-sm text-neutral-400">
                      This will automatically log you in
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Set your password</p>
                    <p className="text-sm text-neutral-400">
                      Create a secure password for future logins
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-energy-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Start your 72-hour intensive!</p>
                    <p className="text-sm text-neutral-400">
                      Begin your Vision Activation journey
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 p-4 rounded-xl">
              <p className="text-sm text-neutral-400">
                <span className="font-semibold text-white">💡 Pro Tip:</span> Check your spam folder if you don't see the email within 2 minutes.
              </p>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8 space-y-4">
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
          >
            Didn't receive the email? Resend
          </Button>
          
          <p className="text-sm text-neutral-400">
            Need help? Contact{' '}
            <a href="mailto:support@vibrationfit.com" className="text-primary-500 hover:underline">
              support@vibrationfit.com
            </a>
          </p>
        </div>
      </Container>
    </PageLayout>
  )
}

