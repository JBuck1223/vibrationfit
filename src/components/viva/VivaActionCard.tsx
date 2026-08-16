'use client'

import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Headphones,
  Layers,
  Library,
  Target,
  FolderKanban,
  Image,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'

export interface VivaActionCardModel {
  href: string
  label: string
  kind: 'kit' | 'draft' | 'story' | 'journal' | 'daily_paper' | 'audio' | 'project' | 'board' | 'manifestations'
}

const KIND_META: Record<VivaActionCardModel['kind'], { icon: LucideIcon; title: string }> = {
  kit: { icon: Layers, title: 'Manifestation' },
  manifestations: { icon: Layers, title: 'My Manifestations' },
  draft: { icon: Target, title: 'Life Vision draft' },
  story: { icon: Library, title: 'Story' },
  journal: { icon: BookOpen, title: 'Journal' },
  daily_paper: { icon: FileText, title: 'Daily Paper' },
  audio: { icon: Headphones, title: 'Audio' },
  project: { icon: FolderKanban, title: 'Project' },
  board: { icon: Image, title: 'Vision board' },
}

export function extractActionCards(markdown: string): VivaActionCardModel[] {
  const matches = markdown.matchAll(/\]\((\/[^\s)]+)\)/g)
  const seen = new Set<string>()
  const cards: VivaActionCardModel[] = []

  for (const match of matches) {
    const href = match[1]
    if (seen.has(href)) continue
    const card = cardFromHref(href)
    if (!card) continue
    seen.add(href)
    cards.push(card)
  }
  return cards
}

export function cardFromHref(href: string): VivaActionCardModel | null {
  if (href === '/manifestations') return { href, label: 'My Manifestations', kind: 'manifestations' }
  if (href.startsWith('/manifestations/')) return { href, label: 'Open this manifestation', kind: 'kit' }
  if (href.startsWith('/life-vision')) return { href, label: 'Open the draft', kind: 'draft' }
  if (href.startsWith('/story/')) return { href, label: 'Read the story', kind: 'story' }
  if (href.startsWith('/journal/')) return { href, label: 'Open the entry', kind: 'journal' }
  if (href.startsWith('/daily-paper')) return { href, label: 'Open Daily Paper', kind: 'daily_paper' }
  if (href.startsWith('/audio')) return { href, label: href.includes('songwriter') ? 'Open Songwriter' : href.includes('mix') ? 'Open Mix' : 'Open Audio', kind: 'audio' }
  if (href.startsWith('/projects/')) return { href, label: 'Open the project', kind: 'project' }
  if (href.startsWith('/vision-board')) return { href, label: 'Open Vision Board', kind: 'board' }
  return null
}

export function VivaActionCard({ href, label, kind }: VivaActionCardModel) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 hover:border-neutral-600 transition-colors"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-[#39FF14]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-neutral-500">{meta.title}</span>
        <span className="block text-sm text-white truncate">{label}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-neutral-500 shrink-0" />
    </Link>
  )
}
