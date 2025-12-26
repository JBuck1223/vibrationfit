'use client'

import React, { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { cn } from '../shared-utils'

interface OfferStackItem {
  id: string
  title: string
  description?: string | React.ReactNode
  icon?: React.ElementType | null
  included?: boolean
  locked?: boolean
  isMessage?: boolean
}

interface OfferStackProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  items: OfferStackItem[]
  defaultExpanded?: string[]
  allowMultiple?: boolean
  className?: string
}

export const OfferStack = React.forwardRef<HTMLDivElement, OfferStackProps>(
  ({ 
    title, 
    subtitle, 
    items, 
    defaultExpanded = [],
    allowMultiple = true,
    className,
    ...props 
  }, ref) => {
    const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpanded)

    const toggleItem = (itemId: string) => {
      setExpandedItems(prev => {
        const newItems = allowMultiple
          ? (prev.includes(itemId) 
              ? prev.filter(id => id !== itemId)
              : [...prev, itemId])
          : (prev.includes(itemId) ? [] : [itemId])
        return newItems
      })
    }

    return (
      <div 
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-neutral-400 text-base md:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Individual Accordion Items */}
        <div className="space-y-1 md:space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItems.includes(item.id)
            const IconComponent = item.icon

            // Render message items differently
            if (item.isMessage) {
              return (
                <div key={item.id} className="py-4 px-2 md:px-6">
                  <p className="text-sm md:text-base text-neutral-400 text-center">
                    {item.title}
                  </p>
                </div>
              )
            }

            return (
              <div
                key={item.id}
                className={cn(
                  'bg-[#1F1F1F] border-2 border-[#333] rounded-xl overflow-hidden transition-all duration-300',
                  'hover:border-[#39FF14]/50 hover:shadow-xl',
                  isExpanded && 'border-[#39FF14]'
                )}
              >
                {/* Item Header - Clickable */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleItem(item.id)
                  }}
                  className="w-full px-2 md:px-6 py-2 md:py-4 flex flex-col text-left transition-colors duration-200 hover:bg-[#39FF14]/5 cursor-pointer"
                  type="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 md:gap-4">
                      {/* Icon */}
                      {IconComponent && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#39FF14]/20">
                          <IconComponent className="w-4 h-4 text-[#39FF14]" />
                        </div>
                      )}
                      
                      {/* Title */}
                      <div className="flex-1">
                        <h4 className="text-base md:text-lg text-white">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Lock Icon and Chevron */}
                    <div className="flex items-center gap-2">
                      {item.locked && (
                        <Lock className="w-4 h-4 text-neutral-500" />
                      )}
                      <ChevronDown className={cn(
                        'w-5 h-5 transition-transform duration-200 text-neutral-400',
                        isExpanded && 'rotate-180'
                      )} />
                    </div>
                  </div>
                </button>

                {/* Item Content - Expandable */}
                {isExpanded && item.description && (
                  <div className="px-2 md:px-6 pb-2 md:pb-4 border-t border-[#333]">
                    <div className="pt-4 space-y-2 text-neutral-300 text-sm leading-relaxed">
                      {typeof item.description === 'string' ? (
                        item.description.split('\n').map((line, index) => {
                          const cleanLine = line.replace(/^•\s*/, '')
                          // Check if line starts with a label to bold
                          const labelMatch = cleanLine.match(/^(What it is:|Outcome:|Done when:)(.*)/)
                          
                          return (
                            <div key={index} className="flex items-start gap-2 mb-2 last:mb-0">
                              <span className="text-[#39FF14] text-sm mt-0.5 flex-shrink-0">•</span>
                              <span>
                                {labelMatch ? (
                                  <>
                                    <strong className="font-semibold">{labelMatch[1]}</strong>
                                    {labelMatch[2]}
                                  </>
                                ) : (
                                  cleanLine
                                )}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        item.description
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

OfferStack.displayName = 'OfferStack'

