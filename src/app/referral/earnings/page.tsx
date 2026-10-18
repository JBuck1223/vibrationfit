'use client'

import {
  ReferralPartnersTab,
  EarningNotice,
  CreditCard,
  CommissionCard,
  HowItWorksCard,
} from '@/components/referral/ReferralPartnerCards'

export default function ReferralPartnersEarningsPage() {
  return (
    <ReferralPartnersTab>
      {({ partners }) => (
        <>
          <EarningNotice partners={partners} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreditCard partners={partners} />
            <CommissionCard partners={partners} />
          </div>
          <HowItWorksCard partners={partners} />
        </>
      )}
    </ReferralPartnersTab>
  )
}
