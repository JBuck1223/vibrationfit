'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Container, Card } from '@/lib/design-system/components'
import { toast } from 'sonner'
import { keys } from '@/lib/query/keys'
import { TripForm, type TripFormValues } from '@/components/travel/TripForm'

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

export default function NewTripPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)

  const { data: isMultiMember = false } = useQuery({
    queryKey: keys.householdContext,
    queryFn: fetchHouseholdIsMultiMember,
    staleTime: 5 * 60_000,
  })

  const handleSubmit = async (values: TripFormValues) => {
    setSaving(true)
    try {
      const res = await fetch('/api/travel/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      const { trip } = await res.json()
      queryClient.invalidateQueries({ queryKey: keys.trips })
      queryClient.invalidateQueries({ queryKey: keys.travelStats })
      router.push(`/travel-tracker/${trip.id}`)
    } catch {
      toast.error('Failed to save trip. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Container size="md" className="px-6">
      <Card variant="elevated" className="p-6 md:p-8">
        <h1 className="mb-6 text-xl font-semibold text-white">New Trip</h1>
        <TripForm
          submitLabel="Save Trip"
          showFlights
          showShareToggle={isMultiMember}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/travel-tracker')}
        />
      </Card>
    </Container>
  )
}
