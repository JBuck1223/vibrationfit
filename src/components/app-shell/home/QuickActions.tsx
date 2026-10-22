'use client'

import { glassTint } from '@/lib/app-shell/glass'
import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronRight, DollarSign, FileText, Headphones, Image as ImageIcon, Library, Lightbulb, Map as MapIcon, Music2, Target, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

interface QuickTool {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Tile tint and icon color, one hue per tool. */
  tint: string
  color: string
  /** area_activations names that count as using this tool. */
  areas: string[]
}

const TOOLS: QuickTool[] = [
  { id: 'vision-audio', label: 'Vision Audio', href: '/audio', icon: Headphones, tint: 'rgba(57,255,20,0.14)', color: '#39FF14', areas: ['vision_audio'] },
  { id: 'journal', label: 'Journal', href: '/journal/new', icon: BookOpen, tint: 'rgba(191,0,255,0.16)', color: '#D58BFF', areas: ['journal', 'journal_review'] },
  { id: 'manifestations', label: 'Manifestation', href: '/manifestations', icon: ImageIcon, tint: 'rgba(255,183,1,0.16)', color: '#FFB701', areas: ['vision_board', 'vision-board'] },
  { id: 'songs', label: 'Song', href: '/audio/songs', icon: Music2, tint: 'rgba(255,0,128,0.14)', color: '#FF6FB5', areas: ['music_listen', 'music-listen'] },
  { id: 'life-vision', label: 'Life Vision', href: '/life-vision', icon: Target, tint: 'rgba(0,255,255,0.12)', color: '#00FFFF', areas: ['life_vision'] },
  { id: 'stories', label: 'Story', href: '/audio/stories', icon: Library, tint: 'rgba(56,132,255,0.16)', color: '#7AB0FF', areas: ['story_listen', 'story-listen', 'story_audio'] },
  { id: 'map', label: 'MAP', href: '/map', icon: MapIcon, tint: 'rgba(20,184,166,0.16)', color: '#2DD4BF', areas: ['map'] },
  { id: 'daily-paper', label: 'Daily Paper', href: '/daily-paper/new', icon: FileText, tint: 'rgba(255,255,255,0.08)', color: '#FFFFFF', areas: [] },
  { id: 'abundance', label: 'Abundance', href: '/abundance-tracker/new', icon: DollarSign, tint: 'rgba(255,183,1,0.12)', color: '#FFD15C', areas: [] },
  { id: 'meditations', label: 'Meditation', href: '/meditations', icon: Wind, tint: 'rgba(120,180,255,0.14)', color: '#9CC8FF', areas: ['meditation_listen'] },
  { id: 'incantations', label: 'Incantation', href: '/story?kind=incantation', icon: Lightbulb, tint: 'rgba(57,255,20,0.10)', color: '#8CFF6B', areas: [] },
]

const DEFAULT_ORDER = ['vision-audio', 'journal', 'manifestations', 'songs', 'daily-paper']

/**
 * How often this member used each tool in the last 30 days: days with an
 * activation, plus entries written for Daily Paper and Abundance (which do not
 * log activations).
 */
function useToolUsage() {
  return useQuery({
    queryKey: [...keys.areaActivations, 'home-quick-actions'],
    queryFn: async (): Promise<Record<string, number>> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {}
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
      const [activations, papers, abundance] = await Promise.all([
        supabase.from('area_activations').select('area').eq('user_id', user.id).gte('activation_date', since),
        supabase.from('daily_papers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('entry_date', since),
        supabase.from('abundance_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', since),
      ])
      const byArea = new Map<string, number>()
      for (const row of activations.data ?? []) byArea.set(row.area, (byArea.get(row.area) ?? 0) + 1)
      const usage: Record<string, number> = {}
      for (const tool of TOOLS) usage[tool.id] = tool.areas.reduce((sum, a) => sum + (byArea.get(a) ?? 0), 0)
      usage['daily-paper'] += papers.count ?? 0
      usage['abundance'] += abundance.count ?? 0
      return usage
    },
    staleTime: 5 * 60_000,
  })
}

/** Five tiles: the tools this member reaches for most, most-used first. */
export function QuickActions() {
  const { data: usage } = useToolUsage()

  const ranked = React.useMemo(() => {
    const used = TOOLS.filter((t) => (usage?.[t.id] ?? 0) > 0).sort((a, b) => (usage?.[b.id] ?? 0) - (usage?.[a.id] ?? 0))
    const fill = DEFAULT_ORDER.map((id) => TOOLS.find((t) => t.id === id)!).filter((t) => !used.includes(t))
    return [...used, ...fill].slice(0, 5)
  }, [usage])

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Quick Actions</h2>
        <Link href="/tools" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {ranked.map((tool) => {
          const Icon = tool.icon
          return (
            <li key={tool.id} className="w-[104px] shrink-0 md:w-auto">
              <Link
                href={tool.href}
                className="flex h-[104px] flex-col items-center justify-center gap-2 rounded-3xl border p-3 text-center transition-transform active:scale-[0.97] md:h-[112px]"
style={{ ...glassTint(tool.tint), borderColor: `${tool.color}55` }}
              >
                <Icon className="h-7 w-7" style={{ color: tool.color }} strokeWidth={1.75} />
                <span className="text-[13px] font-medium leading-tight text-white">{tool.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
