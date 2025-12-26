'use client'

import React from 'react'

// ============================================================================
// ICON LIST COMPONENT
// Perfect bullet alignment with consistent line heights
// ============================================================================

export interface IconListItem {
  text: string
  id?: string
}

export interface IconListProps {
  items: IconListItem[] | string[]
  bulletColor?: string
  textColor?: string
  spacing?: 'tight' | 'normal' | 'relaxed'
  className?: string
}

export const IconList: React.FC<IconListProps> = ({
  items,
  bulletColor = 'text-primary-500',
  textColor = 'text-neutral-300',
  spacing = 'normal',
  className = ''
}) => {
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-3',
    relaxed: 'space-y-4'
  }

  return (
    <ul className={`${spacingClasses[spacing]} ${className}`}>
      {items.map((item, index) => {
        const text = typeof item === 'string' ? item : item.text
        const key = typeof item === 'string' ? index : (item.id || index)
        
        return (
          <li key={key} className="flex gap-3">
            <span className={`${bulletColor} text-lg font-bold leading-[1.75rem] flex-shrink-0`}>
              •
            </span>
            <span className={`text-sm ${textColor} leading-[1.75rem]`}>
              {text}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

