'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { RoomFrame, ToolGrid } from './RoomFrame'
import { ContinueListening } from './MemberHome'
import { useMemberExperience } from './MemberExperience'
const copy = {
  listen: {
    title: 'Find your frequency.',
    subtitle: 'Your vision, your voice, your soundtrack.',
  },
  capture: {
    title: 'Make room for the moment.',
    subtitle: 'Thoughts, gratitude and the life unfolding around you.',
  },
  tribe: {
    title: 'Better, together.',
    subtitle: 'Share your wins. Find your people. Keep growing.',
  },
  tools: {
    title: 'Your space. Your tools.',
    subtitle: 'Everything you need, right where you need it.',
  },
}
export function RoomHub({ room }: { room: keyof typeof copy }) {
  const [search, setSearch] = useState('')
  const { error } = useMemberExperience()
  return (
    <RoomFrame
      {...copy[room]}
      eyebrow={
        room === 'tools' ? 'EXPLORE' : 'YOUR ' + room.toUpperCase() + ' ROOM'
      }
    >
      {room === 'listen' && <ContinueListening />}
      {room === 'tools' && (
        <>
          <label className="room-search">
            <Search size={20} />
            <input
              type="search"
              aria-label="Search tools"
              placeholder="Find a tool, practice or place…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <p className="room-pin-hint">
            Pin up to six favorites. Your other quick actions adapt to what you
            use.
          </p>
        </>
      )}
      {error && (
        <p role="status" className="room-notice">
          {error}
        </p>
      )}
      <ToolGrid
        room={room === 'tools' ? undefined : room}
        search={search}
        pinnable={room === 'tools'}
      />
    </RoomFrame>
  )
}
