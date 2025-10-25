'use client'

import React from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { AlertTriangle, CheckCircle, Save, GitBranch } from 'lucide-react'

// ============================================================================
// Version Confirmation Dialog Component
// ============================================================================

interface VersionConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: 'save-as-draft' | 'commit-as-active' | 'delete-version' | 'set-active'
  versionNumber?: number
  isLoading?: boolean
}

export const VersionConfirmDialog: React.FC<VersionConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  versionNumber,
  isLoading = false
}) => {
  if (!isOpen) return null

  const getDialogContent = () => {
    switch (type) {
      case 'save-as-draft':
        return {
          icon: <Save className="w-8 h-8 text-yellow-500" />,
          title: 'Save as Draft',
          message: 'This will create a draft version that you can continue editing. The current active version will remain unchanged.',
          confirmText: 'Save as Draft',
          confirmVariant: 'secondary' as const,
          confirmIcon: <Save className="w-4 h-4" />
        }
      
      case 'commit-as-active':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Commit as Active Version',
          message: 'This will make this draft the new active version. The previous active version will become a complete version.',
          confirmText: 'Commit as Active',
          confirmVariant: 'primary' as const,
          confirmIcon: <CheckCircle className="w-4 h-4" />
        }
      
      case 'set-active':
        return {
          icon: <GitBranch className="w-8 h-8 text-blue-500" />,
          title: 'Set as Active Version',
          message: `This will make version ${versionNumber} the new active version. The current active version will become a complete version.`,
          confirmText: 'Set as Active',
          confirmVariant: 'primary' as const,
          confirmIcon: <CheckCircle className="w-4 h-4" />
        }
      
      case 'delete-version':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: 'Delete Version',
          message: `Are you sure you want to delete version ${versionNumber}? This action cannot be undone.`,
          confirmText: 'Delete Version',
          confirmVariant: 'danger' as const,
          confirmIcon: <AlertTriangle className="w-4 h-4" />
        }
      
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
          title: 'Confirm Action',
          message: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          confirmVariant: 'primary' as const,
          confirmIcon: <CheckCircle className="w-4 h-4" />
        }
    }
  }

  const content = getDialogContent()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-3">
            {content.title}
          </h3>
          
          <p className="text-neutral-300 mb-6 leading-relaxed">
            {content.message}
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            
            <Button
              variant={content.confirmVariant}
              onClick={onConfirm}
              disabled={isLoading}
              className="gap-2 px-6"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {content.confirmIcon}
                  {content.confirmText}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default VersionConfirmDialog
