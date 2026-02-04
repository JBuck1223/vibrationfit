'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input, Button, RadioGroup, AutoResizeTextarea } from '@/lib/design-system/components'

interface ProfileFieldProps {
  label: string
  value: any
  type?: 'text' | 'number' | 'array' | 'boolean' | 'story' | 'select'
  emptyText?: string
  showIncompleteIndicator?: boolean
  editable?: boolean
  fieldKey?: string
  onSave?: (fieldKey: string, newValue: any) => Promise<void>
  selectOptions?: Array<{ value: string; label: string }>
  placeholder?: string
  collapsible?: boolean
  autoEdit?: boolean // If true, automatically enters edit mode when editable is true
}

export function ProfileField({ 
  label, 
  value, 
  type = 'text',
  emptyText = 'Not specified',
  showIncompleteIndicator = true,
  editable = false,
  fieldKey,
  onSave,
  selectOptions,
  placeholder,
  collapsible = false,
  autoEdit = true
}: ProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [arrayInput, setArrayInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  // Sync editValue when value prop changes
  useEffect(() => {
    setEditValue(value)
  }, [value])
  
  // Auto-enter edit mode when editable becomes true (for section-level editing)
  useEffect(() => {
    if (autoEdit && editable) {
      setIsEditing(true)
    } else if (!editable) {
      setIsEditing(false)
    }
  }, [editable, autoEdit])

  const isEmpty = () => {
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'boolean') return false // Booleans are never empty
    return value === null || value === undefined || value === ''
  }

  const isIncomplete = isEmpty()

  const handleEdit = () => {
    setEditValue(value)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value)
    setArrayInput('')
    if (!autoEdit) {
      setIsEditing(false)
    }
  }

  const handleSave = async () => {
    if (!onSave || !fieldKey) return
    
    setIsSaving(true)
    try {
      // Normalize empty strings to null for select fields (but allow actual values)
      let valueToSave = editValue
      if (type === 'select') {
        // Convert empty string to null, but keep actual selected values
        if (editValue === '' || editValue === null || editValue === undefined) {
          valueToSave = null
        } else {
          // Ensure we're saving the actual string value
          valueToSave = String(editValue)
        }
      }
      
      await onSave(fieldKey, valueToSave)
      if (!autoEdit) {
        setIsEditing(false)
      }
      setArrayInput('')
    } catch (error) {
      console.error('Failed to save:', error)
      throw error // Re-throw so the component can show error state
    } finally {
      setIsSaving(false)
    }
  }
  
  // Auto-save on change when in autoEdit mode
  const handleChange = (newValue: any) => {
    setEditValue(newValue)
    if (autoEdit && onSave && fieldKey) {
      onSave(fieldKey, newValue)
    }
  }

  const handleArrayAdd = () => {
    if (arrayInput.trim()) {
      const newArray = Array.isArray(editValue) ? [...editValue, arrayInput.trim()] : [arrayInput.trim()]
      setEditValue(newArray)
      setArrayInput('')
      // Auto-save in autoEdit mode
      if (autoEdit && onSave && fieldKey) {
        onSave(fieldKey, newArray)
      }
    }
  }

  const handleArrayRemove = (index: number) => {
    if (Array.isArray(editValue)) {
      const newArray = editValue.filter((_, i) => i !== index)
      setEditValue(newArray)
      // Auto-save in autoEdit mode
      if (autoEdit && onSave && fieldKey) {
        onSave(fieldKey, newArray)
      }
    }
  }

  const renderEditMode = () => {
    if (type === 'story') {
      return (
        <div className="space-y-2">
          <AutoResizeTextarea
            value={editValue || ''}
            onChange={handleChange}
            placeholder={placeholder || `Enter your ${label.toLowerCase()}...`}
            className="w-full min-h-[120px]"
          />
          {!autoEdit && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Save</>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          )}
        </div>
      )
    }

    if (type === 'array') {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {Array.isArray(editValue) && editValue.map((item, index) => (
              <span key={index} className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm flex items-center gap-2">
                {item}
                <button
                  onClick={() => handleArrayRemove(index)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleArrayAdd()}
              placeholder={placeholder || `Add ${label.toLowerCase()}...`}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleArrayAdd}
            >
              Add
            </Button>
          </div>
          {!autoEdit && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Save</>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          )}
        </div>
      )
    }

    if (type === 'boolean') {
      return (
        <div className="space-y-2">
          <RadioGroup
            name={`${fieldKey}-boolean`}
            value={editValue}
            onChange={(value) => handleChange(value)}
            options={[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' }
            ]}
          />
          {!autoEdit && (
            <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Save</>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
          )}
        </div>
      )
    }

    if (type === 'select' && selectOptions) {
      return (
        <div className="space-y-2">
          <select
            value={editValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Select...</option>
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!autoEdit && (
            <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Save</>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
          )}
        </div>
      )
    }

    // Default: text or number input
    return (
      <div className="space-y-2">
        <Input
          type={type === 'number' ? 'number' : 'text'}
          value={editValue || ''}
          onChange={(e) => handleChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className="w-full"
        />
        {!autoEdit && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Save</>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderValue = () => {
    if (type === 'array' && Array.isArray(value) && value.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {value.map((item, index) => (
            <span key={index} className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
              {item}
            </span>
          ))}
        </div>
      )
    }

    if (type === 'boolean') {
      return value === true ? 'Yes' : value === false ? 'No' : emptyText
    }

    if (type === 'story' && value) {
      return (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
          <p className="text-white whitespace-pre-wrap">{value}</p>
        </div>
      )
    }

    if (type === 'select' && selectOptions && value) {
      const selectedOption = selectOptions.find(option => option.value === value)
      return selectedOption ? selectedOption.label : value
    }

    return value || emptyText
  }

  return (
    <div className={`${isIncomplete && showIncompleteIndicator ? 'border-l-2 border-yellow-500/50 pl-3' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-neutral-400">{label}</p>
          {isIncomplete && showIncompleteIndicator && (
            <AlertCircle className="w-3 h-3 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {editable && !isEditing && (
            <button
              onClick={handleEdit}
              className="text-primary-500 hover:text-primary-400 transition-colors p-1"
              title="Edit this field"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {collapsible && !isEditing && !isEmpty() && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        renderEditMode()
      ) : (
        <>
          {collapsible && !isExpanded ? (
            <p className="text-neutral-500 text-sm italic">Click to expand</p>
          ) : (
            <>
              {type === 'story' || type === 'array' ? (
                renderValue()
              ) : (
                <p className={`font-medium ${isIncomplete ? 'text-neutral-500 italic' : 'text-white'}`}>
                  {renderValue()}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

