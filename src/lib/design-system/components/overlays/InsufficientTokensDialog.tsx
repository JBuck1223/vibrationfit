'use client'

import React from 'react'
import { Coins, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

interface InsufficientTokensDialogProps {
  isOpen: boolean
  onClose: () => void
  requiredTokens?: number
  currentTokens?: number
  tokensRemaining?: number
  estimatedTokens?: number
  actionName?: string
}

export const InsufficientTokensDialog: React.FC<InsufficientTokensDialogProps> = ({
  isOpen,
  onClose,
  requiredTokens,
  currentTokens,
  tokensRemaining,
  estimatedTokens,
  actionName = 'this action'
}) => {
  const required = requiredTokens ?? estimatedTokens ?? 0
  const current = currentTokens ?? tokensRemaining ?? 0
  if (!isOpen) return null

  const tokensNeeded = required - current

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] border-2 border-[#FFB701] rounded-2xl p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FFB701]/20 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6 text-[#FFB701]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Insufficient Tokens</h3>
            <p className="text-neutral-400 text-sm">
              You need <span className="text-[#FFB701] font-semibold">{tokensNeeded} more tokens</span> to perform {actionName}.
            </p>
            <p className="text-neutral-500 text-xs mt-2">
              Current: {currentTokens} | Required: {requiredTokens}
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
            <Link href="/tokens">
              Get Tokens
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
