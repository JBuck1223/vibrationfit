'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Spinner } from '@/lib/design-system/components'
import {
  Eye,
  Music,
  Image,
  BookOpen,
  Users,
  TrendingUp,
  Radio,
  AlertTriangle,
  Pause,
  X,
  Shield,
} from 'lucide-react'

type AssetCounts = {
  visions: number
  audioTracks: number
  boardImages: number
  journalEntries: number
  vibePosts: number
  abundanceEvents: number
  focusStories: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirmCancel: () => void
  isCanceling: boolean
}

const ASSET_CONFIG = [
  { key: 'visions' as const, label: 'Life Visions', icon: Eye, color: 'text-[#39FF14]' },
  { key: 'audioTracks' as const, label: 'Audio Tracks', icon: Music, color: 'text-[#00FFFF]' },
  { key: 'boardImages' as const, label: 'Vision Board Images', icon: Image, color: 'text-[#BF00FF]' },
  { key: 'journalEntries' as const, label: 'Journal Entries', icon: BookOpen, color: 'text-[#FFFF00]' },
  { key: 'focusStories' as const, label: 'Focus Stories', icon: Radio, color: 'text-[#39FF14]' },
  { key: 'vibePosts' as const, label: 'Vibe Tribe Posts', icon: Users, color: 'text-[#00FFFF]' },
  { key: 'abundanceEvents' as const, label: 'Abundance Events', icon: TrendingUp, color: 'text-[#BF00FF]' },
]

export default function CancelMembershipDialog({
  isOpen,
  onClose,
  onConfirmCancel,
  isCanceling,
}: Props) {
  const [assets, setAssets] = useState<AssetCounts | null>(null)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [step, setStep] = useState<'overview' | 'pause' | 'confirm'>('overview')
  const [pauseMonths, setPauseMonths] = useState(1)
  const [isPausing, setIsPausing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('overview')
      setLoadingAssets(true)
      fetch('/api/billing/asset-counts')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setAssets(data)
        })
        .catch(() => {})
        .finally(() => setLoadingAssets(false))
    }
  }, [isOpen])

  const totalAssets = assets
    ? Object.values(assets).reduce((sum, v) => sum + v, 0)
    : 0

  const handlePause = async () => {
    setIsPausing(true)
    try {
      const res = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: pauseMonths }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to pause')
      onClose()
      window.location.reload()
    } catch {
      setIsPausing(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      {step === 'overview' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF0040]/10 border border-[#FF0040]/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[#FF0040]" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Before You Go...
            </h3>
            <p className="text-sm text-neutral-400 mt-2">
              You&apos;ve built something meaningful. Here&apos;s what you&apos;ve created:
            </p>
          </div>

          {loadingAssets ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : assets && totalAssets > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {ASSET_CONFIG.map(({ key, label, icon: Icon, color }) => {
                const count = assets[key]
                if (count === 0) return null
                return (
                  <div
                    key={key}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className={`${color} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-white leading-tight">{count}</div>
                      <div className="text-xs text-neutral-500 truncate">{label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className="bg-[#00FFFF]/5 border border-[#00FFFF]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Pause className="w-5 h-5 text-[#00FFFF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">
                  Need a breather?
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  You can pause your membership for up to 3 months instead. Your content stays safe and you won&apos;t be charged.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setStep('pause')}
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pause Instead
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Keep Membership
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => setStep('confirm')}
            >
              Continue to Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 'pause' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#00FFFF]/10 border border-[#00FFFF]/20 flex items-center justify-center mx-auto mb-4">
              <Pause className="w-7 h-7 text-[#00FFFF]" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Pause Membership
            </h3>
            <p className="text-sm text-neutral-400 mt-2">
              Take a break without losing anything. Your membership will automatically resume.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              How long would you like to pause?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPauseMonths(m)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all duration-200
                    ${pauseMonths === m
                      ? 'border-[#00FFFF] bg-[#00FFFF]/10 text-[#00FFFF]'
                      : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600'}
                  `}
                >
                  <div className="text-lg font-bold">{m}</div>
                  <div className="text-xs">{m === 1 ? 'Month' : 'Months'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#39FF14]" />
              <span className="text-neutral-300">All your content stays safe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#39FF14]" />
              <span className="text-neutral-300">No charges during pause</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#39FF14]" />
              <span className="text-neutral-300">Resumes automatically</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('overview')}>
              Back
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handlePause}
              disabled={isPausing}
              loading={isPausing}
            >
              Pause for {pauseMonths} {pauseMonths === 1 ? 'Month' : 'Months'}
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF0040]/10 border border-[#FF0040]/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-[#FF0040]" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Are you sure?
            </h3>
            <p className="text-sm text-neutral-400 mt-2">
              Your membership will be canceled at the end of your current billing period. You&apos;ll retain access until then.
            </p>
          </div>

          <div className="bg-[#FF0040]/5 border border-[#FF0040]/20 rounded-xl p-4 text-sm text-neutral-400">
            <p>After cancellation:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>VIVA tokens will stop replenishing</li>
              <li>Audio generation will be disabled</li>
              <li>Vision refinements will be limited</li>
              <li>Existing content remains accessible in read-only mode</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('overview')}>
              Go Back
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={onConfirmCancel}
              disabled={isCanceling}
              loading={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Membership'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
