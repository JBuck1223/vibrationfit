'use client'

import Link from 'next/link'
import { ArrowRight, BookOpenText, Headphones, Target, Wand2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { useActiveVisionSummary } from './queries'

const REVISION_HOLD_DAYS = 30

export function LifeVisionWidget(chrome: WidgetChromeProps) {
  const { data: vision, isLoading } = useActiveVisionSummary()

  const committed = vision
    ? new Date(vision.committedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  const anchor = vision?.lastRefinedAt ?? vision?.committedAt ?? null
  const daysSince = anchor ? Math.floor((Date.now() - new Date(anchor).getTime()) / 86400000) : null
  const holdRemaining = daysSince !== null ? Math.max(0, REVISION_HOLD_DAYS - daysSince) : null

  return (
    <WidgetFrame
      {...chrome}
      title="Life Vision"
      icon={Target}
      accent="#39FF14"
      href="/life-vision"
      hrefLabel="Open"
      loading={isLoading}
    >
      {!vision ? (
        <WidgetEmpty
          title="Write the life you choose"
          body="Two parts per area, in your own words. VIVA writes the whole Life Vision from them."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/life-vision/start">
                Write my Life Vision
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p className="line-clamp-1 text-base font-semibold text-white">{vision.title}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Version {vision.versionCount} · committed {committed}
            </p>
          </div>

          <p className="text-xs leading-relaxed text-neutral-400">
            {holdRemaining && holdRemaining > 0
              ? `Live with it. Revision window opens in ${holdRemaining} ${holdRemaining === 1 ? 'day' : 'days'}.`
              : daysSince !== null
                ? `${daysSince} days since your last refinement. If something has shifted, refine it.`
                : 'Read it, listen to it, refine it when it stops feeling true.'}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/life-vision/${vision.id}`}>
                <BookOpenText className="mr-1.5 h-4 w-4" />
                Read
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/audio">
                <Headphones className="mr-1.5 h-4 w-4" />
                Listen
              </Link>
            </Button>
            <Button variant={holdRemaining && holdRemaining > 0 ? 'ghost' : 'primary'} size="sm" asChild>
              <Link href="/life-vision/update">
                <Wand2 className="mr-1.5 h-4 w-4" />
                Refine
              </Link>
            </Button>
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
