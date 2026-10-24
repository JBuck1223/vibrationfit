'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { VivaMarkdown } from './VivaMarkdown'
import { MessageCopyButton } from './MessageCopyButton'
import { useInShell } from '@/lib/app-shell/shell-context'

/**
 * Canonical VIVA chat chrome. Every conversation surface must use these
 * primitives — do not invent a local bubble, avatar, or thinking style.
 *
 * User = VIVA purple (accent). Never Electric Lime / primary / green-line green.
 * Assistant = markdown in the open, no bubble.
 */
// Translucent on purpose (the picture shows through), but tinted and blurred
// enough that the words read over a bright photo.
export const VIVA_USER_BUBBLE_CLASS =
  'min-w-0 max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl rounded-br-md border border-accent-500/35 bg-gradient-to-br from-accent-500/35 to-accent-500/[0.18] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-[0_0_18px_rgba(191,0,255,0.14)] backdrop-blur-md'

/** A faint scrim under VIVA's own words in the shell: no bubble, just enough veil to read over a picture. */
const VIVA_ASSISTANT_SCRIM_CLASS = 'rounded-2xl bg-[rgba(10,8,16,0.28)] px-4 py-3 backdrop-blur-sm'

const THINKING_DOT_CLASS = 'h-1.5 w-1.5 rounded-full bg-accent-500'

export function VivaUserMessage({
  children,
  copyText,
  hideCopy = false,
  className,
}: {
  children: ReactNode
  copyText?: string
  hideCopy?: boolean
  className?: string
}) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className={cn(VIVA_USER_BUBBLE_CLASS, className)}>{children}</div>
      {!hideCopy && copyText?.trim() ? (
        <MessageCopyButton text={copyText} align="right" />
      ) : null}
    </div>
  )
}

export function VivaAssistantMessage({
  children,
  markdown,
  copyText,
  hideCopy = false,
  actions,
}: {
  children?: ReactNode
  markdown?: string
  copyText?: string
  hideCopy?: boolean
  /** Extra controls beside Copy (e.g. Save as Story / Journal). */
  actions?: ReactNode
}) {
  const inShell = useInShell()
  return (
    <div className="space-y-2">
      <div className={cn(inShell && VIVA_ASSISTANT_SCRIM_CLASS)}>
        {markdown != null ? <VivaMarkdown>{markdown}</VivaMarkdown> : children}
      </div>
      {!hideCopy && copyText?.trim() ? (
        <div className="flex items-center gap-1">
          <MessageCopyButton text={copyText} />
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function VivaThinkingIndicator({
  label = 'Here with you',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-white/60', className)}>
      <span className="inline-flex gap-1">
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:0ms]')} />
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:150ms]')} />
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:300ms]')} />
      </span>
      {label || null}
    </span>
  )
}
