'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface FinancialSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
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

export function FinancialSection({ profile, onProfileChange, onProfileReload, onSave, isSaving, hasUnsavedChanges = false }: FinancialSectionProps) {
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false)
  const [isHouseholdIncomeDropdownOpen, setIsHouseholdIncomeDropdownOpen] = useState(false)
  const [isSavingsRetirementDropdownOpen, setIsSavingsRetirementDropdownOpen] = useState(false)
  const [isAssetsEquityDropdownOpen, setIsAssetsEquityDropdownOpen] = useState(false)
  const [isConsumerDebtDropdownOpen, setIsConsumerDebtDropdownOpen] = useState(false)
  const currencyDropdownRef = useRef<HTMLDivElement>(null)
  const householdIncomeDropdownRef = useRef<HTMLDivElement>(null)
  const savingsRetirementDropdownRef = useRef<HTMLDivElement>(null)
  const assetsEquityDropdownRef = useRef<HTMLDivElement>(null)
  const consumerDebtDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false)
      }
      if (householdIncomeDropdownRef.current && !householdIncomeDropdownRef.current.contains(event.target as Node)) {
        setIsHouseholdIncomeDropdownOpen(false)
      }
      if (savingsRetirementDropdownRef.current && !savingsRetirementDropdownRef.current.contains(event.target as Node)) {
        setIsSavingsRetirementDropdownOpen(false)
      }
      if (assetsEquityDropdownRef.current && !assetsEquityDropdownRef.current.contains(event.target as Node)) {
        setIsAssetsEquityDropdownOpen(false)
      }
      if (consumerDebtDropdownRef.current && !consumerDebtDropdownRef.current.contains(event.target as Node)) {
        setIsConsumerDebtDropdownOpen(false)
      }
    }

    if (isCurrencyDropdownOpen || isHouseholdIncomeDropdownOpen || isSavingsRetirementDropdownOpen || isAssetsEquityDropdownOpen || isConsumerDebtDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCurrencyDropdownOpen, isHouseholdIncomeDropdownOpen, isSavingsRetirementDropdownOpen, isAssetsEquityDropdownOpen, isConsumerDebtDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('money'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_money: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('money'))
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

  // Format options with currency symbol
  const formattedIncomeOptions = useMemo(() => {
    const symbol = getCurrencySymbol()
    return incomeOptions.map(opt => ({
      ...opt,
      label: opt.label === 'Prefer not to say' ? opt.label : opt.label.replace(/\$/, symbol)
    }))
  }, [profile.currency])

  const formattedDebtOptions = useMemo(() => {
    const symbol = getCurrencySymbol()
    return debtOptions.map(opt => ({
      ...opt,
      label: (opt.label === 'Prefer not to say' || opt.label === 'None') ? opt.label : opt.label.replace(/\$/, symbol)
    }))
  }, [profile.currency])

  const MoneyIcon = getVisionCategoryIcon('money')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MoneyIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('money')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Currency *
          </label>
          <div className="relative" ref={currencyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.currency && profile.currency !== 'USD'
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {/* Treat database default 'USD' as unselected for display */}
              {profile.currency && profile.currency !== 'USD'
                ? currencyOptions.find(opt => opt.value === profile.currency)?.label || profile.currency
                : 'Select currency'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isCurrencyDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsCurrencyDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {currencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('currency', option.value)
                        setIsCurrencyDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        profile.currency && profile.currency !== 'USD' && profile.currency === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Household Income */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Household Income *
          </label>
          <div className="relative" ref={householdIncomeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsHouseholdIncomeDropdownOpen(!isHouseholdIncomeDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.household_income 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {formattedIncomeOptions.find(opt => opt.value === (profile.household_income || ''))?.label || 'Select income range'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isHouseholdIncomeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isHouseholdIncomeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsHouseholdIncomeDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {formattedIncomeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('household_income', option.value)
                        setIsHouseholdIncomeDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.household_income || '') === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Savings & Retirement */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Combined Savings & Retirement *
          </label>
          <div className="relative" ref={savingsRetirementDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSavingsRetirementDropdownOpen(!isSavingsRetirementDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.savings_retirement 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {formattedIncomeOptions.find(opt => opt.value === (profile.savings_retirement || ''))?.label || 'Select savings range'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isSavingsRetirementDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isSavingsRetirementDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsSavingsRetirementDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {formattedIncomeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('savings_retirement', option.value)
                        setIsSavingsRetirementDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.savings_retirement || '') === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Assets/Equity */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Assets/Equity *
          </label>
          <div className="relative" ref={assetsEquityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAssetsEquityDropdownOpen(!isAssetsEquityDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.assets_equity 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {formattedIncomeOptions.find(opt => opt.value === (profile.assets_equity || ''))?.label || 'Select assets range'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isAssetsEquityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isAssetsEquityDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsAssetsEquityDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {formattedIncomeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('assets_equity', option.value)
                        setIsAssetsEquityDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.assets_equity || '') === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Consumer Debt */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Consumer Debt *
          </label>
          <div className="relative" ref={consumerDebtDropdownRef}>
            <button
              type="button"
              onClick={() => setIsConsumerDebtDropdownOpen(!isConsumerDebtDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.consumer_debt 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {formattedDebtOptions.find(opt => opt.value === (profile.consumer_debt || ''))?.label || 'Select debt range'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isConsumerDebtDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isConsumerDebtDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsConsumerDebtDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {formattedDebtOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('consumer_debt', option.value)
                        setIsConsumerDebtDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.consumer_debt || '') === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('money')}?`}
          value={profile.clarity_money || ''}
          onChange={(value) => handleInputChange('clarity_money', value)}
          placeholder="Share what's going well with your financial journey, wealth goals, money mindset... Or record your story!"
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('money')}
          instanceId="clarity"
        />
        <SavedRecordings
          key={`money-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('money')}
          onDelete={handleDeleteRecording}
        />        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('money')}?`}
          value={profile.contrast_money || ''}
          onChange={(value) => handleInputChange('contrast_money', value)}
          placeholder="Share what's not going well with your finances or wealth, or what you'd like to improve..."
          rows={6}
          storageFolder="profile"
          category={visionToRecordingKey('money')}
          instanceId="contrast"
        />      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          <span className="font-medium text-primary-400">Privacy Assured:</span> All financial information is encrypted and used solely to personalize your AI assistant's guidance. This data is never shared or used for marketing purposes.
        </p>
      </div>

      {/* Save Button - Bottom Right */}
      {onSave && (
        <div className="flex justify-end mt-6">
          <SaveButton
            onClick={onSave}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
          />
        </div>
      )}
    </Card>
  )
}
