"use client"

import React, { useState } from 'react'
import { Button } from '@/lib/design-system/components'
import { Check } from 'lucide-react'

interface DiscoveryOption {
  id: string
  label: string
  sublabel: string
  icon: string
  inputField?: boolean
}

interface DiscoveryQuestionProps {
  questionText: string
  options: DiscoveryOption[]
  onSubmit: (selections: string[], customInput?: string) => void
  multiSelect?: boolean
  showSubmitButton?: boolean // New prop to control button visibility
}

export function DiscoveryQuestion({
  questionText,
  options,
  onSubmit,
  multiSelect = true,
  showSubmitButton = true // Default to true for backwards compatibility
}: DiscoveryQuestionProps) {
  const [selections, setSelections] = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleToggle = (optionId: string) => {
    const newSelections = new Set(selections)
    
    if (multiSelect) {
      if (newSelections.has(optionId)) {
        newSelections.delete(optionId)
      } else {
        newSelections.add(optionId)
      }
    } else {
      newSelections.clear()
      newSelections.add(optionId)
    }

    // Show custom input if "other" option is selected
    if (optionId === 'other' || options.find(o => o.id === optionId)?.inputField) {
      setShowCustomInput(newSelections.has(optionId))
      if (!newSelections.has(optionId)) {
        setCustomInput('')
      }
    }

    setSelections(newSelections)
    
    // Auto-submit if button is hidden (for Step 2 questions)
    if (!showSubmitButton && newSelections.size > 0) {
      const selectedArray = Array.from(newSelections)
      onSubmit(selectedArray, customInput || undefined)
    }
  }

  const handleSubmit = () => {
    const selectedArray = Array.from(selections)
    onSubmit(selectedArray, customInput || undefined)
  }

  const isValid = selections.size > 0 && (!showCustomInput || customInput.trim().length > 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Question */}
      <h3 className="text-lg font-semibold text-white text-center">
        {questionText}
      </h3>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selections.has(option.id)
          
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-[#14B8A6] bg-[#14B8A6]/10'
                  : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
                }
                group
              `}
            >
              {/* Selection indicator */}
              {multiSelect && (
                <div className={`
                  absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'border-[#14B8A6] bg-[#14B8A6]' 
                    : 'border-neutral-600 bg-transparent'
                  }
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-1">
                  {option.icon}
                </div>

                {/* Label & Sublabel */}
                <div className="flex-1">
                  <div className={`font-semibold mb-1 transition-colors ${
                    isSelected ? 'text-[#14B8A6]' : 'text-white group-hover:text-neutral-200'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {option.sublabel}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom Input Field */}
      {showCustomInput && (
        <div className="animate-fadeIn">
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Tell me more..."
            className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#14B8A6] resize-none"
            rows={3}
            autoFocus
          />
        </div>
      )}

      {/* Submit Button - only show if showSubmitButton is true */}
      {showSubmitButton && (
        <>
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-8"
            >
              {multiSelect ? 'Continue' : 'Next'} →
            </Button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-neutral-500 text-center">
            {multiSelect ? 'Select all that resonate • No right or wrong answers' : 'Choose the one that resonates most'}
          </p>
        </>
      )}
      
      {/* Helper Text when button is hidden */}
      {!showSubmitButton && (
        <p className="text-xs text-neutral-500 text-center">
          Select all that resonate • Your choices will be saved automatically
        </p>
      )}
    </div>
  )
}

