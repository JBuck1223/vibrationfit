'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { OverlayPortal } from './OverlayPortal'

interface WarningConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isProcessing?: boolean
  isLoading?: boolean
  type?: 'warning' | 'delete' | 'danger' | 'commit' | 'success' | 'draft'
}

export const WarningConfirmationDialog: React.FC<WarningConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Warning',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  isProcessing = false,
  isLoading,
  type = 'warning'
}) => {
  const loading = isLoading ?? isProcessing
  if (!isOpen) return null

  return (
    <OverlayPortal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="vf-glass rounded-[24px] border bg-[rgba(28,22,38,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl border-[#FFB701]/60 p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FFB701]/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#FFB701]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-neutral-400 text-sm">{message}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  )
}
