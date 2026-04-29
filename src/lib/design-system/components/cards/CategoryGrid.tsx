'use client'

import React from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

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
  /**
   * Where to render the select-all control when `showSelectAll` is true.
   * `above` = compact button row above the pills (recommended with `lifeVisionCategoryStrip`).
   * Default: `above` when both `lifeVisionCategoryStrip` and `showSelectAll` are set; otherwise `inline` (All as first pill).
   */
  selectAllPlacement?: 'inline' | 'above'
  completionBadgeColor?: string
  refinementBadgeColor?: string
  /** When truthy, shows a mobile-only centered Scroll to see all hint below the pills (value not shown). */
  pillLabel?: string
  getPillClassName?: (categoryKey: string) => string | undefined
  fillWidth?: boolean
  /** With fillWidth: on md+ use a 7-column grid so 14 pills become two rows (e.g. Life Vision record). */
  twoLineDesktop?: boolean
  /** When true (without fillWidth), pills keep natural width and wrap to multiple centered rows on md+ */
  wrapOnDesktop?: boolean
  /** Optional centered uppercase label rendered above the pills (stays inside parent padding, does not bleed). */
  title?: string
  /** Optional className applied to the pill row wrapper (not the title). Use to bleed the pill strip out of a padded card on mobile, e.g. "-mx-3 md:-mx-4". */
  bleedClassName?: string
  /** Brand green (#39FF14) icons; labels keep selected/unselected text colors (e.g. audio record Life Vision). */
  brandGreenIcons?: boolean
  /**
   * Life Vision category pill preset: sets `fillWidth`, `twoLineDesktop`, and `brandGreenIcons` for the standard
   * full-category strip (mobile horizontal scroll, desktop two rows of seven). Ignores `fillWidth`, `twoLineDesktop`,
   * `brandGreenIcons`, and `wrapOnDesktop` when true.
   */
  lifeVisionCategoryStrip?: boolean
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
    selectAllPlacement,
    completionBadgeColor = '#39FF14',
    refinementBadgeColor = '#FFFF00',
    pillLabel,
    getPillClassName,
    fillWidth = false,
    twoLineDesktop = false,
    wrapOnDesktop = false,
    title,
    bleedClassName,
    brandGreenIcons = false,
    lifeVisionCategoryStrip = false,
    className,
    ...props
  }, ref) => {
    const useFillWidth = lifeVisionCategoryStrip ? true : fillWidth
    const useTwoLineDesktop = lifeVisionCategoryStrip ? true : twoLineDesktop
    const useBrandGreenIcons = lifeVisionCategoryStrip ? true : brandGreenIcons
    const useWrapOnDesktop = lifeVisionCategoryStrip ? false : wrapOnDesktop

    const useSelectAllAbove =
      selectAllPlacement === 'above' ||
      (selectAllPlacement === undefined && lifeVisionCategoryStrip && showSelectAll)

    const allSelected = selectedCategories.length === categories.length
    const hasBadges = mode !== 'selection'
    const gridDesktop = useFillWidth && useTwoLineDesktop

    const selectAllText = selectAllLabel ?? (allSelected ? 'Deselect all' : 'Select all')

    const pills = (
      <>
        {showSelectAll && onSelectAll && !useSelectAllAbove && (
          <button
            type="button"
            onClick={onSelectAll}
            className={cn(pillBase, 'shrink-0', hasBadges && 'mt-2 mr-0.5', allSelected ? pillSelected : allPillUnselected)}
          >
            {selectAllText}
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
              useFillWidth
                ? gridDesktop
                  ? 'shrink-0 md:w-full md:min-w-0'
                  : 'shrink-0 md:flex-1 md:min-w-0'
                : 'shrink-0',
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
                  useFillWidth ? 'shrink-0 md:w-full md:justify-center' : 'shrink-0',
                  isSelected ? pillSelected : pillUnselected,
                  extraClass,
                )}
              >
                <CatIcon
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    useBrandGreenIcons && 'text-[#39FF14]',
                    useBrandGreenIcons && !isSelected && 'opacity-[0.72]',
                  )}
                />
                {useBrandGreenIcons ? (
                  <span className={isSelected ? 'text-primary-400' : 'text-neutral-400'}>{category.label}</span>
                ) : (
                  category.label
                )}
              </button>
            </div>
          )
        })}
      </>
    )

    return (
      /* min-w-0: flex/grid children default to min-width:auto — without this, min-w-max pills expand the whole page horizontally */
      <div ref={ref} className={cn('min-w-0 w-full max-w-full', className)} {...props}>
        {title ? (
          <p className="mb-2 text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            {title}
          </p>
        ) : null}

        <div className={cn(bleedClassName)}>
          {showSelectAll && onSelectAll && useSelectAllAbove && (
            <div className="mb-2 flex justify-center max-md:px-4 md:px-0">
              <Button
                type="button"
                variant={allSelected ? 'primary' : 'outline'}
                size="sm"
                onClick={onSelectAll}
                className="!h-auto min-h-0 !px-3 !py-1.5 !text-xs font-medium antialiased shrink-0 md:!px-3 md:!py-1.5"
              >
                {selectAllText}
              </Button>
            </div>
          )}

          {useFillWidth ? (
            /* Scrollport must be width-bounded so pills scroll inside the card, not grow the viewport */
            <div className="scrollbar-hide w-full min-w-0 max-w-full max-md:overflow-x-auto md:overflow-visible">
              <div
                className={cn(
                  'gap-2 pb-1 max-md:px-4 md:min-w-0 md:w-full md:px-0',
                  gridDesktop
                    ? 'flex min-w-max items-center max-md:overflow-x-auto md:grid md:grid-cols-7 md:gap-2'
                    : 'flex min-w-max items-center md:flex-wrap md:justify-center',
                )}
              >
                {pills}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'flex w-full min-w-0 max-w-full items-center gap-2 pb-1 scrollbar-hide overflow-x-auto px-4 md:px-0',
                useWrapOnDesktop
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
      </div>
    )
  }
)
CategoryGrid.displayName = 'CategoryGrid'
