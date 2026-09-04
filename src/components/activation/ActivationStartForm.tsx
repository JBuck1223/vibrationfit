'use client'

/**
 * Activation email capture — embedded in the /activation landing page.
 * Creates the free account + activation via /api/activation/start and routes
 * into the guided experience. Existing members get a magic-link email instead
 * of an auto-login (account-takeover guard).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail } from 'lucide-react'
import { useTracking } from '@/components/TrackingProvider'
import { trackConversion } from '@/lib/tracking/pixels'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export function ActivationStartForm({
  previewState,
  previewEmail,
}: {
  previewState?: 'form' | 'check-email'
  previewEmail?: string
} = {}) {
  const router = useRouter()
  const { visitorId, sessionId } = useTracking()
  const copy = ACTIVATION_COPY.startForm

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState(previewEmail || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(previewState === 'check-email')

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (previewState) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/activation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          visitor_id: visitorId || undefined,
          session_id: sessionId || undefined,
          landing_page: '/activation',
          referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')

      if (data.checkEmail) {
        setCheckEmail(true)
        return
      }

      if (data.isNewUser && data.activationId) {
        trackConversion('lead', { content_name: 'activation', event_id: data.activationId })
      }
      router.push(data.resumePath || `/activation/experience?id=${data.activationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border-2 border-[#00FFFF]/30 bg-[#101010] p-6 text-center md:p-8">
        <Mail className="mx-auto mb-3 h-8 w-8 text-[#00FFFF]" />
        <h3 className="mb-2 text-lg font-bold text-white">{copy.checkEmailTitle}</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          {copy.checkEmailBefore}{' '}
          <span className="text-white">{email}</span>. {copy.checkEmailAfter}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleStart} className="mx-auto mt-10 w-full max-w-md">
      <div className="rounded-2xl border-2 border-[#333] bg-[#101010] p-6 md:p-8">
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="space-y-4">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={copy.firstNamePlaceholder}
            required
            className="w-full rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#39FF14] focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            required
            className="w-full rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#39FF14] focus:outline-none"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !firstName || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-transparent bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? copy.submitting : copy.submit}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="text-center text-xs text-neutral-500">
            {copy.footer}
          </p>
        </div>
      </div>
    </form>
  )
}
