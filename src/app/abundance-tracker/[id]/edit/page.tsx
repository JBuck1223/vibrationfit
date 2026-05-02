'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AbundanceEditForm } from '@/components/abundance-tracker/AbundanceEditForm'

export default function AbundanceEditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [eventId, setEventId] = useState<string | null>(null)

  useEffect(() => {
    void params.then((p) => setEventId(p.id))
  }, [params])

  if (!eventId) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Edit Abundance Entry" />
        <AbundanceEditForm
          eventId={eventId}
          onCancel={() => router.push(`/abundance-tracker/${eventId}`)}
          onSuccess={() => router.push(`/abundance-tracker/${eventId}`)}
        />
      </Stack>
    </Container>
  )
}
