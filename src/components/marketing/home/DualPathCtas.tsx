import { ArrowRight } from 'lucide-react'
import {
  FREE_ACTIVATION_CTA_LABEL,
  FREE_ACTIVATION_HREF,
  MEMBERSHIP_CHECKOUT_HREF,
  MEMBERSHIP_CTA_LABEL,
} from '@/lib/marketing/public-offer'

const primaryClass =
  'inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-4 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:w-auto md:whitespace-nowrap md:px-7'

const secondaryClass =
  'inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-white/20 bg-transparent px-4 py-2.5 text-center text-sm font-medium text-neutral-300 antialiased transition-all duration-300 hover:border-white/40 hover:text-white active:opacity-80 md:w-auto md:whitespace-nowrap md:px-6'

export function DualPathCtas({
  className = '',
  align = 'center',
  paidOnly = false,
}: {
  className?: string
  align?: 'center' | 'start'
  paidOnly?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-stretch gap-3 ${
        align === 'start' ? 'md:items-start' : 'md:items-center'
      } ${className}`}
    >
      <a href={MEMBERSHIP_CHECKOUT_HREF} className={primaryClass}>
        {MEMBERSHIP_CTA_LABEL}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </a>
      {paidOnly ? null : (
        <a href={FREE_ACTIVATION_HREF} className={secondaryClass}>
          {FREE_ACTIVATION_CTA_LABEL}
        </a>
      )}
    </div>
  )
}

export function MembershipCta({
  className = '',
  align = 'center',
}: {
  className?: string
  align?: 'center' | 'start'
}) {
  return <DualPathCtas className={className} align={align} paidOnly />
}
