'use client'

import React, { useState } from 'react'
import { Button } from '@/lib/design-system/components'
import { Save, CheckCircle, Copy, Trash2, MoreVertical } from 'lucide-react'
import VersionConfirmDialog from './VersionConfirmDialog'

// ============================================================================
// Version Action Toolbar Component
// ============================================================================

interface VersionActionToolbarProps {
  versionId: string
  versionNumber: number
  isActive: boolean
  isDraft: boolean
  onSaveAsDraft?: () => void
  onCommitAsActive?: () => void
  onCreateDraft?: () => void
  onSetActive?: () => void
  onDelete?: () => void
  isLoading?: boolean
  className?: string
}

export const VersionActionToolbar: React.FC<VersionActionToolbarProps> = ({
  versionId,
  versionNumber,
  isActive,
  isDraft,
  onSaveAsDraft,
  onCommitAsActive,
  onCreateDraft,
  onSetActive,
  onDelete,
  isLoading = false,
  className = ''
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'save-as-draft' | 'commit-as-active' | 'delete-version' | 'set-active'
    onConfirm: () => void
  } | null>(null)

  const handleConfirm = (type: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      type: type as any,
      onConfirm
    })
  }

  const handleConfirmAction = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm()
      setConfirmDialog(null)
    }
  }

  const handleCloseDialog = () => {
    setConfirmDialog(null)
  }

  const getActions = () => {
    if (isActive) {
      return []
    }

    if (isDraft) {
      return [
        {
          label: 'Commit as Active',
          icon: <CheckCircle className="w-4 h-4" />,
          variant: 'primary' as const,
          onClick: () => handleConfirm('commit-as-active', () => onCommitAsActive?.()),
          showConfirm: true
        },
        {
          label: 'Delete Draft',
          icon: <Trash2 className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => handleConfirm('delete-version', () => onDelete?.()),
          showConfirm: true
        }
      ]
    }

    // Complete version
    return [
      {
        label: 'Set as Active',
        icon: <CheckCircle className="w-4 h-4" />,
        variant: 'primary' as const,
        onClick: () => handleConfirm('set-active', () => onSetActive?.()),
        showConfirm: true
      },
      {
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleConfirm('delete-version', () => onDelete?.()),
        showConfirm: true
      }
    ]
  }

  const actions = getActions()

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            disabled={isLoading}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      {confirmDialog && (
        <VersionConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={handleCloseDialog}
          onConfirm={handleConfirmAction}
          type={confirmDialog.type}
          versionNumber={versionNumber}
          isLoading={isLoading}
        />
      )}
    </>
  )
}

export default VersionActionToolbar
