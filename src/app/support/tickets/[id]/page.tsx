// /src/app/support/tickets/[id]/page.tsx
// User's single ticket view

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  type BadgeProps,
  Container,
  Spinner,
  Stack,
  Textarea,
} from '@/lib/design-system/components'
import { ArrowLeft, Send } from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
}

interface Reply {
  id: string
  ticket_id: string
  admin_id: string | null
  reply: string
  is_internal: boolean
  created_at: string
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  async function fetchTicket() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')

      const data = await response.json()
      setTicket(data.ticket)
      setReplies(data.replies.filter((r: Reply) => !r.is_internal) || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
      alert('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendReply() {
    if (!replyText.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: replyText,
          is_internal: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to send reply')

      setReplyText('')
      await fetchTicket()
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getStatusVariant(status: string): BadgeProps['variant'] {
    switch (status) {
      case 'open': return 'accent'
      case 'in_progress': return 'warning'
      case 'waiting_reply': return 'secondary'
      case 'resolved': return 'primary'
      case 'closed': return 'neutral'
      default: return 'neutral'
    }
  }

  function getPriorityVariant(priority: string): BadgeProps['variant'] {
    switch (priority) {
      case 'urgent': return 'danger'
      case 'high': return 'warning'
      case 'low': return 'neutral'
      default: return 'neutral'
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="py-8">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!ticket) {
    return (
      <Container size="xl" className="py-8">
        <Card className="p-8 text-center">
          <p className="text-neutral-400 mb-4">Ticket not found</p>
          <Button variant="secondary" onClick={() => router.push('/support/tickets')}>
            Back to Tickets
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-8">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/support/tickets')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Button>
        </div>

        {/* Ticket Header Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Badge variant={getStatusVariant(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              {ticket.priority !== 'normal' && (
                <Badge variant={getPriorityVariant(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-neutral-500 pt-3 border-t border-[#333]">
            <span>Ticket: {ticket.ticket_number}</span>
            <span className="text-neutral-700">|</span>
            <div className="flex items-center gap-2">
              <span>Category:</span>
              <Badge variant="neutral">{ticket.category}</Badge>
            </div>
            <span className="text-neutral-700">|</span>
            <span>Submitted: {formatDate(ticket.created_at)}</span>
          </div>
        </Card>

        {/* Original Message */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Description</h2>
          <div className="bg-neutral-900 p-4 rounded-xl">
            <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </Card>

        {/* Replies */}
        {replies.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Conversation</h2>
            <Stack gap="md">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-neutral-900 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-primary-500">
                      {reply.admin_id ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-neutral-300 whitespace-pre-wrap">{reply.reply}</p>
                </div>
              ))}
            </Stack>
          </Card>
        )}

        {/* Reply Box */}
        {ticket.status !== 'closed' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary-500" />
              Add a Reply
            </h2>

            <div className="space-y-4">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
                className="w-full"
              />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Spinner size="sm" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {ticket.status === 'closed' && (
          <Card className="p-6 bg-neutral-900 border-neutral-700">
            <p className="text-neutral-400 text-center">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
