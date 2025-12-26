'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { Card } from '../cards/Card'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'
import { Stack } from '../layout/Stack'

// ============================================================================
// PROOF WALL COMPONENT - Before/After Carousel
// ============================================================================

interface ProofWallItem {
  id: string
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  story: string
  storyTitle?: string
}

interface ProofWallProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ProofWallItem[]
  heading?: string | null
  className?: string
  showHeadingOutside?: boolean
  showStoryHighlight?: boolean
}

export const ProofWall = React.forwardRef<HTMLDivElement, ProofWallProps>(
  ({
    items,
    heading,
    className = '',
    showHeadingOutside = true,
    showStoryHighlight = true,
    ...props
  }, ref) => {
    const primaryItem: ProofWallItem = items[0] ?? {
      id: 'default-proof',
      beforeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg',
      afterImage: 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg',
      story: '',
    }

    const displayTitle = heading === undefined ? 'Lock It In and Let It Flow' : heading

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {showHeadingOutside && displayTitle && (
          <Stack gap="sm" className="items-center text-center mb-6">
            <Heading level={2} className="text-white">
              {displayTitle}
            </Heading>
          </Stack>
        )}

        <Card
          variant="default"
          className="p-4 md:p-6 space-y-6 bg-black border border-[#404040]"
        >
          {displayTitle && (
            <Heading level={2} className="text-white text-center">
              {displayTitle}
            </Heading>
          )}

          <Stack gap="lg">
            <Text size="base" className="text-neutral-400 text-center leading-relaxed">
              From no money &amp; 6-figures in the hole to 6-figures in the bank. Once we locked in the system, abundance flowed.
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 rounded-2xl border border-[#FF0040]/60 bg-[#FF0040]/10 p-4">
                <Heading level={4} className="text-[#FF0040] uppercase tracking-[0.2em] text-center font-extrabold">
                  Before
                </Heading>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                  <img
                    src={primaryItem.beforeImage || 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg'}
                    alt={primaryItem.beforeAlt || 'Before transformation'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-[#39FF14]/60 bg-[#39FF14]/10 p-4">
                <Heading level={4} className="text-[#39FF14] uppercase tracking-[0.2em] text-center font-extrabold">
                  After
                </Heading>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                  <img
                    src={primaryItem.afterImage || 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg'}
                    alt={primaryItem.afterAlt || 'After transformation'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </Stack>
        </Card>
      </div>
    )
  }
)
ProofWall.displayName = 'ProofWall'

