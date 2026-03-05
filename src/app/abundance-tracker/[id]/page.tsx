'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Container,
  Stack,
  Card,
  Button,
  PageHero,
  Spinner,
  DeleteConfirmationDialog,
  Text,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { getEntryCategoryDisplay } from '@/lib/abundance/entry-categories'
import { OptimizedImage } from '@/components/OptimizedImage'
import {
  ArrowLeft,
  DollarSign,
  Heart,
  Edit,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function getVisionLabel(key: string): string {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.label || key.charAt(0).toUpperCase() + key.slice(1)
}

function getVisionIcon(key: string) {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.icon || DollarSign
}

interface AbundanceEvent {
  id: string
  user_id: string
  date: string
  value_type: 'money' | 'value'
  amount: number | null
  vision_category: string | null
  entry_category: string | null
  note: string
  created_at: string
  updated_at?: string
  image_url?: string | null
}

export default function AbundanceEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [event, setEvent] = useState<AbundanceEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('abundance_events')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        router.push('/abundance-tracker')
        return
      }

      setEvent(data)
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  const handleDelete = async () => {
    if (!event) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('abundance_events')
        .delete()
        .eq('id', event.id)
        .eq('user_id', event.user_id)

      if (error) throw error
      router.push('/abundance-tracker')
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </Container>
    )
  }

  if (!event) return null

  const eventVisionCategories = event.vision_category
    ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const { label: entryLabel, icon: EntryIcon } = getEntryCategoryDisplay(event.entry_category)

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Abundance Entry">
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => router.push('/abundance-tracker')}>
              <DollarSign className="w-4 h-4 mr-2" />
              Abundance Dashboard
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="xl">
            {/* Entry date */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Entry date
              </Text>
              <p className="text-lg font-semibold text-white">
                {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {event.updated_at && event.updated_at !== event.created_at && (
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Updated: {new Date(event.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </section>

            {/* Amount */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Amount
              </Text>
              <p className="text-lg font-semibold text-white">
                {event.amount != null && Number(event.amount) > 0
                  ? formatCurrency(Number(event.amount))
                  : '—'}
              </p>
            </section>

            {/* Abundance (Money or Value) */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Abundance
              </Text>
              <p className="text-lg font-semibold text-white inline-flex items-center gap-2">
                {event.value_type === 'money' ? (
                  <DollarSign className="w-5 h-5 text-[#39FF14]" />
                ) : (
                  <Heart className="w-5 h-5 text-[#BF00FF]" />
                )}
                {event.value_type === 'money' ? 'Money' : 'Value'}
              </p>
            </section>

            {/* Kind of abundance */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Kind of abundance
              </Text>
              <p className="text-lg font-semibold text-white inline-flex items-center gap-2">
                {entryLabel ? (
                  <>
                    <EntryIcon className="w-5 h-5 text-neutral-400" />
                    {entryLabel}
                  </>
                ) : (
                  '—'
                )}
              </p>
            </section>

            {/* Note */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Note
              </Text>
              <p className="text-neutral-300 whitespace-pre-wrap">{event.note || '—'}</p>
            </section>

            {/* Categories */}
            <section className="space-y-2">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Categories
              </Text>
              {eventVisionCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {eventVisionCategories.map((catKey) => {
                    const VisionIcon = getVisionIcon(catKey)
                    return (
                      <span
                        key={catKey}
                        className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[#161616] border border-[#1F1F1F] text-neutral-300"
                      >
                        <VisionIcon className="w-4 h-4" />
                        {getVisionLabel(catKey)}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-neutral-500">—</p>
              )}
            </section>

            {/* Image */}
            {event.image_url && (
              <section className="space-y-2">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Image
                </Text>
                <div className="rounded-xl overflow-hidden border border-[#1F1F1F]">
                  <OptimizedImage
                    src={event.image_url}
                    alt="Abundance moment"
                    width={800}
                    height={500}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 sm:justify-end pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex-1 sm:flex-none sm:w-32"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/abundance-tracker/${event.id}/edit`)}
                className="flex-1 sm:flex-none sm:w-32"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </Stack>
        </Card>

        <DeleteConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete abundance moment?"
          description="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          loading={deleting}
        />
      </Stack>
    </Container>
  )
}
