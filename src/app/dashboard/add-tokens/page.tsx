'use client'

import { useEffect, useState } from 'react'
import { Container, Card, Button, Stack, PageHero } from '@/lib/design-system/components'
import { Zap, Check, Sparkles, TrendingUp, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import AddOnConfirmDialog from '@/components/checkout/AddOnConfirmDialog'
import { ADDON_PRICING } from '@/lib/checkout/products'
import { formatPrice, formatTokensShort } from '@/lib/billing/config'

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

type ActiveTab = 'onetime' | 'subscription'

export default function AddTokensPage() {
  const [packs, setPacks] = useState<TokenPack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('onetime')

  // One-time purchase dialog state
  const [onetimeDialog, setOnetimeDialog] = useState<{
    open: boolean
    packKey: string
    packName: string
    unitPrice: number
  } | null>(null)

  // Subscription dialog state
  const [subDialog, setSubDialog] = useState(false)

  useEffect(() => {
    async function loadPacks() {
      try {
        setPacksLoading(true)
        const response = await fetch('/api/billing/packs?product=tokens')
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load packs')
        }
        const data = await response.json()
        setPacks((data.packs || []) as TokenPack[])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load packs')
      } finally {
        setPacksLoading(false)
      }
    }
    loadPacks()
  }, [])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Creation Token Packs"
          subtitle="Never expires. Use anytime. Full creative freedom."
        />

        {/* Tabs */}
        <div className="flex gap-2 bg-[#1F1F1F] rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('onetime')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'onetime'
                ? 'bg-[#39FF14] text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            One-Time Packs
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'bg-[#39FF14] text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Token Subscription
          </button>
        </div>

        {/* One-Time Packs Tab */}
        {activeTab === 'onetime' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
            {packsLoading && (
              <Card className="p-8">
                <div className="text-center text-neutral-400 text-sm">Loading packs...</div>
              </Card>
            )}
            {!packsLoading && packs.length === 0 && (
              <Card className="p-8">
                <div className="text-center text-neutral-400 text-sm">Packs are unavailable right now.</div>
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

                <div className="text-center mb-6">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">{pack.name}</h3>
                  {pack.description && (
                    <p className="text-sm text-neutral-400 mb-4">{pack.description}</p>
                  )}
                  <div className="inline-flex items-baseline gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-700 mb-2">
                    <Sparkles className="w-4 h-4 text-energy-500" />
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      {formatTokensShort(pack.grantAmount)}
                    </span>
                    <span className="text-sm text-neutral-500">tokens</span>
                  </div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-500 mb-1">
                    {formatPrice(pack.unitAmount)}
                  </div>
                  <div className="text-sm text-neutral-500">One-time purchase</div>
                </div>

                <ul className="space-y-3 mb-6 flex-grow">
                  {(pack.highlights.length > 0
                    ? pack.highlights
                    : [`${formatTokensShort(pack.grantAmount)} tokens`, 'Never expires']
                  ).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span className="text-neutral-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={pack.isPopular ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full mt-auto"
                  onClick={() =>
                    setOnetimeDialog({
                      open: true,
                      packKey: pack.packKey,
                      packName: pack.name,
                      unitPrice: pack.unitAmount,
                    })
                  }
                >
                  Purchase
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Token Subscription Tab */}
        {activeTab === 'subscription' && (
          <Card className="p-6 md:p-8">
            <div className="max-w-lg mx-auto text-center space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Recurring Token Add-on</h3>
                <p className="text-neutral-400">
                  Add a recurring token allocation to your Vision Pro subscription.
                  Tokens are granted each billing cycle.
                </p>
              </div>

              <div className="bg-[#2A2A2A] rounded-xl p-6 space-y-3">
                <div className="text-3xl font-bold text-[#39FF14]">
                  {formatPrice(ADDON_PRICING.TOKEN_28DAY)}
                  <span className="text-lg text-neutral-400 font-normal"> / 1M tokens / cycle</span>
                </div>
                <p className="text-sm text-neutral-500">
                  Select quantity (1-10 units) in the next step. Added to your existing subscription billing.
                </p>
              </div>

              <ul className="space-y-3 text-left">
                {[
                  'Tokens granted automatically each billing cycle',
                  'Prorated charge for the current cycle',
                  'Adjust or cancel anytime',
                  'Stacks with your existing token balance',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="primary" size="lg" className="w-full" onClick={() => setSubDialog(true)}>
                Add to Subscription
              </Button>
            </div>
          </Card>
        )}

        {/* FAQ */}
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

      {/* One-time purchase dialog */}
      {onetimeDialog?.open && (
        <AddOnConfirmDialog
          isOpen
          onClose={() => setOnetimeDialog(null)}
          mode="onetime"
          addonType="tokens"
          unitLabel={onetimeDialog.packName}
          unitPriceCents={onetimeDialog.unitPrice}
          packKey={onetimeDialog.packKey}
          productKey="tokens"
          maxQuantity={5}
          onSuccess={() => {
            toast.success('Tokens added to your balance!')
            window.location.reload()
          }}
        />
      )}

      {/* Subscription add-on dialog */}
      {subDialog && (
        <AddOnConfirmDialog
          isOpen
          onClose={() => setSubDialog(false)}
          mode="subscription"
          addonType="tokens"
          unitLabel="1M tokens / cycle"
          unitPriceCents={ADDON_PRICING.TOKEN_28DAY}
          intervalLabel="every 28 days"
          maxQuantity={10}
          onSuccess={() => {
            toast.success('Token subscription added!')
            window.location.reload()
          }}
        />
      )}
    </Container>
  )
}
