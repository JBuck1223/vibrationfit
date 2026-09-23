'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Container, Select, Stack, Textarea } from '@/lib/design-system/components'
import { useAdminStudioChrome } from '@/components/admin-studio'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { VivaAssistantMessage, VivaThinkingIndicator, VivaUserMessage } from '@/components/viva/VivaChatMessage'
import { CoachStreamError, readCoachStream } from '@/lib/viva/coach-stream'
import {
  ADMIN_SOCIAL_REPLY_MODE,
  SOCIAL_REPLY_LENGTH_LABELS,
  SOCIAL_REPLY_LENGTHS,
  SOCIAL_REPLY_PLATFORM_LABELS,
  SOCIAL_REPLY_PLATFORMS,
  SOCIAL_REPLY_VOICE_LABELS,
  SOCIAL_REPLY_VOICES,
  buildSocialReplyUserMessage,
  extractSocialReplyDraft,
  stripSocialReplyMarkers,
  parseSocialReplyIntakeJson,
  type SocialReplyIntake,
  type SocialReplyLength,
  type SocialReplyPlatform,
  type SocialReplyVoice,
} from '@/lib/viva/prompts/social-reply-prompts'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Thread = {
  id: string
  title: string | null
  preview_message: string | null
  last_message_at: string | null
  updated_at: string
  cached_system_prompt: string | null
}

const emptyIntake: SocialReplyIntake = {
  incomingMessage: '',
  platform: 'instagram_dm',
  length: 'medium',
  voice: 'vanessa_jordan',
  notes: '',
}

function formatWhen(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function SocialVivaPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [intake, setIntake] = useState<SocialReplyIntake>(emptyIntake)
  const [composer, setComposer] = useState('')
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [streaming, setStreaming] = useState(false)

  useAdminStudioChrome({
    title: 'Social VIVA',
    icon: MessageCircle,
    contextText: 'Draft replies to other people without using your personal VIVA.',
  })

  const latestDraft = useMemo(() => {
    const last = [...messages].reverse().find(message => message.role === 'assistant' && message.content.trim())
    return last ? extractSocialReplyDraft(last.content) : ''
  }, [messages])

  const loadThreads = useCallback(async () => {
    const res = await fetch(`/api/viva/conversations?mode=${ADMIN_SOCIAL_REPLY_MODE}`)
    if (!res.ok) {
      toast.error('Could not load Social VIVA threads')
      setLoadingThreads(false)
      return
    }
    const data = await res.json()
    setThreads(data.sessions || [])
    setLoadingThreads(false)
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  const applyThread = useCallback(async (id: string) => {
    setThreadId(id)
    setLoadingMessages(true)
    setComposer('')
    try {
      const thread = threads.find(item => item.id === id)
      const restored = parseSocialReplyIntakeJson(thread?.cached_system_prompt)
      if (restored) setIntake({ ...restored, notes: restored.notes || '' })

      const res = await fetch(`/api/viva/conversations/${id}/messages`)
      if (!res.ok) throw new Error('Failed to load thread')
      const data = await res.json()
      const next: ChatMessage[] = (data.messages || []).map((row: { id: string; role: string; message: string }) => ({
        id: row.id,
        role: row.role === 'assistant' ? 'assistant' : 'user',
        content: row.message,
      }))
      setMessages(next)
    } catch (error) {
      console.error(error)
      toast.error('Could not open that thread')
    } finally {
      setLoadingMessages(false)
    }
  }, [threads])

  const startNew = useCallback(() => {
    setThreadId(null)
    setMessages([])
    setComposer('')
    setIntake(emptyIntake)
  }, [])

  const send = useCallback(async (instruction?: string) => {
    const incoming = intake.incomingMessage.trim()
    if (!incoming) {
      toast.error("Paste the person's question first")
      return
    }
    const note = (instruction ?? composer).trim()
    if (threadId && !note) return

    const userText = threadId ? note : buildSocialReplyUserMessage(intake, note || null)

    const optimisticUser: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: userText,
    }
    const assistantId = `local-assistant-${Date.now()}`
    setMessages(current => [...current, optimisticUser, { id: assistantId, role: 'assistant', content: '' }])
    setComposer('')
    setStreaming(true)

    try {
      await readCoachStream({
        url: '/api/admin/viva/social-reply',
        body: {
          conversationId: threadId || undefined,
          incomingMessage: incoming,
          platform: intake.platform,
          length: intake.length,
          voice: intake.voice,
          notes: intake.notes || undefined,
          instruction: note || undefined,
        },
        onHeaders: ({ conversationId }) => {
          if (conversationId && conversationId !== threadId) {
            setThreadId(conversationId)
          }
        },
        onUpdate: parsed => {
          if (!parsed.ready) return
          setMessages(current =>
            current.map(message =>
              message.id === assistantId ? { ...message, content: parsed.text } : message,
            ),
          )
        },
      })
      await loadThreads()
    } catch (error) {
      const message = error instanceof CoachStreamError
        ? error.message
        : 'VIVA could not draft that reply'
      toast.error(message)
      setMessages(current => current.filter(item => item.id !== assistantId && item.id !== optimisticUser.id))
    } finally {
      setStreaming(false)
    }
  }, [composer, intake, loadThreads, threadId])

  const deleteThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/viva/conversations?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Could not delete that thread')
      return
    }
    if (threadId === id) startNew()
    await loadThreads()
  }, [loadThreads, startNew, threadId])

  const copyDraft = useCallback(async () => {
    if (!latestDraft) return
    try {
      await navigator.clipboard.writeText(latestDraft)
      toast.success('Reply copied')
    } catch {
      toast.error('Could not copy that reply')
    }
  }, [latestDraft])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          <Card className="p-5 h-fit">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white">Threads</h2>
              <Button size="sm" variant="outline" onClick={startNew} disabled={streaming}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
            {loadingThreads ? (
              <p className="text-sm text-neutral-500">Loading threads…</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-neutral-500">No social drafts yet. Paste a question to start.</p>
            ) : (
              <ul className="space-y-2">
                {threads.map(thread => {
                  const active = thread.id === threadId
                  return (
                    <li key={thread.id}>
                      <div
                        className={`rounded-xl border px-3 py-2.5 ${
                          active ? 'border-accent-500/40 bg-accent-500/10' : 'border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          disabled={streaming}
                          onClick={() => void applyThread(thread.id)}
                        >
                          <p className="text-sm text-white line-clamp-2">{thread.title || thread.preview_message || 'Untitled'}</p>
                          <p className="text-[11px] text-neutral-500 mt-1">{formatWhen(thread.last_message_at || thread.updated_at)}</p>
                        </button>
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-red-400"
                          disabled={streaming}
                          onClick={() => void deleteThread(thread.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Stack gap="md">
            <Card className="p-6">
              <Stack gap="md">
                <div>
                  <h2 className="text-lg font-semibold text-white">Their question</h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    VIVA answers their situation — not yours. Nothing from your personal VIVA is used here.
                  </p>
                </div>
                <Textarea
                  label="What they wrote"
                  value={intake.incomingMessage}
                  onChange={event => setIntake(current => ({ ...current, incomingMessage: event.target.value }))}
                  placeholder="Paste the comment, DM, or email…"
                  rows={6}
                  disabled={streaming}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    label="Channel"
                    value={intake.platform}
                    onChange={value => setIntake(current => ({ ...current, platform: value as SocialReplyPlatform }))}
                    options={SOCIAL_REPLY_PLATFORMS.map(value => ({
                      value,
                      label: SOCIAL_REPLY_PLATFORM_LABELS[value],
                    }))}
                    disabled={streaming}
                  />
                  <Select
                    label="Length"
                    value={intake.length}
                    onChange={value => setIntake(current => ({ ...current, length: value as SocialReplyLength }))}
                    options={SOCIAL_REPLY_LENGTHS.map(value => ({
                      value,
                      label: SOCIAL_REPLY_LENGTH_LABELS[value],
                    }))}
                    disabled={streaming}
                  />
                  <Select
                    label="Voice"
                    value={intake.voice}
                    onChange={value => setIntake(current => ({ ...current, voice: value as SocialReplyVoice }))}
                    options={SOCIAL_REPLY_VOICES.map(value => ({
                      value,
                      label: SOCIAL_REPLY_VOICE_LABELS[value],
                    }))}
                    disabled={streaming}
                  />
                </div>
                <Textarea
                  label="What we know (optional)"
                  value={intake.notes || ''}
                  onChange={event => setIntake(current => ({ ...current, notes: event.target.value }))}
                  placeholder="Who they are, which post this is on, anything they already told us…"
                  rows={3}
                  disabled={streaming}
                />
                <div>
                  <Button
                    variant={threadId ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => void send(threadId ? 'Rewrite the copy-paste reply using the current channel, length, voice, and notes.' : undefined)}
                    disabled={streaming || !intake.incomingMessage.trim()}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {threadId ? 'Redraw with these settings' : 'Draft with VIVA'}
                  </Button>
                </div>
              </Stack>
            </Card>

            {(messages.length > 0 || loadingMessages) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Work the draft</h2>
                {loadingMessages ? (
                  <p className="text-sm text-neutral-500">Loading this thread…</p>
                ) : (
                  <div className="space-y-5">
                    {messages.map(message =>
                      message.role === 'user' ? (
                        <VivaUserMessage key={message.id} copyText={message.content}>
                          {message.content}
                        </VivaUserMessage>
                      ) : message.content.trim() ? (
                        <VivaAssistantMessage
                          key={message.id}
                          markdown={stripSocialReplyMarkers(message.content)}
                          copyText={extractSocialReplyDraft(message.content)}
                        />
                      ) : (
                        <VivaThinkingIndicator key={message.id} label="Drafting the reply" />
                      ),
                    )}
                  </div>
                )}
                <div className="mt-6">
                  <VivaChatInput
                    value={composer}
                    onChange={setComposer}
                    onSend={() => void send()}
                    disabled={streaming || !threadId}
                    canSend={Boolean(threadId) && Boolean(composer.trim()) && !streaming}
                    placeholder={threadId ? 'Shorter, warmer, no pitch, more Green Line…' : 'Draft a reply first'}
                  />
                </div>
              </Card>
            )}
          </Stack>

          <Card className="p-5 h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Copy-paste reply</h2>
              <Button size="sm" variant="outline" onClick={() => void copyDraft()} disabled={!latestDraft}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            {latestDraft ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">{latestDraft}</p>
            ) : (
              <p className="text-sm text-neutral-500">
                VIVA will put the postable reply here. Chat stays for notes and revisions.
              </p>
            )}
          </Card>
        </div>
      </Stack>
    </Container>
  )
}
