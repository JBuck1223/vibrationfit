'use client'

import React from 'react'
import { cn } from '../shared-utils'

// ============================================================================
// PAGE HERO COMPONENT
// 🔒 LOCKED - See FEATURE_REGISTRY.md before modifying
// Current padding: 24px mobile (p-6), 32px desktop (lg:p-8)
// DO NOT modify internal padding - manage spacing at page level
// ============================================================================

export interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  children?: React.ReactNode
}

export const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        {...props}
      >
        {/* Subtle Gradient Border */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          {/* Modern Enhanced Layout with Card Container */}
          <div className="relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              {eyebrow && (
                <div className="text-center mb-4">
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                    {eyebrow}
                  </div>
                </div>
              )}
              
              {/* Title Section */}
              <div className={cn("text-center", subtitle || children ? "mb-4" : "")}>
                <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                  {title}
                </h1>
              </div>
              
              {/* Subtitle */}
              {subtitle && (
                <div className={cn("text-center", children ? "mb-4" : "")}>
                  <p className="text-xs md:text-lg text-neutral-300">
                    {subtitle}
                  </p>
                </div>
              )}

              {/* Custom Children (video, buttons, etc.) */}
              {children && (
                <div className="flex flex-col items-center space-y-4 md:space-y-4 lg:space-y-6">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
PageHero.displayName = 'PageHero'

