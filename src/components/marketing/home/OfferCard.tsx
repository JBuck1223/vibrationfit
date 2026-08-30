'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Coins,
  Headphones,
  Headset,
  LayoutGrid,
  Map,
  Mic,
  Music,
  NotebookPen,
  ScrollText,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  Users,
  UsersRound,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal } from '@/lib/design-system'
import { trackConversion } from '@/lib/tracking/pixels'
import { LAUNCH_SOLO_PROMO_CODE, resolveIntensiveLaunchPromoCode } from '@/lib/billing/launch-promo'
import { CTA_LABEL } from './primitives'

type GuaranteeKey = 'activation' | 'membership'

const GUARANTEES: Array<{
  key: GuaranteeKey
  title: string
  badge: string
  accent: string
  clockLine: string
  summary: string
  finePrint: string[]
}> = [
  {
    key: 'activation',
    title: '72-Hour Activation Guarantee',
    badge:
      'https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png',
    accent: '#39FF14',
    clockLine: 'Clock starts today',
    summary:
      'Complete all 14 guided Activation steps in 72 hours. Not satisfied? Full refund of your Activation fee. No questions asked.',
    finePrint: [
      'Completion = all 14 guided Activation steps done within 72 hours: Account Settings & Baseline Intake, Profile complete, 12-category Life Vision built (with VIVA), Vision Audio & Mix ready, Vision Board built (12 images), 1 journal entry logged, Vibe Tribe post + community engagement, Alignment Gym tour complete, MAP activated.',
    ],
  },
  {
    key: 'membership',
    title: 'Membership Guarantee',
    badge: 'https://media.vibrationfit.com/site-assets/brand/guarantees/membership-guarantee.png',
    accent: '#8B5CF6',
    clockLine: 'Clock starts today',
    summary:
      'You have a 16-week satisfaction guarantee from your checkout date, no matter which plan you\u2019re on.',
    finePrint: [
      'Not satisfied within your 16-week window?',
      'If your membership hasn\u2019t billed yet (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.',
      'If it has billed inside your 16-week window, we refund that charge and cancel all future renewals.',
    ],
  },
]

function GuaranteeCards() {
  const [openKey, setOpenKey] = useState<GuaranteeKey | null>(null)
  const open = GUARANTEES.find((g) => g.key === openKey)

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-2.5">
        {GUARANTEES.map((guarantee) => (
          <button
            key={guarantee.key}
            type="button"
            onClick={() => setOpenKey(guarantee.key)}
            className="group flex flex-col items-center rounded-xl border border-white/10 bg-black/40 px-2.5 py-3 text-center transition-all duration-300 hover:border-white/30 hover:bg-black/60"
          >
            <img
              src={guarantee.badge}
              alt={guarantee.title}
              className="h-16 w-16 object-contain"
            />
            <span className="mt-2 text-[11px] font-semibold leading-snug text-white">
              {guarantee.title}
            </span>
            <span className="mt-1 text-[10px] text-neutral-500 underline underline-offset-2 transition-colors group-hover:text-neutral-300">
              Full details
            </span>
          </button>
        ))}
      </div>

      <Modal
        isOpen={open !== undefined}
        onClose={() => setOpenKey(null)}
        title={open?.title}
        size="md"
      >
        {open ? (
          <div className="flex flex-col items-center text-center">
            <img src={open.badge} alt={open.title} className="h-32 w-32 object-contain" />
            <p
              className="mt-4 flex items-center gap-2 text-sm font-semibold"
              style={{ color: open.accent }}
            >
              <Clock className="h-4 w-4" />
              {open.clockLine}
            </p>
            <p className="mt-4 text-white">{open.summary}</p>
            <div className="mt-4 space-y-2 text-sm text-neutral-300">
              {open.finePrint.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export function OfferBuyBox() {
  const [planType, setPlanType] = useState<'solo' | 'household'>('solo')
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promo = params.get('promo')
    const ref = params.get('ref') || params.get('source') || params.get('affiliate')

    if (promo) setPromoCode(promo)
    if (ref) {
      setReferralSource(ref)
      if (!promo) setPromoCode(LAUNCH_SOLO_PROMO_CODE)
    }

    const campaign = params.get('campaign') || params.get('utm_campaign')
    if (campaign) setCampaignName(campaign)

    const type = params.get('plan') || params.get('type') || params.get('planType')
    if (type === 'solo' || type === 'household') setPlanType(type)
    setReady(true)
  }, [])

  const hasPromo = ready && Boolean(promoCode)
  const intensiveTotal = planType === 'solo' ? 499 : 699
  const membershipPrice = planType === 'solo' ? 99 : 149
  const todayAmount = hasPromo ? 1 : intensiveTotal

  const featureGroups: Array<{
    heading: string
    color: string
    items: Array<{ icon: LucideIcon; title: string; detail: string }>
  }> = [
    {
      heading: 'Your Identity',
      color: '#39FF14',
      items: [
        {
          icon: User,
          title: 'Profile',
          detail: 'who you are, feeding every tool you use',
        },
        {
          icon: ScrollText,
          title: 'Life I Choose\u2122 vision',
          detail: '12 life categories, every version preserved',
        },
        {
          icon: LayoutGrid,
          title: 'Vision Board',
          detail: 'upload your images or generate them with VIVA',
        },
        {
          icon: BookOpen,
          title: 'Focus Stories, Incantations + SparkQuery\u2122',
          detail: 'your vision made speakable',
        },
      ],
    },
    {
      heading: 'Your Creation Studio',
      color: '#BF00FF',
      items: [
        {
          icon: Headphones,
          title: 'Vision Audio',
          detail: '9 voices + delivery vibes, category by category',
        },
        {
          icon: Mic,
          title: 'Record it in your own voice',
          detail: 'full recording suite with waveform editing',
        },
        {
          icon: SlidersHorizontal,
          title: 'Sleep, Meditation + Power mixes',
          detail: 'ambient beds, solfeggio + binaural layers',
        },
        {
          icon: Music,
          title: 'Songwriter',
          detail: 'original songs from your vision \u2014 lyrics, music, art',
        },
      ],
    },
    {
      heading: 'Your Daily Practice',
      color: '#00FFFF',
      items: [
        {
          icon: Map,
          title: 'MAP \u2014 My Alignment Plan',
          detail: 'auto-verified from your actual practice',
        },
        {
          icon: NotebookPen,
          title: 'Journal + Daily Paper',
          detail: 'write it, speak it, or film it \u2014 transcribed',
        },
        {
          icon: Coins,
          title: 'Abundance & Manifestation Tracker',
          detail: 'log every win, watch the evidence stack',
        },
        {
          icon: TrendingUp,
          title: 'Streaks, badges + tracking',
          detail: 'your alignment, measured',
        },
      ],
    },
    {
      heading: 'In Your Corner',
      color: '#FFFF00',
      items: [
        {
          icon: Sparkles,
          title: 'VIVA',
          detail: 'your coach \u2014 remembers you, writes + creates with you',
        },
        {
          icon: Video,
          title: 'Alignment Gym',
          detail: 'weekly live group coaching + replays',
        },
        {
          icon: UsersRound,
          title: 'Vibe Tribe',
          detail: 'wins, wobbles + collaboration with the community',
        },
        {
          icon: Headset,
          title: 'Support',
          detail: 'from the team behind Vibration Fit',
        },
      ],
    },
  ]

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const visitorId = document.cookie.match(/(?:^|; )vf_visitor_id=([^;]*)/)?.[1]
      const sessionId = document.cookie.match(/(?:^|; )vf_session_id=([^;]*)/)?.[1]
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              product_key: 'intensive',
              plan: 'full',
              continuity: '28day',
              plan_type: planType,
            },
          ],
          promoCode: resolveIntensiveLaunchPromoCode(promoCode, planType),
          referralSource: referralSource || undefined,
          campaignName: campaignName || undefined,
          visitorId,
          sessionId,
        }),
      })
      const data = await res.json()
      if (data.cartId) {
        trackConversion('initiate_checkout', { content_name: 'intensive', currency: 'USD', event_id: data.cartId })
        window.location.href = `/checkout/${data.cartId}`
        return
      }
      toast.error('Failed to create checkout session')
    } catch {
      toast.error('Network error. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <div className="hp-offer-card flex flex-col items-center rounded-2xl px-5 py-6 text-center lg:px-6 lg:py-7">
      <p className="text-xl font-extrabold leading-tight text-[#39FF14] md:text-[1.65rem]">
        72-Hour Vision Activation
      </p>
      <p className="mt-1 text-xs text-neutral-400">+ your first 28 days of Vision Pro</p>

      {hasPromo ? (
        <div className="mt-5">
          <p className="text-lg font-extrabold text-neutral-500 line-through">${intensiveTotal}</p>
          <p className="text-6xl font-extrabold leading-none text-[#39FF14]">$1</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            today
          </p>
          <p className="mt-1.5 text-xs text-neutral-400">{promoCode?.toUpperCase()} applied</p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-6xl font-extrabold leading-none text-[#39FF14]">${todayAmount}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            one-time
          </p>
        </div>
      )}

      <p className="mt-3 text-sm leading-snug text-neutral-300 md:text-base">
        Then <span className="font-semibold text-white">${membershipPrice} every 28 days</span>{' '}
        unless canceled. Cancel any time.
      </p>

      <div className="mt-5 w-full border-t border-white/10 pt-5">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          <Shield className="h-3.5 w-3.5 text-[#FFFF00]" />
          Backed by two guarantees
        </p>
        <GuaranteeCards />
      </div>

      <div className="mt-5 w-full border-t border-white/10 pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          What&rsquo;s Inside
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {featureGroups.map((group) => (
            <div
              key={group.heading}
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-left"
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: group.color }}
              >
                {group.heading}
              </p>
              <div className="space-y-2">
                {group.items.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-start gap-2">
                    <span
                      className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${group.color}1A`, color: group.color }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold leading-tight text-white">
                        {title}
                      </span>
                      <span className="block text-[11px] leading-tight text-neutral-400">
                        {detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {planType === 'household' ? (
          <p className="mt-2.5 flex items-center justify-center gap-1.5 rounded-full border border-[#00FFFF]/30 bg-[#00FFFF]/5 px-3 py-1.5 text-[11px] font-semibold text-[#00FFFF]">
            <Users className="h-3.5 w-3.5" />
            Two logins under one roof
          </p>
        ) : null}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handlePurchase}
        disabled={isLoading}
        className="mt-5 h-auto min-h-14 w-full !whitespace-normal px-5 py-4 text-center md:px-6"
      >
        {isLoading ? 'Processing...' : CTA_LABEL}
        {!isLoading ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
      </Button>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
        <ShoppingCart className="h-3.5 w-3.5 text-[#39FF14]" />
        Next step: secure checkout
      </p>
    </div>
  )
}
