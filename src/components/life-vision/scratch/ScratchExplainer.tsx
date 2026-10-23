'use client'

/**
 * The one explainer for Start From Scratch. Collapsible row in the same
 * chrome as the area rows: video on the left, how-it-works text on the right.
 */

import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { useInShell } from '@/lib/app-shell/shell-context'

export const SCRATCH_EXPLAINER_VIDEO =
  'https://media.vibrationfit.com/site-assets/onboarding/vision-from-scratch-mode-1080p.mp4'
export const SCRATCH_EXPLAINER_POSTER =
  'https://media.vibrationfit.com/site-assets/onboarding/vision-from-scratch-mode-thumb.0000000.jpg'

interface ScratchExplainerProps {
  open: boolean
  onToggle: () => void
}

export function ScratchExplainer({ open, onToggle }: ScratchExplainerProps) {
  const inShell = useInShell()
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616] transition-all hover:border-[#3a3a3a]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {inShell ? (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(191,0,255,0.16)]">
              <PlayCircle className="h-5 w-5 text-[#d68bff]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-white">How this works</span>
              <span className="block truncate text-xs text-white/50">A short video and the two things VIVA needs from you</span>
            </span>
          </>
        ) : (
          <>
        <PlayCircle className="h-4 w-4 shrink-0 text-[#BF00FF]" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">How this works</span>
          </>
        )}
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      </button>

      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-4">
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6">
            <OptimizedVideo
              url={SCRATCH_EXPLAINER_VIDEO}
              thumbnailUrl={SCRATCH_EXPLAINER_POSTER}
              context="single"
              className="aspect-video w-full overflow-hidden rounded-xl"
            />
            <div className={`space-y-3 text-sm leading-relaxed ${inShell ? 'text-white/75' : 'text-neutral-300'}`}>
              <h2 className="text-base font-semibold text-white">Bring Your Life Vision to Life</h2>
              <p>VIVA turns your raw material into your Life Vision. For each category, give her two things:</p>
              <p>
                <span className="font-semibold text-white">What&apos;s going on now</span>
                <br />
                The honest version. No sugarcoating, no spiritual bypassing. If it&apos;s amazing, celebrate it. If it sucks, let it out. You don&apos;t have to make it sound pretty.
              </p>
              <p>
                <span className="font-semibold text-white">Unleash your imagination</span>
                <br />
                What would you absolutely love to experience in this part of your life? Let yourself want what you want, even if it feels wildly out of reach. Dream big. Get specific. Go unhinged.
              </p>
              <p>
                <span className="font-semibold text-white">Spillover is completely natural</span>
                <br />
                Money comes up when you talk about work. Love comes up when you talk about family. Fun comes up when you talk about travel. Your life is connected, so overlap is good. Speak naturally about the subject and let your thoughts go where they go. You don&apos;t need to fit everything neatly into one category.
              </p>
              <p>
                <span className="font-semibold text-white">Write your Life Vision</span>
                <br />
                Once you&apos;ve added both to every category, tap <span className="font-semibold text-white">Write My Life Vision</span>. VIVA brings it all together into a complete vision, then you enter <span className="font-semibold text-white">VIVA Edit</span> to shape and refine it with her.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
