'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Copy, Gift, Share2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { formatCents } from '@/hooks/useReferralDashboard'
import { useReferralSummary } from './queries'

const SHARE_TEXT = 'I have been using Vibration Fit to create and live my life vision. Thought you would love it.'

export function ReferralsWidget(chrome: WidgetChromeProps) {
  const { data, isLoading } = useReferralSummary()
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copyLink = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (!data) return
    try {
      await navigator.share({ title: 'Vibration Fit', text: SHARE_TEXT, url: data.referralLink })
    } catch {
      // Dismissed share sheet
    }
  }

  const partners = data?.partners
  const slots = partners?.creditSlots || 3
  const perReferral = formatCents(partners?.creditPerReferralCents ?? 3300)
  const active = partners ? partners.activeReferrals : data?.stats.paidConversions ?? 0
  const slotsFilled = Math.min(active, slots)
  const remaining = slots - slotsFilled
  const isFree = remaining === 0
  const commissionCents = partners
    ? partners.balance.pending + partners.balance.held + partners.balance.approved
    : 0

  const headline = isFree
      ? 'Your membership is free'
      : slotsFilled === 0
        ? `Refer ${slots}, get yours free`
        : `Refer ${remaining} more, get yours free`

  const rewards = isFree
    ? `Every new referral now pays you through Partners${commissionCents > 0 ? `. ${formatCents(commissionCents)} earned so far.` : '.'}`
    : `Each referral takes ${perReferral} off your bill until it's free. After that, referrals pay you through Partners.`

  const detail = partners?.isInternal
    ? `${rewards} (Founder link: yours are tracked, not paid.)`
    : partners && !partners.isMember
      ? `${rewards} Rewards start once you have an active paid membership.`
      : rewards

  return (
    <WidgetFrame {...chrome} title="Partners" icon={Share2} accent="#39FF14" loading={isLoading}>
      {!data ? (
        <WidgetEmpty
          title="Your referral link is almost ready"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/referral">Open Partners</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-full border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-xs text-neutral-300">
              {data.referralLink.replace(/^https?:\/\//, '')}
            </div>
            <Button variant="primary" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            {canShare ? (
              <Button variant="outline" size="sm" onClick={shareLink} className="shrink-0" aria-label="Share link">
                <Share2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
              <Gift className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
              <span className="shrink-0 text-sm font-semibold text-white">{headline}</span>
              <div className="flex min-w-[3rem] flex-1 gap-1" aria-hidden>
                {Array.from({ length: slots }, (_, i) => (
                  <span
                    key={i}
                    className={cn('h-1.5 flex-1 rounded-full', i < slotsFilled ? 'bg-primary-500' : 'bg-white/[0.08]')}
                  />
                ))}
              </div>
              <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                {slotsFilled}/{slots}
              </span>
            </div>

          <div className="mt-auto flex items-end justify-between gap-3">
            <p className="min-w-0 text-xs leading-relaxed text-neutral-400">
              {detail}
            </p>
            <Link
              href="/referral"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-400"
            >
              Open Partners
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
