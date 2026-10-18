'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Container, ProgressBar, Spinner, Stack } from '@/lib/design-system/components'
import { Gift, Wallet, Receipt, Info } from 'lucide-react'
import { formatCents, useReferralDashboard, type ReferralDashboardData } from '@/hooks/useReferralDashboard'
import type { PartnerDashboard, PartnerReferral, PartnerReferralStatus } from '@/lib/partners/dashboard'

export function formatReferralDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return ''
  }
}

export function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-center">
      <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  )
}

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th'
  return `${n}${suffix}`
}

export const STATUS_LABELS: Record<PartnerReferralStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  clicked: { label: 'Clicked', variant: 'neutral' },
  signed_up: { label: 'Signed up', variant: 'info' },
  payment_pending: { label: 'Checking out', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  failed_payment: { label: 'Payment failed', variant: 'warning' },
  paused: { label: 'Paused', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  chargeback: { label: 'Disputed', variant: 'danger' },
  fraud: { label: 'Removed', variant: 'danger' },
}

export function EarningNotice({ partners }: { partners: PartnerDashboard }) {
  let body: string | null = null
  if (partners.isInternal) {
    body = 'This is a founder account. Everyone who joins through your link is tracked below, but founder links don\'t earn bill credit or commission, since Vibration Fit would be paying itself. The credit and commission numbers on this page stay at $0 for you.'
  } else if (partners.isSuspended) {
    body = 'Your partner account is paused, so referrals are not earning right now. Reach out to support with any questions.'
  } else if (!partners.isMember) {
    body = 'Earning requires an active paid membership. Your link still works and every referral is attributed to you, but credit and commission only build while your own membership is active.'
  }
  if (!body) return null
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-[#FFFF00] shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-300">{body}</p>
      </div>
    </Card>
  )
}

export function CreditCard({ partners }: { partners: PartnerDashboard }) {
  const filled = Math.min(partners.activeReferrals, partners.creditSlots)
  const remaining = partners.creditSlots - filled
  const nextBill = Math.max(partners.billCents - partners.creditCents, 0)
  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-[#39FF14]" />
        <h2 className="text-lg md:text-xl font-bold text-white flex-1">Bill credit</h2>
        {!partners.creditsLive ? <Badge variant="warning">Preview</Badge> : null}
      </div>

      {partners.creditCents > 0 ? (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums">{formatCents(partners.creditCents)}</span>
            <span className="text-sm text-neutral-400">off your next bill</span>
          </div>
          <p className="text-sm text-neutral-400 mb-5">
            Next bill {formatCents(nextBill)} instead of {formatCents(partners.billCents)}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums">
              {formatCents(partners.creditPerReferralCents)}
            </span>
            <span className="text-sm text-neutral-400">off your bill for each active referral</span>
          </div>
          <p className="text-sm text-neutral-400 mb-5">
            Refer {partners.creditSlots} and your {formatCents(partners.billCents)} bill drops to $0.
          </p>
        </>
      )}

      <ProgressBar value={filled} max={partners.creditSlots} variant="primary" size="md" />
      <p className="text-xs text-neutral-500 mt-2">
        {filled} of {partners.creditSlots} active referrals.{' '}
        {remaining > 0
          ? `${remaining} more for a free cycle.`
          : 'Your cycle is free while they stay active.'}
      </p>

      <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
        {formatCents(partners.creditPerReferralCents)} comes off for each active referral, recalculated at every bill. If a referral goes inactive, that credit comes off until they are active again.
        {!partners.creditsLive
          ? ' Credits are being tracked now and will start coming off your bill soon. Until then you are billed the full amount.'
          : ''}
      </p>
    </Card>
  )
}

const BUCKET_COPY: { key: keyof PartnerDashboard['balance']; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'held', label: 'In review' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
]

export function CommissionCard({ partners }: { partners: PartnerDashboard }) {
  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-[#00FFFF]" />
        <h2 className="text-lg md:text-xl font-bold text-white">Commission</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BUCKET_COPY.map(b => (
          <div key={b.key} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3">
            <div className="text-xs text-neutral-400">{b.label}</div>
            <div className="text-xl font-bold text-white tabular-nums">{formatCents(partners.balance[b.key])}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
        Your first {partners.creditSlots} active referrals earn bill credit. Every active referral after that earns {Math.round(partners.referralRate * 100)}% of what they pay, every cycle.
        Commission stays pending for {partners.refundHoldDays} days after each payment, then it is approved.
        Some commissions go to review before approval. Approved commission is paid monthly once it reaches {formatCents(partners.minimumPayoutCents)}.
      </p>
    </Card>
  )
}

export function ReferralRow({ row }: { row: PartnerReferral }) {
  const status = STATUS_LABELS[row.status] ?? { label: row.status, variant: 'neutral' as const }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#1a1a1a] rounded-lg px-4 py-3 border border-[#333]">
      <div className="min-w-0">
        <span className="text-sm text-white font-medium break-all">{row.referredEmail}</span>
        <span className="text-xs text-neutral-500 block sm:inline sm:ml-2">
          {row.activatedAt ? `Joined ${formatReferralDate(row.activatedAt)}` : formatReferralDate(row.createdAt)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {row.slot === 'credit' ? <span className="text-xs text-neutral-400">Bill credit</span> : null}
        {row.slot === 'cash' || row.earnedCents !== 0 ? (
          <span className="text-xs text-neutral-400 tabular-nums">{formatCents(row.earnedCents)} earned</span>
        ) : null}
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </div>
  )
}

export function PayoutHistoryCard({ partners }: { partners: PartnerDashboard }) {
  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-[#BF00FF]" />
        <h2 className="text-lg md:text-xl font-bold text-white">Payout history</h2>
      </div>
      {partners.payouts.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No payouts yet. Approved commission is paid out monthly once it reaches {formatCents(partners.minimumPayoutCents)}.
        </p>
      ) : (
        <div className="space-y-2">
          {partners.payouts.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2 bg-[#1a1a1a] rounded-lg px-4 py-3 border border-[#333]">
              <div>
                <span className="text-sm text-white font-medium tabular-nums">{formatCents(p.amountCents)}</span>
                <span className="text-xs text-neutral-500 ml-2">{formatReferralDate(p.paidAt || p.createdAt)}</span>
              </div>
              <Badge variant={p.status === 'paid' ? 'success' : p.status === 'failed' || p.status === 'returned' ? 'danger' : 'neutral'}>
                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function HowItWorksCard({ partners }: { partners: PartnerDashboard }) {
  const rate = Math.round(partners.referralRate * 100)
  const steps = [
    {
      title: `Your first ${partners.creditSlots} active referrals lower your bill`,
      body: `Each one takes ${formatCents(partners.creditPerReferralCents)} off your membership. With ${partners.creditSlots} active, your cycle is free.`,
    },
    {
      title: `Every referral after that earns ${rate}% commission`,
      body: `You earn ${rate}% of what each of them pays, every cycle, for as long as they stay a member.`,
    },
    {
      title: 'Credit follows who is active',
      body: 'If one of your first referrals leaves, your next active referral takes their place, so your credit and commission stay whole.',
    },
    {
      title: `Commission is approved after ${partners.refundHoldDays} days`,
      body: `That covers the refund window. Approved commission is paid monthly once it reaches ${formatCents(partners.minimumPayoutCents)}.`,
    },
    {
      title: 'You earn while your own membership is active',
      body: 'Your link always works and every referral stays yours, but credit and commission build only while you hold an active paid membership.',
    },
  ]
  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4">How it works</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#333] text-xs font-semibold text-[#39FF14]">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="text-sm text-neutral-400">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/**
 * Loads the member's referral dashboard for a tab page. Shows a spinner while
 * loading, and points to the Share tab when there is no link yet.
 */
export function ReferralPartnersTab({
  children,
}: {
  children: (data: ReferralDashboardData & { partners: PartnerDashboard }) => ReactNode
}) {
  const { data, isLoading } = useReferralDashboard()

  if (isLoading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!data?.partners) {
    return (
      <Container size="xl">
        <Card className="p-4 md:p-6 lg:p-8 max-w-lg mx-auto w-full text-center">
          <p className="text-sm text-neutral-400 mb-4">Get your referral link first, then your referrals and earnings show up here.</p>
          <Link href="/referral">
            <Button variant="primary" size="sm">Get My Referral Link</Button>
          </Link>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">{children({ ...data, partners: data.partners })}</Stack>
    </Container>
  )
}
