'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { Text } from '../typography/Text'

interface FeatureCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon: React.ElementType
  title: string | React.ReactNode
  children: React.ReactNode
  iconColor?: string
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  hover?: boolean
  number?: number
  className?: string
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon: IconComponent, title, children, iconColor = '#39FF14', iconSize = 'lg', variant = 'default', hover = false, number, className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-[#1F1F1F] border-2 border-[#333]',
      elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-xl',
      outlined: 'bg-transparent border-2 border-[#333]',
      glass: 'bg-[#1F1F1F]/50 backdrop-blur-lg border border-[#333]/50'
    }
    
    const hoverEffect = hover ? 'hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200' : ''
    
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-4 md:p-6 flex flex-col items-center text-center', variants[variant], hoverEffect, className)}
        {...props}
      >
        {number !== undefined && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#39FF14]/20 border-2 border-[#39FF14]/30 flex items-center justify-center mb-2">
            <span className="text-xs md:text-sm font-bold text-[#39FF14]">
              {number}
            </span>
          </div>
        )}
        
        <div className="mb-3 md:mb-4">
          <IconComponent 
            size={iconSize === 'xs' ? 16 : iconSize === 'sm' ? 20 : iconSize === 'md' ? 24 : iconSize === 'lg' ? 32 : 48} 
            color={iconColor} 
            className="flex-shrink-0"
            strokeWidth={2}
          />
        </div>
        
        <Text size="base" className="text-white mb-2 md:mb-3 font-semibold">
          {title}
        </Text>
        
        <Text size="sm" className="text-neutral-300">
          {children}
        </Text>
      </div>
    )
  }
)
FeatureCard.displayName = 'FeatureCard'
