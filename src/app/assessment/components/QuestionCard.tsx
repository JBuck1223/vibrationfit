// /src/app/assessment/components/QuestionCard.tsx
// Individual assessment question card component

'use client'

import { AssessmentQuestion, AssessmentOption } from '@/types/assessment'
import { Card } from '@/lib/design-system/components'
import { Check } from 'lucide-react'

interface QuestionCardProps {
  question: AssessmentQuestion
  selectedValue?: number
  onSelect: (option: AssessmentOption) => void
  questionNumber: number
  totalQuestions: number
}

export default function QuestionCard({
  question,
  selectedValue,
  onSelect,
  questionNumber,
  totalQuestions
}: QuestionCardProps) {
  return (
    <Card variant="elevated" className="p-8">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[#39FF14]">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        
        <h3 className="text-2xl font-semibold text-white mb-2">
          {question.text}
        </h3>
        
        <p className="text-sm text-neutral-400">
          Choose the response that most honestly describes your current state
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedValue === option.value
          
          let borderColor = 'border-neutral-600'
          let hoverBorderColor = 'hover:border-neutral-500'
          
          if (isSelected) {
            borderColor = 'border-[#39FF14]'
          }

          return (
            <button
              key={index}
              onClick={() => onSelect(option)}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200
                ${borderColor} ${hoverBorderColor}
                ${isSelected 
                  ? 'bg-neutral-700/50 scale-[1.02]' 
                  : 'bg-neutral-800/30 hover:bg-neutral-700/30'
                }
                text-left relative group
              `}
            >

              <div className="flex items-center gap-4">
                {/* Option Text */}
                <span className={`
                  flex-1 text-base
                  ${isSelected ? 'text-white font-medium' : 'text-neutral-300'}
                `}>
                  {option.text}
                </span>

                {/* Check Icon */}
                {isSelected && (
                  <Check className="flex-shrink-0 w-5 h-5 text-[#39FF14]" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

