// /src/app/support/announcements/page.tsx
// Member-facing announcements list — modern minimalist styling

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { Megaphone, Pin, Video, Paperclip, Search, X } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  attachments: string[]
  is_pinned: boolean
  published_at: string
  created_at: string
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'update', label: 'Platform Updates' },
  { value: 'how-to', label: 'How-To Guides' },
  { value: 'known-issue', label: 'Known Issues' },
  { value: 'tip', label: 'Tips & Tricks' },
]

function getCategoryStyle(category: string) {
  switch (category) {
    case 'update': return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
    case 'how-to': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
    case 'known-issue': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    case 'tip': return 'text-teal-400 bg-teal-500/20 border-teal-500/30'
    default: return 'text-neutral-400 bg-neutral-800 border-neutral-700'
  }
}

function getCategoryLabel(category: string): string {
  return CATEGORIES.find(c => c.value === category)?.label || category
}

function hasMediaAttachments(attachments: string[]): boolean {
  return attachments.some(url =>
    url.match(/\.(mp4|webm|mov|avi)$/i) ||
    url.includes('/video-recordings/') ||
    url.includes('/video/')
  )
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [category])

  async function fetchAnnouncements() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      const response = await fetch(`/api/support/announcements?${params}`)
      if (!response.ok) throw new Error('Failed to fetch announcements')
      const data = await response.json()
      setAnnouncements(data.announcements)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const q = searchQuery.toLowerCase().trim()
  const filteredAnnouncements = q
    ? announcements.filter(a =>
        a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      )
    : announcements

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Category filter pills + search */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                category === cat.value
                  ? 'bg-primary-500/20 text-primary-500 border-primary-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => {
              setShowSearch(prev => !prev)
              if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 0)
              else setSearchQuery('')
            }}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              showSearch
                ? 'bg-primary-500/20 text-primary-500 border-primary-500/30'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-600'
            }`}
            aria-label="Search announcements"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {showSearch && (
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates..."
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-9 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-primary-500/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {q ? 'No Results' : 'No Updates Yet'}
            </h3>
            <p className="text-neutral-400">
              {q
                ? 'No updates match your search.'
                : category !== 'all'
                  ? 'No updates in this category yet.'
                  : 'Check back soon for platform updates and how-to guides.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => router.push(`/support/announcements/${announcement.id}`)}
                className="cursor-pointer hover:bg-white/[0.03] transition-colors px-4 sm:px-5 py-4"
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Pin icon — desktop only, left of content */}
                  {announcement.is_pinned && (
                    <div className="hidden sm:flex flex-shrink-0 items-center">
                      <Pin className="w-4 h-4 text-primary-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Top line: date/pin (mobile) left, video icon + badge right */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        {announcement.is_pinned ? (
                          <Pin className="w-3.5 h-3.5 text-primary-500 sm:hidden" />
                        ) : null}
                        <span className="text-neutral-500">{formatDate(announcement.published_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {announcement.attachments.length > 0 && (
                          <span className="text-neutral-500">
                            {hasMediaAttachments(announcement.attachments) ? (
                              <Video className="w-3.5 h-3.5" />
                            ) : (
                              <Paperclip className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full border ${getCategoryStyle(announcement.category)}`}>
                          {getCategoryLabel(announcement.category)}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm sm:text-base font-medium text-white truncate mb-0.5">
                      {announcement.title}
                    </p>
                    {/* Description preview */}
                    <p className="text-[13px] text-neutral-300 leading-relaxed line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}
