'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Search, UserRound, ArrowUpRight } from 'lucide-react'
import { COASTAL_IMAGE, ROOM_TOOLS, type RoomId } from '@/lib/rooms/catalog'
import { useMemberExperience } from './MemberExperience'
export function RoomFrame({
  children,
  title,
  eyebrow = 'YOUR SPACE TO BECOME',
  subtitle,
}: {
  children: React.ReactNode
  title: string
  eyebrow?: string
  subtitle?: string
}) {
  return (
    <div
      className="member-room"
      style={
        { '--room-image': `url("${COASTAL_IMAGE}")` } as React.CSSProperties
      }
    >
      <div className="room-content">
        <header className="room-header">
          <Link href="/dashboard" aria-label="Vibration Fit Home">
            <Image
              unoptimized
              src="https://media.vibrationfit.com/site-assets/brand/logo/logo-white.svg"
              alt="Vibration Fit"
              width={210}
              height={40}
            />
          </Link>
          <div className="flex gap-2">
            <Link
              className="room-icon-button"
              href="/tools"
              aria-label="Search all tools"
            >
              <Search size={20} />
            </Link>
            <Link
              className="room-icon-button"
              href="/account"
              aria-label="Your account"
            >
              <UserRound size={20} />
            </Link>
          </div>
        </header>
        <div className="room-heading">
          <p className="room-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && <p className="room-subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
export function ToolGrid({
  room,
  search = '',
  ids,
  pinnable = false,
}: {
  room?: RoomId
  search?: string
  ids?: string[]
  pinnable?: boolean
}) {
  const { state, dispatch, saving } = useMemberExperience()
  const tools = ids
    ? ids.flatMap((id) => ROOM_TOOLS.filter((t) => t.id === id))
    : ROOM_TOOLS.filter(
        (t) =>
          (!room || t.room === room) &&
          `${t.name} ${t.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
  if (!tools.length)
    return (
      <p className="room-panel">
        No tools match “{search}”. Try a different name.
      </p>
    )
  return (
    <div className="room-tool-grid">
      {tools.map((t) => (
        <div key={t.id} className="room-tool room-panel">
          <Link href={t.href}>
            <t.icon
              size={23}
              className={t.id === 'viva' ? 'text-[#BF00FF]' : 'text-[#b8e7ae]'}
            />
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <ArrowUpRight className="room-tool-arrow" size={17} />
          </Link>
          {pinnable && (
            <button
              className="room-pin"
              disabled={
                saving ||
                (!state.pinned.includes(t.id) && state.pinned.length >= 6)
              }
              aria-pressed={state.pinned.includes(t.id)}
              onClick={() =>
                void dispatch({
                  type: 'pin',
                  toolId: t.id,
                  pinned: !state.pinned.includes(t.id),
                })
              }
            >
              {state.pinned.includes(t.id) ? 'Unpin' : 'Pin to Home'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
