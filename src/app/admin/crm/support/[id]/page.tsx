// /src/app/admin/crm/support/[id]/page.tsx
// Support ticket detail page for admins

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
  Select,
} from '@/lib/design-system/components'
import { ArrowLeft, Send, Mail, MessageSquare, User, Calendar, Hash, RefreshCw } from 'lucide-react'
import { ConversationThread } from '@/components/crm/ConversationThread'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  user_id: string | null
  guest_email: string | null
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
  admin?: {
    email: string
  }
}

export default function SupportTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [conversation, setConversation] = useState<any[]>([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      fetchReplies()
      fetchConversation()
    }
  }, [ticketId])

  async function fetchTicket() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')

      const data = await response.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      alert('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  async function fetchReplies() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`)
      if (!response.ok) throw new Error('Failed to fetch replies')

      const data = await response.json()
      setReplies(data.replies || [])
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  async function fetchConversation() {
    setLoadingConversation(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/conversation`)
      if (!response.ok) throw new Error('Failed to fetch conversation')

      const data = await response.json()
      setConversation(data.conversation || [])
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoadingConversation(false)
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
          is_internal: isInternal,
        }),
      })

      if (!response.ok) throw new Error('Failed to send reply')

      setReplyText('')
      setIsInternal(false)
      await fetchReplies()
      await fetchConversation() // Refresh conversation
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      setTicket({ ...ticket, status: newStatus })
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleUpdatePriority(newPriority: string) {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) throw new Error('Failed to update priority')

      setTicket({ ...ticket, priority: newPriority })
    } catch (error) {
      console.error('Error updating priority:', error)
      alert('Failed to update priority')
    } finally {
      setUpdating(false)
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
          <Button variant="secondary" onClick={() => router.push('/admin/crm/support/board')}>
            Back to Support Board
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
            onClick={() => router.push('/admin/crm/support/board')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Board
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

          {/* Status and Priority Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
              <Select
                value={ticket.status}
                onChange={handleUpdateStatus}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'waiting_reply', label: 'Waiting Reply' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Priority</label>
              <Select
                value={ticket.priority}
                onChange={handleUpdatePriority}
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ]}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
              <Badge className={`${getStatusColor(ticket.status)} text-white px-3 py-1.5`}>
                {ticket.category}
              </Badge>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-neutral-700 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-400">Customer:</span>
              <span className="text-white font-medium">
                {ticket.guest_email || ticket.user_id || 'Unknown'}
              </span>
            </div>
          </div>
        </Card>

        {/* Original Message */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Original Request
          </h2>
          <div className="bg-neutral-900 p-4 rounded-xl">
            <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </Card>

        {/* Conversation Thread (Email + SMS + Replies) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Conversation ({conversation.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConversation}
              disabled={loadingConversation}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConversation ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <ConversationThread 
            messages={conversation} 
            loading={loadingConversation}
          />
        </Card>

        {/* Reply Box */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-500" />
            Add Reply
          </h2>

          <div className="space-y-4">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={6}
              className="w-full"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 text-primary-500 focus:ring-primary-500"
                />
                Internal note (not visible to customer)
              </label>

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
      </Stack>
    </Container>
  )
}

