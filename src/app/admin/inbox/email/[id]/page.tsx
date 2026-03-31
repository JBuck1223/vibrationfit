'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, User, Send, RefreshCw } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { ConversationThread } from '@/components/crm/ConversationThread'
import { useConversationRealtime } from '@/hooks/useConversationRealtime'
import ComposeEmail from '@/components/admin/inbox/ComposeEmail'
import ComposeSMS from '@/components/admin/inbox/ComposeSMS'

interface Contact {
  name: string | null
  email: string | null
  phone: string | null
  userId: string | null
  leadId: string | null
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [conversation, setConversation] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showReply, setShowReply] = useState<'email' | 'sms' | null>(null)

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inbox/${id}?channel=email`)
      if (res.ok) {
        const data = await res.json()
        setContact(data.contact)
        setConversation(data.conversation || [])
      }
    } catch { /* non-critical */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  useConversationRealtime({
    onUpdate: fetchDetail,
    userId: contact?.userId,
    email: contact?.email,
    enabled: !!contact,
  })

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A] min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222]">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500 shrink-0" />
            <h2 className="text-sm font-semibold text-neutral-200 truncate">
              {contact?.name || contact?.email || 'Unknown Contact'}
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {contact?.email && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {contact.email}
              </span>
            )}
            {contact?.phone && (
              <span className="text-xs text-neutral-500">
                {contact.phone}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={fetchDetail}
          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1A1A1A]">
        <span className="text-xs text-neutral-500">
          {conversation.length} message{conversation.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-neutral-600">
          {conversation.filter(m => m.direction === 'inbound').length} received
        </span>
        <span className="text-xs text-neutral-600">
          {conversation.filter(m => m.direction === 'outbound').length} sent
        </span>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <ConversationThread messages={conversation} loading={loading} />
      </div>

      {/* Reply Bar */}
      <div className="border-t border-[#222] bg-[#0D0D0D]">
        {showReply ? (
          <div className="max-h-[400px] overflow-y-auto">
            {showReply === 'email' ? (
              <ComposeEmail
                defaultTo={contact?.email || ''}
                replyContext={{ userId: contact?.userId || undefined }}
                onSend={() => {
                  setShowReply(null)
                  fetchDetail()
                  window.dispatchEvent(new CustomEvent('inbox:counts-changed'))
                }}
                onClose={() => setShowReply(null)}
              />
            ) : (
              <ComposeSMS
                defaultTo={contact?.phone || ''}
                replyContext={{
                  userId: contact?.userId || undefined,
                  leadId: contact?.leadId || undefined,
                }}
                onSend={() => {
                  setShowReply(null)
                  fetchDetail()
                  window.dispatchEvent(new CustomEvent('inbox:counts-changed'))
                }}
                onClose={() => setShowReply(null)}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3">
            {contact?.email && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReply('email')}
                className="!text-xs"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Reply via Email
              </Button>
            )}
            {contact?.phone && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReply('sms')}
                className="!text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Reply via SMS
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
