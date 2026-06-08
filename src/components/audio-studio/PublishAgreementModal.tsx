'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckSquare, Square, Loader2, ChevronDown, ShieldCheck } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'

interface PublishAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AGREEMENT_SECTIONS = [
  {
    title: '1. Ownership and Grant of License',
    paragraphs: [
      'All sound recordings and musical works generated using the VIVA system within the Vibration Fit platform in connection with your prompts, inputs, lyrics, or ideas (each a "VIVA Track") are owned exclusively by Vibration Fit, Inc.',
      'To the extent you have or later acquire any rights in a VIVA Track (including rights arising from your prompts, lyrics, or other contributions), you hereby irrevocably assign all such rights to Vibration Fit, Inc.',
      'Vibration Fit, Inc. grants you a non-exclusive, limited license to use any released VIVA Track for your own non-commercial personal promotion (for example, sharing links or snippets on your social media), subject to any branding and usage guidelines provided by Vibration Fit, Inc.',
    ],
  },
  {
    title: '2. Distribution and Permanence of Submission',
    paragraphs: [
      'You authorize Vibration Fit, Inc. to distribute, stream, reproduce, publicly perform, promote, and sublicense VIVA Tracks through all music platforms including but not limited to Spotify, Apple Music, Amazon Music, YouTube Music, and any future platforms, on a non-exclusive, perpetual, worldwide basis.',
      'You acknowledge that once a VIVA Track is distributed to third-party platforms, Vibration Fit, Inc. is not obligated to withdraw or remove it, and some platforms may not support or fully honor takedown requests. Vibration Fit, Inc. may, in its sole discretion, remove a VIVA Track from some or all platforms at any time (for example, for legal, policy, or quality reasons).',
    ],
  },
  {
    title: '3. Royalty Participation',
    paragraphs: [
      'Third-party platforms and distributors will pay all royalties and related revenues for VIVA Tracks directly to Vibration Fit, Inc. You will not receive royalty payments directly from third-party platforms.',
      'For each VIVA Track that Vibration Fit, Inc. chooses to release under the Vibration Fit name, you are entitled to 50% of the "Net Royalties" attributable to that specific VIVA Track. Vibration Fit, Inc. retains the remaining 50%.',
      '"Net Royalties" means amounts actually received by Vibration Fit, Inc. from third-party distributors, platforms, or partners that are directly attributable to the exploitation of that specific VIVA Track, after deduction of: (a) distributor fees, (b) payment processor fees, (c) chargebacks, refunds, and uncollectible amounts, and (d) sales, use, or other taxes withheld or charged in connection with those amounts.',
    ],
  },
  {
    title: '4. Songwriter / Creator Credit',
    paragraphs: [
      'Where practical and supported by the relevant platform, Vibration Fit, Inc. will credit you in the metadata and/or description for released VIVA Tracks (for example, as a "Creator," "Songwriter," or similar designation), using the Full Legal Name you provide below. Credit format and placement may vary by platform and are not guaranteed.',
    ],
  },
  {
    title: '5. Representations, Warranties, and Indemnification',
    paragraphs: [
      'You represent and warrant that: (a) Any prompts, lyrics, titles, melodies, audio files, or other materials you provide do not infringe the rights of any third party. (b) You have complied with the terms of use of any third-party tools, samples, or content used in connection with your contributions. (c) You have the right to enter into this Agreement and to grant the rights described above.',
      'You agree to indemnify and hold harmless Vibration Fit, Inc. and its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorneys\' fees) arising out of: (i) your breach of this Agreement, or (ii) any claim that your contributions (including prompts, lyrics, or uploaded materials) infringe or violate the rights of any third party.',
      'Vibration Fit, Inc. may, in its sole discretion, suspend royalty payments and/or remove a VIVA Track from distribution if it receives a claim or reasonably believes that a VIVA Track or your contributions may infringe third-party rights or violate any applicable terms or laws.',
    ],
  },
  {
    title: '6. Vibration Fit, Inc. Rights',
    paragraphs: [
      'Vibration Fit, Inc. has the right to use any VIVA Track in promotional materials, curated playlists, platform features, marketing campaigns, Vibration Fit products and services, and any other activities related to the Vibration Fit, Inc. platform and brand, without additional payment beyond the royalty participation described in Section 3.',
    ],
  },
  {
    title: '7. Royalty Accounting and Payments',
    paragraphs: [
      'Vibration Fit, Inc. will account to you on a quarterly basis for Net Royalties attributable to released VIVA Tracks in which you participate and will make royalty payments when your accrued unpaid share reaches at least USD $50 (or such other threshold as Vibration Fit, Inc. may reasonably establish and communicate). Amounts below the threshold will roll over to the next accounting period.',
      'You are responsible for providing and keeping current accurate payment and tax information. Failure to do so may delay or prevent payment.',
    ],
  },
]

function AgreementPanel({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/40 overflow-hidden">
      <button
        type="button"
        onClick={onCollapse}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
      >
        <span>Song Publishing Agreement</span>
        <ChevronDown className="w-4 h-4 rotate-180" />
      </button>
      <div className="max-h-64 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {AGREEMENT_SECTIONS.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-medium text-white mb-1">{section.title}</h4>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-xs text-neutral-400 leading-relaxed mb-2 last:mb-0">{p}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PublishAgreementModal({
  isOpen,
  onClose,
  onSuccess,
}: PublishAgreementModalProps) {
  const [legalName, setLegalName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setAgreed(false)
    setShowAgreement(false)
    setError(null)
    setSubmitting(false)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_accounts')
        .select('full_name, first_name, last_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const name = data.full_name || [data.first_name, data.last_name].filter(Boolean).join(' ')
            if (name) setLegalName(name)
          }
        })
    })
  }, [isOpen])

  const canSubmit = agreed && legalName.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/songs/publishing-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songwriter_legal_name: legalName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not save your agreement')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your agreement')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-neutral-700 rounded-2xl max-w-lg w-full shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Song Publishing Agreement</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Intro */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#39FF14]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#39FF14]" />
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Accept this once to let Vibration Fit release the music you create with VIVA. You only
              do this a single time &mdash; we&rsquo;ll remember it from here on.
            </p>
          </div>

          {/* Bullet points */}
          <div className="space-y-3">
            <p className="text-sm text-neutral-300 font-medium">By accepting, you agree that Vibration Fit may:</p>
            <ul className="space-y-2.5 text-sm text-neutral-400 leading-relaxed">
              <li className="flex gap-2.5">
                <span className="text-[#39FF14] flex-shrink-0 mt-0.5">&#x2022;</span>
                <span>Add any song you create with VIVA to the Vibration Fit Music Library for members to enjoy.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#39FF14] flex-shrink-0 mt-0.5">&#x2022;</span>
                <span>Release any of those songs on Spotify, Apple Music, YouTube Music, Alexa, and other platforms under the Vibration Fit artist profile.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#39FF14] flex-shrink-0 mt-0.5">&#x2022;</span>
                <span>Credit you as the creator and share 50% of Net Royalties on anything we release publicly.</span>
              </li>
            </ul>
          </div>

          {/* One-time clarity */}
          <div className="rounded-xl border border-[#39FF14]/20 bg-[#39FF14]/5 p-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              This is a one-time agreement. Once you accept, you won&rsquo;t see this again &mdash;
              you&rsquo;re free to create as much music with VIVA as you like.
            </p>
          </div>

          {/* Agreement checkbox */}
          <button
            type="button"
            onClick={() => setAgreed(prev => !prev)}
            className={`flex items-start gap-3 w-full text-left p-3 rounded-lg border transition-colors ${
              agreed
                ? 'border-[#39FF14]/30 bg-[#39FF14]/5'
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {agreed ? (
              <CheckSquare className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm text-neutral-300">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAgreement(prev => !prev)
                }}
                className="text-[#39FF14] underline underline-offset-2 hover:text-[#39FF14]/80 transition-colors"
              >
                Song Publishing Agreement
              </button>
              .
            </span>
          </button>

          {/* Expandable full agreement */}
          {showAgreement && <AgreementPanel onCollapse={() => setShowAgreement(false)} />}

          {/* Creator credit */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Full Legal Name (Creator Credit)
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/30 focus:border-[#39FF14]/50"
            />
            <p className="text-[11px] text-neutral-600 mt-1.5">
              This name will be used for creator credit where supported by each platform.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting} className="flex-1">
            Not Now
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            {submitting ? 'Saving...' : 'Accept Agreement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
