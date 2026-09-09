'use client'

import { getVisionCategoryIcon, getVisionCategoryLabel } from '@/lib/design-system/vision-categories'
import {
  groupNotesByCategory,
  normalizeNoteText,
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
      source: 'viva',
      created_at: new Date().toISOString(),
    })
  }
  return extra.length ? [...notes, ...extra] : notes
}

function NoteList({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone: 'contrast' | 'clarity'
}) {
  const filled = items.length > 0
  const color = tone === 'clarity' ? 'text-[#a4ff8a]' : 'text-[#ff8ba7]'
  const border = tone === 'clarity' ? 'border-[#39FF14]/25 bg-[#39FF14]/[0.04]' : 'border-[#FF0040]/25 bg-[#FF0040]/[0.04]'
  return (
    <div className={`rounded-xl border p-3 ${filled ? border : 'border-[#2a2a2a] bg-[#0A0A0A]'}`}>
      <div className={`text-[10px] uppercase tracking-wider ${filled ? color : 'text-neutral-500'}`}>
        {label}
      </div>
      {filled ? (
        <ul className="mt-1.5 space-y-1.5">
          {items.map((text, i) => (
            <li key={i} className="text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap">
              {text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-neutral-600">No notes yet</p>
      )}
    </div>
  )
}

export function VisionDraftSessionBoard({
  notes,
  liveSeeds = [],
}: {
  notes: DraftSessionNote[]
  liveSeeds?: VisionUpdateSeed[]
}) {
  const grouped = groupNotesByCategory(mergeLiveSeeds(notes, liveSeeds))
  const filledCount = grouped.filter((g) => g.contrast.length > 0 || g.clarity.length > 0).length

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        {filledCount} of 12 categories have notes. Answer VIVA&apos;s questions — contrast and clarity land here.
      </p>
      {grouped.map((group) => {
        const key = group.category as LifeCategoryKey
        const Icon = getVisionCategoryIcon(key)
        const hasAny = group.contrast.length > 0 || group.clarity.length > 0
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
                {group.contrast.length > 0 && (
                  <span className="rounded-full bg-[#FF0040]/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#ff8ba7]">
                    Contrast
                  </span>
                )}
                {group.clarity.length > 0 && (
                  <span className="rounded-full bg-[#39FF14]/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#a4ff8a]">
                    Clarity
                  </span>
                )}
              </span>
            </div>
            <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
              <NoteList label="Contrast" items={group.contrast} tone="contrast" />
              <NoteList label="Clarity" items={group.clarity} tone="clarity" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
