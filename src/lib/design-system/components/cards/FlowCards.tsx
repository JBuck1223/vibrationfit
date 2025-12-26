'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { Card } from './Card'
import { Stack } from '../layout/Stack'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

// ============================================================================
// FLOW CARDS COMPONENT - Vertically stacked cards with arrows
// ============================================================================

interface FlowCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    label: string
    description: string
    icon?: React.ElementType
    iconColor?: string
  }>
  arrowColor?: string
}

export const FlowCards = React.forwardRef<HTMLDivElement, FlowCardsProps>(
  ({ items, arrowColor = '#39FF14', className = '', ...props }, ref) => {
    const ArrowDownIcon = () => (
      <svg className="w-6 h-6" style={{ color: arrowColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    )

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-4 w-full', className)}
        {...props}
      >
        {items.map((item, index) => {
          const IconComponent = item.icon
          return (
            <React.Fragment key={index}>
              <Card variant="default" hover>
                <Stack gap="sm">
                  <div className="flex items-start gap-4">
                    {IconComponent && (
                      <div 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: `${item.iconColor || arrowColor}20`,
                          border: `2px solid ${item.iconColor || arrowColor}30`
                        }}
                      >
                        <IconComponent 
                          className="w-5 h-5 md:w-6 md:h-6" 
                          style={{ color: item.iconColor || arrowColor }}
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Heading level={4} className="text-white mb-2">
                        {item.label}
                      </Heading>
                      <Text size="sm" className="text-neutral-300">
                        {item.description}
                      </Text>
                    </div>
                  </div>
                </Stack>
              </Card>
              
              {/* Arrow between cards (except after last card) */}
              {index < items.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="animate-bounce">
                    <ArrowDownIcon />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
FlowCards.displayName = 'FlowCards'

