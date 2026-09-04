'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Spinner } from '@/lib/design-system/components'
import { Sparkles } from 'lucide-react'
import {
  VivaAssistantMessage,
  VivaThinkingIndicator,
  VivaUserMessage,
} from '@/components/viva/VivaChatMessage'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { CoachStreamError, readCoachStream } from '@/lib/viva/coach-stream'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { isIntakeReady } from '@/lib/activation/intake-markers'
import type { ActivationChatMessage } from '@/lib/activation/orchestrator'

export function ActivationIntakeChat({
  activationId,
  initialMessages,
  currentState,
  dreamWant,
  category,
  intakeReady,
  onFieldsChange,
  onCreate,
  creating,
  readOnly,
}: {
  activationId: string
  initialMessages: ActivationChatMessage[]
  currentState?: string | null
  dreamWant?: string | null
  category?: string | null
  intakeReady?: boolean
  onFieldsChange?: (next: {
    current_state?: string | null
    dream_want?: string | null
    category?: string | null
    intake_ready?: boolean
    conversation: ActivationChatMessage[]
  }) => void
  onCreate?: () => void
  creating?: boolean
  readOnly?: boolean
}) {
  const copy = ACTIVATION_COPY.chat
  const [messages, setMessages] = useState<ActivationChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const ready = intakeReady || isIntakeReady({
    current_state: currentState,
    dream_response: { want: dreamWant || '' },
    category,
  })

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function send(text?: string) {
    if (readOnly || streaming || creating) return
    const content = (text ?? draft).trim()
    if (!content) return

    const nextMessages: ActivationChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setStreaming(true)
    setThinking(true)

    try {
      let received = false
      const { parsed } = await readCoachStream({
        url: `/api/activation/${activationId}/chat`,
        body: { message: content },
        onUpdate: (update) => {
          if (!update.text) return
          if (update.text.trim()) {
            received = true
            setThinking(false)
          }
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && prev.length > nextMessages.length) {
              return [...prev.slice(0, -1), { role: 'assistant', content: update.text }]
            }
            return [...prev, { role: 'assistant', content: update.text }]
          })
        },
      })

      if (!parsed.text.trim() && !received) {
        throw new CoachStreamError("I didn't get a response back. Try sending that again.")
      }

      const res = await fetch(`/api/activation/${activationId}`)
      if (res.ok) {
        const data = await res.json()
        const row = data.activation
        onFieldsChange?.({
          current_state: row.current_state,
          dream_want: row.dream_response?.want || null,
          category: row.category,
          intake_ready: !!row.intake_ready_at || isIntakeReady(row),
          conversation: Array.isArray(row.conversation) ? row.conversation : nextMessages,
        })
        if (Array.isArray(row.conversation) && row.conversation.length) {
          setMessages(row.conversation)
        }
      }
    } catch (err) {
      const fallback =
        err instanceof CoachStreamError
          ? err.message
          : "I'm having trouble connecting right now. Let's try again in a moment."
      setError(fallback)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && !last.content.trim()) return prev.slice(0, -1)
        return prev
      })
    } finally {
      setStreaming(false)
      setThinking(false)
    }
  }

  const categoryLabel = category
    ? getVisionCategoryLabel(category as VisionCategoryKey)
    : null

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      <div className="flex-1 space-y-8 pb-6">
        {messages.map((message, i) => (
          <div key={`${message.role}-${i}`}>
            {message.role === 'user' ? (
              <VivaUserMessage copyText={message.content}>{message.content}</VivaUserMessage>
            ) : (
              <VivaAssistantMessage markdown={message.content} copyText={message.content} />
            )}
          </div>
        ))}
        {thinking && <VivaThinkingIndicator />}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-neutral-850/95 backdrop-blur-sm border-t border-[#1A1A1A] -mx-4 px-4 py-4 md:-mx-0 md:px-0">
        <p className="text-[11px] uppercase tracking-wider text-neutral-600 mb-2">{copy.readinessTitle}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categoryLabel && (
            <ReadinessPill label={categoryLabel} filled />
          )}
          <ReadinessPill label={copy.readinessCurrent} filled={!!currentState?.trim()} />
          <ReadinessPill label={copy.readinessDesire} filled={!!dreamWant?.trim()} />
        </div>

        {ready && onCreate && (
          <div className="mb-4">
            <p className="text-sm text-neutral-400 mb-3">{copy.readyLine}</p>
            <Button variant="primary" size="sm" onClick={onCreate} disabled={creating || streaming}>
              {creating ? (
                <>
                  <Spinner variant="primary" size="sm" className="mr-2" />
                  {copy.creating}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {copy.create}
                </>
              )}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {!readOnly && (
          <VivaChatInput
            value={draft}
            onChange={setDraft}
            onSend={(_attachments, text) => send(text)}
            disabled={streaming || !!creating}
            placeholder={copy.placeholder}
            canSend={!!draft.trim() && !streaming && !creating}
          />
        )}
      </div>
    </div>
  )
}

function ReadinessPill({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs border ${
        filled
          ? 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]'
          : 'border-[#222] bg-[#0D0D0D] text-neutral-500'
      }`}
    >
      {label}
    </span>
  )
}
