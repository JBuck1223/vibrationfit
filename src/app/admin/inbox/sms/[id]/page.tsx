'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare, User, Send, RefreshCw } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { ConversationThread } from '@/components/crm/ConversationThread'
import { useConversationRealtime } from '@/hooks/useConversationRealtime'
import ComposeSMS from '@/components/admin/inbox/ComposeSMS'

interface Contact {
  name: string | null
  email: string | null
  phone: string | null
  userId: string | null
  leadId: string | null
}

export default function SMSDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [conversation, setConversation] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showReply, setShowReply] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inbox/${id}?channel=sms`)
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

        <MessageSquare className="w-4 h-4 text-[#BF00FF] shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500 shrink-0" />
            <h2 className="text-sm font-semibold text-neutral-200 truncate">
              {contact?.name || contact?.phone || 'Unknown Contact'}
            </h2>
          </div>
          {contact?.phone && (
            <span className="text-xs text-neutral-500 mt-0.5 block truncate">
              {contact.phone}
            </span>
          )}
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
        <span className="text-xs text-[#BF00FF]/70 font-medium">SMS Thread</span>
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

      {/* SMS Thread (newest first -- already sorted by API) */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <ConversationThread messages={conversation} loading={loading} />
      </div>

      {/* Reply Bar */}
      <div className="border-t border-[#222] bg-[#0D0D0D]">
        {showReply ? (
          <div className="max-h-[400px] overflow-y-auto">
            <ComposeSMS
              defaultTo={contact?.phone || ''}
              replyContext={{
                userId: contact?.userId || undefined,
                leadId: contact?.leadId || undefined,
              }}
              onSend={() => {
                setShowReply(false)
                fetchDetail()
                window.dispatchEvent(new CustomEvent('inbox:counts-changed'))
              }}
              onClose={() => setShowReply(false)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3">
            {contact?.phone && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReply(true)}
                className="!text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Reply
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
