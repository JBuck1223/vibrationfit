'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { WidgetEmpty, WidgetFrame, WidgetStat, type WidgetChromeProps } from '../WidgetFrame'
import { relativeDay, useReferralSummary } from './queries'

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

  const latest = data?.paidReferrals[0]

  return (
    <WidgetFrame
      {...chrome}
      title="Referrals"
      icon={Share2}
      accent="#39FF14"
      href="/referral"
      hrefLabel="Open"
      loading={isLoading}
    >
      {!data ? (
        <WidgetEmpty
          title="Your referral link is almost ready"
          body="Open Referrals to grab your link and start sharing."
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
          <div className="grid grid-cols-3 gap-2">
            <WidgetStat label="Clicks" value={data.stats.totalClicks} />
            <WidgetStat label="Signups" value={data.stats.emailSignups} />
            <WidgetStat label="Paid" value={data.stats.paidConversions} />
          </div>
          <p className="mt-auto truncate text-xs text-neutral-500">
            {latest
              ? `Latest: ${latest.referred_email || 'a purchase'} ${relativeDay(latest.created_at)}`
              : 'Share your link. Everyone who joins through it shows up here.'}
          </p>
        </div>
      )}
    </WidgetFrame>
  )
}
