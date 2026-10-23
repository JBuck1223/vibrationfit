import { Metadata } from 'next'
import React from 'react'
import { ReferralPartnersAreaBar } from '@/components/referral/ReferralPartnersAreaBar'
import { ReferralHeader } from '@/components/app-shell/referral/ReferralHeader'

export const metadata: Metadata = {
  title: 'Referral Partners',
}

export default function ReferralPartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ReferralPartnersAreaBar />
      <main
        className="flex-1 px-4 pb-3 pt-6 md:px-0 md:pb-3 md:pt-8 lg:pt-6 [[data-app-shell]_&]:pt-0"
        data-studio-glass
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        <ReferralHeader />
        {children}
      </main>
    </>
  )
}
