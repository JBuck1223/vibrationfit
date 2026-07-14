'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Sparkles, ArrowRight } from 'lucide-react'
import { Card, Button, Spinner } from '@/lib/design-system/components'
import { computePersonalVersionNumbers, formatVisionDate } from './vision-version-labels'

interface ConvertVisionToolProps {
  householdId: string
  householdMembers: Array<{
    user_id: string
    role: string
    profile: {
      first_name: string
      last_name: string
      email: string
    }
  }>
  onClose: () => void
  onSuccess: () => void
}

interface PersonalVision {
  id: string
  user_id: string
  title?: string
  created_at: string
  is_active: boolean
}

export function ConvertVisionTool({
  householdId,
  householdMembers,
  onClose,
  onSuccess
}: ConvertVisionToolProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const [personalVisions, setPersonalVisions] = useState<PersonalVision[]>([])
  const [selectedVision, setSelectedVision] = useState<string | null>(null)

  useEffect(() => {
    loadPersonalVisions()
  }, [])

  async function loadPersonalVisions() {
    try {
      const response = await fetch('/api/household/visions?type=personal')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load personal visions')
      }

      setPersonalVisions(data.visions || [])
      setLoading(false)
    } catch (err: any) {
      console.error('Error loading personal visions:', err)
      setError(err.message || 'Failed to load personal visions')
      setLoading(false)
    }
  }

  async function handleConvert() {
    if (!selectedVision) {
      setError('Please select a vision to convert')
      return
    }

    setConverting(true)
    setError('')

    try {
      const response = await fetch('/api/vision/convert-to-household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVisionId: selectedVision,
          householdId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert vision')
      }

      // Success! Navigate to the new vision (draft or active)
      onSuccess?.()
      if (data.isActive) {
        router.push(`/life-vision/${data.visionId}`)
      } else {
        router.push(`/life-vision/${data.visionId}/draft`)
      }
    } catch (err: any) {
      console.error('Error converting vision:', err)
      setError(err.message || 'Failed to convert vision')
      setConverting(false)
    }
  }

  function getOwnerName(userId: string) {
    const member = householdMembers.find(m => m.user_id === userId)
    if (!member?.profile) return 'Unknown'
    return `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
  }

  const versionNumbers = useMemo(
    () => computePersonalVersionNumbers(personalVisions),
    [personalVisions]
  )

  // Group visions by owner so options read like the area bar dropdown
  // ("Jordan's Visions" -> Version 2, Version 1) instead of raw titles.
  const groupedVisions = useMemo(() => {
    const groups: Array<{ ownerId: string; ownerName: string; visions: PersonalVision[] }> = []
    for (const vision of personalVisions) {
      const existing = groups.find(g => g.ownerId === vision.user_id)
      if (existing) {
        existing.visions.push(vision)
      } else {
        groups.push({
          ownerId: vision.user_id,
          ownerName: getOwnerName(vision.user_id),
          visions: [vision],
        })
      }
    }
    return groups
  }, [personalVisions, householdMembers])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary-500" />
              Convert to Household Vision
            </h2>
            <p className="text-neutral-400">
              Choose the personal vision version to convert into a shared household vision
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner variant="primary" size="lg" />
          </div>
        ) : personalVisions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 mb-4">No personal visions found</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Vision List — grouped by owner, labeled like the Vision dropdown */}
            <div className="space-y-4 mb-6">
              {groupedVisions.map((group) => (
                <div key={group.ownerId}>
                  <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    {group.ownerName}
                  </p>
                  <div className="space-y-1.5">
                    {group.visions.map((vision) => {
                      const isSelected = selectedVision === vision.id

                      return (
                        <button
                          key={vision.id}
                          onClick={() => setSelectedVision(vision.id)}
                          className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'border-[#39FF14]/50 bg-[#39FF14]/10'
                              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/60'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                              Version {versionNumbers[vision.id]}
                            </p>
                            <p className="text-xs text-neutral-500">{formatVisionDate(vision.created_at)}</p>
                          </div>
                          {vision.is_active && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 text-[#39FF14] bg-[#39FF14]/10">
                              Active
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-300">
                <strong>Note:</strong> This creates a new household version. The original personal vision stays unchanged.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={converting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConvert}
                disabled={!selectedVision || converting}
                loading={converting}
                className="flex-1"
              >
                {!converting && <ArrowRight className="w-4 h-4 mr-2" />}
                {converting ? 'Converting...' : 'Convert to Household'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
