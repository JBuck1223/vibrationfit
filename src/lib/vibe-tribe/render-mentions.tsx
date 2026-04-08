'use client'

import React from 'react'
import Link from 'next/link'

export interface MentionedUser {
  id: string
  full_name: string
}

/**
 * Renders text content with @mentions as clickable green links.
 * `mentionedUsers` maps display names to user IDs so links point to /snapshot/{id}.
 */
export function renderContentWithMentions(
  content: string,
  mentionedUsers: MentionedUser[]
): React.ReactNode {
  if (!mentionedUsers || mentionedUsers.length === 0) {
    return content
  }

  const sorted = [...mentionedUsers].sort((a, b) => b.full_name.length - a.full_name.length)
  const escaped = sorted.map(u => u.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`@(${escaped.join('|')})`, 'gi')

  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let prevIndex = -1

  while ((match = regex.exec(content)) !== null) {
    if (match.index === prevIndex) break
    prevIndex = match.index

    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const mentionedName = match[1]
    const user = sorted.find(
      u => u.full_name.toLowerCase() === mentionedName.toLowerCase()
    )

    if (user) {
      parts.push(
        <Link
          key={`${match.index}-${user.id}`}
          href={`/snapshot/${user.id}`}
          className="text-[#39FF14] font-medium hover:underline"
        >
          @{mentionedName}
        </Link>
      )
    } else {
      parts.push(
        <span key={match.index} className="text-[#39FF14] font-medium">
          @{mentionedName}
        </span>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : content
}
