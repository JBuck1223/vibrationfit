'use client'

import React from 'react'
import Link from 'next/link'

export interface MentionedUser {
  id: string
  full_name: string
}

/** Matches http(s) and www. URLs. */
const URL_IN_TEXT = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

/**
 * Strips delimiters that often get glued onto URLs in prose, e.g. (url) or url.
 */
function cleanUrlMatch(raw: string): string {
  let t = raw.trim()
  while (t.length) {
    const c = t[t.length - 1]
    if (',.;:!?]'.includes(c)) {
      t = t.slice(0, -1)
      continue
    }
    if (c === ')') {
      const open = (t.match(/\(/g) || []).length
      const close = (t.match(/\)/g) || []).length
      if (close > open) {
        t = t.slice(0, -1)
        continue
      }
    }
    break
  }
  return t
}

function hrefForDisplayUrl(display: string): string {
  if (display.startsWith('http://') || display.startsWith('https://')) {
    return display
  }
  if (display.startsWith('www.')) {
    return `https://${display}`
  }
  return display
}

function isVibrationfitHost(href: string): boolean {
  try {
    const { hostname } = new URL(href)
    return hostname === 'vibrationfit.com' || hostname === 'www.vibrationfit.com'
  } catch {
    return false
  }
}

const LINK_CLASS =
  'text-[#00FFFF] font-medium break-all [overflow-wrap:anywhere] underline underline-offset-2 hover:opacity-90'

/**
 * Renders a single segment with @mentions as green links to /snapshot/{id}.
 */
function renderMentionParts(
  content: string,
  mentionedUsers: MentionedUser[]
): React.ReactNode {
  if (!mentionedUsers || mentionedUsers.length === 0) {
    return content
  }

  const sorted = [...mentionedUsers].sort((a, b) => b.full_name.length - a.full_name.length)
  const escaped = sorted.map((u) => u.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
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
    const user = sorted.find((u) => u.full_name.toLowerCase() === mentionedName.toLowerCase())

    if (user) {
      parts.push(
        <Link
          key={`${match.index}-${user.id}`}
          href={`/snapshot/${user.id}`}
          className="text-[#39FF14] font-medium break-words hover:underline"
        >
          @{mentionedName}
        </Link>
      )
    } else {
      parts.push(
        <span key={match.index} className="text-[#39FF14] font-medium break-words">
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

/**
 * Renders post/comment text with:
 * - Auto-linked http(s) and www. URLs (external: new tab + noopener; same site: VibrationFit in-app)
 * - @mentions as profile links
 * - Long strings wrapped (break-all) so the feed does not cause horizontal scroll on small screens
 */
export function renderContentWithMentions(
  content: string,
  mentionedUsers: MentionedUser[]
): React.ReactNode {
  if (!content) {
    return null
  }

  const nodes: React.ReactNode[] = []
  const re = new RegExp(URL_IN_TEXT.source, 'gi')
  let last = 0
  let m: RegExpExecArray | null
  let seg = 0

  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      nodes.push(
        <span key={`t-${seg++}`} className="break-words [overflow-wrap:anywhere]">
          {renderMentionParts(content.slice(last, m.index), mentionedUsers)}
        </span>
      )
    }

    const full = m[0]
    const cleaned = cleanUrlMatch(full)
    if (cleaned.length === 0) {
      last = m.index + full.length
      continue
    }
    const href = hrefForDisplayUrl(cleaned)
    if (isVibrationfitHost(href)) {
      const path = (() => {
        try {
          const u = new URL(href)
          return u.pathname + u.search + u.hash
        } catch {
          return cleaned
        }
      })()
      nodes.push(
        <span key={`u-${seg++}`} className="inline-block max-w-full align-baseline break-all [overflow-wrap:anywhere]">
          <Link href={path} className={LINK_CLASS}>
            {cleaned}
          </Link>
        </span>
      )
    } else {
      nodes.push(
        <a
          key={`a-${seg++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${LINK_CLASS} inline-block max-w-full align-baseline`}
        >
          {cleaned}
        </a>
      )
    }

    last = m.index + full.length
  }

  if (last < content.length) {
    nodes.push(
      <span key={`t-${seg++}`} className="break-words [overflow-wrap:anywhere]">
        {renderMentionParts(content.slice(last), mentionedUsers)}
      </span>
    )
  }

  if (nodes.length === 0) {
    return <span className="break-words [overflow-wrap:anywhere]">{renderMentionParts(content, mentionedUsers)}</span>
  }

  return <span className="min-w-0 break-words [overflow-wrap:anywhere]">{nodes}</span>
}
