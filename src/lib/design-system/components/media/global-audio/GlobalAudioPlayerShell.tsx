'use client'

import { PersistentMiniPlayer } from './PersistentMiniPlayer'
import { AudioDrawerPlayer } from './AudioDrawerPlayer'

export function GlobalAudioPlayerShell() {
  return (
    <>
      <PersistentMiniPlayer />
      <AudioDrawerPlayer />
    </>
  )
}
