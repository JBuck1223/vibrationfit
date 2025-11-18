'use client'

import React from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Package, Plus, Trash2, Save } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface PossessionsLifestyleSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
  onSave?: () => void
  isSaving?: boolean
}

type VehicleOrToy = {
  name: string
  year_acquired?: string | null
  ownership_status: 'paid_in_full' | 'own_with_payment' | 'leased' | 'borrowed'
}

export function PossessionsLifestyleSection({ profile, onProfileChange, onProfileReload, profileId, onSave, isSaving }: PossessionsLifestyleSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  // Initialize vehicles and toys arrays
  const vehicles: VehicleOrToy[] = profile.vehicles || []
  const toys: VehicleOrToy[] = profile.toys || []

  const handleVehicleChange = (index: number, field: keyof VehicleOrToy, value: string) => {
    const updated = [...vehicles]
    updated[index] = { ...updated[index], [field]: value }
    handleInputChange('vehicles', updated)
  }

  const handleVehicleAdd = () => {
    const newVehicle: VehicleOrToy = {
      name: '',
      year_acquired: null,
      ownership_status: 'paid_in_full'
    }
    handleInputChange('vehicles', [...vehicles, newVehicle])
  }

  const handleVehicleRemove = (index: number) => {
    const updated = vehicles.filter((_, i) => i !== index)
    handleInputChange('vehicles', updated)
  }

  const handleToyChange = (index: number, field: keyof VehicleOrToy, value: string) => {
    const updated = [...toys]
    updated[index] = { ...updated[index], [field]: value }
    handleInputChange('toys', updated)
  }

  const handleToyAdd = () => {
    const newToy: VehicleOrToy = {
      name: '',
      year_acquired: null,
      ownership_status: 'paid_in_full'
    }
    handleInputChange('toys', [...toys, newToy])
  }

  const handleToyRemove = (index: number) => {
    const updated = toys.filter((_, i) => i !== index)
    handleInputChange('toys', updated)
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'stuff', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      await fetch(apiUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ story_recordings: updatedRecordings, clarity_stuff: updatedText }) 
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) { 
      console.error('Failed to save recording:', error)
      alert('Failed to save recording.') 
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'stuff')
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
        <Package className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('stuff')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Lifestyle Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Lifestyle Category
          </label>
          <select
            value={profile.lifestyle_category || ''}
            onChange={(e) => handleInputChange('lifestyle_category', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select category...</option>
            <option value="minimalist">Minimalist</option>
            <option value="moderate">Moderate</option>
            <option value="comfortable">Comfortable</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>

        {/* Vehicles Table */}
        <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Vehicles</h4>
              <button
                type="button"
                onClick={handleVehicleAdd}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">
                Click "Add Vehicle" to add your first vehicle
              </p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900 rounded-lg border border-neutral-700 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-400">Vehicle {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleVehicleRemove(index)}
                        className="text-neutral-400 hover:text-red-400 transition-colors"
                        title="Remove vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Vehicle Name *
                        </label>
                        <Input
                          type="text"
                          value={vehicle.name || ''}
                          onChange={(e) => handleVehicleChange(index, 'name', e.target.value)}
                          placeholder="e.g., 2020 Toyota Camry"
                          className="w-full text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Year Acquired
                        </label>
                        <Input
                          type="text"
                          value={vehicle.year_acquired || ''}
                          onChange={(e) => handleVehicleChange(index, 'year_acquired', e.target.value)}
                          placeholder="e.g., 2020"
                          className="w-full text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Ownership Status *
                        </label>
                        <select
                          value={vehicle.ownership_status || 'paid_in_full'}
                          onChange={(e) => handleVehicleChange(index, 'ownership_status', e.target.value as VehicleOrToy['ownership_status'])}
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                        >
                          <option value="paid_in_full">Paid In Full</option>
                          <option value="own_with_payment">Own with a payment</option>
                          <option value="leased">Leased</option>
                          <option value="borrowed">Borrowed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Toys Table */}
        <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Toys</h4>
              <p className="text-xs text-neutral-400">
                RVs, Boats, Trampolines, or any recreational items you want to list
              </p>
            </div>
            <button
              type="button"
              onClick={handleToyAdd}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Toy
            </button>
          </div>

          {toys.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              Click "Add Toy" to add your first recreational item
            </p>
          ) : (
            <div className="space-y-3">
              {toys.map((toy, index) => (
                <div
                  key={index}
                  className="bg-neutral-900 rounded-lg border border-neutral-700 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-400">Toy {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleToyRemove(index)}
                      className="text-neutral-400 hover:text-red-400 transition-colors"
                      title="Remove toy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Item Name *
                      </label>
                      <Input
                        type="text"
                        value={toy.name || ''}
                        onChange={(e) => handleToyChange(index, 'name', e.target.value)}
                        placeholder="e.g., RV, Boat, Trampoline"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Year Acquired
                      </label>
                      <Input
                        type="text"
                        value={toy.year_acquired || ''}
                        onChange={(e) => handleToyChange(index, 'year_acquired', e.target.value)}
                        placeholder="e.g., 2020"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Ownership Status *
                      </label>
                      <select
                        value={toy.ownership_status || 'paid_in_full'}
                        onChange={(e) => handleToyChange(index, 'ownership_status', e.target.value as VehicleOrToy['ownership_status'])}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                      >
                        <option value="paid_in_full">Paid In Full</option>
                        <option value="own_with_payment">Own with a payment</option>
                        <option value="leased">Leased</option>
                        <option value="borrowed">Borrowed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('stuff')}?`}
          value={profile.clarity_stuff || ''}
          onChange={(value) => handleInputChange('clarity_stuff', value)}
          placeholder="Share what's going well with your lifestyle, what possessions matter to you, how you live... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="stuff"
        />

        <SavedRecordings
          key={`possessions-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="stuff"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('stuff')}?`}
          value={profile.contrast_stuff || ''}
          onChange={(value) => handleInputChange('contrast_stuff', value)}
          placeholder="Share what's not going well with your lifestyle or possessions, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="stuff"
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your lifestyle preferences helps Viva provide relevant suggestions for lifestyle improvements and material goals.
        </p>
      </div>

      {/* Save Button - Bottom Right */}
      {onSave && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={onSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </Card>
  )
}
