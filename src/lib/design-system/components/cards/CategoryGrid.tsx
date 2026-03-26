'use client'

import React from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { Badge } from '../badges/Badge'
import { Grid } from '../layout/Grid'
import { Card } from './Card'
import { CategoryCard } from './CategoryCard'
import type { LucideIcon } from 'lucide-react'

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
  layout?: '14-column' | '12-column'
  mode?: 'selection' | 'completion' | 'draft' | 'record'
  showSelectAll?: boolean
  onSelectAll?: () => void
  selectAllLabel?: string
  variant?: 'default' | 'elevated' | 'outlined'
  withCard?: boolean
  completionBadgeColor?: string
  refinementBadgeColor?: string
}

export const CategoryGrid = React.forwardRef<HTMLDivElement, CategoryGridProps>(
  ({ 
    categories,
    selectedCategories = [],
    completedCategories = [],
    refinedCategories = [],
    activeCategory,
    onCategoryClick,
    layout = '14-column',
    mode = 'selection',
    showSelectAll = false,
    onSelectAll,
    selectAllLabel,
    variant = 'outlined',
    withCard = true,
    completionBadgeColor = '#39FF14',
    refinementBadgeColor = '#FFFF00',
    className = '',
    ...props
  }, ref) => {
    // Determine grid class based on layout
    const gridClass = layout === '14-column'
      ? 'grid grid-cols-4 md:grid-cols-7 lg:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1'
      : 'grid grid-cols-4 md:grid-cols-12 gap-3'

    // Calculate if all are selected for "Select All" button
    const allSelected = selectedCategories.length === categories.length

    const gridContent = (
      <div ref={ref} {...props}>
        {/* Optional Select All Button */}
        {showSelectAll && onSelectAll && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={onSelectAll}
              variant="ghost"
              size="sm"
            >
              {selectAllLabel || (allSelected ? 'Deselect All' : 'Select All')}
            </Button>
          </div>
        )}

        {/* Category Grid */}
        <div className={gridClass}>
          {categories.map((category) => {
            const isActive = activeCategory === category.key
            const isSelected = isActive || selectedCategories.includes(category.key)
            const isCompleted = completedCategories.includes(category.key)
            const isRefined = refinedCategories.includes(category.key)
            
            // In 'record' mode: green check for completed, amber icon for refined-but-not-completed
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

            return (
              <div key={category.key} className="relative">
                {showBadge && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 flex items-center justify-center z-10"
                    style={{ borderColor: badgeColor }}
                  >
                    {needsReRecord ? (
                      <RefreshCw className="w-3 h-3" style={{ color: badgeColor }} strokeWidth={3} />
                    ) : (
                      <Check className="w-3 h-3" style={{ color: badgeColor }} strokeWidth={3} />
                    )}
                  </div>
                )}

                <CategoryCard
                  category={category}
                  selected={isSelected}
                  onClick={() => onCategoryClick?.(category.key)}
                  variant={variant}
                  selectionStyle="border"
                  iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                  selectedIconColor="#39FF14"
                  className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
                />
              </div>
            )
          })}
        </div>
      </div>
    )

    // Optionally wrap in Card
    if (withCard) {
      return (
        <Card className={cn('p-4', className)}>
          {gridContent}
        </Card>
      )
    }

    return gridContent
  }
)
CategoryGrid.displayName = 'CategoryGrid'

