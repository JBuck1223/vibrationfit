'use client'

import { Container } from '@/lib/design-system/components'
import { MapSystemBuilder } from '@/components/map-studio/MapSystemBuilder'

export default function MapUpdateSystemPage() {
  return (
    <Container size="xl">
      <MapSystemBuilder redirectTo="/map/update" />
    </Container>
  )
}
