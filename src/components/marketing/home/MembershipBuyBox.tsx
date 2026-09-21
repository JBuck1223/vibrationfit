import { ArrowRight, Shield, ShoppingCart } from 'lucide-react'
import {
  MEMBERSHIP_CHECKOUT_HREF,
  MEMBERSHIP_CTA_LABEL,
  MEMBERSHIP_PRODUCT_NAME,
} from '@/lib/marketing/public-offer'
import { FeatureGroups, GuaranteeCards } from '@/components/marketing/home/OfferCard'

export function MembershipBuyBox({ id }: { id?: string } = {}) {
  return (
    <div
      id={id}
      className="hp-offer-card flex scroll-mt-24 flex-col items-center rounded-2xl px-5 py-6 text-center lg:px-6 lg:py-7"
    >
      <p className="text-xl font-extrabold leading-tight text-[#39FF14] md:text-[1.65rem]">
        {MEMBERSHIP_PRODUCT_NAME}
      </p>
      <p className="mt-1 text-xs text-neutral-400">the complete Vibration Fit system</p>

      <div className="mt-5">
        <p className="text-6xl font-extrabold leading-none text-[#39FF14]">$99</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
          every 28 days
        </p>
      </div>

      <p className="mt-3 text-sm leading-snug text-neutral-300 md:text-base">
        Charged today. Then{' '}
        <span className="font-semibold text-white">$99 every 28 days</span> unless
        canceled. Cancel anytime.
      </p>

      <div className="mt-5 w-full border-t border-white/10 pt-5">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          <Shield className="h-3.5 w-3.5 text-[#8B5CF6]" />
          Backed by our membership guarantee
        </p>
        <GuaranteeCards membershipOnly />
      </div>

      <div className="mt-5 w-full border-t border-white/10 pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          What&rsquo;s Inside
        </p>
        <FeatureGroups />
      </div>

      <a
        href={MEMBERSHIP_CHECKOUT_HREF}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-6 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:w-auto md:whitespace-nowrap md:px-7"
      >
        {MEMBERSHIP_CTA_LABEL}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </a>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
        <ShoppingCart className="h-3.5 w-3.5 text-[#39FF14]" />
        Next step: secure checkout
      </p>
    </div>
  )
}
