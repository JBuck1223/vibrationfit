'use client'
import { RoomFrame, ToolGrid } from './RoomFrame'
import { BeginJourney } from './BeginJourney'
import {
  ONBOARDING_STEPS,
  withSequentialLocks,
} from '@/lib/life-activation/steps'
import { ROOM_TABS } from '@/lib/rooms/catalog'
import { useState } from 'react'
export function RoomPreview() {
  const [selected, setSelected] = useState('')
  const steps = withSequentialLocks(
    ONBOARDING_STEPS.map((s) => ({
      ...s,
      stepNumber: s.number,
      completed: false,
      completedAt: null,
    })),
  )
  return (
    <>
      <RoomFrame
        title="Welcome home."
        subtitle="A little space for the life you’re creating."
      >
        <p className="room-notice">
          Development preview · Sample onboarding state
          {selected ? ` · Selected ${selected}` : ''}
        </p>
        <BeginJourney
          steps={steps}
          nextStep={steps[0]}
          loading={false}
          continueDisabled={false}
          onContinue={(s) => setSelected(s.title)}
          onSkip={async () => {}}
        />
        <div className="room-section-heading">
          <h2>Your quick actions</h2>
        </div>
        <ToolGrid
          ids={['daily-paper', 'audio', 'journal', 'vision', 'map', 'viva']}
        />
      </RoomFrame>
      <nav className="room-nav" aria-label="Preview rooms">
        {ROOM_TABS.map((t) => (
          <a
            key={t.id}
            href={t.href}
            aria-current={t.id === 'home' ? 'page' : undefined}
          >
            <t.icon size={21} />
            <span>{t.name}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
