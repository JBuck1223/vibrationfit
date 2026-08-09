'use client'

import { useState } from 'react'
import { Button, Modal, Spinner, Textarea } from '@/lib/design-system/components'
import { Forward, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { ParsedTrip, Trip } from '@/lib/travel/types'
import { TripForm, type FlightRow, type TripFormValues } from './TripForm'

const FORWARD_ADDRESS = 'trips@inbound.vibrationfit.com'

interface ImportTripModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

export function ImportTripModal({ isOpen, onClose, onImported }: ImportTripModalProps) {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedTrip | null>(null)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setText('')
    setParsed(null)
    setParsing(false)
    setSaving(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const parse = async () => {
    if (!text.trim()) return
    setParsing(true)
    try {
      const res = await fetch('/api/travel/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'VIVA could not read that text')
        return
      }
      setParsed(json.parsed)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  const saveTrip = async (values: TripFormValues) => {
    setSaving(true)
    try {
      const res = await fetch('/api/travel/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, source: 'email' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Trip added to your travel record')
      onImported()
      close()
    } catch {
      toast.error('Failed to save trip')
      setSaving(false)
    }
  }

  const initialTrip: Partial<Trip> | undefined = parsed
    ? {
        title: parsed.title,
        status: 'past',
        start_date: parsed.startDate || null,
        end_date: parsed.endDate || null,
        story: parsed.notes || null,
        destinations: parsed.destinations,
      }
    : undefined

  const initialFlights: FlightRow[] = (parsed?.flights || []).map((f) => ({
    airline: f.airline || '',
    flight_number: f.flightNumber || '',
    depart_airport: f.departAirport || '',
    arrive_airport: f.arriveAirport || '',
    depart_at: f.departAt?.slice(0, 10) || '',
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={parsed ? 'Review Your Trip' : 'Import from Email'}
      size="lg"
    >
      {!parsed ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-400">
            Paste a flight confirmation, itinerary, or booking email below and
            VIVA will pull out the trip details for you.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full email or itinerary text here..."
            rows={10}
          />
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={parse} disabled={parsing || !text.trim()}>
              {parsing ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  VIVA is reading...
                </span>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Extract Trip
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={close} disabled={parsing}>
              Cancel
            </Button>
          </div>

          <div className="mt-2 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Forward className="mt-0.5 h-4 w-4 shrink-0 text-[#00FFFF]" />
            <p className="text-xs leading-relaxed text-neutral-400">
              You can also forward travel confirmation emails to{' '}
              <span className="font-medium text-[#00FFFF]">{FORWARD_ADDRESS}</span>{' '}
              from your account email address. VIVA will read them and queue the
              trips here for your review.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-400">
            Here is what VIVA found. Adjust anything, then save it to your travel record.
          </p>
          <TripForm
            initial={initialTrip}
            initialFlights={initialFlights}
            submitLabel="Save Trip"
            showFlights
            saving={saving}
            onSubmit={saveTrip}
            onCancel={() => setParsed(null)}
          />
        </div>
      )}
    </Modal>
  )
}
