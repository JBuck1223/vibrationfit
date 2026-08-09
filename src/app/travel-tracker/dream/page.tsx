'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Images,
  Link2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Checkbox,
  Modal,
  Spinner,
  DeleteConfirmationDialog,
  HouseholdScopeToggle,
  type HouseholdScope,
} from '@/lib/design-system/components'
import { toast } from 'sonner'
import { keys } from '@/lib/query/keys'
import { COUNTRIES, countryName } from '@/lib/travel/countries'
import { TravelMediaSection } from '@/components/travel/TravelMediaSection'
import { TravelLinksSection } from '@/components/travel/TravelLinksSection'
import type { DreamDestination } from '@/lib/travel/types'

const COUNTRY_OPTIONS = [
  { value: '', label: 'Country (optional)' },
  ...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
]

interface HouseholdInfo {
  isMultiMember: boolean
  members: { userId: string; displayName: string; avatarUrl: string | null; isSelf: boolean }[]
}

async function fetchDreams(scope: 'mine' | 'all'): Promise<DreamDestination[]> {
  const res = await fetch(`/api/travel/dream-destinations?scope=${scope}`)
  if (!res.ok) throw new Error('Failed to load dream destinations')
  const json = await res.json()
  return json.dreams || []
}

async function fetchHousehold(): Promise<HouseholdInfo | null> {
  try {
    const res = await fetch('/api/household/context')
    if (!res.ok) return null
    const json = await res.json()
    if (!json.household?.isMultiMember) return null
    return { isMultiMember: true, members: json.household.members }
  } catch {
    return null
  }
}

export default function DreamListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<HouseholdScope>('me')
  const apiScope: 'mine' | 'all' = scope === 'me' ? 'mine' : 'all'

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [notes, setNotes] = useState('')
  const [share, setShare] = useState(false)
  const [saving, setSaving] = useState(false)

  const [openDream, setOpenDream] = useState<DreamDestination | null>(null)
  const [deleting, setDeleting] = useState<DreamDestination | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actualizing, setActualizing] = useState(false)

  const { data: dreams = [], isLoading } = useQuery({
    queryKey: [...keys.dreamDestinations, apiScope],
    queryFn: () => fetchDreams(apiScope),
  })

  const { data: household } = useQuery({
    queryKey: keys.householdContext,
    queryFn: fetchHousehold,
    staleTime: 5 * 60_000,
  })

  const visibleDreams = useMemo(() => {
    if (scope !== 'me' && scope !== 'all') {
      return dreams.filter((d) => d.user_id === scope)
    }
    return dreams
  }, [dreams, scope])

  // Keep the open detail modal in sync after invalidations
  const openDreamFresh = openDream
    ? dreams.find((d) => d.id === openDream.id) || openDream
    : null

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.dreamDestinations })
  }

  const addDream = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/travel/dream-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          country_code: countryCode || null,
          notes,
          shareWithHousehold: share,
        }),
      })
      if (!res.ok) throw new Error()
      setName('')
      setCountryCode('')
      setNotes('')
      setShare(false)
      setAddOpen(false)
      refresh()
    } catch {
      toast.error('Failed to add dream destination')
    } finally {
      setSaving(false)
    }
  }

  const actualizeDream = async (dream: DreamDestination) => {
    setActualizing(true)
    try {
      const res = await fetch('/api/travel/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dream.name,
          status: 'upcoming',
          destinations: [{ name: dream.name, countryCode: dream.country_code }],
          story: dream.notes,
          dream_destination_id: dream.id,
        }),
      })
      if (!res.ok) throw new Error()
      const { trip } = await res.json()
      queryClient.invalidateQueries({ queryKey: keys.trips })
      queryClient.invalidateQueries({ queryKey: keys.dreamDestinations })
      toast.success('Vision becoming reality — trip created')
      router.push(`/travel-tracker/${trip.id}`)
    } catch {
      toast.error('Failed to actualize')
      setActualizing(false)
    }
  }

  const deleteDream = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/travel/dream-destinations/${deleting.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setDeleting(null)
      setOpenDream(null)
      refresh()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Container size="xl" className="px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {household?.isMultiMember && (
            <HouseholdScopeToggle
              members={household.members}
              value={scope}
              onChange={setScope}
            />
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Dream Destination
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : visibleDreams.length === 0 ? (
        <Card variant="elevated" className="py-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#BF00FF]/60" />
          <p className="mb-1 font-medium text-white">Where is the world calling you?</p>
          <p className="mb-5 text-sm text-neutral-500">
            Add the destinations in your vision. When you take the trip, actualize it
            into your travel record.
          </p>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Dream Destination
          </Button>
        </Card>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDreams.map((dream) => {
            const cover =
              dream.cover_image_url ||
              dream.attachments?.find((a) => a.file_type?.startsWith('image/'))?.file_url ||
              null
            const actualized = !!dream.actualized_trip_id
            return (
              <Card
                key={dream.id}
                variant="elevated"
                className="group cursor-pointer overflow-hidden !p-0 transition-transform duration-300 hover:-translate-y-1"
                onClick={() => setOpenDream(dream)}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={dream.name} loading="lazy" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-[#1d0a2e] to-[#0a1f2e]">
                    <Sparkles className="h-8 w-8 text-[#BF00FF]/40" />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate font-semibold text-white group-hover:text-[#BF00FF]">
                      {dream.name}
                    </h3>
                    {actualized && <Badge variant="primary" className="shrink-0">Actualized</Badge>}
                  </div>
                  {dream.country_code && (
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3" />
                      {countryName(dream.country_code)}
                    </p>
                  )}
                  {dream.notes && (
                    <p className="mt-2 line-clamp-2 text-xs text-neutral-400">{dream.notes}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
                    {(dream.attachments?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Images className="h-3.5 w-3.5" />
                        {dream.attachments?.length}
                      </span>
                    )}
                    {(dream.reference_links?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5" />
                        {dream.reference_links?.length}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add dream modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Dream Destination" size="md">
        <div className="flex flex-col gap-4">
          <Input
            label="Destination"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Santorini, Greece"
          />
          <Select
            label="Country"
            options={COUNTRY_OPTIONS}
            value={countryCode}
            onChange={setCountryCode}
            placeholder="Country (optional)"
          />
          <Textarea
            label="Why this place?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What draws you here? What will you experience?"
            rows={3}
          />
          {household?.isMultiMember && (
            <Checkbox
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              label="Share with household"
            />
          )}
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={addDream} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Add to Dream List'}
            </Button>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dream detail modal */}
      <Modal
        isOpen={!!openDreamFresh}
        onClose={() => setOpenDream(null)}
        title={openDreamFresh?.name || ''}
        size="lg"
      >
        {openDreamFresh && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              {openDreamFresh.country_code && (
                <Badge variant="neutral">
                  {countryName(openDreamFresh.country_code)}
                </Badge>
              )}
              {openDreamFresh.actualized_trip_id && (
                <Badge variant="primary">Actualized</Badge>
              )}
              {openDreamFresh.household_id && <Badge variant="success">Shared</Badge>}
            </div>

            {openDreamFresh.notes && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                {openDreamFresh.notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {openDreamFresh.actualized_trip_id ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`/travel-tracker/${openDreamFresh.actualized_trip_id}`)}
                >
                  View Trip
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => actualizeDream(openDreamFresh)}
                  disabled={actualizing}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {actualizing ? 'Actualizing...' : 'Actualize This Trip'}
                </Button>
              )}
              {openDreamFresh.isMine !== false && (
                <Button size="sm" variant="danger" onClick={() => setDeleting(openDreamFresh)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                <Images className="h-4 w-4" />
                Inspiration
              </h3>
              <TravelMediaSection
                endpoint={`/api/travel/dream-destinations/${openDreamFresh.id}`}
                attachments={openDreamFresh.attachments || []}
                onChanged={refresh}
              />
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                <Link2 className="h-4 w-4" />
                Links
              </h3>
              <TravelLinksSection
                endpoint={`/api/travel/dream-destinations/${openDreamFresh.id}`}
                links={openDreamFresh.reference_links || []}
                onChanged={refresh}
              />
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmationDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={deleteDream}
        title="Delete Dream Destination"
        message="This removes the destination, its media, and links from your Dream List."
        itemName={deleting?.name || ''}
        isDeleting={isDeleting}
      />
    </Container>
  )
}
