'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Copy } from 'lucide-react'
import { Card, Button, Spinner } from '@/lib/design-system/components'
import { computePersonalVersionNumbers, formatVisionDate } from './vision-version-labels'

interface VisionData {
  id: string
  user_id: string
  title: string
  created_at: string
  is_active: boolean
}

interface MergeVisionsToolProps {
  onClose: () => void
  householdId: string
  householdMembers: Array<{
    user_id: string
    profile: {
      first_name: string
      last_name: string
    }
  }>
  onSuccess?: () => void
}

export function MergeVisionsTool({ 
  onClose, 
  householdId,
  householdMembers,
  onSuccess 
}: MergeVisionsToolProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState(false)
  const [selectedVisions, setSelectedVisions] = useState<string[]>([])
  const [personalVisions, setPersonalVisions] = useState<VisionData[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadPersonalVisions()
  }, [])

  async function loadPersonalVisions() {
    try {
      setLoading(true)

      const response = await fetch('/api/household/visions?type=personal')
      const data = await response.json()

      if (!response.ok) {
        console.error('Error fetching personal visions:', data.error)
        setError('Failed to load personal visions')
        return
      }

      setPersonalVisions(data.visions || [])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load personal visions')
    } finally {
      setLoading(false)
    }
  }

  async function handleMerge() {
    if (selectedVisions.length !== 2) {
      setError('Please select exactly 2 visions to merge')
      return
    }

    setMerging(true)
    setError('')

    try {
      const response = await fetch('/api/vision/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId1: selectedVisions[0],
          visionId2: selectedVisions[1],
          householdId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge visions')
      }

      // Success! Navigate to the new vision (draft or active)
      onSuccess?.()
      if (data.isActive) {
        router.push(`/life-vision/${data.visionId}`)
      } else {
        router.push(`/life-vision/${data.visionId}/draft`)
      }
    } catch (err: any) {
      console.error('Error merging visions:', err)
      setError(err.message || 'Failed to merge visions')
      setMerging(false)
    }
  }

  function getOwnerName(userId: string) {
    const member = householdMembers.find(m => m.user_id === userId)
    if (!member?.profile) return 'Unknown'
    return `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
  }

  function toggleVision(visionId: string) {
    setError('')
    setSelectedVisions(prev =>
      prev.includes(visionId)
        ? prev.filter(id => id !== visionId)
        : prev.length < 2 ? [...prev, visionId] : prev
    )
  }

  const versionNumbers = useMemo(
    () => computePersonalVersionNumbers(personalVisions),
    [personalVisions]
  )

  // Group visions by owner so options read like the area bar dropdown
  // ("Jordan's Visions" -> Version 2, Version 1) instead of raw titles.
  const groupedVisions = useMemo(() => {
    const groups: Array<{ ownerId: string; ownerName: string; visions: VisionData[] }> = []
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
              <Copy className="w-6 h-6 text-primary-500" />
              Merge Two Visions
            </h2>
            <p className="text-neutral-400">
              Choose 2 personal vision versions to combine into one household vision
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : personalVisions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 mb-4">
              No personal visions available to merge.
            </p>
            <p className="text-neutral-500 text-sm">
              You need at least 2 completed personal visions from household members.
            </p>
          </div>
        ) : (
          <>
            {/* Vision Selection — grouped by owner, labeled like the Vision dropdown */}
            <div className="space-y-4 mb-6">
              {groupedVisions.map((group) => (
                <div key={group.ownerId}>
                  <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    {group.ownerName}
                  </p>
                  <div className="space-y-1.5">
                    {group.visions.map((vision) => {
                      const isSelected = selectedVisions.includes(vision.id)
                      const isDisabled = selectedVisions.length === 2 && !isSelected

                      return (
                        <button
                          key={vision.id}
                          onClick={() => toggleVision(vision.id)}
                          disabled={isDisabled}
                          className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'border-[#39FF14]/50 bg-[#39FF14]/10'
                              : isDisabled
                              ? 'border-neutral-800 bg-neutral-900/60 opacity-50 cursor-not-allowed'
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
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-secondary-400">
                <strong>Tip:</strong> The merge combines both visions&apos; content. You&apos;ll be able to refine the result together afterwards.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={merging}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMerge}
                disabled={selectedVisions.length !== 2 || merging}
                loading={merging}
                className="flex-1"
              >
                {merging ? 'Merging...' : 'Merge Selected Visions'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
