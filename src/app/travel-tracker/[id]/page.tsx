'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Edit,
  Images,
  Link2,
  MapPin,
  Plane,
  Share2,
  Trash2,
} from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Badge,
  Spinner,
  Modal,
  DeleteConfirmationDialog,
} from '@/lib/design-system/components'
import { toast } from 'sonner'
import { keys } from '@/lib/query/keys'
import { countryName } from '@/lib/travel/countries'
import { tripDateLabel } from '@/components/travel/travel-utils'
import { TripForm, type TripFormValues } from '@/components/travel/TripForm'
import { TravelFlightsSection } from '@/components/travel/TravelFlightsSection'
import { TravelMediaSection } from '@/components/travel/TravelMediaSection'
import { TravelLinksSection } from '@/components/travel/TravelLinksSection'
import type { Trip } from '@/lib/travel/types'

async function fetchTrip(id: string): Promise<Trip> {
  const res = await fetch(`/api/travel/trips/${id}`)
  if (!res.ok) throw new Error('Failed to load trip')
  const json = await res.json()
  return json.trip
}

async function fetchHouseholdIsMultiMember(): Promise<boolean> {
  try {
    const res = await fetch('/api/household/context')
    if (!res.ok) return false
    const json = await res.json()
    return !!json.household?.isMultiMember
  } catch {
    return false
  }
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: trip, isLoading } = useQuery({
    queryKey: keys.tripDetail(id),
    queryFn: () => fetchTrip(id),
  })

  const { data: isMultiMember = false } = useQuery({
    queryKey: keys.householdContext,
    queryFn: fetchHouseholdIsMultiMember,
    staleTime: 5 * 60_000,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.trips })
    queryClient.invalidateQueries({ queryKey: keys.travelStats })
  }

  const patchTrip = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/travel/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error()
  }

  const handleEditSubmit = async (values: TripFormValues) => {
    setSaving(true)
    try {
      // Flights are managed separately in TravelFlightsSection on this page
      const payload: Record<string, unknown> = { ...values }
      delete payload.flights
      await patchTrip(payload)
      setEditing(false)
      refresh()
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const confirmImport = async (status: 'past' | 'upcoming') => {
    setConfirming(true)
    try {
      await patchTrip({ status })
      refresh()
      toast.success('Trip added to your travel record')
    } catch {
      toast.error('Failed to confirm trip')
    } finally {
      setConfirming(false)
    }
  }

  const toggleShare = async () => {
    if (!trip) return
    try {
      await patchTrip({ shareWithHousehold: !trip.household_id })
      refresh()
    } catch {
      toast.error('Failed to update sharing')
    }
  }

  const deleteTrip = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/travel/trips/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      refresh()
      router.push('/travel-tracker')
    } catch {
      toast.error('Failed to delete trip')
      setIsDeleting(false)
    }
  }

  if (isLoading || !trip) {
    return (
      <Container size="lg" className="px-6">
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </Container>
    )
  }

  const dateLabel = tripDateLabel(trip)

  return (
    <Container size="lg" className="px-6">
      <button
        type="button"
        onClick={() => router.push('/travel-tracker')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All Trips
      </button>

      {trip.status === 'draft_import' && (
        <Card variant="outlined" className="mb-6 !border-[#BF00FF]/40 !p-4">
          <p className="mb-1 text-sm font-medium text-white">
            VIVA pulled this trip from your email. Review the details, then confirm.
          </p>
          <p className="mb-3 text-xs text-neutral-500">
            You can edit anything before confirming. Deleting discards the import.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => confirmImport('past')} disabled={confirming}>
              <Check className="mr-1.5 h-4 w-4" />
              Confirm as Taken
            </Button>
            <Button size="sm" variant="secondary" onClick={() => confirmImport('upcoming')} disabled={confirming}>
              <CalendarClock className="mr-1.5 h-4 w-4" />
              Confirm as Upcoming
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={confirming}>
              <Edit className="mr-1.5 h-4 w-4" />
              Edit First
            </Button>
          </div>
        </Card>
      )}

      <Card variant="elevated" className="mb-6 overflow-hidden !p-0">
        {trip.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="h-52 w-full object-cover"
          />
        )}
        <div className="p-6 md:p-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {trip.status === 'upcoming' && <Badge variant="info">Upcoming</Badge>}
            {trip.status === 'draft_import' && <Badge variant="warning">Needs Review</Badge>}
            {trip.household_id && <Badge variant="success">Shared</Badge>}
            {trip.trip_type && (
              <Badge variant="neutral" className="capitalize">
                {trip.trip_type.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
              {dateLabel && <p className="mt-1 text-sm text-neutral-400">{dateLabel}</p>}
              {trip.member && !trip.member.isSelf && (
                <p className="mt-1 text-xs text-neutral-500">By {trip.member.displayName}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isMultiMember && trip.isMine && (
                <Button size="sm" variant="ghost" onClick={toggleShare}>
                  <Share2 className="mr-1.5 h-4 w-4" />
                  {trip.household_id ? 'Unshare' : 'Share'}
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Edit className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              {trip.isMine && (
                <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {trip.destinations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {trip.destinations.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2.5 py-1 text-sm text-neutral-300"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#39FF14]" />
                  {d.name}
                  {d.countryCode ? `, ${countryName(d.countryCode)}` : ''}
                </span>
              ))}
            </div>
          )}

          {trip.story && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
              {trip.story}
            </p>
          )}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="elevated" className="!p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            <Plane className="h-4 w-4" />
            Flights
          </h2>
          <TravelFlightsSection tripId={id} flights={trip.flights || []} onChanged={refresh} />
        </Card>

        <Card variant="elevated" className="!p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            <Link2 className="h-4 w-4" />
            Links
          </h2>
          <TravelLinksSection
            endpoint={`/api/travel/trips/${id}`}
            links={trip.reference_links || []}
            onChanged={refresh}
          />
        </Card>
      </div>

      <Card variant="elevated" className="mb-10 !p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          <Images className="h-4 w-4" />
          Photos & Videos
        </h2>
        <TravelMediaSection
          endpoint={`/api/travel/trips/${id}`}
          attachments={trip.attachments || []}
          onChanged={refresh}
        />
      </Card>

      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Edit Trip"
        size="lg"
      >
        <TripForm
          initial={trip}
          submitLabel="Save Changes"
          showShareToggle={false}
          saving={saving}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <DeleteConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteTrip}
        title="Delete Trip"
        message="This permanently removes the trip, its flights, media, and links."
        itemName={trip.title}
        isDeleting={isDeleting}
      />
    </Container>
  )
}
