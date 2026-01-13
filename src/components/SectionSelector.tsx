'use client'

import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { Toggle } from '@/lib/design-system/components'
import { CheckSquare, Square } from 'lucide-react'

interface SectionSelectorProps {
  allSelected: boolean
  onAllSelectedChange: (value: boolean) => void
  selectedSections: string[]
  onSelectedSectionsChange: (sections: string[]) => void
  label?: string
  description?: string
}

export function SectionSelector({
  allSelected,
  onAllSelectedChange,
  selectedSections,
  onSelectedSectionsChange,
  label = 'All 14 Sections',
  description
}: SectionSelectorProps) {
  const toggleSection = (key: string, checked: boolean) => {
    if (checked) {
      onSelectedSectionsChange([...selectedSections, key])
    } else {
      onSelectedSectionsChange(selectedSections.filter(k => k !== key))
    }
  }

  const selectAll = () => {
    onSelectedSectionsChange(VISION_CATEGORIES.map(c => c.key))
  }

  const selectNone = () => {
    onSelectedSectionsChange([])
  }

  return (
    <div className="space-y-3">
      {/* Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Toggle
            value={allSelected ? 'all' : 'specific'}
            onChange={(val) => onAllSelectedChange(val === 'all')}
            options={[
              { value: 'all', label: label },
              { value: 'specific', label: 'Select Specific' }
            ]}
          />
        </div>
        {!allSelected && (
          <span className="text-sm text-neutral-400">
            {selectedSections.length} of {VISION_CATEGORIES.length} selected
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-neutral-500">{description}</p>
      )}
      
      {/* Section Checkboxes */}
      {!allSelected && (
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Select All
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

          {/* Checkbox Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 p-4 bg-black/20 rounded-xl border border-neutral-800">
            {VISION_CATEGORIES.map(cat => {
              const isSelected = selectedSections.includes(cat.key)
              const Icon = cat.icon
              
              return (
                <label 
                  key={cat.key} 
                  className={`
                    flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-primary-500/20 border border-primary-500/50' 
                      : 'hover:bg-neutral-800/50 border border-transparent'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSection(cat.key, e.target.checked)}
                    className="sr-only"
                  />
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  )}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-primary-400' : 'text-neutral-500'}`} />
                    <span className={`text-xs truncate ${isSelected ? 'text-white font-medium' : 'text-neutral-400'}`}>
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
