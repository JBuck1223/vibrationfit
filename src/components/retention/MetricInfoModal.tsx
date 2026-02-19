'use client'

import { useEffect, useRef } from 'react'
import { Card, Button } from '@/lib/design-system/components'
import { X, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { MetricType } from './RetentionMetricTile'

interface MetricExplainerContent {
  title: string
  subtitle: string
  description: string
  items: string[]
}

export const METRIC_EXPLAINERS: Record<MetricType, MetricExplainerContent> = {
  creations: {
    title: 'Creations',
    subtitle: 'What you\'ve built: visions, audios, boards, journals and more.',
    description: 'We count any new asset you create in VibrationFit:',
    items: [
      'Life Visions',
      'Audio Sets',
      'Vision Board items',
      'Journal entries',
      'Daily Paper entries',
      'Abundance Tracker events',
    ],
  },
  activations: {
    title: 'Activations',
    subtitle: 'Number of reps you completed.',
    description: 'Every qualifying practice event counts as an Activation:',
    items: [
      'Playing a Vision Audio',
      'Creating a Journal entry',
      'Creating a Daily Paper entry',
      'Creating an Abundance Tracker entry',
      'Creating or actualizing a Vision Board item',
      'Attending an Alignment Gym session',
      'Posting in Vibe Tribe',
    ],
  },
  connections: {
    title: 'Connections',
    subtitle: 'Posts, comments, and hearts in Vibe Tribe.',
    description: 'We count your interactions with the Vibe Tribe community:',
    items: [
      'Vibe Tribe posts',
      'Comments on posts',
      'Hearts given',
    ],
  },
  sessions: {
    title: 'Sessions',
    subtitle: 'Alignment Gym sessions you attended.',
    description: 'We count each Alignment Gym session you show up for:',
    items: [
      'Live sessions attended',
      'Replays watched',
    ],
  },
}

interface MetricInfoModalProps {
  type: MetricType
  isOpen: boolean
  onClose: () => void
}

export default function MetricInfoModal({ type, isOpen, onClose }: MetricInfoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const content = METRIC_EXPLAINERS[type]

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{content.title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-300 mb-3">{content.description}</p>

        {/* Bullet list */}
        <div className="space-y-2 mb-5">
          {content.items.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-300">{item}</span>
            </div>
          ))}
        </div>

        {/* Learn more link */}
        <div className="pt-3 border-t border-neutral-800">
          <Link
            href="/tracking/how-it-works"
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-primary-400 flex items-center gap-1 transition-colors"
          >
            Learn more about how tracking works
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    </div>
  )
}
