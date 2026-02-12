'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { Button, Card } from '@/lib/design-system/components'
import { Music, Users, Dumbbell, X } from 'lucide-react'

interface UnlockCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
}

const GRADUATION_UNLOCKS = [
  {
    icon: Music,
    title: 'Advanced Audio Suite',
    description: 'Frequency Enhancements – binaural beats and solfeggio‑backed layers you can add on top of any Vision Audio for healing, deeper sleep, focus, and meditation.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30'
  },
  {
    icon: Dumbbell,
    title: 'The Alignment Gym',
    description: 'Weekly live coaching sessions with Jordan and Vanessa to calibrate, get unstuck, and keep your 28‑Day MAP (and beyond) on track.',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30'
  },
  {
    icon: Users,
    title: 'Vibe Tribe Community',
    description: 'A private space to connect with conscious creators on the same journey – share your wins, struggles, and practices as you keep activating The Life You Choose.',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20',
    borderColor: 'border-primary-500/30'
  }
]

export function UnlockCelebrationModal({ isOpen, onClose }: UnlockCelebrationModalProps) {
  // Fire confetti when modal opens
  const fireConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#199D67', '#14B8A6', '#8B5CF6', '#FFB701']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    })

    // Continuous side confetti
    frame()
  }, [])

  useEffect(() => {
    if (isOpen) {
      fireConfetti()
    }
  }, [isOpen, fireConfetti])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        <Card variant="elevated" className="bg-[#0A0A0A] border-[#333] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-800 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>

          {/* Header */}
          <div className="text-center pt-8 pb-6 px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Welcome to Your Vibration Fit Membership
            </h2>
            <p className="text-neutral-300 mb-1">
              You&apos;ve completed your 72‑Hour Activation Intensive. You are now a Graduate. Congratulations!
            </p>
            <p className="text-neutral-400 text-sm mt-3">
              As promised, here are your Graduation Unlocks:
            </p>
          </div>

          {/* Unlocks Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GRADUATION_UNLOCKS.map((unlock) => (
                <div
                  key={unlock.title}
                  className={`p-4 rounded-xl ${unlock.bgColor} border ${unlock.borderColor} text-center`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${unlock.bgColor} mb-3`}>
                    <unlock.icon className={`w-6 h-6 ${unlock.color}`} />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">
                    {unlock.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {unlock.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-8 text-center">
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Your next move: open your Dashboard, start Day 1 of your 28‑Day MAP, and go earn your first activation badge.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onClose}
              className="w-full sm:w-auto px-8"
            >
              Enter My Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
