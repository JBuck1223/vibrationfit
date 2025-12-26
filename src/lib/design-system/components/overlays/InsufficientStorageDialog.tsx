'use client'

import React from 'react'
import { HardDrive, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] border-2 border-[#8B5CF6] rounded-2xl p-6 max-w-md w-full relative">
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

        <div className="flex gap-3">
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
  )
}
