'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe2, MapPin, Sparkles } from 'lucide-react'
import {
  Container,
  Card,
  Spinner,
  HouseholdScopeToggle,
  type HouseholdScope,
} from '@/lib/design-system/components'
import { keys } from '@/lib/query/keys'
import { countryName } from '@/lib/travel/countries'
import { WorldMap } from '@/components/travel/WorldMap'
import type { DreamDestination, Trip } from '@/lib/travel/types'

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

async function fetchDreams(scope: 'mine' | 'all'): Promise<DreamDestination[]> {
  const res = await fetch(`/api/travel/dream-destinations?scope=${scope}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.dreams || []
}

export default function TravelMapPage() {
  const [scope, setScope] = useState<HouseholdScope>('me')
  const apiScope: 'mine' | 'all' = scope === 'me' ? 'mine' : 'all'

  const { data: payload, isLoading } = useQuery({
    queryKey: [...keys.trips, 'list', apiScope],
    queryFn: () => fetchTrips(apiScope),
  })

  const { data: dreams = [] } = useQuery({
    queryKey: [...keys.dreamDestinations, apiScope],
    queryFn: () => fetchDreams(apiScope),
  })

  const trips = useMemo(() => {
    let list = (payload?.trips || []).filter((t) => t.status !== 'draft_import')
    if (scope !== 'me' && scope !== 'all') {
      list = list.filter((t) => t.user_id === scope)
    }
    return list
  }, [payload, scope])

  const visitedCodes = useMemo(() => {
    const set = new Set<string>()
    for (const t of trips) {
      if (t.status !== 'past') continue
      for (const d of t.destinations) {
        if (d.countryCode) set.add(d.countryCode.toUpperCase())
      }
    }
    return Array.from(set).sort()
  }, [trips])

  const dreamCodes = useMemo(() => {
    const set = new Set<string>()
    for (const d of dreams) {
      if (!d.actualized_trip_id && d.country_code) set.add(d.country_code.toUpperCase())
    }
    return Array.from(set).sort()
  }, [dreams])

  return (
    <Container size="xl" className="px-6">
      {payload?.household?.isMultiMember && (
        <div className="mb-6">
          <HouseholdScopeToggle
            members={payload.household.members}
            value={scope}
            onChange={setScope}
          />
        </div>
      )}

      <Card variant="elevated" className="mb-8 !p-5 md:!p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <WorldMap visitedCountryCodes={visitedCodes} dreamCountryCodes={dreamCodes} />
        )}
      </Card>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="elevated" className="!p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            <Globe2 className="h-4 w-4 text-[#39FF14]" />
            Countries Visited ({visitedCodes.length})
          </h2>
          {visitedCodes.length === 0 ? (
            <p className="py-2 text-sm text-neutral-500">
              Add country details to your trips and they will light up here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {visitedCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10 px-2.5 py-1 text-xs text-[#39FF14]"
                >
                  <MapPin className="h-3 w-3" />
                  {countryName(code) || code}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card variant="elevated" className="!p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            <Sparkles className="h-4 w-4 text-[#BF00FF]" />
            Dream Destinations ({dreamCodes.length})
          </h2>
          {dreamCodes.length === 0 ? (
            <p className="py-2 text-sm text-neutral-500">
              Add destinations to your Dream List to see the world calling you.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {dreamCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full border border-[#BF00FF]/30 bg-[#BF00FF]/10 px-2.5 py-1 text-xs text-[#BF00FF]"
                >
                  <Sparkles className="h-3 w-3" />
                  {countryName(code) || code}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Container>
  )
}
