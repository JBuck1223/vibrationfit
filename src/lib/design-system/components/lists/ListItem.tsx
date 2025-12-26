'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../shared-utils'

interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
  icon?: React.ElementType
  iconColor?: string
  variant?: 'default' | 'checked' | 'numbered' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  number?: number
  className?: string
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ children, icon: IconComponent, iconColor = '#39FF14', variant = 'default', number, className = '', ...props }, ref) => {
    const renderIcon = () => {
      if (variant === 'checked') {
        return (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#39FF14]/20 border-2 border-[#39FF14]/30 flex items-center justify-center">
            <Check className="w-3 h-3" style={{ color: iconColor }} strokeWidth={3} />
          </div>
        )
      }
      
      if (variant === 'numbered' && number !== undefined) {
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm" style={{ color: iconColor }}>
            {number}
          </div>
        )
      }
      
      if (IconComponent) {
        return <IconComponent className="flex-shrink-0 w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />
      }
      
      return (
        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: iconColor }} />
      )
    }

    return (
      <li ref={ref} className={cn('flex items-start gap-3 text-neutral-200', className)} {...props}>
        {renderIcon()}
        <span className="flex-1">{children}</span>
      </li>
    )
  }
)
ListItem.displayName = 'ListItem'
