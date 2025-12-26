'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface OrderedListProps extends React.OlHTMLAttributes<HTMLOListElement> {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'spaced' | 'compact' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  numberColor?: string
  className?: string
}

export const OrderedList = React.forwardRef<HTMLOListElement, OrderedListProps>(
  ({ children, spacing = 'md', variant = 'default', numberColor = '#39FF14', className = '', ...props }, ref) => {
    const spacings = {
      sm: 'space-y-2',
      md: 'space-y-3',
      lg: 'space-y-4'
    }
    
    const variants: Record<string, string> = {
      default: '',
      spaced: 'space-y-6',
      compact: 'space-y-1'
    }

    return (
      <ol 
        ref={ref} 
        className={cn(
          'list-none counter-reset-item',
          variants[variant] || spacings[spacing],
          className
        )} 
        {...props}
        style={{
          counterReset: 'item',
          ...props.style
        }}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              style: {
                counterIncrement: 'item',
                ...(child.props as any).style
              }
            })
          }
          return child
        })}
      </ol>
    )
  }
)
OrderedList.displayName = 'OrderedList'
