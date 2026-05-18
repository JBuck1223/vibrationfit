// /src/app/support/announcements/[id]/page.tsx
// Member-facing announcement detail view — modern minimalist styling

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Stack, Spinner, Button, Video } from '@/lib/design-system/components'
import { ArrowLeft, Pin, Download, FileText } from 'lucide-react'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'

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

const CATEGORY_LABELS: Record<string, string> = {
  update: 'Platform Update',
  'how-to': 'How-To Guide',
  'known-issue': 'Known Issue',
  tip: 'Tip & Trick',
}

function getCategoryStyle(category: string) {
  switch (category) {
    case 'update': return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
    case 'how-to': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
    case 'known-issue': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    case 'tip': return 'text-teal-400 bg-teal-500/20 border-teal-500/30'
    default: return 'text-neutral-400 bg-neutral-800 border-neutral-700'
  }
}

export default function AnnouncementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncement()
  }, [id])

  async function fetchAnnouncement() {
    try {
      const response = await fetch(`/api/support/announcements/${id}`)
      if (!response.ok) throw new Error('Not found')
      const data = await response.json()
      setAnnouncement(data.announcement)
    } catch (error) {
      console.error('Error fetching announcement:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!announcement) {
    return (
      <Container size="xl">
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-white mb-2">Not Found</h3>
          <p className="text-neutral-400 mb-6">
            This announcement may have been removed.
          </p>
          <Button variant="primary" onClick={() => router.push('/support/announcements')}>
            Back to Updates
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <button
          onClick={() => router.push('/support/announcements')}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Updates
        </button>

        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {announcement.is_pinned && (
                <Pin className="w-4 h-4 text-primary-500 shrink-0" />
              )}
              <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCategoryStyle(announcement.category)}`}>
                {CATEGORY_LABELS[announcement.category] || announcement.category}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {announcement.title}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              {formatDate(announcement.published_at)}
            </p>
          </div>

          {/* Content */}
          <div className="text-[15px] text-neutral-300 leading-relaxed whitespace-pre-wrap mb-8">
            {announcement.content}
          </div>

          {/* Attachments */}
          {announcement.attachments.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/[0.06]">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Attachments</p>
              <div className="space-y-3">
                {announcement.attachments.map((url, idx) => {
                  const kind = getSupportAttachmentKind(url)

                  if (kind === 'video') {
                    return (
                      <div key={idx} className="rounded-xl overflow-hidden border border-white/[0.06]">
                        <Video src={url} variant="inline" />
                      </div>
                    )
                  }

                  if (kind === 'audio') {
                    return (
                      <div key={idx} className="rounded-xl border border-white/[0.06] bg-[#111] p-4">
                        <audio src={url} controls className="w-full" preload="metadata" />
                      </div>
                    )
                  }

                  if (kind === 'image') {
                    return (
                      <div key={idx} className="rounded-xl overflow-hidden border border-white/[0.06]">
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full max-h-[500px] object-contain bg-[#0c0c0c]"
                        />
                      </div>
                    )
                  }

                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-[#111] hover:bg-white/[0.03] transition-colors"
                    >
                      <FileText className="w-5 h-5 text-neutral-500 shrink-0" />
                      <span className="text-sm text-cyan-400 hover:underline truncate flex-1">
                        {getSupportAttachmentDisplayName(url)}
                      </span>
                      <Download className="w-4 h-4 text-neutral-500 shrink-0" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Stack>
    </Container>
  )
}
