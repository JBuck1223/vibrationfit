'use client'

import { Suspense } from 'react'
import { Spinner, Container } from '@/lib/design-system/components'
import CalendarPanel from '../map/CalendarPanel'

/** First-class Learning Calendar — the daily tracking surface. */
export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg" className="py-20 flex justify-center">
          <Spinner />
        </Container>
      }
    >
      <CalendarPanel />
    </Suspense>
  )
}
