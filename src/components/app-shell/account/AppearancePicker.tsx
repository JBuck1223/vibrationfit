'use client'

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme } from '../ThemeProvider'

interface ThemeOption {
  id: string
  slug: string
  name: string
  kind: 'system' | 'custom'
  preview: string | null
}

interface ThemesResponse {
  activeThemeId: string | null
  themes: ThemeOption[]
}

const THEMES_KEY = ['app-shell', 'themes'] as const

/** Account → Appearance: pick the picture set the whole app wears. */
export function AppearancePicker() {
  const queryClient = useQueryClient()
  const { theme: current, refresh } = useTheme()
  const { data, isLoading } = useQuery({
    queryKey: THEMES_KEY,
    queryFn: async (): Promise<ThemesResponse> => {
      const res = await fetch('/api/app-shell/themes')
      if (!res.ok) throw new Error('Could not load themes')
      return res.json()
    },
  })

  const choose = useMutation({
    mutationFn: async (themeId: string) => {
      const res = await fetch('/api/app-shell/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      })
      if (!res.ok) throw new Error('Could not save your theme')
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: THEMES_KEY }), refresh()])
      toast.success('Theme updated')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save your theme'),
  })

  const activeId = data?.activeThemeId ?? current?.theme.id ?? null
  const themes = data?.themes ?? []
  // Nothing chosen yet means the default (sunset) is what they see.
  const effectiveId = activeId ?? themes.find((t) => t.slug === 'sunset')?.id ?? null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Palette className="h-4 w-4 text-[#39FF14]" />
          Theme
        </h2>
        <p className="mt-1 text-sm text-white/65">
          Your theme sets the imagery behind every screen. Your own photos still come first wherever you have them.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {themes.map((t) => {
            const selected = t.id === effectiveId
            const saving = choose.isPending && choose.variables === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => choose.mutate(t.id)}
                  disabled={choose.isPending}
                  aria-pressed={selected}
                  className={cn(
                    'glass-panel relative block h-36 w-full overflow-hidden text-left transition-colors',
                    selected ? 'border-[#39FF14]' : 'hover:border-white/40',
                  )}
                >
                  {t.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-[15px] font-semibold text-white">{t.name}</span>
                  {t.kind === 'custom' && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                      Yours
                    </span>
                  )}
                  <span
                    className={cn(
                      'absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-opacity',
                      selected ? 'bg-[#39FF14] text-black opacity-100' : 'bg-black/50 text-white opacity-0',
                    )}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-white/50">Creating your own theme from a mood of your choosing arrives in a later release.</p>
    </div>
  )
}
