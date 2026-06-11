'use client'

import React, { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { PublishAgreementModal } from './PublishAgreementModal'

interface SubmitForPublishingSheetProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  trackId: string
  trackTitle?: string
}

export function SubmitForPublishingSheet({
  isOpen,
  onClose,
  songId,
  trackId,
  trackTitle,
}: SubmitForPublishingSheetProps) {
  const [status, setStatus] = useState<'checking' | 'needs_agreement' | 'ready' | 'submitting' | 'success' | 'error' | 'already_submitted'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [showAgreement, setShowAgreement] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setStatus('checking')
    setError(null)
    setExistingStatus(null)
    checkAgreementStatus()
  }, [isOpen, trackId])

  async function checkAgreementStatus() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in')
      setStatus('error')
      return
    }

    const { data: account } = await supabase
      .from('user_accounts')
      .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version')
      .eq('id', user.id)
      .single()

    const hasAgreement = account?.song_publishing_agreement_accepted_at
      && account?.song_publishing_agreement_version === '2.0'

    if (hasAgreement) {
      setStatus('ready')
    } else {
      setStatus('needs_agreement')
    }
  }

  async function handleSubmit() {
    setStatus('submitting')
    setError(null)

    try {
      const res = await fetch('/api/songs/publish-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId, track_id: trackId }),
      })

      if (res.status === 409) {
        const data = await res.json()
        setExistingStatus(data.status || 'pending')
        setStatus('already_submitted')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setStatus('error')
    }
  }

  function handleAgreementSuccess() {
    setShowAgreement(false)
    setStatus('ready')
  }

  if (!isOpen) return null

  if (showAgreement) {
    return (
      <PublishAgreementModal
        isOpen={true}
        onClose={() => { setShowAgreement(false); onClose() }}
        onSuccess={handleAgreementSuccess}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-neutral-700 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-5 space-y-4">
          {status === 'checking' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          )}

          {status === 'needs_agreement' && (
            <>
              <div className="text-center">
                <Send className="w-8 h-8 text-[#39FF14] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Submit for Publishing</h3>
                <p className="text-sm text-neutral-400">
                  Before submitting songs for publishing, you need to accept the Song Publishing Agreement.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setShowAgreement(true)} className="flex-1">
                  View Agreement
                </Button>
              </div>
            </>
          )}

          {status === 'ready' && (
            <>
              <div className="text-center">
                <Send className="w-8 h-8 text-[#39FF14] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Submit for Publishing</h3>
                <p className="text-sm text-neutral-400">
                  {trackTitle
                    ? `Submit "${trackTitle}" for review and publishing on streaming platforms under Vibration Fit.`
                    : 'Submit this track for review and publishing on streaming platforms under Vibration Fit.'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              </div>
            </>
          )}

          {status === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#39FF14]" />
              <p className="text-sm text-neutral-400">Submitting for review...</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-[#39FF14] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Submitted</h3>
                <p className="text-sm text-neutral-400">
                  Your track has been submitted for publishing review. You&apos;ll be notified when it&apos;s approved.
                </p>
              </div>
              <Button variant="primary" onClick={onClose} className="w-full">
                Done
              </Button>
            </>
          )}

          {status === 'already_submitted' && (
            <>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Already Submitted</h3>
                <p className="text-sm text-neutral-400">
                  This track already has a {existingStatus} publish request.
                </p>
              </div>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Submission Failed</h3>
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} className="flex-1">
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
