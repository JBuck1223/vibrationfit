'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { Plus, X, Minus } from 'lucide-react'
import { UserProfile } from '@/lib/supabase/profile'

interface FamilySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

const childrenAgeOptions = [
  { value: '0-2 years', label: '0-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '6-8 years', label: '6-8 years' },
  { value: '9-11 years', label: '9-11 years' },
  { value: '12-14 years', label: '12-14 years' },
  { value: '15-17 years', label: '15-17 years' },
  { value: '18+ years', label: '18+ years' }
]

export function FamilySection({ profile, onProfileChange }: FamilySectionProps) {
  const [childrenAges, setChildrenAges] = useState<string[]>(
    profile.children_ages || []
  )
  const isUserActionRef = useRef(false)

  // Keep local state in sync with profile data, but preserve local changes
  useEffect(() => {
    // Don't sync if user is actively making changes
    if (isUserActionRef.current) {
      return
    }
    
    const profileAges = profile.children_ages || []
    const numberOfChildren = profile.number_of_children || 0
    
    // Only update local state if:
    // 1. Profile has data and we don't have any local data, OR
    // 2. The number of children in profile is different from our local array length
    if ((profileAges.length > 0 && childrenAges.length === 0) ||
        (numberOfChildren > 0 && childrenAges.length !== numberOfChildren)) {
      
      // Ensure the ages array matches the number of children
      const adjustedAges = [...profileAges]
      while (adjustedAges.length < numberOfChildren) {
        adjustedAges.push('')
      }
      if (adjustedAges.length > numberOfChildren) {
        adjustedAges.splice(numberOfChildren)
      }
      
      
      setChildrenAges(adjustedAges)
    }
  }, [profile.children_ages, profile.number_of_children])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleHasChildrenChange = (hasChildren: boolean) => {
    handleInputChange('has_children', hasChildren)
    
    if (!hasChildren) {
      // Clear children-related fields if no children
      handleInputChange('number_of_children', null)
      setChildrenAges([])
      handleInputChange('children_ages', [])
    } else {
      // Set default number of children to 1 if they have children
      if (!profile.number_of_children) {
        handleInputChange('number_of_children', 1)
      }
    }
  }

  const handleNumberOfChildrenChange = (number: number) => {
    // Mark that user is making changes
    isUserActionRef.current = true
    
    handleInputChange('number_of_children', number)
    
    // Adjust children ages array to match the number
    const currentAges = childrenAges || []
    const newAges = [...currentAges]
    
    if (number > currentAges.length) {
      // Add empty ages for new children
      for (let i = currentAges.length; i < number; i++) {
        newAges.push('')
      }
    } else if (number < currentAges.length) {
      // Remove excess ages
      newAges.splice(number)
    }
    
    setChildrenAges(newAges)
    handleInputChange('children_ages', newAges.filter(age => age !== ''))
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isUserActionRef.current = false
    }, 1000)
  }

  const handleChildAgeChange = (index: number, age: string) => {
    const newAges = [...childrenAges]
    newAges[index] = age
    setChildrenAges(newAges)
    handleInputChange('children_ages', newAges.filter(age => age !== ''))
  }

  const hasChildren = profile.has_children === true
  const numberOfChildren = profile.number_of_children || 0

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Family</h3>
      
      <div className="space-y-6">
        {/* Has Children */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            Do you have children? *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_children"
                checked={hasChildren === true}
                onChange={() => handleHasChildrenChange(true)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_children"
                checked={hasChildren === false}
                onChange={() => handleHasChildrenChange(false)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">No</span>
            </label>
          </div>
        </div>

        {/* Number of Children - Conditional */}
        {hasChildren && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              How many children do you have? *
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => numberOfChildren > 1 && handleNumberOfChildrenChange(numberOfChildren - 1)}
                disabled={numberOfChildren <= 1}
                className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-neutral-400" />
              </button>
              
              <Input
                type="number"
                value={numberOfChildren}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 0
                  if (num >= 0 && num <= 20) {
                    handleNumberOfChildrenChange(num)
                  }
                }}
                min="1"
                max="20"
                className="w-20 text-center"
              />
              
              <button
                onClick={() => numberOfChildren < 20 && handleNumberOfChildrenChange(numberOfChildren + 1)}
                disabled={numberOfChildren >= 20}
                className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        )}

        {/* Children Ages - Conditional */}
        {hasChildren && numberOfChildren > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Children's Ages *
            </label>
            <div className="space-y-3">
              {Array.from({ length: numberOfChildren }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400 w-20">
                    Child {index + 1}:
                  </span>
                  <select
                    value={childrenAges[index] || ''}
                    onChange={(e) => handleChildAgeChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select age range</option>
                    {childrenAgeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Family information helps your AI assistant understand your responsibilities and provide relevant guidance for your life planning.
        </p>
      </div>
    </Card>
  )
}
