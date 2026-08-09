'use client'

import { useState } from 'react'
import { Button, Input, Select, Textarea, Checkbox, Spinner } from '@/lib/design-system/components'
import { MapPin, Plane, Plus, Trash2 } from 'lucide-react'
import { COUNTRIES } from '@/lib/travel/countries'
import type { Trip, TripDestination } from '@/lib/travel/types'

const COUNTRY_OPTIONS = [
  { value: '', label: 'Country (optional)' },
  ...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
]

const TRIP_TYPE_OPTIONS = [
  { value: '', label: 'Type (optional)' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'family', label: 'Family' },
  { value: 'romantic', label: 'Romantic Getaway' },
  { value: 'business', label: 'Business' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'road_trip', label: 'Road Trip' },
  { value: 'other', label: 'Other' },
]

interface DestinationRow {
  name: string
  countryCode: string
}

export interface FlightRow {
  airline: string
  flight_number: string
  depart_airport: string
  arrive_airport: string
  depart_at: string
}

export interface TripFormValues {
  title: string
  status: 'past' | 'upcoming'
  start_date: string | null
  end_date: string | null
  destinations: TripDestination[]
  trip_type: string | null
  story: string | null
  flights?: FlightRow[]
  shareWithHousehold?: boolean
}

interface TripFormProps {
  initial?: Partial<Trip>
  /** Prefilled flight rows (e.g. from a VIVA email import) */
  initialFlights?: FlightRow[]
  submitLabel: string
  /** Show the flight segment rows (used on create; detail page manages flights separately) */
  showFlights?: boolean
  /** Show the household share checkbox (caller decides based on household context) */
  showShareToggle?: boolean
  saving: boolean
  onSubmit: (values: TripFormValues) => void
  onCancel?: () => void
}

export function TripForm({
  initial,
  initialFlights,
  submitLabel,
  showFlights = false,
  showShareToggle = false,
  saving,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [status, setStatus] = useState<'past' | 'upcoming'>(
    initial?.status === 'upcoming' ? 'upcoming' : 'past'
  )
  const [startDate, setStartDate] = useState(initial?.start_date?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(initial?.end_date?.slice(0, 10) || '')
  const [tripType, setTripType] = useState(initial?.trip_type || '')
  const [story, setStory] = useState(initial?.story || '')
  const [share, setShare] = useState(!!initial?.household_id)
  const [destinations, setDestinations] = useState<DestinationRow[]>(
    initial?.destinations?.length
      ? initial.destinations.map((d) => ({ name: d.name, countryCode: d.countryCode || '' }))
      : [{ name: '', countryCode: '' }]
  )
  const [flights, setFlights] = useState<FlightRow[]>(initialFlights || [])
  const [error, setError] = useState<string | null>(null)

  const updateDestination = (index: number, patch: Partial<DestinationRow>) => {
    setDestinations((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const updateFlight = (index: number, patch: Partial<FlightRow>) => {
    setFlights((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Give this trip a title.')
      return
    }
    const cleanDestinations = destinations
      .filter((d) => d.name.trim())
      .map((d) => ({ name: d.name.trim(), countryCode: d.countryCode || null }))
    if (cleanDestinations.length === 0) {
      setError('Add at least one destination.')
      return
    }
    setError(null)
    onSubmit({
      title: title.trim(),
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      destinations: cleanDestinations,
      trip_type: tripType || null,
      story: story.trim() || null,
      flights: showFlights
        ? flights.filter(
            (f) => f.airline || f.flight_number || f.depart_airport || f.arrive_airport
          )
        : undefined,
      shareWithHousehold: showShareToggle ? share : undefined,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Trip Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Two weeks in Italy"
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setStatus('past')}
          className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
            status === 'past'
              ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          Taken
        </button>
        <button
          type="button"
          onClick={() => setStatus('upcoming')}
          className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
            status === 'upcoming'
              ? 'border-[#00FFFF] bg-[#00FFFF]/10 text-[#00FFFF]'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          Upcoming
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-300">
          Destinations
        </label>
        <div className="flex flex-col gap-2">
          {destinations.map((d, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-500" />
                <Input
                  value={d.name}
                  onChange={(e) => updateDestination(i, { name: e.target.value })}
                  placeholder="City or place, e.g. Rome"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  options={COUNTRY_OPTIONS}
                  value={d.countryCode}
                  onChange={(v) => updateDestination(i, { countryCode: v })}
                  placeholder="Country (optional)"
                  className="w-full sm:w-52"
                />
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDestinations((rows) => rows.filter((_, idx) => idx !== i))}
                    className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Remove destination"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="mt-2"
          onClick={() => setDestinations((rows) => [...rows, { name: '', countryCode: '' }])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Destination
        </Button>
      </div>

      <Select
        label="Trip Type"
        options={TRIP_TYPE_OPTIONS}
        value={tripType}
        onChange={setTripType}
        placeholder="Type (optional)"
      />

      <Textarea
        label="Story"
        value={story}
        onChange={(e) => setStory(e.target.value)}
        placeholder="What made this trip meaningful? Capture the moments, feelings, and highlights..."
        rows={4}
      />

      {showFlights && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">
            Flights
          </label>
          {flights.length === 0 && (
            <p className="mb-2 text-sm text-neutral-500">
              Add flight segments to track routes and miles flown.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {flights.map((f, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 shrink-0 text-neutral-500" />
                  <Input
                    value={f.airline}
                    onChange={(e) => updateFlight(i, { airline: e.target.value })}
                    placeholder="Airline"
                    className="flex-1"
                  />
                  <Input
                    value={f.flight_number}
                    onChange={(e) => updateFlight(i, { flight_number: e.target.value })}
                    placeholder="Flight #"
                    className="w-28"
                  />
                  <button
                    type="button"
                    onClick={() => setFlights((rows) => rows.filter((_, idx) => idx !== i))}
                    className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Remove flight"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Input
                    value={f.depart_airport}
                    onChange={(e) => updateFlight(i, { depart_airport: e.target.value.toUpperCase() })}
                    placeholder="From (IATA, e.g. ATL)"
                    maxLength={3}
                  />
                  <Input
                    value={f.arrive_airport}
                    onChange={(e) => updateFlight(i, { arrive_airport: e.target.value.toUpperCase() })}
                    placeholder="To (IATA, e.g. CDG)"
                    maxLength={3}
                  />
                  <Input
                    type="date"
                    value={f.depart_at}
                    onChange={(e) => updateFlight(i, { depart_at: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() =>
              setFlights((rows) => [
                ...rows,
                { airline: '', flight_number: '', depart_airport: '', arrive_airport: '', depart_at: '' },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Flight
          </Button>
        </div>
      )}

      {showShareToggle && (
        <Checkbox
          checked={share}
          onChange={(e) => setShare(e.target.checked)}
          label="Share with household"
        />
      )}

      {error && <p className="text-sm text-[#FF0040]">{error}</p>}

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" />
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
