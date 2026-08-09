'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Globe2, Luggage, MapPin, Plane, PlaneTakeoff } from 'lucide-react'
import {
  Container,
  Card,
  Spinner,
  HouseholdScopeToggle,
  type HouseholdScope,
} from '@/lib/design-system/components'
import { keys } from '@/lib/query/keys'
import type { TravelStats } from '@/lib/travel/types'

interface HouseholdInfo {
  id: string
  name: string
  isMultiMember: boolean
  members: { userId: string; displayName: string; avatarUrl: string | null; isSelf: boolean }[]
}

async function fetchStats(scope: 'mine' | 'all'): Promise<TravelStats | null> {
  const res = await fetch(`/api/travel/stats?scope=${scope}`)
  if (!res.ok) return null
  const json = await res.json()
  return json.stats || null
}

async function fetchHousehold(): Promise<HouseholdInfo | null> {
  try {
    const res = await fetch('/api/household/context')
    if (!res.ok) return null
    const json = await res.json()
    if (!json.household?.isMultiMember) return null
    return {
      id: json.household.householdId,
      name: json.household.householdName,
      isMultiMember: true,
      members: json.household.members,
    }
  } catch {
    return null
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export default function TravelInsightsPage() {
  const [scope, setScope] = useState<HouseholdScope>('me')
  const apiScope: 'mine' | 'all' = scope === 'me' ? 'mine' : 'all'

  const { data: stats, isLoading } = useQuery({
    queryKey: [...keys.travelStats, apiScope],
    queryFn: () => fetchStats(apiScope),
  })

  const { data: household } = useQuery({
    queryKey: keys.householdContext,
    queryFn: fetchHousehold,
    staleTime: 5 * 60_000,
  })

  const statCards = [
    { label: 'Trips Taken', value: stats ? formatNumber(stats.tripCount) : '—', icon: Luggage, color: 'text-[#39FF14]' },
    { label: 'Countries', value: stats ? formatNumber(stats.countryCount) : '—', icon: Globe2, color: 'text-[#00FFFF]' },
    { label: 'Destinations', value: stats ? formatNumber(stats.destinationCount) : '—', icon: MapPin, color: 'text-[#FFFF00]' },
    { label: 'Flights', value: stats ? formatNumber(stats.flightCount) : '—', icon: PlaneTakeoff, color: 'text-[#BF00FF]' },
    { label: 'Miles Flown', value: stats ? formatNumber(stats.milesFlown) : '—', icon: Plane, color: 'text-[#FF6B35]' },
  ]

  return (
    <Container size="xl" className="px-6">
      {household?.isMultiMember && (
        <div className="mb-6">
          <HouseholdScopeToggle
            members={household.members}
            value={scope}
            onChange={setScope}
            compact
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <Card key={label} variant="elevated" className="!p-4">
                <Icon className={`mb-2 h-5 w-5 ${color}`} />
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-neutral-500">{label}</div>
              </Card>
            ))}
          </div>

          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="elevated" className="!p-5 md:!p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Trips Per Year
              </h2>
              {!stats || stats.tripsPerYear.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Add dates or years to your trips to see your travel timeline.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.tripsPerYear}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis
                        dataKey="year"
                        stroke="#666"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#666"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1F1F1F',
                          border: '1px solid #333',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="count" name="Trips" fill="#39FF14" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card variant="elevated" className="!p-5 md:!p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Top Destinations
              </h2>
              {!stats || stats.topDestinations.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Your most-visited places will show up here.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.topDestinations.map((d, i) => {
                    const max = stats.topDestinations[0]?.count || 1
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-500">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-sm text-white">{d.name}</span>
                            <span className="shrink-0 text-xs text-neutral-500">
                              {d.count} {d.count === 1 ? 'visit' : 'visits'}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                            <div
                              className="h-full rounded-full bg-[#00FFFF]"
                              style={{ width: `${Math.max(8, (d.count / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </Container>
  )
}
