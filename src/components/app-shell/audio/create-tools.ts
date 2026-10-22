import { AudioLines, Mic, Music2, Sliders, type LucideIcon } from 'lucide-react'

export interface CreateTool {
  id: 'generate' | 'record' | 'mix' | 'songwriter'
  title: string
  /** Short name for the pill switcher and tool header. */
  short: string
  description: string
  href: string
  icon: LucideIcon
  color: string
  tint: string
}

export const CREATE_TOOLS: CreateTool[] = [
  { id: 'generate', title: 'Generate voice', short: 'Generate', description: 'A VIVA voice reads your vision or story', href: '/audio/generate', icon: AudioLines, color: '#39FF14', tint: 'rgba(57,255,20,0.15)' },
  { id: 'record', title: 'Record your voice', short: 'Record', description: 'Read it aloud yourself', href: '/audio/record', icon: Mic, color: '#67e8f9', tint: 'rgba(34,211,238,0.15)' },
  { id: 'mix', title: 'Mix', short: 'Mix', description: 'Add music and frequencies', href: '/audio/mix', icon: Sliders, color: '#5eead4', tint: 'rgba(45,212,191,0.15)' },
  { id: 'songwriter', title: 'Songwriter', short: 'Songwriter', description: 'Turn your vision into a song', href: '/audio/songwriter', icon: Music2, color: '#ffff66', tint: 'rgba(255,255,0,0.13)' },
]

export function toolForPath(pathname: string | null): CreateTool | null {
  const path = pathname ?? ''
  return CREATE_TOOLS.find((t) => path === t.href || path.startsWith(`${t.href}/`)) ?? null
}

export const QUEUE_HREF = '/audio/queue'

/** A generation batch's name, the same way the queue page names it. */
export function batchTitle(batch: { metadata?: Record<string, unknown>; variant_ids?: string[] }): string {
  const name = batch.metadata?.audio_set_name
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (batch.metadata?.custom_mix === true) return 'Custom mix'
  const ids = batch.variant_ids ?? []
  if (ids.includes('standard')) return 'Voice only'
  if (ids.includes('personal')) return 'Personal recording'
  return 'Audio'
}

export const isRunning = (status: string) => status === 'pending' || status === 'processing'

/** The Create side of Audio: the Create page, each tool, and the queue. */
export function isCreatePath(pathname: string | null): boolean {
  const path = pathname ?? ''
  return ['/audio/create', QUEUE_HREF, ...CREATE_TOOLS.map((t) => t.href)].some((p) => path === p || path.startsWith(`${p}/`))
}
