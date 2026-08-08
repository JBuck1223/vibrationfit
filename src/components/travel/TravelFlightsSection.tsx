'use client'

import { useState } from 'react'
import { Button, Input } from '@/lib/design-system/components'
import { Plane, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TripFlight } from '@/lib/travel/types'

interface TravelFlightsSectionProps {
  tripId: string
  flights: TripFlight[]
  onChanged: () => void
}

function formatFlightDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TravelFlightsSection({ tripId, flights, onChanged }: TravelFlightsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [departAirport, setDepartAirport] = useState('')
  const [arriveAirport, setArriveAirport] = useState('')
  const [departDate, setDepartDate] = useState('')
  const [saving, setSaving] = useState(false)

  const addFlight = async () => {
    if (!departAirport.trim() && !arriveAirport.trim() && !airline.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/travel/trips/${tripId}/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airline,
          flight_number: flightNumber,
          depart_airport: departAirport,
          arrive_airport: arriveAirport,
          depart_at: departDate ? `${departDate}T12:00:00Z` : null,
        }),
      })
      if (!res.ok) throw new Error()
      setAirline('')
      setFlightNumber('')
      setDepartAirport('')
      setArriveAirport('')
      setDepartDate('')
      setShowForm(false)
      onChanged()
    } catch {
      toast.error('Failed to add flight')
    } finally {
      setSaving(false)
    }
  }

  const deleteFlight = async (flightId: string) => {
    const res = await fetch(`/api/travel/trips/${tripId}/flights?flight_id=${flightId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      onChanged()
    } else {
      toast.error('Failed to delete flight')
    }
  }

  return (
    <div>
      {flights.length === 0 && !showForm ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          <Plane className="mx-auto mb-1.5 h-5 w-5 text-neutral-600" />
          No flights yet. Add segments to track routes and miles.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {flights.map((f) => {
            const date = formatFlightDate(f.depart_at)
            return (
              <div
                key={f.id}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <Plane className="h-4 w-4 shrink-0 text-[#00FFFF]" />
                <div className="min-w-0 flex-1">
                  <span className="block text-sm text-white">
                    {f.depart_airport || '???'} → {f.arrive_airport || '???'}
                    {f.distance_miles ? (
                      <span className="ml-2 text-xs text-neutral-500">
                        {new Intl.NumberFormat('en-US').format(Math.round(f.distance_miles))} mi
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {[f.airline, f.flight_number, date].filter(Boolean).join(' · ') || 'Flight'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteFlight(f.id)}
                  className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete flight"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder="Airline"
            />
            <Input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Flight # (optional)"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={departAirport}
              onChange={(e) => setDepartAirport(e.target.value.toUpperCase())}
              placeholder="From (ATL)"
              maxLength={3}
            />
            <Input
              value={arriveAirport}
              onChange={(e) => setArriveAirport(e.target.value.toUpperCase())}
              placeholder="To (CDG)"
              maxLength={3}
            />
            <Input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={addFlight} disabled={saving}>
              {saving ? 'Saving...' : 'Add Flight'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Flight
          </Button>
        </div>
      )}
    </div>
  )
}
