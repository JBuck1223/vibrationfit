'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, GraduationCap, Search } from 'lucide-react'
import { searchTools } from '@/lib/app-shell/tools-catalog'

/**
 * The Tools section root: search and Training on top, then every creation
 * surface as a tile. Listen is for enjoying content; this is for making it.
 */
export function ToolsDirectory() {
  const params = useSearchParams()
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const results = React.useMemo(() => searchTools(query), [query])

  React.useEffect(() => {
    if (params.get('focus') === 'search') inputRef.current?.focus()
  }, [params])

  return (
    <div className="space-y-6">
      <section className="pb-1 pt-3 md:pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          Tools
        </p>
        <h2 className="text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[40px]">
          Create something today
        </h2>
      </section>

      <label className="glass-panel flex items-center gap-3 px-4 py-3 focus-within:border-[#39FF14]/70">
        <Search className="h-5 w-5 shrink-0 text-white/60" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools"
          className="w-full bg-transparent text-base text-white placeholder:text-white/45 focus:outline-none"
        />
      </label>

      <Link
        href="/begin/training"
        className="glass-panel flex items-center gap-4 px-5 py-4 transition-colors hover:border-[#39FF14]/60"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-white">Training</span>
          <span className="block text-sm text-white/65">Short walkthroughs of every tool, at your pace.</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-white/40" />
      </Link>

      {results.length === 0 ? (
        <p className="px-1 text-sm text-white/60">Nothing matches &ldquo;{query}&rdquo; yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {results.map((tool) => {
            const Icon = tool.icon
            const viva = tool.accent === 'viva'
            return (
              <li key={tool.id} data-section={viva ? 'viva' : undefined}>
                <Link
                  href={tool.href}
                  className="glass-panel flex h-full flex-col gap-3 p-4 transition-colors hover:border-[var(--section-accent)]/70"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--section-accent-soft)] text-[var(--section-accent)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-white">{tool.name}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/65">{tool.description}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
