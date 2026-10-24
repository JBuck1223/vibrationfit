'use client'

import React from 'react'
import { HardDrive, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { OverlayPortal } from './OverlayPortal'

interface InsufficientStorageDialogProps {
  isOpen: boolean
  onClose: () => void
  requiredStorage?: number
  currentStorage?: number
  storageUsedGB?: number
  storageQuotaGB?: number
  estimatedSizeGB?: number
  actionName?: string
}

export const InsufficientStorageDialog: React.FC<InsufficientStorageDialogProps> = ({
  isOpen,
  onClose,
  requiredStorage,
  currentStorage,
  storageUsedGB,
  storageQuotaGB,
  estimatedSizeGB,
  actionName = 'this action'
}) => {
  if (!isOpen) return null

  const required = requiredStorage ?? estimatedSizeGB ?? 0
  const current = currentStorage ?? (storageQuotaGB ? storageQuotaGB - (storageUsedGB ?? 0) : 0)
  const storageNeeded = required - current

  return (
    <OverlayPortal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="vf-glass rounded-[24px] border bg-[rgba(28,22,38,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl border-[#8B5CF6]/60 p-4 sm:p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Insufficient Storage</h3>
            <p className="text-neutral-400 text-sm">
              You need <span className="text-[#8B5CF6] font-semibold">{storageNeeded} MB more storage</span> to perform {actionName}.
            </p>
            <p className="text-neutral-500 text-xs mt-2">
              Current: {currentStorage} MB | Required: {requiredStorage} MB
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            asChild
            className="flex-1"
          >
            <Link href="/account/settings">
              Upgrade Storage
            </Link>
          </Button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  )
}
