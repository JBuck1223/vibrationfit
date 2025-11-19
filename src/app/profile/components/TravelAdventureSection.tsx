'use client'

import React from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Plane, Plus, Trash2 } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface TravelAdventureSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
}

type Trip = {
  destination: string
  year?: string | null
  duration?: string | null
}

export function TravelAdventureSection({ profile, onProfileChange, onProfileReload, profileId }: TravelAdventureSectionProps) {
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
        body: JSON.stringify({ story_recordings: updatedRecordings, clarity_travel: updatedText }) 
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
        <Plane className="w-6 h-6 text-secondary-500" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('travel')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Travel Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Travel Frequency
          </label>
          <select
            value={profile.travel_frequency || ''}
            onChange={(e) => handleInputChange('travel_frequency', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select frequency...</option>
            <option value="never">Never</option>
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Passport */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.passport || false}
              onChange={(e) => handleInputChange('passport', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-neutral-700 bg-neutral-800 checked:bg-primary-500 checked:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors cursor-pointer"
            />
            <span className="text-sm font-medium text-neutral-200">I have a valid passport</span>
          </label>
        </div>

        {/* Countries Visited */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Countries Visited
          </label>
          <Input
            type="number"
            min="0"
            value={profile.countries_visited || 0}
            onChange={(e) => handleInputChange('countries_visited', parseInt(e.target.value) || 0)}
            placeholder="0"
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
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
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
                  className="bg-neutral-900 rounded-lg border border-neutral-700 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-400">Trip {index + 1}</span>
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

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('travel')}?`}
          value={profile.clarity_travel || ''}
          onChange={(value) => handleInputChange('clarity_travel', value)}
          placeholder="Share what's going well with your travel experiences, where you've been, how you like to travel... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('travel')}
          instanceId="clarity"
        />

        <SavedRecordings
          key={`travel-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('travel')}
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('travel')}?`}
          value={profile.contrast_travel || ''}
          onChange={(value) => handleInputChange('contrast_travel', value)}
          placeholder="Share what's not going well with your travel or adventures, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('travel')}
          instanceId="contrast"
        />

        {/* Dream Field */}
        <RecordingTextarea
          label={`What do you dream about in ${getVisionCategoryLabel('travel')}?`}
          value={profile.dream_travel || ''}
          onChange={(value) => handleInputChange('dream_travel', value)}
          placeholder="What's your ideal vision for travel and adventure? Where do you dream of going and what experiences do you crave?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('travel')}
          instanceId="dream"
        />

        {/* Worry Field */}
        <RecordingTextarea
          label={`What do you worry about in ${getVisionCategoryLabel('travel')}?`}
          value={profile.worry_travel || ''}
          onChange={(value) => handleInputChange('worry_travel', value)}
          placeholder="What concerns you most about travel—time, money, responsibilities, or something else?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('travel')}
          instanceId="worry"
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your travel interests helps Viva provide relevant destination suggestions and adventure planning guidance.
        </p>
      </div>
    </Card>
  )
}
