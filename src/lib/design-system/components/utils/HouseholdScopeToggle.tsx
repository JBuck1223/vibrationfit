'use client'

import React from 'react'
import { User, Users, Home } from 'lucide-react'
import { cn } from '../shared-utils'

// ============================================================================
// HOUSEHOLD SCOPE TOGGLE
// ============================================================================
// The standard "household lens" switcher used across shared features
// (Vision Board, Abundance, Audio, Projects, Stories, Life Visions).
//
// Scope values:
//   'me'        -> only the current user's content
//   <userId>    -> a specific other member's shared content
//   'all'       -> combined view (labeled "Both" for couples, "Everyone" for 3+)

export type HouseholdScope = 'me' | 'all' | (string & {})

export interface HouseholdScopeMember {
  /** auth user id — used as the scope value when selected */
  userId: string
  /** First name (preferred) or display name shown on the segment */
  displayName: string
  avatarUrl?: string | null
  isSelf?: boolean
}

interface HouseholdScopeToggleProps {
  /** All active household members, including the current user */
  members: HouseholdScopeMember[]
  value: HouseholdScope
  onChange: (scope: HouseholdScope) => void
  /** Hide individual member segments and show only Me / Both (default false) */
  compact?: boolean
  className?: string
}

/**
 * Adaptive label for the combined segment: "Both" for a two-person household,
 * "Everyone" for three or more members.
 */
export function combinedScopeLabel(memberCount: number): string {
  return memberCount > 2 ? 'Everyone' : 'Both'
}

export function HouseholdScopeToggle({
  members,
  value,
  onChange,
  compact = false,
  className = '',
}: HouseholdScopeToggleProps) {
  const others = members.filter((m) => !m.isSelf)

  // A household lens only makes sense with at least one other member.
  if (others.length === 0) return null

  const options: { value: HouseholdScope; label: string; icon: React.ReactNode; avatarUrl?: string | null }[] = [
    { value: 'me', label: 'Me', icon: <User className="w-4 h-4" /> },
  ]

  if (!compact) {
    for (const member of others) {
      options.push({
        value: member.userId,
        label: member.displayName,
        icon: <User className="w-4 h-4" />,
        avatarUrl: member.avatarUrl,
      })
    }
  }

  options.push({
    value: 'all',
    label: combinedScopeLabel(members.length),
    icon: members.length > 2 ? <Home className="w-4 h-4" /> : <Users className="w-4 h-4" />,
  })

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-[#1F1F1F] rounded-full p-1',
        className
      )}
      role="tablist"
      aria-label="Household scope"
    >
      {options.map((option) => {
        const isActive = value === option.value
        const isCombined = option.value === 'all'
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300',
              isActive
                ? isCombined
                  ? 'bg-[#00FFFF] text-black'
                  : 'bg-[#39FF14] text-black'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            {option.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={option.avatarUrl}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              option.icon
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
