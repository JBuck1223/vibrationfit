'use client'

/**
 * IntensiveStepHeader - Standardized header for all Intensive step pages
 * 
 * Displays:
 * - ACTIVATION INTENSIVE (eyebrow)
 * - Step X of 14
 * - Step Title
 * - Optional children (content, buttons, etc.)
 */

interface IntensiveStepHeaderProps {
  stepNumber: number
  stepTitle: string
  children?: React.ReactNode
}

export function IntensiveStepHeader({
  stepNumber,
  stepTitle,
  children
}: IntensiveStepHeaderProps) {
  return (
    <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-primary-500/30 via-secondary-500/20 to-accent-500/30">
      <div className="relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="relative z-10">
          {/* Eyebrow */}
          <div className="text-center mb-4">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
              ACTIVATION INTENSIVE
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {/* Step Number */}
            <p className="text-sm md:text-base font-medium text-neutral-400 text-center">
              Step {stepNumber} of 14
            </p>
            
            {/* Step Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white">
              {stepTitle}
            </h1>
            
            {/* Optional children content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
