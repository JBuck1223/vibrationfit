'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { VivaMarkdown } from './VivaMarkdown'
import { MessageCopyButton } from './MessageCopyButton'

/**
 * Canonical VIVA chat chrome. Every conversation surface must use these
 * primitives — do not invent a local bubble, avatar, or thinking style.
 *
 * User = VIVA purple (accent). Never Electric Lime / primary / green-line green.
 * Assistant = markdown in the open, no bubble.
 */
export const VIVA_USER_BUBBLE_CLASS =
  'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-accent-500/30 bg-gradient-to-br from-accent-500/20 to-accent-500/[0.05] px-4 py-2.5 text-[15px] leading-relaxed text-neutral-100 shadow-[0_0_18px_rgba(191,0,255,0.14)]'

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
}: {
  children?: ReactNode
  markdown?: string
  copyText?: string
  hideCopy?: boolean
}) {
  return (
    <div className="space-y-2">
      {markdown != null ? <VivaMarkdown>{markdown}</VivaMarkdown> : children}
      {!hideCopy && copyText?.trim() ? (
        <MessageCopyButton text={copyText} />
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
    <span className={cn('inline-flex items-center gap-2 text-sm text-neutral-500', className)}>
      <span className="inline-flex gap-1">
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:0ms]')} />
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:150ms]')} />
        <span className={cn(THINKING_DOT_CLASS, 'animate-bounce [animation-delay:300ms]')} />
      </span>
      {label || null}
    </span>
  )
}
