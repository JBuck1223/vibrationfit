'use client'

import React from 'react'
import { Heart, Sparkles, Wind, Sun, Lock, CloudRain, Frown, Anchor } from 'lucide-react'
import { Heading, Text } from '@/lib/design-system'

const ABOVE_FEELINGS = [
  { label: 'Freedom', icon: Wind },
  { label: 'Joy', icon: Sun },
  { label: 'Ease', icon: Sparkles },
  { label: 'Love', icon: Heart },
]

const BELOW_FEELINGS = [
  { label: 'Bondage', icon: Lock },
  { label: 'Pain', icon: CloudRain },
  { label: 'Fear', icon: Frown },
  { label: 'Heaviness', icon: Anchor },
]

/** Leaping stick figure, arms raised — free and joyful. */
function FreeFigure({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 150"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="120" cy="40" r="12" />
      <circle cx="115" cy="38" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="125" cy="38" r="1.6" fill="currentColor" stroke="none" />
      <path d="M113 44 Q120 52 127 44" strokeWidth={2} />
      <line x1="120" y1="53" x2="120" y2="92" />
      <path d="M120 62 L93 33" strokeWidth={3} />
      <path d="M120 62 L147 33" strokeWidth={3} />
      <path d="M120 92 L101 122" strokeWidth={3} />
      <path d="M120 92 L139 122" strokeWidth={3} />
      <line x1="74" y1="134" x2="166" y2="134" strokeWidth={2} opacity={0.4} />
      <path d="M95 130 q6 5 12 0" strokeWidth={2} opacity={0.55} />
      <path d="M133 130 q6 5 12 0" strokeWidth={2} opacity={0.55} />
      <path d="M58 38 v12 M52 44 h12" strokeWidth={2} opacity={0.7} />
      <path d="M186 50 v10 M181 55 h10" strokeWidth={2} opacity={0.6} />
      <circle cx="170" cy="28" r="1.8" fill="currentColor" stroke="none" opacity={0.7} />
      <circle cx="64" cy="74" r="1.6" fill="currentColor" stroke="none" opacity={0.6} />
    </svg>
  )
}

/** Hunched stick figure confined in a box, wrists in handcuffs. */
function CagedFigure({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 150"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="62" y="34" width="116" height="104" rx="4" strokeWidth={3.5} />
      <path d="M62 34 L84 14 L200 14 L178 34" strokeWidth={2} opacity={0.55} />
      <path d="M178 138 L200 118 L200 14" strokeWidth={2} opacity={0.55} />
      <circle cx="116" cy="64" r="11" />
      <circle cx="111.5" cy="62" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="120" cy="62" r="1.5" fill="currentColor" stroke="none" />
      <path d="M111 69 Q116 64 121 69" strokeWidth={2} />
      <path d="M116 75 Q108 96 120 116" />
      <path d="M120 116 L104 128" />
      <path d="M120 116 L138 126" />
      <path d="M114 86 Q128 92 138 92" />
      <path d="M118 96 Q130 98 138 96" />
      <circle cx="142" cy="92" r="4.5" strokeWidth={2.5} />
      <circle cx="142" cy="96" r="4.5" strokeWidth={2.5} />
      <path d="M147 92 l6 1 l-6 3" strokeWidth={2} opacity={0.8} />
    </svg>
  )
}

function GreenLineGraphic() {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#1F1F1F] bg-[#0A0A0A]">
      {/* ABOVE THE LINE */}
      <div className="relative px-6 pt-10 pb-12 md:px-12 md:pt-14 md:pb-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 100%, rgba(57,255,20,0.18), rgba(0,255,255,0.06) 45%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="order-2 flex justify-center md:order-1">
            <FreeFigure className="w-64 text-[#39FF14] drop-shadow-[0_0_18px_rgba(57,255,20,0.45)] md:w-80" />
          </div>
          <div className="order-1 text-center md:order-2 md:text-left">
            <span className="mb-2 inline-block rounded-full border border-[#39FF14]/40 bg-[#39FF14]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#39FF14]">
              Above the Green Line
            </span>
            <Heading level={3} className="text-white !mb-3">
              Freedom &amp; Joy
            </Heading>
            <div className="mx-auto max-w-md space-y-1 md:mx-0">
              <p className="text-lg font-semibold leading-snug text-white md:text-xl">
                The basis of life is{' '}
                <span className="text-[#39FF14]">freedom</span>.
              </p>
              <p className="text-lg font-semibold leading-snug text-white md:text-xl">
                The purpose of life is{' '}
                <span className="text-[#39FF14]">joy</span>.
              </p>
            </div>
            <Text className="text-neutral-300 mx-auto mt-3 max-w-md md:mx-0">
              Above the Green Line you live from this truth—open, light, and free to
              be, do, and have what you truly want.
            </Text>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {ABOVE_FEELINGS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10 px-3 py-1 text-sm font-medium text-[#39FF14]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* THE GREEN LINE */}
      <div className="relative h-[3px] w-full">
        <div className="absolute inset-0 bg-[#39FF14]" />
        <div className="absolute inset-0 blur-[6px] bg-[#39FF14]/70" />
        <div className="absolute inset-x-0 -top-3 flex justify-center">
          <span className="rounded-full border border-[#39FF14] bg-black px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.5)]">
            The Green Line
          </span>
        </div>
      </div>

      {/* BELOW THE LINE */}
      <div className="relative px-6 pt-12 pb-10 md:px-12 md:pt-16 md:pb-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, rgba(255,0,64,0.16), rgba(255,0,64,0.04) 45%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="order-1 text-center md:text-left">
            <span className="mb-2 inline-block rounded-full border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF0040]">
              Below the Green Line
            </span>
            <Heading level={3} className="text-white !mb-3">
              Bondage &amp; Pain
            </Heading>
            <div className="mx-auto max-w-md space-y-1 md:mx-0">
              <p className="text-lg font-semibold leading-snug text-white md:text-xl">
                Lose your freedom and life feels like{' '}
                <span className="text-[#FF0040]">bondage</span>.
              </p>
              <p className="text-lg font-semibold leading-snug text-white md:text-xl">
                Lose your joy and life turns to{' '}
                <span className="text-[#FF0040]">pain</span>.
              </p>
            </div>
            <Text className="text-neutral-300 mx-auto mt-3 max-w-md md:mx-0">
              Below the Green Line life feels heavy, stuck, and constricted—boxed in
              by fear, stress, and resistance.
            </Text>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {BELOW_FEELINGS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#FF0040]/30 bg-[#FF0040]/10 px-3 py-1 text-sm font-medium text-[#FF0040]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center order-2">
            <CagedFigure className="w-64 text-[#FF0040] drop-shadow-[0_0_16px_rgba(255,0,64,0.4)] md:w-80" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Self-contained Green Line section for embedding inside a page (e.g. homepage).
 * Includes the intro, the above/below graphic, and the closing line.
 */
export function GreenLineSection() {
  return (
    <div>
      <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
        <Heading level={2} className="text-white">
          Living Above the Green Line
        </Heading>
        <Text size="lg" className="text-neutral-300 mt-4">
          The basis of life is <span className="text-[#39FF14] font-semibold">freedom</span>.
          The purpose of life is <span className="text-[#39FF14] font-semibold">joy</span>.
          Everything we do at Vibration Fit helps you spend more of your life above
          the Green Line.
        </Text>
      </div>

      <GreenLineGraphic />

      <div className="mx-auto mt-10 max-w-2xl text-center md:mt-12">
        <Text className="text-neutral-400 italic">
          Your feelings are guidance. Vibrational fitness is choosing&mdash;again
          and again&mdash;to intentionally shift your focus above the Green Line
          so you feel good.
        </Text>
      </div>
    </div>
  )
}

export default GreenLineSection
