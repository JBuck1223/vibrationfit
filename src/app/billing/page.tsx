// /src/app/billing/page.tsx
// Billing management and subscription overview

'use client'

import { useState, useEffect } from 'react'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system/components'
import { CreditCard, Calendar, TrendingUp, ExternalLink, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      })

      if (!response.ok) throw new Error('Failed to create portal session')

      const { url } = await response.json()
      window.location.href = url

    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to open billing portal. Please try again.')
    }
  }

  if (loading) {
    return (
      <>
        <Container size="xl" className="py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-800 rounded w-1/4"></div>
            <div className="h-64 bg-neutral-800 rounded"></div>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="xl" className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-neutral-400">
            Manage your membership and payment details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary-500" />
                Current Plan
              </h2>
              {subscription && (
                <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
                  {subscription.status}
                </Badge>
              )}
            </div>

            {subscription ? (
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {subscription.tier?.name || 'Free'}
                  </div>
                  <p className="text-neutral-400">
                    {subscription.tier?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 p-4 rounded-lg">
                    <div className="text-xs text-neutral-400 mb-1">Current Period</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - 
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="bg-neutral-800 p-4 rounded-lg">
                    <div className="text-xs text-neutral-400 mb-1">VIVA Tokens</div>
                    <div className="text-sm font-semibold text-primary-500">
                      {subscription.tier?.viva_tokens_monthly || 0} / month
                    </div>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-yellow-500 mb-1">
                          Subscription Ending
                        </div>
                        <div className="text-xs text-neutral-300">
                          Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleManageBilling}
                  className="w-full"
                >
                  Manage Billing <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-400 mb-4">
                  You're currently on the Free plan
                </p>
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/pricing'}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <div className="text-sm text-neutral-400">This Month</div>
                  <div className="text-2xl font-bold text-white">
                    ${subscription?.tier?.price_monthly ? (subscription.tier.price_monthly / 100).toFixed(0) : '0'}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-secondary-500" />
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Next Billing</div>
                  <div className="text-sm font-semibold text-white">
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <div className="text-sm font-semibold text-white mb-2">
                  Need a custom plan?
                </div>
                <p className="text-xs text-neutral-400 mb-4">
                  Contact us for enterprise pricing
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  )
}

