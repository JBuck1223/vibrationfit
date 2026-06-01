'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { Container, Stack, Card, Button, Spinner, ImageLightbox } from '@/lib/design-system'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { Plus, FileText, Edit, ImageOff } from 'lucide-react'

interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
  categories: string[]
  image_urls: string[]
  created_at: string
}

const isVideo = (url: string) =>
  /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')

const isImageUrl = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}

function SafeImage({ src, alt, className, onClick }: {
  src: string; alt: string; className?: string; onClick?: (e: React.MouseEvent) => void
}) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className={`bg-neutral-800 flex items-center justify-center ${className || ''}`} onClick={onClick}>
        <ImageOff className="w-6 h-6 text-neutral-600" />
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} onClick={onClick} loading="lazy" onError={() => setError(true)} />
}

export default function IntensiveJournalListPage() {
  const router = useRouter()
  const { setCompletedAt } = useIntensiveStep()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxImages, setLightboxImages] = useState<{ url: string; alt?: string }[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('first_journal_entry, first_journal_entry_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (cancelled) return

      if (checklist?.first_journal_entry && checklist.first_journal_entry_at) {
        setCompletedAt(checklist.first_journal_entry_at)
      }

      const { data } = await supabase
        .from('journal_entries')
        .select('id, date, title, content, categories, image_urls, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!cancelled) {
        setEntries(data || [])
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true; setCompletedAt(null) }
  }, [setCompletedAt])

  const openLightbox = (urls: string[], index: number) => {
    setLightboxImages(urls.map(url => ({ url, alt: 'Journal media' })))
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (entries.length === 0) {
    return (
      <Container size="xl">
        <Card className="text-center py-16 max-w-2xl mx-auto">
          <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No journal entries yet</h3>
          <p className="text-neutral-400 mb-6">
            Write your first entry to complete this step.
          </p>
          <Button asChild>
            <Link href="/intensive/journal/new">
              <Plus className="w-5 h-5 mr-2" />
              Add Entry
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {entries.map((entry) => {
          const dateStr = entry.date || entry.created_at.slice(0, 10)
          const dateObj = new Date(dateStr + 'T00:00:00')
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
          })
          const imageUrls = (entry.image_urls || []).filter(url => isImageUrl(url))
          const videoUrls = (entry.image_urls || []).filter(url => isVideo(url))

          return (
            <Card key={entry.id} variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-2 border-b border-[#252525] pb-2">
                  <time className="text-sm font-medium text-white" dateTime={dateStr}>
                    {formattedDate}
                  </time>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Edit entry"
                    onClick={() => router.push(`/journal/${entry.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                {entry.title && (
                  <h3 className="text-base font-medium text-white">{entry.title}</h3>
                )}

                <section className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Entry</p>
                  <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-line">
                    {entry.content || '\u2014'}
                  </p>
                </section>

                {entry.categories && entry.categories.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.categories.map((categoryKey: string) => {
                        const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                        const CategoryIcon = categoryInfo?.icon
                        return (
                          <span
                            key={categoryKey}
                            className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-[#39FF14]/35 bg-[#39FF14]/10 px-2 py-1 text-xs text-[#39FF14]"
                          >
                            {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5 shrink-0 text-[#39FF14]" aria-hidden />}
                            <span className="truncate">{categoryInfo ? categoryInfo.label : categoryKey}</span>
                          </span>
                        )
                      })}
                    </div>
                  </section>
                )}

                {imageUrls.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Images</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-neutral-800 cursor-pointer border border-neutral-700 hover:border-primary-500/50 transition-colors"
                          onClick={() => openLightbox(imageUrls, idx)}
                        >
                          <SafeImage src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {videoUrls.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Videos</p>
                    <div className="space-y-2">
                      {videoUrls.map((url, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-neutral-700 max-w-sm">
                          <OptimizedVideo
                            url={url}
                            context="list"
                            lazy
                            className="w-full [&>div]:rounded-lg [&>div]:border-0 [&_video]:object-contain [&_video]:w-full [&_video]:h-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </Card>
          )
        })}

        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          showCopyButton={false}
          showCounter
        />
      </Stack>
    </Container>
  )
}
