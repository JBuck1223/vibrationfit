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

export function ActivationStartForm() {
  const router = useRouter()
  const { visitorId, sessionId } = useTracking()

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
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
      router.push(`/activation/experience?id=${data.activationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border-2 border-[#00FFFF]/30 bg-[#101010] p-6 text-center md:p-8">
        <Mail className="mx-auto mb-3 h-8 w-8 text-[#00FFFF]" />
        <h3 className="mb-2 text-lg font-bold text-white">Check your email</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          You already have a Vibration Fit account, so we sent a secure sign-in link
          to <span className="text-white">{email}</span>. Open it on this device to
          continue your Activation.
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
            placeholder="First name"
            required
            className="w-full rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#39FF14] focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#39FF14] focus:outline-none"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !firstName || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-transparent bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Setting up your space...' : 'Create My Free Activation'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="text-center text-xs text-neutral-500">
            No credit card required. Takes 10–15 minutes. Your information stays private.
          </p>
        </div>
      </div>
    </form>
  )
}
