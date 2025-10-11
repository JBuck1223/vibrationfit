// /src/app/assessment/components/ProgressTracker.tsx
// Progress tracking component for assessment

'use client'

import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { AssessmentCategory } from '@/types/assessment'
import { Check, Circle } from 'lucide-react'

interface CategoryProgress {
  category: AssessmentCategory
  answered: number
  total: number
  percentage: number
}

interface ProgressTrackerProps {
  overall: {
    answered: number
    total: number
    percentage: number
  }
  categories: Record<string, {
    answered: number
    total: number
    percentage: number
  }>
  currentCategory?: AssessmentCategory
}

export default function ProgressTracker({
  overall,
  categories,
  currentCategory
}: ProgressTrackerProps) {
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-neutral-300">
            Overall Progress
          </span>
          <span className="text-2xl font-bold text-primary-500">
            {overall.percentage}%
          </span>
        </div>
        
        <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
            style={{ width: `${overall.percentage}%` }}
          />
        </div>
        
        <div className="mt-2 text-xs text-neutral-400 text-center">
          {overall.answered} of {overall.total} questions answered
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4">
          Category Progress
        </h3>
        
        <div className="space-y-3">
          {VISION_CATEGORIES.map((cat) => {
            const categoryKey = cat.key as AssessmentCategory
            const progress = categories[categoryKey]
            const isComplete = progress && progress.percentage === 100
            const isCurrent = currentCategory === categoryKey
            const Icon = cat.icon

            return (
              <div
                key={cat.key}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-colors
                  ${isCurrent ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-neutral-700/30'}
                `}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  ${isComplete 
                    ? 'bg-primary-500 text-white' 
                    : isCurrent
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'bg-neutral-700 text-neutral-400'
                  }
                `}>
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Category Name */}
                <div className="flex-1 min-w-0">
                  <div className={`
                    text-sm font-medium
                    ${isCurrent ? 'text-primary-500' : 'text-neutral-300'}
                  `}>
                    {cat.label}
                  </div>
                  {progress && (
                    <div className="text-xs text-neutral-400">
                      {progress.answered}/{progress.total} questions
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                <div className="flex-shrink-0">
                  {progress ? (
                    <span className={`
                      text-xs font-semibold
                      ${isComplete 
                        ? 'text-primary-500' 
                        : isCurrent
                          ? 'text-primary-500'
                          : 'text-neutral-400'
                      }
                    `}>
                      {progress.percentage}%
                    </span>
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-600" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-secondary-500/10 border border-secondary-500/30 rounded-xl p-4">
        <p className="text-xs text-neutral-300 leading-relaxed">
          <span className="font-semibold text-secondary-500">Tip:</span> Answer honestly based on your current reality, not where you want to be. This helps VIVA create your most aligned life vision.
        </p>
      </div>
    </div>
  )
}

