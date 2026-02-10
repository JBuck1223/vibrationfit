import { Card, Badge, ProgressBar, Button } from '@/lib/design-system/components'
import { AssessmentResult, AssessmentCategory, AssessmentResponse } from '@/types/assessment'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { categoryMetadata } from '@/lib/assessment/questions'
import { useState } from 'react'
import AssessmentBarChart from './AssessmentBarChart'

interface ResultsSummaryProps {
  assessment: AssessmentResult
  responses?: AssessmentResponse[]
}

export default function ResultsSummary({ assessment, responses = [] }: ResultsSummaryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  console.log('📊 ResultsSummary received:', {
    assessmentId: assessment?.id,
    responsesCount: responses?.length,
    hasResponses: !!responses,
    sampleResponse: responses?.[0]
  })
  
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

  const getResponseStatus = (responseValue: number): 'above' | 'transition' | 'below' => {
    if (responseValue >= 4) return 'above'
    if (responseValue === 3) return 'transition'
    return 'below'
  }

  const getResponseStatusBadge = (responseValue: number) => {
    const status = getResponseStatus(responseValue)
    switch (status) {
      case 'above':
        return <Badge variant="success">Above</Badge>
      case 'transition':
        return <Badge variant="warning">Transition</Badge>
      case 'below':
        return <Badge variant="error">Below</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'above':
        return <TrendingUp className="w-4 h-4 text-[#39FF14]" />
      case 'below':
        return <TrendingDown className="w-4 h-4 text-[#FF0040]" />
      case 'transition':
      case 'neutral':
        return <Minus className="w-4 h-4 text-[#FFB701]" />
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
      case 'transition':
      case 'neutral':
        return 'warning'
      default:
        return 'info'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'above':
        return 'Above'
      case 'below':
        return 'Below'
      case 'transition':
      case 'neutral':
        return 'Transition'
      default:
        return 'Transition'
    }
  }

  // Get all 12 categories with real data from assessment
  const allCategories: AssessmentCategory[] = [
    'fun', 'travel', 'home', 'family', 'love', 'health',
    'money', 'work', 'social', 'stuff', 'giving', 'spirituality'
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
      <Card className="p-4 md:p-6 lg:p-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">Vibrational Score</h3>
        
        <div className="text-center space-y-6">
          {/* Large Percentage */}
          <div className="text-4xl font-bold text-primary-500">
            {assessment.overall_percentage || 0}%
          </div>
          
          {/* Progress Bar */}
          <div>
            <ProgressBar
              value={assessment.overall_percentage || 0}
              variant="primary"
            />
          </div>
          
          {/* Score Text */}
          <p className="text-sm text-white">
            Scored {assessment.total_score || 0}/{assessment.max_possible_score || 420} on assessment questions.
          </p>
        </div>
      </Card>

      {/* Bar Chart Visualization */}
      <AssessmentBarChart assessment={assessment} />

      {/* Category Breakdown */}
      <Card className="p-4 md:p-6 lg:p-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">Category Breakdown</h3>
        
        {/* Table Header - Desktop Only */}
        <div className="hidden xl:grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 md:gap-6 p-4 bg-neutral-900/50 rounded-lg mb-2 text-xs md:text-sm font-semibold text-neutral-400">
          <div>Category</div>
          <div className="text-center">Percentage Score</div>
          <div className="text-center">Question Score</div>
          <div className="text-center">Green Line Status</div>
          <div className="text-center">Responses</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {categories.map((category, index) => {
            const categoryResponses = responses.filter(r => r.category === category.category)
            const isExpanded = expandedCategories.has(category.category)
            
            return (
              <div key={index} className="bg-neutral-800/50 rounded-lg">
                {/* Desktop Table Row */}
                <div className="hidden xl:grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 md:gap-6 p-4 items-center">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category.status)}
                    <span className="text-white font-medium">{category.name}</span>
                  </div>
                  <div className="text-white font-medium text-center">{category.percentage}%</div>
                  <div className="text-neutral-400 text-sm text-center">{category.score}/{category.maxScore}</div>
                  <div className="flex justify-center">
                    <Badge variant={getCategoryColor(category.status)}>
                      {getCategoryLabel(category.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-center">
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

                {/* Mobile Stacked Layout */}
                <div className="xl:hidden p-4 space-y-3">
                  {/* Category Name */}
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category.status)}
                    <span className="text-white font-medium text-lg">{category.name}</span>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-400 mb-1">Percentage Score</span>
                      <span className="text-white font-medium">{category.percentage}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-400 mb-1">Question Score</span>
                      <span className="text-neutral-400 text-sm">{category.score}/{category.maxScore}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col">
                    <span className="text-xs text-neutral-400 mb-1">Green Line Status</span>
                    <div>
                      <Badge variant={getCategoryColor(category.status)}>
                        {getCategoryLabel(category.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Responses Button */}
                  {categoryResponses.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => toggleCategory(category.category)}
                      className="text-xs p-2 w-full justify-center"
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
                
                {isExpanded && categoryResponses.length > 0 && (
                  <div className="px-4 pb-4 border-t border-neutral-700">
                    <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                      {categoryResponses.map((response, responseIndex) => (
                        <div key={responseIndex} className="p-3 bg-neutral-900/50 rounded text-sm">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                            <div className="flex-1 mb-3 md:mb-0">
                              <div className="font-medium text-white mb-1">
                                {response.question_text}
                              </div>
                              <div className="text-neutral-300 mb-1">
                                <strong>Response:</strong> {response.response_text}
                              </div>
                            </div>
                            
                            {/* Desktop: Right side */}
                            <div className="hidden md:block ml-4 text-right space-y-2">
                              <div className="flex justify-end">
                                {getResponseStatusBadge(response.response_value)}
                              </div>
                              <div className="text-xs text-neutral-400">
                                <div>Response Value: {response.response_value}</div>
                                {response.is_custom_response && (
                                  <div>Custom Score: {response.custom_response_value || 'N/A'}</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Mobile: Below content, 50/50 split */}
                            <div className="md:hidden flex gap-2">
                              <div className="flex-1 flex justify-center">
                                {getResponseStatusBadge(response.response_value)}
                              </div>
                              <div className="flex-1 text-xs text-neutral-400 flex items-center justify-center">
                                <div>Response Value: {response.response_value}</div>
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
        <h3 className="text-xl font-semibold text-white mb-4 text-center">Key Insights</h3>
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
                {transitionCategories.length > 0 && (
                  <div className="p-4 bg-[#FFB701]/10 border border-[#FFB701]/30 rounded-lg">
                    <p className="text-sm text-white">
                      <strong className="text-[#FFB701]">In Transition:</strong> {transitionCategories.map(c => c.name).join(', ')} {transitionCategories.length === 1 ? 'is' : 'are'} in transition - keep building momentum.
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
              </>
            )
          })()}
        </div>
      </Card>
    </div>
  )
}