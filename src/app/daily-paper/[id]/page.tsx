'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Container,
  Stack,
  PageHero,
  Spinner,
  Text,
  DeleteConfirmationDialog,
} from '@/lib/design-system'
import { OptimizedImage } from '@/components/OptimizedImage'
import { Edit, Eye, FileText, Trash2, X, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DailyPaperEntry } from '@/hooks/useDailyPaper'

function formatEntryDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Treat URL as image when content-type is missing (e.g. VIVA-saved or legacy rows). */
function looksLikeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return true
  if (url.includes('media.vibrationfit.com') && (url.includes('/generated/') || url.includes('/journal/'))) return true
  return false
}

export default function DailyPaperViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [entry, setEntry] = useState<DailyPaperEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: entryData, error } = await supabase
        .from('daily_papers')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error || !entryData) {
        router.push('/daily-paper')
        return
      }

      setEntry(entryData)
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!entry) {
    return (
      <div className="text-center py-16">
        <div className="text-neutral-400">Entry not found</div>
      </div>
    )
  }

  const tasks = [entry.task_one, entry.task_two, entry.task_three].filter(
    (t) => t && t.trim().length > 0
  )

  const isImageAttachment =
    entry.attachment_content_type?.startsWith('image/') ||
    looksLikeImageUrl(entry.attachment_url)

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { error } = await supabase
        .from('daily_papers')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting daily paper:', error)
        alert('Failed to delete entry. Please try again.')
        return
      }
      router.push('/daily-paper')
    } catch (err) {
      console.error('Error deleting daily paper:', err)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Daily Paper Entry">
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/daily-paper')}
            >
              <Eye className="w-4 h-4 mr-2" />
              See All
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="xl">
            <section className="space-y-4">
              <Text
                size="sm"
                className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]"
              >
                Entry date
              </Text>
              <p className="text-lg font-semibold text-white">
                {formatEntryDate(entry.entry_date)}
              </p>
              {entry.updated_at && entry.created_at && entry.updated_at !== entry.created_at && (
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Updated: {new Date(entry.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </section>

            <section className="space-y-4">
              <Text
                size="sm"
                className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]"
              >
                Gratitude
              </Text>
              <p className="text-neutral-200 leading-relaxed whitespace-pre-line">
                {entry.gratitude || '—'}
              </p>
            </section>

            <section className="space-y-4">
              <Text
                size="sm"
                className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]"
              >
                Aligned actions
              </Text>
              <div className="space-y-2 text-sm text-neutral-100">
                {tasks.length === 0 ? (
                  <p className="text-neutral-500">No actions logged.</p>
                ) : (
                  tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex gap-2 rounded-xl border border-[#1F1F1F] bg-[#161616] p-3"
                    >
                      <span className="text-neutral-500 shrink-0">
                        {index + 1}.
                      </span>
                      <span className="whitespace-pre-line">{task}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-4">
              <Text
                size="sm"
                className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]"
              >
                Fun promise
              </Text>
              <p className="text-neutral-200 leading-relaxed whitespace-pre-line">
                {entry.fun_plan || '—'}
              </p>
            </section>

            {entry.attachment_url && (
              <section className="space-y-4">
                <Text
                  size="sm"
                  className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]"
                >
                  Attachment
                </Text>
                <div className="space-y-4">
                  {isImageAttachment ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="relative group">
                        <OptimizedImage
                          src={entry.attachment_url}
                          alt="Daily Paper"
                          width={800}
                          height={600}
                          className="w-full h-auto object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                          onClick={() => setLightboxOpen(true)}
                          quality={90}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 50vw"
                        />
                      </div>
                    </div>
                  ) : (
                    <a
                      href={entry.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#1F1F1F] bg-[#161616] px-4 py-3 text-sm text-primary-500 hover:border-[#199D67] transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Open attachment
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Actions - Delete and Edit at bottom (like journal) */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 sm:justify-end pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 sm:flex-none sm:w-32"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/daily-paper/${entry.id}/edit`)}
                className="flex-1 sm:flex-none sm:w-32"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </Stack>
        </Card>

        {/* Lightbox - same pattern as journal */}
        {lightboxOpen && entry?.attachment_url && isImageAttachment && (
          <div
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (
                target === e.currentTarget ||
                (!target.closest('.lightbox-media-content') &&
                  !target.closest('button') &&
                  !target.closest('a'))
              ) {
                setLightboxOpen(false)
              }
            }}
          >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div
                className="lightbox-media-content relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={entry.attachment_url}
                  alt="Daily Paper"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <a
                href={entry.attachment_url}
                download
                className="absolute bottom-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-6 h-6" />
              </a>
            </div>
          </div>
        )}

        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          itemName={`Daily Paper (${formatEntryDate(entry.entry_date)})`}
          itemType="Daily Paper"
          isLoading={deleting}
          loadingText="Deleting..."
        />
      </Stack>
    </Container>
  )
}
