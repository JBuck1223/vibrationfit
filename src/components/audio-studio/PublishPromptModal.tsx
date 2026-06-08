'use client'

import React from 'react'
import { Music2, Send } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

interface PublishPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

export function PublishPromptModal({ isOpen, onClose, onSubmit }: PublishPromptModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#39FF14]/10 flex items-center justify-center">
            <Music2 className="w-7 h-7 text-[#39FF14]" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Submit to Vibration Fit
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              This enables streaming on all music platforms and allows the Vibe Tribe
              to listen to your song. You will be listed as an Artist.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Not Now
            </Button>
            <Button variant="primary" onClick={onSubmit} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
