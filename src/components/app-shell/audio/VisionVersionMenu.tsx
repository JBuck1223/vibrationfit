'use client'

import React from 'react'
import { Check, ChevronDown, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudioStudio } from '@/components/audio-studio/AudioStudioContext'
import { useMultiMemberHousehold, visionOwnerName } from '@/components/life-vision/useMultiMemberHousehold'

type Vision = ReturnType<typeof useAudioStudio>['allVisions'][number]

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Which Life Vision version's audio the library shows. Grouped like the
 * studio's selector: your versions, then household ("Life We Choose")
 * versions and a partner's shared ones.
 */
export function VisionVersionMenu() {
  const { vision, allVisions, switchVision } = useAudioStudio()
  const { data: household } = useMultiMemberHousehold()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!vision || allVisions.length < 2) return null

  const mine = allVisions.filter((v) => v.is_mine !== false && !v.is_household)
  const ours = allVisions.filter((v) => v.is_household)
  const shared = allVisions.filter((v) => v.is_mine === false && !v.is_household)
  const groups: { label: string; items: { v: Vision; label: string }[] }[] = [
    { label: 'The Life I Choose', items: mine.map((v) => ({ v, label: `Version ${v.version_number}` })) },
    {
      label: 'The Life We Choose',
      items: [
        ...ours.map((v) => ({ v, label: `Version ${v.version_number}` })),
        ...shared.map((v) => ({ v, label: `Version ${v.version_number} · ${visionOwnerName(household?.members, v.user_id)}` })),
      ],
    },
  ].filter((g) => g.items.length > 0)

  const groupOf = (v: Vision) => (v.is_household || v.is_mine === false ? 'The Life We Choose' : 'The Life I Choose')

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex max-w-full items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-sm text-white transition-colors hover:border-white/35"
      >
        <Eye className="h-4 w-4 shrink-0 text-[#39FF14]" />
        <span className="truncate">
          {groupOf(vision)} · <span className="text-white/65">Version {vision.version_number}{vision.is_active ? ' (active)' : ''}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Life Vision version"
          className="vf-glass absolute left-0 top-full z-30 mt-2 max-h-[60vh] w-[280px] overflow-y-auto rounded-2xl border border-white/[0.14] bg-[rgba(28,22,38,0.96)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          {groups.map((g, gi) => (
            <div key={g.label} className={cn(gi > 0 && 'mt-1 border-t border-white/[0.08] pt-1')}>
              {groups.length > 1 && <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium text-white/50">{g.label}</p>}
              {g.items.map(({ v, label }) => {
                const selected = v.id === vision.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      switchVision(v.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      selected ? 'bg-[rgba(57,255,20,0.12)] text-[#39FF14]' : 'text-white/85 hover:bg-white/[0.06]',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">
                        {label}
                        {v.is_active && <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-px text-[10px] text-white/70">Active</span>}
                      </span>
                      <span className="block text-[11px] text-white/45">{shortDate(v.created_at)}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
