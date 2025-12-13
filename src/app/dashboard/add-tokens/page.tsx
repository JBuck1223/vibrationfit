// /src/app/dashboard/add-tokens/page.tsx
// Token pack purchase page

'use client'

import { useState } from 'react'
import { Container, Card, Button, Badge, Stack, PageHero } from '@/lib/design-system/components'
import { Zap, Check, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

const TOKEN_PACKS = [
  {
    id: 'power',
    name: 'Power Pack',
    tokens: 2_000_000,
    price: 99,
    popular: false,
    description: 'Perfect for active creators',
    features: [
      '2 million tokens',
      '~40 vision refinements',
      '~10 audio generations',
      'Never expires',
    ],
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    tokens: 5_000_000,
    price: 199,
    popular: true,
    description: 'Best value for power users',
    features: [
      '5 million tokens',
      '~100 vision refinements',
      '~25 audio generations',
      'Never expires',
      'Priority support',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra Pack',
    tokens: 12_000_000,
    price: 399,
    popular: false,
    description: 'Ultimate creative freedom',
    features: [
      '12 million tokens',
      '~240 vision refinements',
      '~60 audio generations',
      'Never expires',
      'Priority support',
      'Early access to new features',
    ],
  },
]

export default function AddTokensPage() {
  const [loading, setLoading] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)

  const handlePurchase = async (packId: string) => {
    setLoading(true)
    setSelectedPack(packId)

    try {
      const response = await fetch('/api/stripe/checkout-token-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      setLoading(false)
      setSelectedPack(null)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Add More Creation Tokens"
          subtitle="Never expires • Use anytime • Full creative freedom"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full">
            <Zap className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-primary-500">Token Packs</span>
          </div>
        </PageHero>

        {/* Token Packs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOKEN_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={`p-8 relative ${
                pack.popular
                  ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-500/5 to-secondary-500/5'
                  : ''
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="success" className="px-4 py-1">
                    Best Value
                  </Badge>
                </div>
              )}

              {/* Pack Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">{pack.name}</h3>
                <p className="text-sm text-neutral-400 mb-4">{pack.description}</p>
                
                {/* Token Amount */}
                <div className="inline-flex items-baseline gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-700 mb-2">
                  <Sparkles className="w-4 h-4 text-energy-500" />
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {(pack.tokens / 1_000_000).toFixed(0)}M
                  </span>
                  <span className="text-sm text-neutral-500">tokens</span>
                </div>
                
                {/* Price */}
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-500 mb-1">
                  ${pack.price}
                </div>
                <div className="text-sm text-neutral-500">
                  One-time purchase
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {pack.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={pack.popular ? 'primary' : 'secondary'}
                size="lg"
                className="w-full"
                onClick={() => handlePurchase(pack.id)}
                disabled={loading}
              >
                {loading && selectedPack === pack.id ? 'Processing...' : 'Purchase'}
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ / Info */}
        <Card className="p-4 md:p-6 lg:p-8 bg-neutral-900">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">How Token Packs Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-500" />
                What are tokens?
              </h3>
              <p className="text-neutral-400 text-sm">
                Tokens power all AI features: VIVA refinements, chats, audio generation, transcription, and image creation. Each action uses tokens based on its complexity and length.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-500" />
                Never expire
              </h3>
              <p className="text-neutral-400 text-sm">
                Token packs never expire and roll over indefinitely. Use them whenever you need extra creative capacity.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                Powered by GPT-5
              </h3>
              <p className="text-neutral-400 text-sm">
                All tokens use the latest GPT-5 model for maximum quality and insight in your vision creation journey.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Stack packs
              </h3>
              <p className="text-neutral-400 text-sm">
                Buy multiple packs! They all add to your balance and never expire. Perfect for intensive transformation periods.
              </p>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

