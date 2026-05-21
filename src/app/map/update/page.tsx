'use client'

import { Container } from '@/lib/design-system/components'
import { MapSystemBuilder } from '@/components/map-studio/MapSystemBuilder'
import { MapCustomUpdate } from '@/components/map-studio/MapCustomUpdate'

export default function MapUpdatePage() {
  return (
    <Container size="xl" className="min-w-0 overflow-x-hidden pb-4">
      <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl pt-2 pb-5 sm:pb-6">
        My Alignment Plan
      </h1>

      <MapSystemBuilder
        redirectTo="/map"
        showHeader={false}
        gridLayout
        customSlot={<MapCustomUpdate showHeader={false} embeddedInPlan />}
      />
    </Container>
  )
}
