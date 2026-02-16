'use client'

import { useEffect, useRef } from 'react'
import { Card, Button, ProgressBar } from '@/lib/design-system/components'
import { X, ArrowRight } from 'lucide-react'
import {
  BadgeWithProgress,
  BADGE_DEFINITIONS,
  BADGE_CATEGORY_COLORS,
} from '@/lib/badges/types'

interface BadgeDetailModalProps {
  badge: BadgeWithProgress | null
  isOpen: boolean
  onClose: () => void
}

export default function BadgeDetailModal({ badge, isOpen, onClose }: BadgeDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

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

  if (!isOpen || !badge) return null

  const { definition, earned, earnedAt, progress } = badge
  // Look up icon from BADGE_DEFINITIONS since functions can't be serialized from API
  const Icon = BADGE_DEFINITIONS[definition.type].icon
  const colors = BADGE_CATEGORY_COLORS[definition.category]
  const isComplete = earned || progress.percentage >= 100

  // Format earned date
  const formatEarnedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in duration-200">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Badge icon (large) */}
        <div className="flex flex-col items-center mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
            style={{
              background: isComplete
                ? `radial-gradient(ellipse at 30% 20%, #d0d0d0 0%, #a8a8a8 25%, #888888 50%, #a0a0a0 75%, #909090 100%)`
                : '#262626',
              border: isComplete ? 'none' : '2px solid #404040',
              boxShadow: isComplete
                ? '0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)'
                : 'none',
            }}
          >
            <Icon
              className="w-10 h-10"
              style={{
                color: isComplete ? '#505050' : '#555',
                opacity: isComplete ? 1 : 0.4,
                filter: isComplete
                  ? 'drop-shadow(1px 1px 0px rgba(255,255,255,0.6)) drop-shadow(-1px -1px 2px rgba(0,0,0,0.4))'
                  : 'none',
              }}
            />
          </div>

          {/* Badge name */}
          <h3 className="text-lg font-bold text-white text-center">{definition.label}</h3>

          {/* Category pill */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 capitalize"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            {definition.category}
          </span>
        </div>

        {/* Criteria */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            How to earn it
          </h4>
          <p className="text-sm text-neutral-300">{definition.description}</p>
        </div>

        {/* Meaning (story) */}
        {definition.meaning && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              What it means
            </h4>
            <p className="text-sm text-neutral-300 italic">{definition.meaning}</p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-500">Progress</span>
            <span className="text-xs font-medium" style={{ color: isComplete ? colors.primary : '#a3a3a3' }}>
              {Math.min(progress.current, progress.target)} / {progress.target}
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress.percentage, 100)}%`,
                backgroundColor: colors.primary,
              }}
            />
          </div>
          {earned && earnedAt && (
            <p className="text-xs text-neutral-500 mt-1.5">
              Earned on {formatEarnedDate(earnedAt)}
            </p>
          )}
        </div>

        {/* Next badge guidance */}
        {definition.nextBadge && (
          <div className="pt-3 border-t border-neutral-800">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              {isComplete ? 'What\'s next' : 'Keep going'}
            </h4>
            <p className="text-sm text-neutral-300 flex items-start gap-2">
              <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
              {definition.nextBadge}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
