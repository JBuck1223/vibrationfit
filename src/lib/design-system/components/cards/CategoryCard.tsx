'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import tokens from '../../tokens'
import { Card } from './Card'
import type { LucideIcon } from 'lucide-react'
// CategoryCard Component - Square category selection card with icon and label
// Optimized for mobile with minimal padding to maintain square aspect ratio
interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  category: {
    key: string
    label: string
    icon: React.ElementType
  }
  selected?: boolean
  onClick?: () => void
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean
  iconColor?: string
  selectedIconColor?: string
  textSize?: 'xs' | 'sm'
  selectionStyle?: 'ring' | 'border'
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ 
    category, 
    selected = false, 
    onClick, 
    variant = 'default',
    hover = true,
    iconColor = tokens.colors.secondary[500], // Default: cyan
    selectedIconColor = tokens.colors.primary[500], // Selected: green
    textSize = 'xs',
    selectionStyle = 'ring',
    className = '', 
    ...props 
  }, ref) => {
    const IconComponent = category.icon
    
    // Use design tokens for variants
    const variants = {
      default: `bg-[${tokens.colors.neutral.cardBg}] border-2 border-[${tokens.colors.neutral.borderLight}]`,
      elevated: `bg-[${tokens.colors.neutral.cardBg}] border-2 border-[${tokens.colors.neutral.borderLight}] shadow-xl`,
      outlined: `bg-transparent border-2 border-[${tokens.colors.neutral.borderLight}]`,
    }
    
    const hoverEffect = hover ? `hover:border-[${tokens.colors.primary[200]}] hover:shadow-2xl transition-all ${tokens.durations[200]}` : ''
    
    const selectionClass = selected 
      ? selectionStyle === 'ring' 
        ? `ring-2 ring-[${tokens.colors.primary[500]}] border-[${tokens.colors.primary[500]}]`
        : 'border border-primary-500'
      : ''
    
    const textSizeClass = textSize === 'xs' ? 'text-[10px]' : 'text-xs'
    
    return (
      <Card 
        ref={ref}
        variant={variant} 
        hover={hover}
        className={cn(
          'cursor-pointer aspect-square',
          `transition-all ${tokens.durations[300]}`,
          // Override Card's default padding with minimal padding for square aspect ratio
          '!p-1 md:!p-2',
          selectionClass,
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex flex-col items-center gap-0.5 md:gap-1 justify-center h-full">
          <IconComponent 
            size={20}
            color={selected ? selectedIconColor : iconColor}
            strokeWidth={2}
            className="flex-shrink-0"
          />
          <span className={cn(
            textSizeClass,
            'font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto'
          )}>
            {category.label}
          </span>
        </div>
      </Card>
    )
  }
)
CategoryCard.displayName = 'CategoryCard'

