'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { useInShell } from '@/lib/app-shell/shell-context'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  hover?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hover = false, className = '', ...props }, ref) => {
    // Inside the app shell every filled card is glass over the theme backdrop.
    const inShell = useInShell()
    const variants = inShell
      ? {
          default: 'glass-panel',
          elevated: 'glass-panel shadow-xl',
          outlined: 'bg-transparent border border-[var(--glass-border)]',
          glass: 'glass-panel',
        }
      : {
          default: 'bg-[#1F1F1F] border-2 border-[#333]',
          elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-xl',
          outlined: 'bg-transparent border-2 border-[#333]',
          glass: 'bg-[#1F1F1F]/50 backdrop-blur-lg border border-[#333]/50',
        }

    const hoverEffect = hover
      ? inShell
        ? 'hover:border-[var(--section-accent)]/60 transition-colors duration-200'
        : 'hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200'
      : ''
    
    // Standardized padding: Mobile p-4 (16px), Tablet p-6 (24px), Desktop p-8 (32px)
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-4 md:p-6 lg:p-8', variants[variant], hoverEffect, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

