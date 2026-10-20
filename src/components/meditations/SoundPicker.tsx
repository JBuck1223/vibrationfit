'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Music2, Pause, Play, Radio } from 'lucide-react'
import type { MeditationBinauralOption, MeditationMusicOption } from '@/lib/meditations/catalog'
import { CreatorLink } from './CreatorLink'

export function musicKey(option: { source: string; id: string }) {
  return `${option.source}:${option.id}`
}

function titleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function musicSubtitle(option: MeditationMusicOption) {
  const category = option.category === 'meditations' ? 'Meditation' : titleCase(option.category)
  return option.creatorName ? `${category} • by ${option.creatorName}` : category
}

/** One preview at a time across every picker on the page. */
export function usePreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPreviewUrl(null)
  }, [])

  const toggle = useCallback((url: string) => {
    if (audioRef.current && previewUrl === url) {
      stop()
      return
    }
    audioRef.current?.pause()
    const audio = new Audio(url)
    audio.volume = 0.7
    audio.addEventListener('ended', () => setPreviewUrl(null))
    audioRef.current = audio
    setPreviewUrl(url)
    void audio.play().catch(() => setPreviewUrl(null))
  }, [previewUrl, stop])

  useEffect(() => () => audioRef.current?.pause(), [])

  return { previewUrl, toggle, stop }
}

export type Preview = ReturnType<typeof usePreview>

interface SlotProps {
  icon: React.ReactNode
  label: string
  value: string | null
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

function Slot({ icon, label, value, open, onToggle, children, footer }: SlotProps) {
  return (
    <div className={`rounded-2xl border-2 transition-colors ${open ? 'border-[#00FFFF]/40 bg-neutral-950' : 'border-neutral-800 bg-neutral-900/60'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00FFFF]/10 text-[#00FFFF]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-wider text-neutral-500">{label}</span>
          <span className={`block truncate text-sm md:text-base ${value ? 'text-white' : 'text-neutral-400'}`}>
            {value || 'None'}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {footer && <div className="px-4 pb-3">{footer}</div>}
      {open && <div className="border-t border-neutral-800 p-2">{children}</div>}
    </div>
  )
}

function OptionRow({
  title,
  subtitle,
  selected,
  previewing,
  onSelect,
  onPreview,
}: {
  title: string
  subtitle?: React.ReactNode
  selected: boolean
  previewing?: boolean
  onSelect: () => void
  onPreview?: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
        selected ? 'bg-[#39FF14]/10' : 'hover:bg-white/5'
      }`}
    >
      {onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          aria-label={previewing ? `Stop preview of ${title}` : `Preview ${title}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            previewing ? 'bg-[#00FFFF] text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
          }`}
        >
          {previewing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
      ) : (
        <span className="w-9 shrink-0" />
      )}
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${selected ? 'text-[#39FF14]' : 'text-white'}`}>{title}</span>
          {subtitle && <span className="block truncate text-xs text-neutral-500">{subtitle}</span>}
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-[#39FF14]" />}
      </button>
    </div>
  )
}

function Level({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs text-neutral-500">Level</span>
      <input
        type="range"
        min={0}
        max={100}
        aria-label={label}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="w-full accent-[#39FF14]"
      />
    </label>
  )
}

interface MusicPickerProps {
  options: MeditationMusicOption[]
  value: string
  onChange: (key: string) => void
  volume: number
  onVolume: (volume: number) => void
  preview: Preview
}

export function MusicPicker({ options, value, onChange, volume, onVolume, preview }: MusicPickerProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('all')
  const selected = options.find((option) => musicKey(option) === value) || null

  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const option of options) seen.add(option.source === 'generated' ? 'mine' : option.category)
    return [...seen]
  }, [options])

  const visible = options.filter((option) => {
    if (category === 'all') return true
    if (category === 'mine') return option.source === 'generated'
    return option.source !== 'generated' && option.category === category
  })

  return (
    <Slot
      icon={<Music2 className="h-5 w-5" />}
      label="Music"
      value={selected?.title || null}
      open={open}
      onToggle={() => setOpen((next) => !next)}
      footer={selected ? (
        <div className="space-y-2">
          {selected.creatorId && selected.creatorName && (
            <p className="text-xs text-neutral-500">
              by <CreatorLink userId={selected.creatorId} name={selected.creatorName} />
            </p>
          )}
          <Level value={volume} onChange={onVolume} label="Music level" />
        </div>
      ) : undefined}
    >
      {categories.length > 1 && (
        <div className="mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {['all', ...categories].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                category === name ? 'bg-[#00FFFF] text-black font-semibold' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {name === 'all' ? 'All' : name === 'mine' ? 'My tracks' : titleCase(name)}
            </button>
          ))}
        </div>
      )}
      <div className="max-h-72 overflow-y-auto">
        <OptionRow title="No music" selected={!selected} onSelect={() => onChange('')} />
        {visible.map((option) => (
          <OptionRow
            key={musicKey(option)}
            title={option.title}
            subtitle={musicSubtitle(option)}
            selected={musicKey(option) === value}
            previewing={preview.previewUrl === option.url}
            onSelect={() => onChange(musicKey(option))}
            onPreview={() => preview.toggle(option.url)}
          />
        ))}
      </div>
    </Slot>
  )
}

interface BinauralPickerProps {
  options: MeditationBinauralOption[]
  value: string
  onChange: (id: string) => void
  volume: number
  onVolume: (volume: number) => void
  preview: Preview
}

export function BinauralPicker({ options, value, onChange, volume, onVolume, preview }: BinauralPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value) || null

  return (
    <Slot
      icon={<Radio className="h-5 w-5" />}
      label="Frequency"
      value={selected?.title || null}
      open={open}
      onToggle={() => setOpen((next) => !next)}
      footer={selected ? <Level value={volume} onChange={onVolume} label="Frequency level" /> : undefined}
    >
      <div className="max-h-72 overflow-y-auto">
        <OptionRow title="No frequency" selected={!selected} onSelect={() => onChange('')} />
        {options.map((option) => (
          <OptionRow
            key={option.id}
            title={option.title}
            subtitle={titleCase(option.category)}
            selected={option.id === value}
            previewing={preview.previewUrl === option.url}
            onSelect={() => onChange(option.id)}
            onPreview={() => preview.toggle(option.url)}
          />
        ))}
      </div>
    </Slot>
  )
}
