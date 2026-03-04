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
  Inline,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { OptimizedImage } from '@/components/OptimizedImage'
import {
  ArrowLeft,
  DollarSign,
  Heart,
  Edit,
  Trash2,
  Gift,
  Tag,
  Briefcase,
  Coins,
  TrendingUp,
  HandHeart,
  Zap,
  Search,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const ENTRY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  gift: { label: 'Gift', icon: Gift },
  discount: { label: 'Discount', icon: Tag },
  income: { label: 'Income', icon: Briefcase },
  found_money: { label: 'Found Money', icon: Coins },
  opportunity: { label: 'Opportunity', icon: TrendingUp },
  support: { label: 'Support / Kindness', icon: HandHeart },
  synchronicity: { label: 'Synchronicity', icon: Zap },
  uncategorized: { label: 'Uncategorized', icon: Search },
}

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
  const EntryIcon = event.entry_category ? ENTRY_LABELS[event.entry_category]?.icon ?? DollarSign : DollarSign
  const entryLabel = event.entry_category ? ENTRY_LABELS[event.entry_category]?.label ?? event.entry_category : null

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Abundance Moment"
          subtitle={new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        >
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => router.push('/abundance-tracker')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Abundance Tracker
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="xl">
            {/* Entry date - same styling as daily-paper [id] */}
            <section className="space-y-4">
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
            </section>

            {/* Note */}
            <section className="space-y-4">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Note
              </Text>
              <p className="text-neutral-300 whitespace-pre-wrap">{event.note}</p>
            </section>

            {/* Image */}
            {event.image_url && (
              <section className="space-y-4">
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

            {/* Type, amount, kind - inline tags (form-style section) */}
            <section className="space-y-4">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Type and details
              </Text>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[#161616] border border-[#1F1F1F] text-neutral-300">
                  {event.value_type === 'money' ? (
                    <DollarSign className="w-4 h-4 text-[#39FF14]" />
                  ) : (
                    <Heart className="w-4 h-4 text-[#BF00FF]" />
                  )}
                  {event.value_type === 'money' ? 'Money' : 'Value'}
                </span>
                {event.amount != null && Number(event.amount) > 0 && (
                  <span className="text-lg font-semibold text-[#39FF14] tabular-nums">
                    {formatCurrency(Number(event.amount))}
                  </span>
                )}
                {entryLabel && (
                  <span className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[#161616] border border-[#1F1F1F] text-neutral-400">
                    <EntryIcon className="w-4 h-4" />
                    {entryLabel}
                  </span>
                )}
                {eventVisionCategories.map((catKey) => {
                  const VisionIcon = getVisionIcon(catKey)
                  return (
                    <span
                      key={catKey}
                      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[#161616] border border-[#1F1F1F] text-neutral-400"
                    >
                      <VisionIcon className="w-4 h-4" />
                      {getVisionLabel(catKey)}
                    </span>
                  )
                })}
              </div>
            </section>

            {/* Created, Kind, Categories - form-style block */}
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5 space-y-4">
              <Inline className="items-center gap-4 md:gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Created:</span>
                  <span className="text-sm font-semibold text-white">
                    {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {entryLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Kind of abundance:</span>
                    <span className="text-sm font-semibold text-white">{entryLabel}</span>
                  </div>
                )}
                {eventVisionCategories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Categories:</span>
                    <div className="flex flex-wrap gap-2">
                      {eventVisionCategories.map((catKey) => (
                        <span
                          key={catKey}
                          className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                        >
                          {getVisionLabel(catKey)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Inline>
            </div>

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
