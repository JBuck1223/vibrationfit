'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please log in')
        setLoading(false)
        return
      }

      // Get all household member IDs
      const memberIds = householdMembers.map(m => m.user_id)

      // Fetch personal visions from all household members
      const { data: visions, error: visionError } = await supabase
        .from('vision_versions')
        .select('id, user_id, title, created_at, is_active')
        .in('user_id', memberIds)
        .is('household_id', null)  // Only personal visions
        .order('created_at', { ascending: false })

      if (visionError) throw visionError

      setPersonalVisions(visions || [])
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
        // Active vision - go to detail page
        router.push(`/life-vision/${data.visionId}`)
      } else {
        // Draft vision - go to draft page
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
    if (!member) return 'Unknown'
    return `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
  }

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
              Select a personal vision to convert into a shared household vision
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
            {/* Vision List */}
            <div className="space-y-3 mb-6">
              {personalVisions.map((vision) => {
                const isSelected = selectedVision === vision.id
                const ownerName = getOwnerName(vision.user_id)

                return (
                  <button
                    key={vision.id}
                    onClick={() => setSelectedVision(vision.id)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {vision.title || 'Untitled Vision'}
                          </h3>
                          {vision.is_active && (
                            <Badge variant="success" className="!text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400">by {ownerName}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(vision.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 text-primary-500 shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Info */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-300">
                <strong>Note:</strong> This will create a household version while keeping your original personal vision unchanged.
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

