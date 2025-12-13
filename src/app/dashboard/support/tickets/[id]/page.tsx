// /src/app/dashboard/support/tickets/[id]/page.tsx
// User's single ticket view

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  Textarea,
} from '@/lib/design-system/components'
import { ArrowLeft, Send, Calendar, Hash } from 'lucide-react'

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

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-[#8B5CF6]'
      case 'in_progress':
        return 'bg-[#FFB701]'
      case 'waiting_reply':
        return 'bg-secondary-500'
      case 'resolved':
        return 'bg-primary-500'
      case 'closed':
        return 'bg-[#666666]'
      default:
        return 'bg-neutral-600'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'bg-[#D03739]'
      case 'high':
        return 'bg-[#FFB701]'
      case 'normal':
        return 'bg-secondary-500'
      case 'low':
        return 'bg-[#666666]'
      default:
        return 'bg-neutral-600'
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
          <Button variant="secondary" onClick={() => router.push('/dashboard/support')}>
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
            onClick={() => router.push('/dashboard/support')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Button>
        </div>

        {/* Ticket Header Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Hash className="w-4 h-4" />
                <span>{ticket.ticket_number}</span>
                <span>•</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-3 mb-4">
            <Badge className={`${getStatusColor(ticket.status)} text-white px-3 py-1.5`}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge className={`${getPriorityColor(ticket.priority)} text-white px-3 py-1.5`}>
              {ticket.priority} priority
            </Badge>
            <Badge className="bg-[#1F1F1F] text-neutral-400 px-3 py-1.5">
              {ticket.category}
            </Badge>
          </div>
        </Card>

        {/* Original Message */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Your Request</h2>
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

