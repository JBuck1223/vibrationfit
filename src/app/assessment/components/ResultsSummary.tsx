import { Card, Badge, ProgressBar } from '@/lib/design-system/components'
import { AssessmentResult, AssessmentCategory } from '@/types/assessment'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { categoryMetadata } from '@/lib/assessment/questions'

interface ResultsSummaryProps {
  assessment: AssessmentResult
}

export default function ResultsSummary({ assessment }: ResultsSummaryProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'above':
        return <TrendingUp className="w-4 h-4 text-[#39FF14]" />
      case 'below':
        return <TrendingDown className="w-4 h-4 text-[#FF0040]" />
      default:
        return <Minus className="w-4 h-4 text-neutral-400" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'above':
        return 'success'
      case 'below':
        return 'error'
      default:
        return 'info'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'above':
        return 'Above Green Line'
      case 'below':
        return 'Below Green Line'
      default:
        return 'Neutral'
    }
  }

  // Get real category data from assessment
  const categories = Object.entries(assessment.category_scores || {}).map(([category, score]) => {
    const categoryKey = category as AssessmentCategory
    const metadata = categoryMetadata[categoryKey]
    const maxScore = 35 // 7 questions × 5 max points each
    const percentage = Math.round((score / maxScore) * 100)
    const status = assessment.green_line_status?.[categoryKey] || 'neutral'
    
    return {
      name: metadata?.title || categoryKey,
      score,
      maxScore,
      percentage,
      status,
      category: categoryKey
    }
  }).sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Overall Assessment Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-bold text-white mb-2">
              {assessment.total_score || 0}/{assessment.max_possible_score || 100}
            </div>
            <ProgressBar
              value={assessment.overall_percentage || 0}
              variant="primary"
              showLabel
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Overall Status:</span>
              <Badge variant="info">
                Assessment Complete
              </Badge>
            </div>
            <div className="text-sm text-neutral-400">
              Completed: {new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getCategoryIcon(category.status)}
                <span className="text-white font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-medium">{category.score}/{category.maxScore}</div>
                  <div className="text-xs text-neutral-400">{category.percentage}%</div>
                </div>
                <Badge variant={getCategoryColor(category.status)}>
                  {getCategoryLabel(category.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Key Insights</h3>
        <div className="space-y-3">
          {(() => {
            const aboveCategories = categories.filter(c => c.status === 'above')
            const belowCategories = categories.filter(c => c.status === 'below')
            const transitionCategories = categories.filter(c => c.status === 'transition')
            
            return (
              <>
                {aboveCategories.length > 0 && (
                  <div className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg">
                    <p className="text-sm text-white">
                      <strong className="text-[#39FF14]">Strengths:</strong> {aboveCategories.map(c => c.name).join(', ')} {aboveCategories.length === 1 ? 'shows' : 'show'} strong alignment above the Green Line.
                    </p>
                  </div>
                )}
                {belowCategories.length > 0 && (
                  <div className="p-4 bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-lg">
                    <p className="text-sm text-white">
                      <strong className="text-[#FF0040]">Focus Areas:</strong> {belowCategories.map(c => c.name).join(', ')} {belowCategories.length === 1 ? 'needs' : 'need'} attention to move above the Green Line.
                    </p>
                  </div>
                )}
                {transitionCategories.length > 0 && (
                  <div className="p-4 bg-[#FFB701]/10 border border-[#FFB701]/30 rounded-lg">
                    <p className="text-sm text-white">
                      <strong className="text-[#FFB701]">In Transition:</strong> {transitionCategories.map(c => c.name).join(', ')} {transitionCategories.length === 1 ? 'is' : 'are'} in transition - keep building momentum.
                    </p>
                  </div>
                )}
                <div className="p-4 bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-lg">
                  <p className="text-sm text-white">
                    <strong className="text-[#14B8A6]">Recommendation:</strong> Focus on one area at a time to create sustainable change and maintain vibrational alignment.
                  </p>
                </div>
              </>
            )
          })()}
        </div>
      </Card>
    </div>
  )
}