// /src/app/dashboard/support/page.tsx
// User's support tickets list

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Badge, Button, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { Plus, MessageSquare, Calendar } from 'lucide-react'

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
        <div className="flex items-center justify-between">
          <PageHero
            title="My Support Tickets"
            subtitle="View and manage your support requests"
          />
          <Button
            variant="primary"
            onClick={() => router.push('/support')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </div>

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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-neutral-500">
                        {ticket.ticket_number}
                      </span>
                      <Badge className={`${getStatusColor(ticket.status)} text-white px-3 py-1`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white px-3 py-1`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {ticket.subject}
                    </h3>
                    <p className="text-neutral-400 text-sm line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(ticket.created_at)}</span>
                  </div>
                  <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1">
                    {ticket.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}

