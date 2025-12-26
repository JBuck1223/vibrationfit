'use client'

import React from 'react'
import { Brain } from 'lucide-react'
import { cn } from '../shared-utils'

interface VIVAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export const VIVAButton = React.forwardRef<HTMLButtonElement, VIVAButtonProps>(
  ({ size = 'md', children, asChild = false, className = '', ...props }, ref) => {
    const sizes = {
      sm: 'px-5 py-3 text-sm gap-2',
      md: 'px-7 py-3 text-sm md:text-base gap-2',
      lg: 'px-10 py-4 text-base gap-2.5',
      xl: 'px-6 py-4 text-lg gap-3'
    }
    
    const buttonClasses = cn(
      'inline-flex items-center justify-center font-semibold',
      'rounded-full transition-all duration-300',
      'bg-gradient-to-r from-[#8B5CF6] to-[#BF00FF]',
      'text-white',
      'hover:from-[#7C3AED] hover:to-[#A855F7]',
      'active:opacity-80',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizes[size],
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonClasses, (children as any).props.className),
        ...props
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        className={buttonClasses}
        {...props}
      >
        <Brain className="w-5 h-5" />
        {children}
      </button>
    )
  }
)
VIVAButton.displayName = 'VIVAButton'
