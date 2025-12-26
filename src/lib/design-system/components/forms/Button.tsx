'use client'

import React from 'react'
import { cn } from '../shared-utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'draft' | 'ghost' | 'ghost-yellow' | 'ghost-blue' | 'ghost-purple' | 'outline' | 'outline-purple' | 'outline-yellow' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  asChild?: boolean
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled, asChild = false, className = '', ...props }, ref) => {
    const variants = {
      primary: `
        bg-[#39FF14] text-black font-semibold
        border-2 border-transparent
        hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)]
        active:opacity-80
      `,
      secondary: `
        bg-[#00FFFF] text-black font-semibold
        border-2 border-transparent
        hover:bg-[rgba(0,255,255,0.1)] hover:text-[#00FFFF] hover:border-[rgba(0,255,255,0.2)]
        active:opacity-80
      `,
      accent: `
        bg-[#BF00FF] text-white font-semibold
        border-2 border-transparent
        hover:bg-[rgba(191,0,255,0.1)] hover:text-[#BF00FF] hover:border-[rgba(191,0,255,0.2)]
        active:opacity-80
      `,
      draft: `
        bg-[#FFFF00] text-black font-semibold
        border-2 border-transparent
        hover:bg-[rgba(255,255,0,0.1)] hover:text-[#FFFF00] hover:border-[rgba(255,255,0,0.2)]
        active:opacity-80
      `,
      ghost: `
        bg-[rgba(57,255,20,0.1)] text-[#39FF14] 
        border-2 border-[rgba(57,255,20,0.2)]
        hover:bg-[rgba(57,255,20,0.2)]
        active:opacity-80
      `,
      'ghost-yellow': `
        bg-[rgba(255,255,0,0.1)] text-[#FFFF00] 
        border-2 border-[rgba(255,255,0,0.2)]
        hover:bg-[rgba(255,255,0,0.2)]
        active:opacity-80
      `,
      'ghost-blue': `
        bg-[rgba(59,130,246,0.1)] text-[#3B82F6] 
        border-2 border-[rgba(59,130,246,0.2)]
        hover:bg-[rgba(59,130,246,0.2)]
        active:opacity-80
      `,
      'ghost-purple': `
        bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] 
        border-2 border-[rgba(139,92,246,0.2)]
        hover:bg-[rgba(139,92,246,0.2)]
        active:opacity-80
      `,
      outline: `
        bg-transparent border-2 border-[#39FF14] text-[#39FF14]
        hover:bg-[#39FF14] hover:text-black
        active:opacity-80
      `,
      'outline-purple': `
        bg-transparent border-2 border-[#BF00FF] text-[#BF00FF]
        hover:bg-[#BF00FF] hover:text-white
        active:opacity-80
      `,
      'outline-yellow': `
        bg-transparent border-2 border-[#FFFF00] text-[#FFFF00]
        hover:bg-[#FFFF00] hover:text-black
        active:opacity-80
      `,
      danger: `
        bg-transparent text-[#FF0040] font-semibold
        border-2 border-[#FF0040]
        hover:bg-[#FF0040] hover:text-white hover:border-transparent
        active:opacity-80
      `,
    }
    
    const sizes = {
      sm: 'px-4 py-3 text-sm md:text-sm md:px-5 gap-1.5',
      md: 'px-4 py-3 text-sm md:text-sm md:px-7 md:py-3 gap-2',
      lg: 'px-5 py-4 text-sm md:text-base md:px-10 md:py-4 gap-2.5',
      xl: 'px-5 py-4 text-sm md:text-base md:px-6 md:py-4 gap-3',
    }
    
    const buttonClasses = cn(
      'inline-flex items-center justify-center',
      'rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      variants[variant],
      sizes[size],
      fullWidth ? 'w-full' : '',
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonClasses, (children as any).props.className),
        disabled: disabled || loading,
        ...props
      })
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.type !== 'submit') {
        e.preventDefault()
        e.stopPropagation()
      }
      props.onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type={props.type || "button"}
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
        onClick={handleClick}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
