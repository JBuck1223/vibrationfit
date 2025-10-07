"use client"

import React from 'react'
import { CheckCircle, Circle, Sparkles } from 'lucide-react'
import { ProgressBar } from '@/lib/design-system/components'

interface CategoryProgressProps {
  totalCategories: number
  completedCategories: string[]
  currentCategory: string
  allCategories: string[]
}

export function CategoryProgress({
  totalCategories,
  completedCategories,
  currentCategory,
  allCategories
}: CategoryProgressProps) {
  const completedCount = completedCategories.length
  const progressPercentage = (completedCount / totalCategories) * 100

  return (
    <div className="mb-8">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFB701]" />
            Vision Progress
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            {completedCount} of {totalCategories} categories completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#199D67]">
            {completedCount}/{totalCategories}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={progressPercentage}
        variant="primary"
        className="mb-6"
      />

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {allCategories.map((category) => {
          const isCompleted = completedCategories.includes(category)
          const isCurrent = category === currentCategory

          return (
            <div
              key={category}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${isCompleted 
                  ? 'bg-[#199D67]/20 border-2 border-[#199D67]' 
                  : isCurrent
                  ? 'bg-[#14B8A6]/20 border-2 border-[#14B8A6]'
                  : 'bg-[#1F1F1F] border-2 border-[#333]'
                }
                transition-all duration-300
              `}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-[#199D67] flex-shrink-0" />
              ) : isCurrent ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#14B8A6] animate-pulse flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-600 flex-shrink-0" />
              )}
              <span className={`
                truncate
                ${isCompleted 
                  ? 'text-[#199D67] font-medium' 
                  : isCurrent
                  ? 'text-[#14B8A6] font-medium'
                  : 'text-neutral-500'
                }
              `}>
                {category}
              </span>
            </div>
          )
        })}
      </div>

      {/* Completion message */}
      {completedCount === totalCategories && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#199D67]/20 to-[#14B8A6]/20 border-2 border-[#199D67] rounded-xl text-center animate-fadeIn">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-[#199D67] font-semibold">
            Complete Vision Achieved!
          </p>
          <p className="text-neutral-300 text-sm mt-1">
            All 12 categories of your life vision are now aligned
          </p>
        </div>
      )}
    </div>
  )
}
