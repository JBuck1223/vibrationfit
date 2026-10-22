'use client'

import React from 'react'
import { Check, ChevronDown, Loader2, Pencil, RefreshCw, Sparkles, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Size = 'square' | 'landscape_4_3' | 'landscape_16_9' | 'portrait_4_3' | 'portrait_16_9'

// The same five sizes as the full generator, each with a little shape preview.
const SIZES: { id: Size; ratio: string; aspect: string; w: number; h: number }[] = [
  { id: 'square', ratio: '1:1', aspect: 'aspect-square', w: 24, h: 24 },
  { id: 'landscape_4_3', ratio: '4:3', aspect: 'aspect-[4/3]', w: 30, h: 22 },
  { id: 'landscape_16_9', ratio: '16:9', aspect: 'aspect-video', w: 36, h: 20 },
  { id: 'portrait_4_3', ratio: '3:4', aspect: 'aspect-[3/4]', w: 18, h: 24 },
  { id: 'portrait_16_9', ratio: '9:16', aspect: 'aspect-[9/16]', w: 14, h: 24 },
]

const STYLES: { id: string; label: string; hint: string }[] = [
  { id: 'dreamy', label: 'Dreamy', hint: 'soft, dreamy light with a gentle glow' },
  { id: 'vivid', label: 'Vivid', hint: 'bold, vivid, saturated color' },
  { id: 'watercolor', label: 'Watercolor', hint: 'a loose watercolor painting' },
  { id: 'cinematic', label: 'Cinematic', hint: 'a cinematic photograph with dramatic light' },
]

async function fileToDataUri(file: File): Promise<string> {
  let upload = file
  const heic = /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  if (heic) {
    try {
      const heic2any = (await import('heic2any')).default
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
      upload = new File([blob as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
    } catch {
      /* send the original; the server may still read it */
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(upload)
  })
}

/**
 * The app shell's VIVA image panel for a journal entry: one button makes an
 * image from what they wrote, with an optional description and style; size
 * and editing an existing image sit under More options. Same image service
 * as the full generator (/api/images/generate).
 */
export function VivaImagePanel({
  journalText,
  onUse,
  onClose,
}: {
  journalText: string
  /** The chosen image's URL, or '' when they remove it. */
  onUse: (url: string) => void
  onClose: () => void
}) {
  const [description, setDescription] = React.useState('')
  const [style, setStyle] = React.useState<string | null>(null)
  const [size, setSize] = React.useState<Size>('square')
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [editFile, setEditFile] = React.useState<File | null>(null)
  const [editPrompt, setEditPrompt] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const [used, setUsed] = React.useState<string | null>(null)

  const request = async (body: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ quality: 'standard', style: 'vivid', model: 'nano-banana', dimension: size, ...body }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg: string = err.error || 'VIVA could not make that image'
        if (res.status === 402 || msg.toLowerCase().includes('token')) throw new Error('Not enough tokens to make an image. Add tokens or upload a photo instead.')
        if (res.status === 403 || msg.includes('Forbidden')) throw new Error('VIVA images are unavailable right now. Upload a photo instead.')
        throw new Error(msg)
      }
      const data = (await res.json()) as { imageUrl: string }
      setResult(data.imageUrl)
      setEditing(false)
      setEditFile(null)
      setEditPrompt('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'VIVA could not make that image')
    } finally {
      setBusy(false)
    }
  }

  const create = () => {
    const source = description.trim() || journalText.trim()
    if (!source) {
      toast.error('Write a little first, or describe the image you want')
      return
    }
    const styleHint = STYLES.find((s) => s.id === style)?.hint
    const scene = description.trim()
      ? description.trim()
      : `An artistic scene inspired by this journal moment: ${source.slice(0, 400)}${source.length > 400 ? '...' : ''}`
    void request({ type: 'journal', prompt: `${scene}${styleHint ? ` In the style of ${styleHint}.` : ''} No words or text in the image.` })
  }

  const applyEdit = async () => {
    if (!editPrompt.trim()) {
      toast.error('Describe the change you want')
      return
    }
    if (result && !editFile) {
      void request({ type: 'edit', prompt: editPrompt.trim(), imageUrl: result })
      return
    }
    if (!editFile) {
      toast.error('Choose an image to edit')
      return
    }
    void request({ type: 'edit', prompt: editPrompt.trim(), imageDataUri: await fileToDataUri(editFile) })
  }

  const aspect = SIZES.find((s) => s.id === size)?.aspect ?? 'aspect-[4/3]'
  const chip = 'rounded-full border px-3 py-1 text-xs transition-colors'

  return (
    <div className="rounded-[20px] border border-[#BF00FF]/35 bg-[rgba(191,0,255,0.06)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#d68bff]" />
        <span className="text-sm font-semibold text-white">VIVA image</span>
        <button type="button" onClick={onClose} aria-label="Close VIVA image" className="ml-auto text-white/50 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {busy ? (
        <div className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/[0.04]', aspect)}>
          <Loader2 className="h-6 w-6 animate-spin text-[#d68bff]" />
          <span className="text-xs text-white/60">VIVA is creating your image...</span>
        </div>
      ) : result && !editing ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="Your VIVA image" className="w-full rounded-2xl object-cover" />
          {used === result ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[rgba(57,255,20,0.14)] py-2 text-sm font-medium text-[#39FF14]">
                <Check className="h-4 w-4" /> Added to this entry
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsed(null)
                  onUse('')
                }}
                className="rounded-full border border-white/20 px-3 py-2 text-xs text-white/75 hover:text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsed(result)
                  onUse(result)
                }}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#39FF14] py-2 text-sm font-semibold text-black"
              >
                <Check className="h-4 w-4" /> Use this
              </button>
              <button type="button" onClick={create} className="flex items-center justify-center gap-1.5 rounded-full border border-white/22 py-2 text-sm text-white">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(true)
                  setEditFile(null)
                }}
                className="flex items-center justify-center gap-1.5 rounded-full border border-white/22 py-2 text-sm text-white"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>
          )}
        </div>
      ) : editing ? (
        <div className="space-y-3">
          {result && !editFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result} alt="Image to edit" className="max-h-40 w-full rounded-2xl object-cover" />
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 px-3 py-4 text-sm text-white/75 hover:text-white">
              <Upload className="h-4 w-4" />
              {editFile ? editFile.name : 'Choose an image to edit'}
              <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
          <input
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="What should change? e.g. make it sunset colors"
            className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/40 focus:border-[#BF00FF]/60 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => void applyEdit()} className="flex-1 rounded-full bg-[#BF00FF] py-2.5 text-sm font-semibold text-white">
              Edit image
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-white/20 px-4 py-2.5 text-sm text-white/80">
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={create}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#BF00FF] text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" /> Create from my entry
          </button>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Or describe it (optional)"
            className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/40 focus:border-[#BF00FF]/60 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={style === s.id}
                onClick={() => setStyle(style === s.id ? null : s.id)}
                className={cn(chip, style === s.id ? 'border-[#BF00FF]/60 bg-[rgba(191,0,255,0.2)] text-[#e0a3ff]' : 'border-white/18 text-white/80 hover:text-white')}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Image size">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={size === s.id}
                onClick={() => setSize(s.id)}
                className={cn(
                  'flex h-14 w-12 flex-col items-center justify-between rounded-xl border p-1.5 transition-colors',
                  size === s.id ? 'border-[#39FF14]/70 bg-[rgba(57,255,20,0.1)]' : 'border-white/15 hover:border-white/30',
                )}
              >
                <span className="flex flex-1 items-center justify-center">
                  <span className={cn('rounded-[3px]', size === s.id ? 'bg-[#39FF14]' : 'bg-white/40')} style={{ width: s.w * 0.75, height: s.h * 0.75 }} />
                </span>
                <span className={cn('text-[10px] font-medium', size === s.id ? 'text-[#39FF14]' : 'text-white/70')}>{s.ratio}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setMoreOpen((o) => !o)} className="flex items-center gap-1 text-xs text-white/55 hover:text-white">
            More options <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')} />
          </button>
          {moreOpen ? (
            <div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white"
              >
                <Pencil className="h-4 w-4" /> Edit an image I have
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
