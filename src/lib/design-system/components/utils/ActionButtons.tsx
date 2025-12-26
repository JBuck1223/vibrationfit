'use client'

import React from 'react'
import Link from 'next/link'
import { Edit, Eye, CheckCircle2, Trash2 } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

interface ActionButtonsProps {
  versionType: 'draft' | 'completed'
  editHref?: string
  viewHref: string
  onCommit?: () => void
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  className?: string
  showLabels?: boolean
  deleteVariant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  commitVariant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  isCommitting?: boolean
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  versionType,
  editHref,
  viewHref,
  onCommit,
  onDelete,
  size = 'sm',
  variant = 'ghost',
  className = '',
  showLabels = true,
  deleteVariant = 'danger',
  commitVariant = 'primary',
  isCommitting = false
}) => {
  if (versionType === 'draft') {
    return (
      <div className={cn('flex flex-row flex-wrap gap-2 md:gap-4 w-full', className)}>
        {/* Edit Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          <Link href={editHref || viewHref}>
            <Edit className="w-4 h-4 flex-shrink-0" />
            {showLabels && <span className="ml-1">Edit</span>}
          </Link>
        </Button>
        
        {/* View Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          <Link href={viewHref}>
            <Eye className="w-4 h-4 flex-shrink-0" />
            {showLabels && <span className="ml-1">View</span>}
          </Link>
        </Button>
        
        {/* Commit Button */}
        <Button
          size={size}
          variant={commitVariant}
          onClick={onCommit}
          disabled={isCommitting}
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          {isCommitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          {showLabels && <span className="ml-1">Commit</span>}
        </Button>
      </div>
    )
  }

  // Completed version - show Edit, View and Delete
  return (
    <div className={cn('flex flex-row flex-wrap gap-2 md:gap-4 w-full', className)}>
      {/* Edit Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <Link href={editHref || viewHref}>
          <Edit className="w-4 h-4 flex-shrink-0" />
          {showLabels && <span className="ml-1">Edit</span>}
        </Link>
      </Button>
      
      {/* View Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <Link href={viewHref}>
          <Eye className="w-4 h-4 flex-shrink-0" />
          {showLabels && <span className="ml-1">View</span>}
        </Link>
      </Button>
      
      {/* Delete Button */}
      <Button
        size={size}
        variant={deleteVariant}
        onClick={onDelete}
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" />
        {showLabels && <span className="ml-1">Delete</span>}
      </Button>
    </div>
  )
}

