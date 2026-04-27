'use client'

import React from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '../shared-utils'

interface CategoryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: ReadonlyArray<{
    readonly key: string
    readonly label: string
    readonly icon: React.ElementType
  }>
  selectedCategories?: string[]
  completedCategories?: string[]
  refinedCategories?: string[]
  activeCategory?: string
  onCategoryClick?: (categoryKey: string) => void
  mode?: 'selection' | 'completion' | 'draft' | 'record'
  showSelectAll?: boolean
  onSelectAll?: () => void
  selectAllLabel?: string
  completionBadgeColor?: string
  refinementBadgeColor?: string
  /** When truthy, shows a mobile-only centered Scroll to see all hint below the pills (value not shown). */
  pillLabel?: string
  getPillClassName?: (categoryKey: string) => string | undefined
  fillWidth?: boolean
  /** When true (without fillWidth), pills keep natural width and wrap to multiple centered rows on md+ */
  wrapOnDesktop?: boolean
}

const pillBase = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer'
const pillSelected = 'bg-primary-500/20 border-primary-500/50 text-primary-400'
const pillUnselected = 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
const allPillUnselected = 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500'

export const CategoryGrid = React.forwardRef<HTMLDivElement, CategoryGridProps>(
  ({
    categories,
    selectedCategories = [],
    completedCategories = [],
    refinedCategories = [],
    activeCategory,
    onCategoryClick,
    mode = 'selection',
    showSelectAll = false,
    onSelectAll,
    selectAllLabel,
    completionBadgeColor = '#39FF14',
    refinementBadgeColor = '#FFFF00',
    pillLabel,
    getPillClassName,
    fillWidth = false,
    wrapOnDesktop = false,
    className,
    ...props
  }, ref) => {
    const allSelected = selectedCategories.length === categories.length
    const hasBadges = mode !== 'selection'

    const pills = (
      <>
        {showSelectAll && onSelectAll && (
          <button
            type="button"
            onClick={onSelectAll}
            className={cn(pillBase, 'shrink-0', hasBadges && 'mt-2 mr-0.5', allSelected ? pillSelected : allPillUnselected)}
          >
            {selectAllLabel || 'All'}
          </button>
        )}

        {categories.map((category) => {
          const CatIcon = category.icon
          const isActive = activeCategory === category.key
          const isSelected = isActive || selectedCategories.includes(category.key)
          const isCompleted = completedCategories.includes(category.key)
          const isRefined = refinedCategories.includes(category.key)

          const needsReRecord = mode === 'record' && isRefined && !isCompleted
          const showBadge =
            (mode === 'completion' && isCompleted) ||
            (mode === 'draft' && isRefined) ||
            (mode === 'record' && (isCompleted || needsReRecord))

          const badgeColor = needsReRecord
            ? refinementBadgeColor
            : mode === 'draft'
              ? refinementBadgeColor
              : completionBadgeColor

          const extraClass = getPillClassName?.(category.key)

          return (
            <div key={category.key} className={cn(
              'relative',
              fillWidth ? 'shrink-0 md:flex-1 md:min-w-0' : 'shrink-0',
              hasBadges && 'pt-2 pr-2',
            )}>
              {showBadge && (
                <div
                  className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#333] border-2 flex items-center justify-center z-10"
                  style={{ borderColor: badgeColor }}
                >
                  {needsReRecord ? (
                    <RefreshCw className="w-2.5 h-2.5" style={{ color: badgeColor }} strokeWidth={3} />
                  ) : (
                    <Check className="w-2.5 h-2.5" style={{ color: badgeColor }} strokeWidth={3} />
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => onCategoryClick?.(category.key)}
                className={cn(
                  pillBase,
                  fillWidth ? 'shrink-0 md:w-full md:justify-center' : 'shrink-0',
                  isSelected ? pillSelected : pillUnselected,
                  extraClass,
                )}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            </div>
          )
        })}
      </>
    )

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {fillWidth ? (
          /* Outer: full card width scrollport; inner: px-4 start/end inset so first pill aligns with card body, scroll reveals edge */
          <div className="scrollbar-hide max-md:-mx-4 max-md:overflow-x-auto md:mx-0 md:overflow-visible">
            <div className="flex min-w-max items-center gap-2 pb-1 max-md:px-4 md:min-w-0 md:w-full md:flex-wrap md:justify-center md:px-0">
              {pills}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 pb-1 scrollbar-hide overflow-x-auto px-4 md:px-0',
              wrapOnDesktop
                ? 'md:overflow-x-visible md:flex-wrap md:justify-center'
                : 'md:justify-center',
            )}
          >
            {pills}
          </div>
        )}

        {pillLabel ? (
          <p className="mt-2 text-center text-[10px] text-neutral-600 md:hidden">
            Scroll to see all <span aria-hidden="true">&rarr;</span>
          </p>
        ) : null}
      </div>
    )
  }
)
CategoryGrid.displayName = 'CategoryGrid'
