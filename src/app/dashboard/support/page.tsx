// /src/app/dashboard/support/page.tsx
// User's support tickets list

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Badge, type BadgeProps, Button, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { Plus, MessageSquare } from 'lucide-react'

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

export default function MyTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    try {
      const response = await fetch('/api/support/tickets')
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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

  return (
    <Container size="xl" className="py-8">
      <Stack gap="lg">
        <PageHero
          title="My Support Tickets"
        >
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/support')}
              className="flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Ticket</span>
            </Button>
          </div>
        </PageHero>

        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h3>
            <p className="text-neutral-400 mb-6">
              You haven't created any support tickets. Need help?
            </p>
            <Button variant="primary" onClick={() => router.push('/support')}>
              Create Your First Ticket
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-6 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/support/tickets/${ticket.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {ticket.subject}
                  </h3>
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

                <p className="text-neutral-400 text-sm line-clamp-2 mb-4">
                  {ticket.description}
                </p>

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
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}




