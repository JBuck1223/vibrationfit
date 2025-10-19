import { Card, Badge, ProgressBar, Button } from '@/lib/design-system/components'
import { AssessmentResult, AssessmentCategory, AssessmentResponse } from '@/types/assessment'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { categoryMetadata } from '@/lib/assessment/questions'
import { useState } from 'react'

interface ResultsSummaryProps {
  assessment: AssessmentResult
  responses?: AssessmentResponse[]
}

export default function ResultsSummary({ assessment, responses = [] }: ResultsSummaryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }
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

  // Get all 12 categories with real data from assessment
  const allCategories: AssessmentCategory[] = [
    'fun', 'travel', 'home', 'family', 'romance', 'health',
    'money', 'business', 'social', 'possessions', 'giving', 'spirituality'
  ]
  
  const categories = allCategories.map((categoryKey) => {
    const metadata = categoryMetadata[categoryKey]
    const score = assessment.category_scores?.[categoryKey] || 0
    const maxScore = 35 // 7 questions × 5 max points each (1-5 scale)
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
          {categories.map((category, index) => {
            const categoryResponses = responses.filter(r => r.category === category.category)
            const isExpanded = expandedCategories.has(category.category)
            
            return (
              <div key={index} className="bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between p-4">
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
                    {categoryResponses.length > 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => toggleCategory(category.category)}
                        className="text-xs p-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span className="ml-1">{categoryResponses.length} responses</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {isExpanded && categoryResponses.length > 0 && (
                  <div className="px-4 pb-4 border-t border-neutral-700">
                    <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                      {categoryResponses.map((response, responseIndex) => (
                        <div key={responseIndex} className="p-3 bg-neutral-900/50 rounded text-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-white mb-1">
                                {response.question_text}
                              </div>
                              <div className="text-neutral-300 mb-1">
                                <strong>Response:</strong> {response.response_text}
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                response.is_custom_response 
                                  ? 'bg-purple-500/20 text-purple-300' 
                                  : 'bg-green-500/20 text-green-300'
                              }`}>
                                {response.is_custom_response ? 'Custom' : 'Standard'}
                              </div>
                              <div className="mt-1 text-xs text-neutral-400">
                                <div>Response Value: {response.response_value}</div>
                                {response.is_custom_response && (
                                  <div>Custom Score: {response.custom_response_value || 'N/A'}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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