// /src/app/support/announcements/page.tsx
// Member-facing announcements list — modern minimalist styling

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { Megaphone, Pin, Video, Paperclip } from 'lucide-react'

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

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Category filter pills */}
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
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Updates Yet</h3>
            <p className="text-neutral-400">
              {category !== 'all'
                ? 'No updates in this category yet.'
                : 'Check back soon for platform updates and how-to guides.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => router.push(`/support/announcements/${announcement.id}`)}
                className="cursor-pointer hover:bg-white/[0.03] transition-colors px-5 py-4"
              >
                <div className="flex items-start gap-4">
                  {/* Date column */}
                  <div className="flex-shrink-0 w-10 text-center pt-0.5">
                    {announcement.is_pinned ? (
                      <Pin className="w-4 h-4 text-primary-500 mx-auto" />
                    ) : (
                      <p className="text-xs text-neutral-500">{formatDate(announcement.published_at)}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-medium text-white truncate">
                        {announcement.title}
                      </p>
                    </div>
                    <p className="text-[13px] text-neutral-300 leading-relaxed line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
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
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}
