'use client'

import { ReferralPartnersTab, PayoutHistoryCard } from '@/components/referral/ReferralPartnerCards'

export default function ReferralPartnersPayoutsPage() {
  return (
    <ReferralPartnersTab>
      {({ partners }) => <PayoutHistoryCard partners={partners} />}
    </ReferralPartnersTab>
  )
}
