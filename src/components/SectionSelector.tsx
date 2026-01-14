'use client'

import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { Toggle } from '@/lib/design-system/components'
import { CheckSquare, Square, AlertCircle } from 'lucide-react'

interface SectionSelectorProps {
  allSelected: boolean
  onAllSelectedChange: (value: boolean) => void
  selectedSections: string[]
  onSelectedSectionsChange: (sections: string[]) => void
  label?: string
  description?: string
  /** 
   * Optional: Limit which sections can be selected. 
   * If not provided, all sections are available.
   * If provided with empty array, all sections are disabled.
   */
  availableSections?: string[]
}

export function SectionSelector({
  allSelected,
  onAllSelectedChange,
  selectedSections,
  onSelectedSectionsChange,
  label = 'All 14 Sections',
  description,
  availableSections
}: SectionSelectorProps) {
  // Determine which sections are available
  const hasRestrictions = availableSections !== undefined
  const availableSet = new Set(availableSections || [])
  const availableCount = hasRestrictions ? availableSet.size : VISION_CATEGORIES.length
  
  // Dynamic label when sections are restricted
  const dynamicLabel = hasRestrictions && availableCount < VISION_CATEGORIES.length
    ? `All ${availableCount} Available`
    : label

  const toggleSection = (key: string, checked: boolean) => {
    // Don't allow selecting unavailable sections
    if (hasRestrictions && !availableSet.has(key)) return
    
    if (checked) {
      onSelectedSectionsChange([...selectedSections, key])
    } else {
      onSelectedSectionsChange(selectedSections.filter(k => k !== key))
    }
  }

  const selectAll = () => {
    // Only select available sections
    if (hasRestrictions) {
      onSelectedSectionsChange([...availableSet])
    } else {
      onSelectedSectionsChange(VISION_CATEGORIES.map(c => c.key))
    }
  }

  const selectNone = () => {
    onSelectedSectionsChange([])
  }

  return (
    <div className="space-y-3">
      {/* Warning if limited sections */}
      {hasRestrictions && availableCount < VISION_CATEGORIES.length && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            {availableCount === 0 
              ? 'No voice-only tracks available. Generate voice-only tracks first.'
              : `Only ${availableCount} of ${VISION_CATEGORIES.length} sections have voice-only tracks available for mixing.`
            }
          </p>
        </div>
      )}

      {/* Toggle Row */}
      <div className="flex justify-center">
        {/* Mobile Toggle (wider, shorter labels) */}
        <div className="sm:hidden">
          <Toggle
            value={allSelected ? 'all' : 'specific'}
            onChange={(val) => onAllSelectedChange(val === 'all')}
            options={[
              { value: 'all', label: 'All Sections' },
              { value: 'specific', label: 'Select' }
            ]}
          />
        </div>
        {/* Desktop Toggle (full labels) */}
        <div className="hidden sm:block">
          <Toggle
            value={allSelected ? 'all' : 'specific'}
            onChange={(val) => onAllSelectedChange(val === 'all')}
            options={[
              { value: 'all', label: dynamicLabel },
              { value: 'specific', label: 'Select Specific' }
            ]}
          />
        </div>
      </div>

      {description && (
        <p className="text-xs text-neutral-500">{description}</p>
      )}
      
      {/* Section Checkboxes */}
      {!allSelected && (
        <div className="space-y-3">
          {/* Quick Actions with Selection Count */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={availableCount === 0}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All{hasRestrictions ? ' Available' : ''}
              </button>
              <span className="text-neutral-600">|</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                Clear All
              </button>
            </div>
            <span className="text-xs text-neutral-400">
              {selectedSections.length} of {availableCount} selected
            </span>
          </div>

          {/* Checkbox Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 p-4 bg-black/20 rounded-xl border border-neutral-800">
            {VISION_CATEGORIES.map(cat => {
              const isSelected = selectedSections.includes(cat.key)
              const isAvailable = !hasRestrictions || availableSet.has(cat.key)
              const Icon = cat.icon
              
              return (
                <label 
                  key={cat.key} 
                  className={`
                    flex items-center gap-2 p-2 rounded-lg transition-all
                    ${!isAvailable 
                      ? 'opacity-40 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-primary-500/20 border border-primary-500/50 cursor-pointer' 
                        : 'hover:bg-neutral-800/50 border border-transparent cursor-pointer'
                    }
                  `}
                  title={!isAvailable ? 'No voice-only track available for this section' : undefined}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isAvailable}
                    onChange={(e) => toggleSection(cat.key, e.target.checked)}
                    className="sr-only"
                  />
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  ) : (
                    <Square className={`w-4 h-4 flex-shrink-0 ${isAvailable ? 'text-neutral-500' : 'text-neutral-700'}`} />
                  )}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${
                      !isAvailable ? 'text-neutral-700' :
                      isSelected ? 'text-primary-400' : 'text-neutral-500'
                    }`} />
                    <span className={`text-xs truncate ${
                      !isAvailable ? 'text-neutral-600' :
                      isSelected ? 'text-white font-medium' : 'text-neutral-400'
                    }`}>
                      {cat.label}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
