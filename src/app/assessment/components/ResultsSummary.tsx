import { Card, Badge, ProgressBar } from '@/lib/design-system/components'
import { AssessmentResult } from '@/types/assessment'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

  // Mock category data - in real implementation, this would come from the assessment
  const categories = [
    { name: 'Career & Business', score: 85, status: 'above', total: 100 },
    { name: 'Health & Wellness', score: 72, status: 'above', total: 100 },
    { name: 'Relationships', score: 45, status: 'below', total: 100 },
    { name: 'Personal Growth', score: 90, status: 'above', total: 100 },
    { name: 'Financial', score: 38, status: 'below', total: 100 },
    { name: 'Spirituality', score: 68, status: 'above', total: 100 },
  ]

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
                  <div className="text-white font-medium">{category.score}/{category.total}</div>
                  <div className="text-xs text-neutral-400">{Math.round((category.score/category.total) * 100)}%</div>
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
          <div className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg">
            <p className="text-sm text-white">
              <strong className="text-[#39FF14]">Strengths:</strong> Your career and personal growth areas show strong alignment above the Green Line.
            </p>
          </div>
          <div className="p-4 bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-lg">
            <p className="text-sm text-white">
              <strong className="text-[#FF0040]">Focus Areas:</strong> Relationships and financial areas need attention to move above the Green Line.
            </p>
          </div>
          <div className="p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded-lg">
            <p className="text-sm text-white">
              <strong className="text-[#00FFFF]">Recommendation:</strong> Focus on one area at a time to create sustainable change.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}