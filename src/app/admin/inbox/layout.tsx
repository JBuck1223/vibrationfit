'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Inbox,
  Mail,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'
import { SIDEBAR_SECTIONS } from '@/components/admin/inbox/constants'
import type { InboxCounts } from '@/components/admin/inbox/types'
import ComposeEmail from '@/components/admin/inbox/ComposeEmail'
import ComposeSMS from '@/components/admin/inbox/ComposeSMS'

type ComposeMode = 'email' | 'sms' | null

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeFilter = searchParams.get('filter') || 'inbox'

  const [counts, setCounts] = useState<InboxCounts | null>(null)
  const [composeMode, setComposeMode] = useState<ComposeMode>(null)

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/counts')
      if (res.ok) setCounts(await res.json())
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  useEffect(() => {
    const handler = () => fetchCounts()
    window.addEventListener('inbox:counts-changed', handler)
    return () => window.removeEventListener('inbox:counts-changed', handler)
  }, [fetchCounts])

  const activeSection =
    SIDEBAR_SECTIONS.find(s => pathname.startsWith(s.path))?.key ||
    (pathname === '/admin/inbox' ? 'all' : 'all')

  const handleFilterClick = (sectionPath: string, filterValue: string) => {
    const params = new URLSearchParams()
    if (filterValue !== 'inbox') params.set('filter', filterValue)
    const qs = params.toString()
    router.push(qs ? `${sectionPath}?${qs}` : sectionPath)
  }

  const handleComposeSent = () => {
    setComposeMode(null)
    fetchCounts()
    window.dispatchEvent(new CustomEvent('inbox:counts-changed'))
  }

  const getFilterCount = (sectionKey: string, filterValue: string): number | null => {
    if (!counts) return null
    const bucket =
      sectionKey === 'all' ? counts.total :
      sectionKey === 'email' ? counts.email :
      sectionKey === 'sms' ? counts.sms :
      null
    if (!bucket) return null
    if (filterValue === 'inbox') return bucket.inbound
    if (filterValue === 'sent') return bucket.outbound
    return bucket.total
  }

  return (
    <div className="flex h-screen -mt-14 md:-mt-8 -mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* LEFT SIDEBAR */}
      <div className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-[#222] bg-[#0D0D0D]">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Inbox className="w-5 h-5 text-[#39FF14]" />
          <h1 className="text-lg font-bold text-neutral-100">Inbox</h1>
        </div>

        {/* Compose buttons */}
        <div className="px-3 pb-2 space-y-1.5">
          <button
            onClick={() => setComposeMode(composeMode === 'email' ? null : 'email')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors ${
              composeMode === 'email'
                ? 'bg-[#00FFFF] text-black'
                : 'bg-[#1A1A1A] text-neutral-300 border border-[#333] hover:border-[#00FFFF]/50 hover:text-[#00FFFF]'
            }`}
          >
            <Mail className="w-4 h-4" />
            Compose Email
          </button>
          <button
            onClick={() => setComposeMode(composeMode === 'sms' ? null : 'sms')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors ${
              composeMode === 'sms'
                ? 'bg-[#BF00FF] text-white'
                : 'bg-[#1A1A1A] text-neutral-300 border border-[#333] hover:border-[#BF00FF]/50 hover:text-[#BF00FF]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Compose SMS
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pt-2">
          {SIDEBAR_SECTIONS.map((section, idx) => {
            const SectionIcon = section.icon
            const isSectionActive = activeSection === section.key

            return (
              <div key={section.key}>
                {idx > 0 && <div className="mx-3 border-t border-[#222] my-2" />}

                {/* Section header */}
                <button
                  onClick={() => handleFilterClick(section.path, 'inbox')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isSectionActive ? 'text-neutral-300' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  <SectionIcon className={`w-3.5 h-3.5 ${section.iconColor}`} />
                  {section.label}
                </button>

                {/* Sub-filters (always visible when this section is active) */}
                {isSectionActive && (
                  <div className="ml-1 mt-0.5 space-y-0.5">
                    {section.filters.map((f) => {
                      const FilterIcon = f.icon
                      const isFilterActive = activeFilter === f.value
                      const count = getFilterCount(section.key, f.value)

                      return (
                        <button
                          key={f.value}
                          onClick={() => handleFilterClick(section.path, f.value)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isFilterActive
                              ? section.activeColor + ' font-semibold'
                              : 'text-neutral-500 hover:bg-[#1A1A1A] hover:text-neutral-300'
                          }`}
                        >
                          <FilterIcon className={`w-4 h-4 shrink-0 ${
                            isFilterActive ? '' : 'text-neutral-600'
                          }`} />
                          <span className="flex-1 text-left truncate">{f.label}</span>
                          {count !== null && count > 0 && (
                            <span className={`text-[11px] font-medium tabular-nums ${
                              isFilterActive ? 'opacity-70' : 'text-neutral-600'
                            }`}>
                              {count > 999 ? '999+' : count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="mt-auto px-3 pb-3">
          <button
            onClick={fetchCounts}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 border border-[#333] rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top nav */}
        <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-[#222] bg-[#0D0D0D] overflow-x-auto">
          {SIDEBAR_SECTIONS.map((section) => {
            const SectionIcon = section.icon
            const isSectionActive = activeSection === section.key
            return (
              <button
                key={section.key}
                onClick={() => handleFilterClick(section.path, 'inbox')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSectionActive
                    ? section.activeColor
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <SectionIcon className="w-3.5 h-3.5" />
                {section.label}
              </button>
            )
          })}
          <div className="w-px h-5 bg-[#333] mx-1 shrink-0" />
          <button
            onClick={() => {
              const currentSection = SIDEBAR_SECTIONS.find(s => s.key === activeSection)
              handleFilterClick(currentSection?.path || '/admin/inbox/all', 'inbox')
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              activeFilter === 'inbox'
                ? 'bg-[#39FF14]/10 text-[#39FF14] font-medium'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => {
              const currentSection = SIDEBAR_SECTIONS.find(s => s.key === activeSection)
              handleFilterClick(currentSection?.path || '/admin/inbox/all', 'sent')
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              activeFilter === 'sent'
                ? 'bg-[#39FF14]/10 text-[#39FF14] font-medium'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setComposeMode(composeMode ? null : 'email')}
            className="ml-auto px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#00FFFF] hover:bg-[#00FFFF]/10 whitespace-nowrap transition-colors"
          >
            Compose
          </button>
        </div>

        <div className="flex-1 flex min-w-0">
          {children}
        </div>
      </div>

      {/* COMPOSE DRAWER */}
      {composeMode && (
        <div className="fixed bottom-0 right-4 w-[400px] h-[520px] bg-[#111] border border-[#333] rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {composeMode === 'email' ? (
            <ComposeEmail
              onSend={handleComposeSent}
              onClose={() => setComposeMode(null)}
            />
          ) : (
            <ComposeSMS
              onSend={handleComposeSent}
              onClose={() => setComposeMode(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
