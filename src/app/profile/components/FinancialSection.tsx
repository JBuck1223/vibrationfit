'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface FinancialSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
}

const currencyOptions = [
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'Other', label: 'Other' }
]

const incomeOptions = [
  { value: '<10,000', label: 'Less than $10,000' },
  { value: '10,000-24,999', label: '$10,000 - $24,999' },
  { value: '25,000-49,999', label: '$25,000 - $49,999' },
  { value: '50,000-99,999', label: '$50,000 - $99,999' },
  { value: '100,000-249,999', label: '$100,000 - $249,999' },
  { value: '250,000-499,999', label: '$250,000 - $499,999' },
  { value: '500,000-999,999', label: '$500,000 - $999,999' },
  { value: '1,000,000+', label: '$1,000,000+' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

const debtOptions = [
  { value: 'None', label: 'None' },
  { value: 'Under 10,000', label: 'Under $10,000' },
  { value: '10,000-24,999', label: '$10,000 - $24,999' },
  { value: '25,000-49,999', label: '$25,000 - $49,999' },
  { value: '50,000-99,999', label: '$50,000 - $99,999' },
  { value: '100,000-249,999', label: '$100,000 - $249,999' },
  { value: '250,000-499,999', label: '$250,000 - $499,999' },
  { value: '500,000-999,999', label: '$500,000 - $999,999' },
  { value: '1,000,000+', label: '$1,000,000+' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

export function FinancialSection({ profile, onProfileChange, onProfileReload }: FinancialSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'money_wealth', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_money: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'money_wealth')
    const recordingToDelete = categoryRecordings[index]
    const allRecordings = profile.story_recordings || []
    const actualIndex = allRecordings.findIndex(r => r.url === recordingToDelete.url && r.created_at === recordingToDelete.created_at)
    if (actualIndex !== -1) {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(recordingToDelete.url)
        const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
        await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings }) })
        if (onProfileReload) await onProfileReload()
      } catch (error) { alert('Failed to delete recording.') }
    }
  }

  const getCurrencySymbol = () => {
    switch (profile.currency) {
      case 'USD': return '$'
      case 'EUR': return '€'
      case 'GBP': return '£'
      default: return '$'
    }
  }

  const formatIncomeLabel = (value: string) => {
    if (value === 'Prefer not to say') return value
    return value.replace(/\$/, getCurrencySymbol())
  }

  const formatDebtLabel = (value: string) => {
    if (value === 'Prefer not to say' || value === 'None') return value
    return value.replace(/\$/, getCurrencySymbol())
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">{getVisionCategoryLabel('money')}</h3>
      
      <div className="space-y-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Currency *
          </label>
          <select
            value={profile.currency || ''}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select currency</option>
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Household Income */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Household Income *
          </label>
          <select
            value={profile.household_income || ''}
            onChange={(e) => handleInputChange('household_income', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select income range</option>
            {incomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatIncomeLabel(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Savings & Retirement */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Combined Savings & Retirement *
          </label>
          <select
            value={profile.savings_retirement || ''}
            onChange={(e) => handleInputChange('savings_retirement', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select savings range</option>
            {incomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatIncomeLabel(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Assets/Equity */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Assets/Equity *
          </label>
          <select
            value={profile.assets_equity || ''}
            onChange={(e) => handleInputChange('assets_equity', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select assets range</option>
            {incomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatIncomeLabel(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Consumer Debt */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Consumer Debt *
          </label>
          <select
            value={profile.consumer_debt || ''}
            onChange={(e) => handleInputChange('consumer_debt', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select debt range</option>
            {debtOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatDebtLabel(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Financial Wellness Insights */}
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-green-400 mb-2">Financial Wellness</h4>
          <p className="text-sm text-neutral-300">
            Understanding your financial situation helps your AI assistant provide relevant money management and investment guidance for your goals.
          </p>
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('money')}?`}
          value={profile.clarity_money || ''}
          onChange={(value) => handleInputChange('clarity_money', value)}
          placeholder="Share what's going well with your financial journey, wealth goals, money mindset... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="money_wealth"
        />

        <SavedRecordings
          key={`money-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="money_wealth"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('money')}?`}
          value={profile.contrast_money || ''}
          onChange={(value) => handleInputChange('contrast_money', value)}
          placeholder="Share what's not going well with your finances or wealth, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="money_wealth"
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          <span className="font-medium text-primary-400">Privacy Assured:</span> All financial information is encrypted and used solely to personalize your AI assistant's guidance. This data is never shared or used for marketing purposes.
        </p>
      </div>
    </Card>
  )
}
