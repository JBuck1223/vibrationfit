'use client'

import React from 'react'
import { Card, Input, Button, Textarea } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'

interface HealthSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

const exerciseFrequencyOptions = [
  { value: 'None', label: 'None' },
  { value: '1-2x', label: '1-2 times per week' },
  { value: '3-4x', label: '3-4 times per week' },
  { value: '5+', label: '5+ times per week' }
]

export function HealthSection({ profile, onProfileChange }: HealthSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const isMetric = profile.units === 'Metric'
  const heightUnit = isMetric ? 'cm' : 'inches'
  const weightUnit = isMetric ? 'kg' : 'lbs'

  // Convert height for display (database stores in inches or cm)
  const getDisplayHeight = () => {
    if (!profile.height) return ''
    return profile.height.toString()
  }

  // Convert weight for display (database stores in pounds or kg)
  const getDisplayWeight = () => {
    if (!profile.weight) return ''
    return profile.weight.toString()
  }

  const handleHeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      handleInputChange('height', numValue)
    }
  }

  const handleWeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      handleInputChange('weight', numValue)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Health & Fitness</h3>
      
      <div className="space-y-6">
        {/* Units Toggle */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            Measurement Units *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="units"
                checked={profile.units === 'US'}
                onChange={() => handleInputChange('units', 'US')}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">US (ft/in, lbs)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="units"
                checked={profile.units === 'Metric'}
                onChange={() => handleInputChange('units', 'Metric')}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">Metric (cm, kg)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Height ({heightUnit}) *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={getDisplayHeight()}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder={isMetric ? "170" : "68"}
                min="0"
                step="0.1"
                className="w-full pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400">
                {heightUnit}
              </div>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Weight ({weightUnit}) *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={getDisplayWeight()}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder={isMetric ? "70" : "150"}
                min="0"
                step="0.1"
                className="w-full pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400">
                {weightUnit}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Exercise Frequency *
          </label>
          <select
            value={profile.exercise_frequency || ''}
            onChange={(e) => handleInputChange('exercise_frequency', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select exercise frequency</option>
            {exerciseFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* BMI Calculator - Optional */}
        {profile.height && profile.weight && (
          <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-primary-400 mb-2">Health Insights</h4>
            <p className="text-sm text-neutral-300">
              Your BMI is approximately <span className="font-medium text-white">
                {(() => {
                  const height = profile.height!
                  const weight = profile.weight!
                  const heightInMeters = isMetric ? height / 100 : height * 0.0254
                  const weightInKg = isMetric ? weight : weight * 0.453592
                  const bmi = weightInKg / (heightInMeters * heightInMeters)
                  return bmi.toFixed(1)
                })()}
              </span>
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              This information helps your AI assistant provide personalized health and wellness guidance.
            </p>
          </div>
        )}

        {/* Health & Vitality Story */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Health & Vitality
          </label>
          <Textarea
            value={profile.health_vitality_story || ''}
            onChange={(e) => handleInputChange('health_vitality_story', e.target.value)}
            placeholder="Share your health journey, fitness goals, wellness practices, or any health-related aspirations..."
            rows={4}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your health context and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Health information helps your AI assistant provide personalized fitness and wellness recommendations.
        </p>
      </div>
    </Card>
  )
}
