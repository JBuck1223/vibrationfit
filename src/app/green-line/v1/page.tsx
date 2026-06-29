'use client'

import React from 'react'
import { Heart, Sparkles, Wind, Sun, Lock, CloudRain, Frown, Anchor } from 'lucide-react'
import { Container, Heading, Text } from '@/lib/design-system'

/**
 * Green Line concept — VERSION 1 (original).
 *
 * First pass: hammock figure (single arm, no eyes) above; caged + handcuffed
 * figure below; generic supporting copy. Preserved for reference.
 */

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

/* ------------------------------------------------------------------ */
/*  Stick-figure SVGs                                                   */
/* ------------------------------------------------------------------ */

/** Relaxed stick figure lounging in a hammock between two posts. */
function HammockFigure({ className = '' }: { className?: string }) {
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
      {/* Posts */}
      <line x1="28" y1="22" x2="28" y2="132" />
      <line x1="212" y1="22" x2="212" y2="132" />
      {/* Ground shadow lines */}
      <line x1="14" y1="132" x2="42" y2="132" />
      <line x1="198" y1="132" x2="226" y2="132" />

      {/* Hammock bed (sagging curve) + top suspension lines */}
      <path d="M28 56 Q120 130 212 56" strokeWidth={3.5} />
      <path d="M28 44 Q120 70 212 44" strokeWidth={1.5} opacity={0.6} />

      {/* Reclining stick figure */}
      {/* Head */}
      <circle cx="78" cy="70" r="11" />
      {/* Smile */}
      <path d="M73 72 Q78 77 83 72" strokeWidth={2} />
      {/* Reclined torso along the hammock */}
      <line x1="89" y1="76" x2="150" y2="92" />
      {/* Arm tucked behind head */}
      <path d="M78 81 Q70 92 84 96" />
      {/* Crossed legs dangling, relaxed */}
      <path d="M150 92 L172 80 L160 96" />
      <path d="M150 92 L166 96 L150 104" />

      {/* Ease / breeze sparkles */}
      <path d="M120 26 q6 -6 12 0" strokeWidth={2} opacity={0.7} />
      <path d="M134 18 q5 -5 10 0" strokeWidth={2} opacity={0.5} />
      <circle cx="104" cy="30" r="1.6" fill="currentColor" stroke="none" opacity={0.7} />
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
      {/* Box / cage (slight isometric) */}
      <rect x="62" y="34" width="116" height="104" rx="4" strokeWidth={3.5} />
      <path d="M62 34 L84 14 L200 14 L178 34" strokeWidth={2} opacity={0.55} />
      <path d="M178 138 L200 118 L200 14" strokeWidth={2} opacity={0.55} />

      {/* Hunched, confined figure */}
      {/* Head bowed */}
      <circle cx="116" cy="64" r="11" />
      {/* Frown */}
      <path d="M111 68 Q116 64 121 68" strokeWidth={2} />
      {/* Curved, slumped back */}
      <path d="M116 75 Q108 96 120 116" />
      {/* Legs pulled in */}
      <path d="M120 116 L104 128" />
      <path d="M120 116 L138 126" />

      {/* Arms forward to bound wrists */}
      <path d="M114 86 Q128 92 138 92" />
      <path d="M118 96 Q130 98 138 96" />

      {/* Handcuffs: two cuffs + chain */}
      <circle cx="142" cy="92" r="4.5" strokeWidth={2.5} />
      <circle cx="142" cy="96" r="4.5" strokeWidth={2.5} />
      <path d="M147 92 l6 1 l-6 3" strokeWidth={2} opacity={0.8} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Main graphic (drop-in component for the homepage container)         */
/* ------------------------------------------------------------------ */

function GreenLineGraphic() {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#1F1F1F] bg-[#0A0A0A]">
      {/* ABOVE THE LINE */}
      <div className="relative px-6 pt-10 pb-12 md:px-12 md:pt-14 md:pb-16">
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 100%, rgba(57,255,20,0.18), rgba(0,255,255,0.06) 45%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Figure */}
          <div className="order-2 flex justify-center md:order-1">
            <HammockFigure className="w-64 text-[#39FF14] drop-shadow-[0_0_18px_rgba(57,255,20,0.45)] md:w-80" />
          </div>
          {/* Copy */}
          <div className="order-1 text-center md:order-2 md:text-left">
            <span className="mb-2 inline-block rounded-full border border-[#39FF14]/40 bg-[#39FF14]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#39FF14]">
              Above the Green Line
            </span>
            <Heading level={3} className="text-white !mb-2">
              Freedom &amp; Joy
            </Heading>
            <Text className="text-neutral-300 mx-auto max-w-md md:mx-0">
              When you&apos;re in alignment, life feels open, light, and easy. You&apos;re
              free to be, do, and have what you truly want.
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
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, rgba(255,0,64,0.16), rgba(255,0,64,0.04) 45%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Copy */}
          <div className="order-1 text-center md:text-left">
            <span className="mb-2 inline-block rounded-full border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF0040]">
              Below the Green Line
            </span>
            <Heading level={3} className="text-white !mb-2">
              Bondage &amp; Pain
            </Heading>
            <Text className="text-neutral-300 mx-auto max-w-md md:mx-0">
              When you&apos;re out of alignment, life feels heavy, stuck, and
              constricted—boxed in by fear, stress, and resistance.
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
          {/* Figure */}
          <div className="flex justify-center order-2">
            <CagedFigure className="w-64 text-[#FF0040] drop-shadow-[0_0_16px_rgba(255,0,64,0.4)] md:w-80" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page wrapper for fine-tuning                                        */
/* ------------------------------------------------------------------ */

export default function GreenLineV1Page() {
  return (
    <div className="min-h-screen bg-black py-16 md:py-24">
      <Container size="lg">
        {/* Version label */}
        <div className="mx-auto mb-4 max-w-3xl text-center">
          <span className="inline-block rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Version 1 — Original
          </span>
        </div>

        {/* Intro */}
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Heading level={1} className="text-white">
            Living Above the Green Line
          </Heading>
          <Text size="lg" className="text-neutral-300 mt-4">
            The basis of life is <span className="text-[#39FF14] font-semibold">freedom</span>.
            The purpose of life is <span className="text-[#39FF14] font-semibold">joy</span>.
            Everything we do at VibrationFit helps you spend more of your life above
            the Green Line.
          </Text>
        </div>

        {/* The graphic */}
        <GreenLineGraphic />

        {/* Closing line */}
        <div className="mx-auto mt-12 max-w-2xl text-center md:mt-16">
          <Text className="text-neutral-400 italic">
            Your feelings are the signal. The Green Line is the threshold. Conscious
            creation is choosing—again and again—to rise above it.
          </Text>
        </div>
      </Container>
    </div>
  )
}
