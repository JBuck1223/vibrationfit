'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Spinner } from '@/lib/design-system/components'
import { BarChart3, Loader2, MessageCircle, Sparkles } from 'lucide-react'
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
import type { ActivationChatMessage, ActivationSeedNote } from '@/lib/activation/orchestrator'
import { ActivationProgressBoard } from '@/components/activation/ActivationProgressBoard'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [scrollbar-color:#2c2c2c_transparent] ' +
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:bg-[#2c2c2c] [&::-webkit-scrollbar-thumb]:rounded-full'

export function ActivationIntakeChat({
  activationId,
  initialMessages,
  currentState,
  dreamResponse,
  category,
  seeds,
  intakeReady,
  onFieldsChange,
  onCreate,
  creating,
  readOnly,
}: {
  activationId: string
  initialMessages: ActivationChatMessage[]
  currentState?: string | null
  dreamResponse?: Record<string, string> | null
  category?: string | null
  seeds?: ActivationSeedNote[] | null
  intakeReady?: boolean
  onFieldsChange?: (next: {
    current_state?: string | null
    dream_response?: Record<string, string> | null
    category?: string | null
    seeds?: ActivationSeedNote[]
    intake_ready?: boolean
    conversation: ActivationChatMessage[]
  }) => void
  onCreate?: () => void
  creating?: boolean
  readOnly?: boolean
}) {
  const copy = ACTIVATION_COPY.chat
  const progressCopy = ACTIVATION_COPY.progress
  const [messages, setMessages] = useState<ActivationChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobilePane, setMobilePane] = useState<'chat' | 'progress'>('chat')
  const endRef = useRef<HTMLDivElement>(null)

  const ready = intakeReady || isIntakeReady({
    current_state: currentState,
    dream_response: dreamResponse,
    category,
    conversation: messages,
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
        const conversation = Array.isArray(row.conversation) ? row.conversation : nextMessages
        onFieldsChange?.({
          current_state: row.current_state,
          dream_response: row.dream_response || null,
          category: row.category,
          seeds: Array.isArray(row.seeds) ? row.seeds : [],
          intake_ready: !!row.intake_ready_at || isIntakeReady(row),
          conversation,
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

  const statusLine = streaming
    ? copy.statusListening
    : ready
      ? copy.statusReady
      : categoryLabel
        ? copy.statusBuilding(categoryLabel)
        : copy.statusListening

  const chatPane = (
    <div className="h-full rounded-3xl bg-gradient-to-b from-[#BF00FF]/50 via-[#2a2a2a] to-[#00FFFF]/30 p-px">
      <div className="flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0D0D0D]">
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#BF00FF] to-[#00FFFF] shadow-[0_0_18px_rgba(191,0,255,0.35)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D0D0D] bg-[#39FF14]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight text-white">VIVA</div>
            <div className="text-[11px] leading-tight text-neutral-500">{statusLine}</div>
          </div>
          {streaming && <Loader2 className="h-4 w-4 animate-spin text-[#BF00FF]" />}
        </div>

        <div className={`flex-1 space-y-6 overflow-y-auto px-4 py-5 ${THIN_SCROLLBAR}`}>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/5 bg-white/[0.02] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {ready && onCreate && (
            <div className="mb-3 rounded-2xl border border-[#39FF14]/30 bg-[#39FF14]/[0.05] px-4 py-3">
              <p className="mb-3 text-sm text-neutral-300">{copy.readyLine}</p>
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
    </div>
  )

  const progressPane = (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#262626] bg-[#0D0D0D]">
      <div className="border-b border-white/5 bg-white/[0.03] px-5 py-3.5">
        <div className="text-sm font-semibold text-white">{progressCopy.paneTitle}</div>
        <div className="text-xs text-neutral-500">{progressCopy.paneSubtitle}</div>
      </div>
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${THIN_SCROLLBAR}`}>
        <ActivationProgressBoard
          input={{
            category,
            current_state: currentState,
            dream_response: dreamResponse,
            conversation: messages,
            seeds,
          }}
        />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-3 md:px-6 md:py-5">
        <div className="flex gap-1 rounded-xl border border-[#262626] bg-[#0D0D0D] p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePane('chat')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors ${
              mobilePane === 'chat' ? 'bg-[#333] text-white' : 'text-neutral-400'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            {copy.mobileChat}
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('progress')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors ${
              mobilePane === 'progress' ? 'bg-[#333] text-white' : 'text-neutral-400'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {copy.mobileProgress}
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[2fr_3fr]">
          <div className={`min-h-0 ${mobilePane === 'chat' ? '' : 'hidden lg:block'}`}>{chatPane}</div>
          <div className={`min-h-0 ${mobilePane === 'progress' ? '' : 'hidden lg:block'}`}>{progressPane}</div>
        </div>
      </div>
    </div>
  )
}
