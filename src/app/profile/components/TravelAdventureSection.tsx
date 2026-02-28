'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, SaveButton, Checkbox } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Plane, Plus, Trash2 } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import * as tokens from '@/lib/design-system/tokens'

interface TravelAdventureSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

type Trip = {
  destination: string
  year?: string | null
  duration?: string | null
}

export function TravelAdventureSection({ profile, onProfileChange, onProfileReload, profileId, onSave, isSaving, hasUnsavedChanges = false }: TravelAdventureSectionProps) {
  const [isTravelFrequencyDropdownOpen, setIsTravelFrequencyDropdownOpen] = useState(false)
  const travelFrequencyDropdownRef = useRef<HTMLDivElement>(null)

  const travelFrequencyOptions = [
    { value: '', label: 'Select frequency...' },
    { value: 'never', label: 'Never' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (travelFrequencyDropdownRef.current && !travelFrequencyDropdownRef.current.contains(event.target as Node)) {
        setIsTravelFrequencyDropdownOpen(false)
      }
    }

    if (isTravelFrequencyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTravelFrequencyDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  // Initialize trips array
  const trips: Trip[] = profile.trips || []

  const handleTripChange = (index: number, field: keyof Trip, value: string) => {
    const updated = [...trips]
    updated[index] = { ...updated[index], [field]: value }
    handleInputChange('trips', updated)
  }

  const handleTripAdd = () => {
    const newTrip: Trip = {
      destination: '',
      year: null,
      duration: null
    }
    handleInputChange('trips', [...trips, newTrip])
  }

  const handleTripRemove = (index: number) => {
    const updated = trips.filter((_, i) => i !== index)
    handleInputChange('trips', updated)
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('travel'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      await fetch(apiUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ story_recordings: updatedRecordings, state_travel: updatedText }) 
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) { 
      console.error('Failed to save recording:', error)
      alert('Failed to save recording.') 
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('travel'))
    const recordingToDelete = categoryRecordings[index]
    const allRecordings = profile.story_recordings || []
    const actualIndex = allRecordings.findIndex(r => r.url === recordingToDelete.url && r.created_at === recordingToDelete.created_at)
    if (actualIndex !== -1) {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        if (recordingToDelete.url) {
          await deleteRecording(recordingToDelete.url)
        }
        
        const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
        
        // Build API URL with profileId if provided
        const apiUrl = profileId 
          ? `/api/profile?profileId=${profileId}`
          : '/api/profile'
        
        const response = await fetch(apiUrl, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ story_recordings: updatedRecordings }) 
        })
        
        if (!response.ok) {
          throw new Error('Failed to update profile')
        }
        
        if (onProfileReload) await onProfileReload()
      } catch (error) { 
        console.error('Failed to delete recording:', error)
        alert('Failed to delete recording.') 
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plane className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('travel')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Travel Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Travel Frequency
          </label>
          <div className="relative" ref={travelFrequencyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTravelFrequencyDropdownOpen(!isTravelFrequencyDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.travel_frequency 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {travelFrequencyOptions.find(opt => opt.value === (profile.travel_frequency || ''))?.label || 'Select frequency...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isTravelFrequencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isTravelFrequencyDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsTravelFrequencyDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {travelFrequencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('travel_frequency', option.value)
                        setIsTravelFrequencyDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.travel_frequency || '') === option.value 
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

        {/* Passport */}
        <div>
          <Checkbox
            label="I have a valid passport"
            checked={profile.passport || false}
            onChange={(e) => handleInputChange('passport', e.target.checked)}
          />
        </div>

        {/* Countries Visited */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Countries Visited
          </label>
          <Input
            type="number"
            min="0"
            value={profile.countries_visited != null && profile.countries_visited > 0 ? profile.countries_visited : ''}
            onChange={(e) => handleInputChange('countries_visited', e.target.value !== '' ? parseInt(e.target.value) || 0 : null)}
            placeholder="How many countries have you visited?"
            className="w-full"
          />
        </div>

        {/* Trips I've Taken Table */}
        <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white">Trips I've Taken</h4>
            <button
              type="button"
              onClick={handleTripAdd}
              className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Trip
            </button>
          </div>

          {trips.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              Click "Add Trip" to add your first trip
            </p>
          ) : (
            <div className="space-y-3">
              {trips.map((trip, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 p-4 space-y-3"
                  style={{
                    backgroundColor: tokens.colors.neutral.cardBg,
                    borderColor: tokens.colors.neutral.borderLight
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-300 uppercase">Trip {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleTripRemove(index)}
                      className="text-neutral-400 hover:text-red-400 transition-colors"
                      title="Remove trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Destination *
                      </label>
                      <Input
                        type="text"
                        value={trip.destination || ''}
                        onChange={(e) => handleTripChange(index, 'destination', e.target.value)}
                        placeholder="e.g., Paris, France"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Year
                      </label>
                      <Input
                        type="text"
                        value={trip.year || ''}
                        onChange={(e) => handleTripChange(index, 'year', e.target.value)}
                        placeholder="e.g., 2023"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Duration
                      </label>
                      <Input
                        type="text"
                        value={trip.duration || ''}
                        onChange={(e) => handleTripChange(index, 'duration', e.target.value)}
                        placeholder="e.g., 1 week, 2 days"
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State Field */}
        <RecordingTextarea
          label={`Current State of ${getVisionCategoryLabel('travel')}`}
          description="Describe your current relationship with travel and adventure. What experiences light you up and what do you feel is missing? Share both the highlights and the gaps — we'll use all of it to shape your vision."
          value={profile.state_travel || ''}
          onChange={(value) => handleInputChange('state_travel', value)}
          placeholder="Type or click the microphone to turn your voice into text."
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          recordingPurpose="quick"
          category={visionToRecordingKey('travel')}
          instanceId="state"
        />
        <SavedRecordings
          key={`travel-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('travel')}
          onDelete={handleDeleteRecording}
        />      </div>

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
