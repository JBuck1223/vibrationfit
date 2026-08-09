'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Luggage,
  Globe2,
  Plane,
  CalendarClock,
  Plus,
  Mail,
  MapPin,
  Inbox,
} from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Badge,
  Spinner,
  HouseholdScopeToggle,
  type HouseholdScope,
} from '@/lib/design-system/components'
import { keys } from '@/lib/query/keys'
import { countryName } from '@/lib/travel/countries'
import { tripDateLabel } from '@/components/travel/travel-utils'
import { ImportTripModal } from '@/components/travel/ImportTripModal'
import type { Trip, TravelStats } from '@/lib/travel/types'

interface TripsPayload {
  trips: Trip[]
  household: {
    id: string
    name: string
    isMultiMember: boolean
    members: { userId: string; displayName: string; avatarUrl: string | null; isSelf: boolean }[]
  } | null
}

async function fetchTrips(scope: 'mine' | 'all'): Promise<TripsPayload> {
  const res = await fetch(`/api/travel/trips?scope=${scope}`)
  if (!res.ok) throw new Error('Failed to load trips')
  return res.json()
}

async function fetchStats(scope: 'mine' | 'all'): Promise<TravelStats | null> {
  const res = await fetch(`/api/travel/stats?scope=${scope}`)
  if (!res.ok) return null
  const json = await res.json()
  return json.stats || null
}

function formatMiles(miles: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(miles))
}

function TripCard({ trip }: { trip: Trip }) {
  const dateLabel = tripDateLabel(trip)
  const cover =
    trip.cover_image_url ||
    trip.attachments?.find((a) => a.file_type?.startsWith('image/'))?.file_url ||
    null

  return (
    <Link href={`/travel-tracker/${trip.id}`} className="group block">
      <Card
        variant="elevated"
        className="h-full overflow-hidden !p-0 transition-transform duration-300 group-hover:-translate-y-1"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={trip.title}
            loading="lazy"
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-[#0e2a1a] to-[#0a1f2e]">
            <Plane className="h-8 w-8 text-[#39FF14]/40" />
          </div>
        )}
        <div className="p-4">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-semibold text-white group-hover:text-[#39FF14]">
              {trip.title}
            </h3>
            {trip.status === 'upcoming' && (
              <Badge variant="info" className="shrink-0">Upcoming</Badge>
            )}
          </div>
          {dateLabel && <p className="text-xs text-neutral-500">{dateLabel}</p>}
          {trip.destinations.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {trip.destinations.slice(0, 3).map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-0.5 text-xs text-neutral-300"
                >
                  <MapPin className="h-3 w-3 text-neutral-500" />
                  {d.name}
                  {d.countryCode ? `, ${countryName(d.countryCode)}` : ''}
                </span>
              ))}
              {trip.destinations.length > 3 && (
                <span className="text-xs text-neutral-500">
                  +{trip.destinations.length - 3} more
                </span>
              )}
            </div>
          )}
          {trip.member && !trip.member.isSelf && (
            <p className="mt-2 text-xs text-neutral-500">{trip.member.displayName}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default function TravelTrackerPage() {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<HouseholdScope>('me')
  const [importOpen, setImportOpen] = useState(false)

  const apiScope: 'mine' | 'all' = scope === 'me' ? 'mine' : 'all'

  const { data: payload, isLoading } = useQuery({
    queryKey: [...keys.trips, 'list', apiScope],
    queryFn: () => fetchTrips(apiScope),
  })

  const { data: stats } = useQuery({
    queryKey: [...keys.travelStats, apiScope],
    queryFn: () => fetchStats(apiScope),
  })

  const trips = useMemo(() => {
    let list = payload?.trips || []
    // Member-specific lens: filter the household result set client-side
    if (scope !== 'me' && scope !== 'all') {
      list = list.filter((t) => t.user_id === scope)
    }
    return list
  }, [payload, scope])

  const drafts = trips.filter((t) => t.status === 'draft_import')
  const upcoming = trips.filter((t) => t.status === 'upcoming')
  const past = trips.filter((t) => t.status === 'past')

  const statCards = [
    { label: 'Trips Taken', value: stats?.tripCount ?? '—', icon: Luggage, color: 'text-[#39FF14]' },
    { label: 'Countries', value: stats?.countryCount ?? '—', icon: Globe2, color: 'text-[#00FFFF]' },
    { label: 'Miles Flown', value: stats ? formatMiles(stats.milesFlown) : '—', icon: Plane, color: 'text-[#BF00FF]' },
    { label: 'Upcoming', value: stats?.upcomingCount ?? '—', icon: CalendarClock, color: 'text-[#FFFF00]' },
  ]

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.trips })
    queryClient.invalidateQueries({ queryKey: keys.travelStats })
  }

  return (
    <Container size="xl" className="px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {payload?.household?.isMultiMember && (
            <HouseholdScopeToggle
              members={payload.household.members}
              value={scope}
              onChange={setScope}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Mail className="mr-1.5 h-4 w-4" />
            Import from Email
          </Button>
          <Link href="/travel-tracker/new">
            <Button variant="primary" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} variant="elevated" className="!p-4">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-neutral-500">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {drafts.length > 0 && (
        <Card variant="outlined" className="mb-8 !border-[#BF00FF]/40 !p-4">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 shrink-0 text-[#BF00FF]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {drafts.length === 1
                  ? 'VIVA found a trip in your email, ready for review.'
                  : `VIVA found ${drafts.length} trips in your email, ready for review.`}
              </p>
              <p className="text-xs text-neutral-500">
                Review the details and confirm to add them to your travel record.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {drafts.map((d) => (
              <Link key={d.id} href={`/travel-tracker/${d.id}`}>
                <Button size="sm" variant="outline">
                  Review: {d.title}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : trips.length === 0 ? (
        <Card variant="elevated" className="py-16 text-center">
          <Plane className="mx-auto mb-3 h-8 w-8 text-neutral-600" />
          <p className="mb-1 font-medium text-white">No trips yet</p>
          <p className="mb-5 text-sm text-neutral-500">
            Add your first trip, or let VIVA pull one in from a confirmation email.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/travel-tracker/new">
              <Button variant="primary" size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                New Trip
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Mail className="mr-1.5 h-4 w-4" />
              Import from Email
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold text-white">Upcoming</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold text-white">Trips Taken</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ImportTripModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </Container>
  )
}
