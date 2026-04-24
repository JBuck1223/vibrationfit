'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, PenLine, ChevronDown, Check, Search, Calendar } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/lib/design-system/components'
import { useJournalStudio } from './JournalStudioContext'

const TABS = [
  { label: 'My Journal', path: '/journal', icon: BookOpen },
  { label: 'Create', path: '/journal/new', icon: PenLine },
]

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [active, ref, onClose])
}

function JournalContextBar({ currentEntryId }: { currentEntryId: string }) {
  const router = useRouter()
  const { entries } = useJournalStudio()

  const [entryOpen, setEntryOpen] = useState(false)
  const [entrySearch, setEntrySearch] = useState('')
  const entryRef = useRef<HTMLDivElement>(null)

  const currentEntry = entries.find(e => e.id === currentEntryId)

  const closeEntry = useCallback(() => { setEntryOpen(false); setEntrySearch('') }, [])
  useClickOutside(entryRef, closeEntry, entryOpen)

  const filteredEntries = entrySearch.trim()
    ? entries.filter(e => (e.title || '').toLowerCase().includes(entrySearch.toLowerCase()))
    : entries

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:max-w-2xl md:mx-auto">
      <div className="relative md:flex-1 md:min-w-0" ref={entryRef}>
        <button
          type="button"
          onClick={() => setEntryOpen(prev => !prev)}
          className="w-full px-3 py-2 md:py-1.5 rounded-xl md:rounded-lg bg-neutral-900/80 md:bg-black/40 border border-neutral-700/50 hover:border-neutral-600 active:bg-neutral-800 transition-colors flex items-center gap-2.5 text-left"
        >
          <Calendar className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />
          <span className={`text-xs font-medium truncate flex-1 ${currentEntry ? 'text-white' : 'text-neutral-500'}`}>
            {currentEntry
              ? (currentEntry.title || `Entry from ${formatDate(currentEntry.date)}`)
              : 'Select an entry...'}
          </span>
          <span className="text-[10px] text-neutral-500 flex-shrink-0">{entries.length}</span>
          <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${entryOpen ? 'rotate-180' : ''}`} />
        </button>

        {entryOpen && (
          <div className="absolute z-50 right-0 left-0 mt-1.5 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            {entries.length > 3 && (
              <div className="p-2 border-b border-neutral-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={entrySearch}
                    onChange={(e) => setEntrySearch(e.target.value)}
                    placeholder="Search entries..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div className="py-1 max-h-64 overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm md:text-xs text-neutral-500">
                    {entrySearch.trim() ? `No results for "${entrySearch}"` : 'No journal entries'}
                  </p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                  const isSelected = entry.id === currentEntryId
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setEntryOpen(false)
                        setEntrySearch('')
                        if (entry.id !== currentEntryId) {
                          router.push(`/journal/${entry.id}`)
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${
                        isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'
                      }`}
                    >
                      <Calendar className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {entry.title || 'Untitled Entry'}
                        </p>
                        <p className="text-xs md:text-[10px] text-neutral-500">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function JournalAreaBar() {
  const pathname = usePathname()

  const isJournalList = pathname === '/journal' || pathname === '/journal/'
  const isJournalDetail = !isJournalList
    && pathname !== '/journal/new'
    && pathname !== '/journal/resources'
    && /^\/journal\/[^/]+(\/edit)?$/.test(pathname)

  let contextBar: React.ReactNode = undefined
  if (isJournalDetail) {
    const segments = pathname.split('/')
    const entryId = segments[2] || ''
    contextBar = <JournalContextBar currentEntryId={entryId} />
  }

  return (
    <AreaBar
      area={{ name: 'My Journal', icon: BookOpen }}
      tabs={TABS}
      contextBar={contextBar}
      variant="default"
    />
  )
}
