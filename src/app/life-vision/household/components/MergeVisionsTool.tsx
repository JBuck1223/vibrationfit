'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'

interface VisionData {
  id: string
  user_id: string
  title: string
  created_at: string
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
      const supabase = createClient()

      // Get all household members' user IDs
      const memberIds = householdMembers.map(m => m.user_id)

      // Fetch all personal visions from household members
      const { data, error } = await supabase
        .from('vision_versions')
        .select('id, user_id, title, created_at')
        .in('user_id', memberIds)
        .is('household_id', null)  // Only personal visions
        .eq('is_draft', false)      // Only completed visions
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching personal visions:', error)
        setError('Failed to load personal visions')
        return
      }

      setPersonalVisions(data || [])
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

      // Success! Navigate to the new draft
      onSuccess?.()
      router.push(`/life-vision/${data.visionId}/draft`)
    } catch (err: any) {
      console.error('Error merging visions:', err)
      setError(err.message || 'Failed to merge visions')
      setMerging(false)
    }
  }

  function getOwnerName(userId: string) {
    const member = householdMembers.find(m => m.user_id === userId)
    if (!member) return 'Unknown'
    return `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Merge Personal Visions</h2>
            <p className="text-neutral-400">
              Select 2 personal visions to combine into one household vision
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
            {/* Vision Selection */}
            <div className="space-y-3 mb-6">
              {personalVisions.map((vision) => {
                const isSelected = selectedVisions.includes(vision.id)
                const isDisabled = 
                  selectedVisions.length === 2 && !isSelected

                return (
                  <label
                    key={vision.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10'
                        : isDisabled
                        ? 'border-neutral-700 bg-neutral-800/50 opacity-50 cursor-not-allowed'
                        : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVisions([...selectedVisions, vision.id])
                        } else {
                          setSelectedVisions(
                            selectedVisions.filter(id => id !== vision.id)
                          )
                        }
                        setError('')
                      }}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          {vision.title || 'Untitled Vision'}
                        </h3>
                        <Badge variant="neutral" className="text-xs">
                          {getOwnerName(vision.user_id)}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Created {new Date(vision.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Info */}
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-secondary-400">
                💡 <strong>Tip:</strong> The merge will combine both visions' content. 
                You'll be able to refine the result together afterwards.
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

