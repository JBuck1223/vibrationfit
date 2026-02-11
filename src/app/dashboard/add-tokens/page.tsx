// /src/app/dashboard/add-tokens/page.tsx
// Token pack purchase page

'use client'

import { useEffect, useState } from 'react'
import { Container, Card, Button, Stack, PageHero } from '@/lib/design-system/components'
import { Zap, Check, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

type TokenPack = {
  packKey: string
  name: string
  description?: string | null
  unitAmount: number
  currency: string
  grantAmount: number
  highlights: string[]
  isPopular: boolean
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

function formatTokensShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`
  }
  return amount.toString()
}

export default function AddTokensPage() {
  const [loading, setLoading] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [packs, setPacks] = useState<TokenPack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setPacksLoading(true)
        const response = await fetch('/api/billing/packs?product=tokens')
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load packs')
        }
        const data = await response.json()
        const fetchedPacks = (data.packs || []) as TokenPack[]
        setPacks(fetchedPacks)
      } catch (error) {
        console.error('Pack load error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load packs')
      } finally {
        setPacksLoading(false)
      }
    }

    loadPacks()
  }, [])

  const handlePurchase = async (packKey: string) => {
    setLoading(true)
    setSelectedPack(packKey)

    try {
      const response = await fetch('/api/stripe/checkout-flex-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey: 'tokens',
          packKey,
          quantity: 1,
        }),
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
          title="Creation Token Packs"
          subtitle="Never expires • Use anytime • Full creative freedom"
        />

        {/* Token Packs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
          {packsLoading && (
            <Card className="p-8">
              <div className="text-center text-neutral-400 text-sm">
                Loading packs...
              </div>
            </Card>
          )}
          {!packsLoading && packs.length === 0 && (
            <Card className="p-8">
              <div className="text-center text-neutral-400 text-sm">
                Packs are unavailable right now.
              </div>
            </Card>
          )}
          {packs.map((pack) => (
            <Card
              key={pack.packKey}
              className={`p-8 relative flex flex-col ${
                pack.isPopular
                  ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-500/5 to-secondary-500/5'
                  : ''
              }`}
            >
              {pack.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-black font-bold text-sm rounded-full shadow-lg shadow-primary-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Best Value
                  </span>
                </div>
              )}

              {/* Pack Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">{pack.name}</h3>
                {pack.description && (
                  <p className="text-sm text-neutral-400 mb-4">{pack.description}</p>
                )}
                
                {/* Token Amount */}
                <div className="inline-flex items-baseline gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-700 mb-2">
                  <Sparkles className="w-4 h-4 text-energy-500" />
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {formatTokensShort(pack.grantAmount)}
                  </span>
                  <span className="text-sm text-neutral-500">tokens</span>
                </div>
                
                {/* Price */}
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-500 mb-1">
                  {formatPrice(pack.unitAmount)}
                </div>
                <div className="text-sm text-neutral-500">
                  One-time purchase
                </div>
              </div>

              {/* Features - flex-grow pushes button to bottom */}
              <ul className="space-y-3 mb-6 flex-grow">
                {(pack.highlights.length > 0 ? pack.highlights : [
                  `${formatTokensShort(pack.grantAmount)} tokens`,
                  'Never expires',
                ]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA - mt-auto ensures alignment at bottom */}
              <Button
                variant={pack.isPopular ? 'primary' : 'secondary'}
                size="lg"
                className="w-full mt-auto"
                onClick={() => handlePurchase(pack.packKey)}
                disabled={loading}
              >
                {loading && selectedPack === pack.packKey ? 'Processing...' : 'Purchase'}
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
                Tokens power all VIVA features: VIVA refinements, chats, audio generation, transcription, and image creation. Each action uses tokens based on its complexity and length.
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

