'use client'

import { Card, Badge } from '@/lib/design-system/components'
import { Users, Mail } from 'lucide-react'
import { ReferralPartnersTab, ReferralRow } from '@/components/referral/ReferralPartnerCards'

export default function ReferralPartnersReferralsPage() {
  return (
    <ReferralPartnersTab>
      {({ partners, invites }) => (
        <>
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#00FFFF]" />
              <h2 className="text-lg md:text-xl font-bold text-white flex-1">Your referrals</h2>
              <span className="text-sm text-neutral-400">{partners.activeReferrals} active</span>
            </div>
            {partners.referrals.length === 0 ? (
              <p className="text-sm text-neutral-400">No referrals yet. When someone signs up or joins through your link, they will appear here.</p>
            ) : (
              <div className="space-y-2">
                {partners.referrals.map(row => <ReferralRow key={row.id} row={row} />)}
              </div>
            )}
          </Card>

          {invites.length > 0 ? (
            <Card className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-[#BF00FF]" />
                <h2 className="text-lg md:text-xl font-bold text-white">Warm intro emails</h2>
              </div>
              <p className="text-xs text-neutral-500 mb-4">People you emailed through the warm intro form.</p>
              <div className="space-y-2">
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between gap-2 bg-[#1a1a1a] rounded-lg px-4 py-3 border border-[#333]">
                    <div className="min-w-0">
                      <span className="text-sm text-white">{invite.referred_name || invite.referred_email}</span>
                      <span className="text-xs text-neutral-500 ml-2 break-all">{invite.referred_email}</span>
                    </div>
                    <Badge
                      variant={
                        invite.status === 'converted' ? 'success' :
                        invite.status === 'clicked' ? 'secondary' :
                        'neutral'
                      }
                    >
                      {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </ReferralPartnersTab>
  )
}
