'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

export interface CaptureEntry {
  id: string
  kind: 'journal' | 'paper' | 'abundance'
  title: string
  excerpt: string | null
  href: string
  image: string | null
  createdAt: string
}

/** The newest journal entries, daily papers and abundance wins, merged by date. */
export function useRecentCaptures(limit = 5) {
  return useQuery({
    queryKey: [...keys.journalEntries, 'capture', 'recent', limit],
    queryFn: async (): Promise<CaptureEntry[]> => {
      const supabase = createClient()
      const [journal, papers, abundance] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, title, content, created_at, image_urls, thumbnail_urls')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('daily_papers')
          .select('id, entry_date, gratitude, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('abundance_events')
          .select('id, note, amount, value_type, image_url, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
      ])

      const strip = (s: string | null | undefined) => (s ?? '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim()

      const items: CaptureEntry[] = [
        ...(journal.data ?? []).map((j) => ({
          id: j.id,
          kind: 'journal' as const,
          title: j.title || 'Journal entry',
          excerpt: strip(j.content).slice(0, 120) || null,
          href: `/journal/${j.id}`,
          image: (j.thumbnail_urls as string[] | null)?.[0] ?? (j.image_urls as string[] | null)?.[0] ?? null,
          createdAt: j.created_at,
        })),
        ...(papers.data ?? []).map((p) => ({
          id: p.id,
          kind: 'paper' as const,
          title: 'Daily Paper',
          excerpt: strip(p.gratitude).slice(0, 120) || null,
          href: `/daily-paper/${p.id}`,
          image: null,
          createdAt: p.created_at,
        })),
        ...(abundance.data ?? []).map((a) => ({
          id: a.id,
          kind: 'abundance' as const,
          title: a.value_type === 'money' && a.amount != null ? `Abundance · $${Number(a.amount).toLocaleString()}` : 'Abundance win',
          excerpt: strip(a.note).slice(0, 120) || null,
          href: `/abundance-tracker/${a.id}`,
          image: a.image_url ?? null,
          createdAt: a.created_at,
        })),
      ]
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
    },
    staleTime: 30_000,
  })
}
