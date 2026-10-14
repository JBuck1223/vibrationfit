'use client'

import { getVisionCategoryIcon, getVisionCategoryLabel } from '@/lib/design-system/vision-categories'
import {
  DEPTH_CLEAR_WORDS,
  computeDepth,
  groupNotesByCategory,
  normalizeNoteText,
  type DepthStatus,
  type DraftSessionCategoryText,
  type DraftSessionNote,
} from '@/lib/life-vision/draft-session'
import type { VisionUpdateSeed } from '@/lib/life-vision/vision-update-stream'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

function mergeLiveSeeds(notes: DraftSessionNote[], live: VisionUpdateSeed[]): DraftSessionNote[] {
  const seen = new Set(
    notes.map((n) => `${n.category}|${n.polarity}|${normalizeNoteText(n.text)}`),
  )
  const extra: DraftSessionNote[] = []
  for (const seed of live) {
    if (!seed.complete || !seed.text.trim()) continue
    const key = `${seed.category}|${seed.polarity}|${normalizeNoteText(seed.text)}`
    if (seen.has(key)) continue
    seen.add(key)
    extra.push({
      id: `live-${key}`,
      session_id: '',
      category: seed.category,
      polarity: seed.polarity,
      text: seed.text.trim(),
      member_text: null,
      source: 'viva',
      created_at: new Date().toISOString(),
    })
  }
  return extra.length ? [...notes, ...extra] : notes
}

const DEPTH_PILL: Record<DepthStatus, { label: string; className: string }> = {
  cleared: { label: 'Cleared', className: 'bg-[#39FF14]/15 text-[#a4ff8a]' },
  thin: { label: 'Thin', className: 'bg-[#FFB000]/15 text-[#ffd27a]' },
  empty: { label: 'Not yet', className: 'bg-[#2a2a2a] text-neutral-500' },
  unknown: { label: 'Unknown yet', className: 'bg-[#8B5CF6]/15 text-[#c4b5fd]' },
}

function WordsColumn({
  label,
  passages,
  labels,
  tone,
}: {
  label: string
  passages: string[]
  labels: string[]
  tone: 'contrast' | 'clarity'
}) {
  const filled = passages.length > 0 || labels.length > 0
  const color = tone === 'clarity' ? 'text-[#a4ff8a]' : 'text-[#ff8ba7]'
  const border = tone === 'clarity' ? 'border-[#39FF14]/25 bg-[#39FF14]/[0.04]' : 'border-[#FF0040]/25 bg-[#FF0040]/[0.04]'
  return (
    <div className={`rounded-xl border p-3 ${filled ? border : 'border-[#2a2a2a] bg-[#0A0A0A]'}`}>
      <div className={`text-[10px] uppercase tracking-wider ${filled ? color : 'text-neutral-500'}`}>
        {label}
      </div>
      {passages.length > 0 && (
        <ul className="mt-1.5 space-y-2">
          {passages.map((text, i) => (
            <li key={`p-${i}`} className="text-sm leading-relaxed text-neutral-100 whitespace-pre-wrap border-l-2 border-neutral-700 pl-2">
              {text}
            </li>
          ))}
        </ul>
      )}
      {labels.length > 0 && (
        <ul className={`${passages.length > 0 ? 'mt-2 pt-2 border-t border-neutral-800' : 'mt-1.5'} space-y-1`}>
          {labels.map((text, i) => (
            <li key={`l-${i}`} className="text-xs leading-relaxed text-neutral-400">
              {text}
            </li>
          ))}
        </ul>
      )}
      {!filled && <p className="mt-1 text-xs text-neutral-600">Nothing yet</p>}
    </div>
  )
}

function BeatBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#39FF14]/25 bg-[#39FF14]/[0.04] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[#a4ff8a]">{label}</div>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">{text}</p>
    </div>
  )
}

export function VisionDraftSessionBoard({
  notes,
  categoryText = [],
  liveSeeds = [],
}: {
  notes: DraftSessionNote[]
  categoryText?: DraftSessionCategoryText[]
  liveSeeds?: VisionUpdateSeed[]
}) {
  const merged = mergeLiveSeeds(notes, liveSeeds)
  const grouped = groupNotesByCategory(merged, categoryText)
  const depth = computeDepth(merged, categoryText)
  const clearedCount = depth.cleared.length + depth.unknown.length

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        {clearedCount} of 12 areas cleared. Your own words land here; an area clears at about {DEPTH_CLEAR_WORDS} of them with a real scene inside. Saying you don&apos;t know yet clears it too.
      </p>
      {grouped.map((group) => {
        const key = group.category as LifeCategoryKey
        const Icon = getVisionCategoryIcon(key)
        const pill = DEPTH_PILL[group.depth]
        const hasAny = group.depth !== 'empty'
        return (
          <div
            key={key}
            className={`rounded-2xl border bg-[#161616] ${
              hasAny ? 'border-[#3a3a3a]' : 'border-[#2a2a2a]'
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Icon className={`h-4 w-4 shrink-0 ${hasAny ? 'text-white' : 'text-neutral-500'}`} />
              <span className="text-sm font-medium text-white truncate">
                {getVisionCategoryLabel(key)}
              </span>
              <span className="ml-auto flex items-center gap-1.5 shrink-0">
                {group.memberWords > 0 && (
                  <span className="text-[10px] text-neutral-500">{group.memberWords} words</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${pill.className}`}>
                  {pill.label}
                </span>
              </span>
            </div>
            {group.memberUnknown.length > 0 && (
              <p className="px-4 pb-2 text-xs text-neutral-400 italic">
                {group.memberUnknown[0]}
              </p>
            )}
            {group.unknownYet && !group.nowDone && !group.dreamDone && (
              <p className="px-4 pb-2 text-xs text-neutral-400 italic">I don&apos;t know yet.</p>
            )}
            {group.nowDone || group.dreamDone ? (
              // Start From Scratch: the beats are the body.
              <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                {group.nowDone && <BeatBlock label="What's going on now" text={group.nowText} />}
                {group.dreamDone && <BeatBlock label="Unleash your imagination" text={group.dreamText} />}
              </div>
            ) : (
              <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                <WordsColumn label="Contrast" passages={group.memberContrast} labels={group.contrast} tone="contrast" />
                <WordsColumn label="Clarity" passages={group.memberClarity} labels={group.clarity} tone="clarity" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
