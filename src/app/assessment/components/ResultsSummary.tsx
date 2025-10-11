// /src/app/assessment/components/ResultsSummary.tsx
// Assessment results summary component

'use client'

import { AssessmentResult } from '@/types/assessment'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { Card, Button } from '@/lib/design-system/components'
import { TrendingUp, TrendingDown, Minus, Target, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ResultsSummaryProps {
  assessment: AssessmentResult
  onGenerateVision?: () => void
  onViewDetails?: () => void
}

export default function ResultsSummary({
  assessment,
  onGenerateVision,
  onViewDetails
}: ResultsSummaryProps) {
  const categoryScores = assessment.category_scores as Record<string, number> || {}
  const greenLineStatuses = assessment.green_line_status as Record<string, 'above' | 'transition' | 'below'> || {}

  // Calculate stats
  const totalCategories = Object.keys(categoryScores).length
  const aboveCount = Object.values(greenLineStatuses).filter(s => s === 'above').length
  const transitionCount = Object.values(greenLineStatuses).filter(s => s === 'transition').length
  const belowCount = Object.values(greenLineStatuses).filter(s => s === 'below').length

  // Get strongest and growth areas
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
  const strongestAreas = sortedCategories.slice(0, 3)
  const growthAreas = sortedCategories.slice(-3).reverse()

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="elevated" className="p-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-4">
            <Target className="w-10 h-10 text-primary-500" />
          </div>
          
          <h1 className="text-4xl font-bold text-white">
            Assessment Complete!
          </h1>
          
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            You've completed all {totalCategories} life categories. Here's your vibrational snapshot.
          </p>

          {/* Overall Score */}
          <div className="inline-flex items-baseline gap-3 px-6 py-3 bg-neutral-800 rounded-full border border-neutral-700">
            <span className="text-sm font-medium text-neutral-400">Overall Score:</span>
            <span className="text-3xl font-bold text-primary-500">
              {assessment.total_score}
            </span>
            <span className="text-sm text-neutral-500">/ {assessment.max_possible_score}</span>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Above Green Line */}
        <Card variant="elevated" className="p-6 border-2 border-primary-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500">{aboveCount}</div>
              <div className="text-sm text-neutral-400">Above Green Line</div>
            </div>
          </div>
        </Card>

        {/* In Transition */}
        <Card variant="elevated" className="p-6 border-2 border-[#FFB701]/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFB701]/20 flex items-center justify-center">
              <Minus className="w-6 h-6 text-[#FFB701]" />
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FFB701]">{transitionCount}</div>
              <div className="text-sm text-neutral-400">In Transition</div>
            </div>
          </div>
        </Card>

        {/* Below Green Line */}
        <Card variant="elevated" className="p-6 border-2 border-[#D03739]/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D03739]/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-[#D03739]" />
            </div>
            <div>
              <div className="text-3xl font-bold text-[#D03739]">{belowCount}</div>
              <div className="text-sm text-neutral-400">Below Green Line</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Areas */}
        <Card variant="elevated" className="p-6">
          <h3 className="text-xl font-semibold text-primary-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Strongest Areas
          </h3>
          <div className="space-y-3">
            {strongestAreas.map(([categoryKey, score]) => {
              const category = VISION_CATEGORIES.find(c => c.key === categoryKey)
              const status = greenLineStatuses[categoryKey]
              const Icon = category?.icon
              
              return (
                <div key={categoryKey} className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg">
                  {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{category?.label}</div>
                    <div className="text-xs text-neutral-400">{status === 'above' ? 'Above Green Line' : status === 'transition' ? 'In Transition' : 'Below Green Line'}</div>
                  </div>
                  <div className="text-lg font-bold text-primary-500">{score}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Growth Opportunities */}
        <Card variant="elevated" className="p-6">
          <h3 className="text-xl font-semibold text-secondary-500 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Growth Opportunities
          </h3>
          <div className="space-y-3">
            {growthAreas.map(([categoryKey, score]) => {
              const category = VISION_CATEGORIES.find(c => c.key === categoryKey)
              const status = greenLineStatuses[categoryKey]
              const Icon = category?.icon
              
              return (
                <div key={categoryKey} className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg">
                  {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-secondary-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{category?.label}</div>
                    <div className="text-xs text-neutral-400">{status === 'above' ? 'Above Green Line' : status === 'transition' ? 'In Transition' : 'Below Green Line'}</div>
                  </div>
                  <div className="text-lg font-bold text-secondary-500">{score}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card variant="elevated" className="p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <h3 className="text-2xl font-bold text-white">Ready to Create Your Life Vision?</h3>
          </div>
          
          <p className="text-neutral-300 max-w-2xl mx-auto">
            VIVA will use your assessment to generate a personalized life vision across all 12 categories, aligned with your current reality and highest aspirations.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            {onGenerateVision && (
              <Button
                variant="primary"
                size="lg"
                onClick={onGenerateVision}
              >
                Generate My Life Vision
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                variant="secondary"
                size="lg"
                onClick={onViewDetails}
              >
                View Detailed Results
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

