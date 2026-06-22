'use client'

import { Modal, Button } from '@/lib/design-system/components'
import { Flame } from 'lucide-react'

interface PhoenixModalProps {
  isOpen: boolean
  onClose: () => void
  onStartAnother: () => void
}

export function PhoenixModal({ isOpen, onClose, onStartAnother }: PhoenixModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="text-center py-4">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-energy-500/20 to-accent-500/20 border border-accent-500/40">
          <Flame className="w-10 h-10 text-energy-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Phoenix Rising</h2>
        <p className="text-neutral-300 mb-6 max-w-md mx-auto">
          You recommitted to every part of your Reset. A brand new life is set in motion.
          Rise into it - and return whenever you choose to reset again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onStartAnother}>
            <Flame className="w-4 h-4 mr-1" />
            Start Another Reset
          </Button>
        </div>
      </div>
    </Modal>
  )
}
