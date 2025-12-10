'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Package, Plus, Trash2 } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import * as tokens from '@/lib/design-system/tokens'

interface PossessionsLifestyleSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

type VehicleOrToy = {
  name: string
  year_acquired?: string | null
  ownership_status: 'paid_in_full' | 'own_with_payment' | 'leased' | 'borrowed'
}

export function PossessionsLifestyleSection({ profile, onProfileChange, onProfileReload, profileId, onSave, isSaving, hasUnsavedChanges = false }: PossessionsLifestyleSectionProps) {
  const [isLifestyleCategoryDropdownOpen, setIsLifestyleCategoryDropdownOpen] = useState(false)
  const [openVehicleDropdowns, setOpenVehicleDropdowns] = useState<Map<number, boolean>>(new Map())
  const [openToyDropdowns, setOpenToyDropdowns] = useState<Map<number, boolean>>(new Map())
  const lifestyleCategoryDropdownRef = useRef<HTMLDivElement>(null)
  const vehicleDropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const toyDropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const lifestyleCategoryOptions = [
    { value: '', label: 'Select category...' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'luxury', label: 'Luxury' },
  ]

  const ownershipStatusOptions = [
    { value: 'paid_in_full', label: 'Paid In Full' },
    { value: 'own_with_payment', label: 'Own with a payment' },
    { value: 'leased', label: 'Leased' },
    { value: 'borrowed', label: 'Borrowed' },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lifestyleCategoryDropdownRef.current && !lifestyleCategoryDropdownRef.current.contains(event.target as Node)) {
        setIsLifestyleCategoryDropdownOpen(false)
      }
      
      // Check vehicle dropdowns
      vehicleDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenVehicleDropdowns(prev => {
            const next = new Map(prev)
            next.set(index, false)
            return next
          })
        }
      })
      
      // Check toy dropdowns
      toyDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenToyDropdowns(prev => {
            const next = new Map(prev)
            next.set(index, false)
            return next
          })
        }
      })
    }

    if (isLifestyleCategoryDropdownOpen || openVehicleDropdowns.size > 0 || openToyDropdowns.size > 0) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLifestyleCategoryDropdownOpen, openVehicleDropdowns, openToyDropdowns])

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
    const newRecording = { url, transcript, type, category: visionToRecordingKey('stuff'), created_at: new Date().toISOString() }
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
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('stuff'))
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
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel(visionToRecordingKey('stuff'))}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Lifestyle Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Lifestyle Category
          </label>
          <div className="relative" ref={lifestyleCategoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLifestyleCategoryDropdownOpen(!isLifestyleCategoryDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.lifestyle_category 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {lifestyleCategoryOptions.find(opt => opt.value === (profile.lifestyle_category || ''))?.label || 'Select category...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isLifestyleCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isLifestyleCategoryDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLifestyleCategoryDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {lifestyleCategoryOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('lifestyle_category', option.value)
                        setIsLifestyleCategoryDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.lifestyle_category || '') === option.value 
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

        {/* Vehicles Table */}
        <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Vehicles</h4>
              <button
                type="button"
                onClick={handleVehicleAdd}
                className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 rounded-lg transition-colors text-sm font-medium"
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
                    className="rounded-lg border-2 p-4 space-y-3"
                    style={{
                      backgroundColor: tokens.colors.neutral.cardBg,
                      borderColor: tokens.colors.neutral.borderLight
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-300 uppercase">Vehicle {index + 1}</span>
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
                        <div 
                          className="relative" 
                          ref={(el) => {
                            if (el) vehicleDropdownRefs.current.set(index, el)
                            else vehicleDropdownRefs.current.delete(index)
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenVehicleDropdowns(prev => {
                                const next = new Map(prev)
                                next.set(index, !next.get(index))
                                return next
                              })
                            }}
                            className="w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] text-white text-sm border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                          >
                            {ownershipStatusOptions.find(opt => opt.value === (vehicle.ownership_status || 'paid_in_full'))?.label || 'Paid In Full'}
                          </button>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${openVehicleDropdowns.get(index) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          
                          {openVehicleDropdowns.get(index) && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => {
                                  setOpenVehicleDropdowns(prev => {
                                    const next = new Map(prev)
                                    next.set(index, false)
                                    return next
                                  })
                                }}
                              />
                              <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                                {ownershipStatusOptions.map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      handleVehicleChange(index, 'ownership_status', option.value as VehicleOrToy['ownership_status'])
                                      setOpenVehicleDropdowns(prev => {
                                        const next = new Map(prev)
                                        next.set(index, false)
                                        return next
                                      })
                                    }}
                                    className={`w-full px-6 py-2 text-left transition-colors ${
                                      (vehicle.ownership_status || 'paid_in_full') === option.value 
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
              className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 rounded-lg transition-colors text-sm font-medium"
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
                  className="rounded-lg border-2 p-4 space-y-3"
                  style={{
                    backgroundColor: tokens.colors.neutral.cardBg,
                    borderColor: tokens.colors.neutral.borderLight
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-300 uppercase">Toy {index + 1}</span>
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
                      <div 
                        className="relative" 
                        ref={(el) => {
                          if (el) toyDropdownRefs.current.set(index, el)
                          else toyDropdownRefs.current.delete(index)
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenToyDropdowns(prev => {
                              const next = new Map(prev)
                              next.set(index, !next.get(index))
                              return next
                            })
                          }}
                          className="w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] text-white text-sm border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                        >
                          {ownershipStatusOptions.find(opt => opt.value === (toy.ownership_status || 'paid_in_full'))?.label || 'Paid In Full'}
                        </button>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className={`w-4 h-4 text-neutral-400 transition-transform ${openToyDropdowns.get(index) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        
                        {openToyDropdowns.get(index) && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => {
                                setOpenToyDropdowns(prev => {
                                  const next = new Map(prev)
                                  next.set(index, false)
                                  return next
                                })
                              }}
                            />
                            <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                              {ownershipStatusOptions.map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    handleToyChange(index, 'ownership_status', option.value as VehicleOrToy['ownership_status'])
                                    setOpenToyDropdowns(prev => {
                                      const next = new Map(prev)
                                      next.set(index, false)
                                      return next
                                    })
                                  }}
                                  className={`w-full px-6 py-2 text-left transition-colors ${
                                    (toy.ownership_status || 'paid_in_full') === option.value 
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel(visionToRecordingKey('stuff'))}?`}
          value={profile.clarity_stuff || ''}
          onChange={(value) => handleInputChange('clarity_stuff', value)}
          placeholder="Share what's going well with your lifestyle, what possessions matter to you, how you live... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('stuff')}
          instanceId="clarity"
        />
        <SavedRecordings
          key={`possessions-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('stuff')}
          onDelete={handleDeleteRecording}
        />        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel(visionToRecordingKey('stuff'))}?`}
          value={profile.contrast_stuff || ''}
          onChange={(value) => handleInputChange('contrast_stuff', value)}
          placeholder="Share what's not going well with your lifestyle or possessions, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('stuff')}
          instanceId="contrast"
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
