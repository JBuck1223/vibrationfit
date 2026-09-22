'use client'

import { useState } from 'react'
import { Button } from '@/lib/design-system/components'

export function ActivationSignInPanel({
  activationId,
  otherAccount,
}: {
  activationId: string
  otherAccount?: boolean
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function sendLink() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/activation-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : 'Could not email the link')
        return
      }
      setSent(true)
    } catch {
      setError('Could not email the link')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Sign in to keep this Activation</h2>
      <p className="text-sm leading-relaxed text-neutral-300">
        Vision Pro is added to the account that just finished this Activation.
        {otherAccount
          ? ' You are signed in on a different account, so payment cannot be attached yet.'
          : ' You are not signed in, so payment cannot be attached yet.'}
        {' '}We will email a link. Open it on any device and you will land in checkout, signed into this Activation, ready to add your card.
      </p>
      {sent ? (
        <p className="text-sm leading-relaxed text-neutral-300">
          Check your email. Open the link on any device. You will land in checkout, signed into this Activation, ready to add your card.
        </p>
      ) : (
        <Button variant="primary" onClick={sendLink} disabled={sending}>
          {sending ? 'Sending…' : 'Email me the link'}
        </Button>
      )}
      {error && <p className="text-sm text-[#FF0040]">{error}</p>}
    </div>
  )
}
