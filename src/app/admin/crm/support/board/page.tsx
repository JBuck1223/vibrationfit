// /src/app/admin/crm/support/board/page.tsx
// Support tickets Kanban board

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { Kanban, KanbanColumn, KanbanItem } from '@/components/crm/Kanban'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  category: string
  user_id: string
  guest_email: string
  created_at: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'open', title: 'Open', color: 'bg-[#8B5CF6]' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-[#FFB701]' },
  { id: 'waiting_reply', title: 'Waiting Reply', color: 'bg-secondary-500' },
  { id: 'resolved', title: 'Resolved', color: 'bg-primary-500' },
  { id: 'closed', title: 'Closed', color: 'bg-[#666666]' },
]

export default function SupportBoardPage() {
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

  async function handleItemMove(itemId: string, newColumnId: string) {
    try {
      const response = await fetch(`/api/support/tickets/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumnId }),
      })

      if (!response.ok) throw new Error('Failed to update ticket')

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === itemId ? { ...ticket, status: newColumnId } : ticket
        )
      )
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Failed to update ticket status')
    }
  }

  function handleItemClick(item: KanbanItem) {
    router.push(`/admin/crm/support/${item.id}`)
  }

  function renderTicketCard(item: KanbanItem) {
    const ticket = item as unknown as Ticket

    return (
      <Card className="p-3 md:p-4 hover:border-primary-500 transition-colors">
        <div className="mb-2">
          <div className="text-xs md:text-sm text-neutral-500 mb-1">{ticket.ticket_number}</div>
          <div className="font-semibold text-sm md:text-base line-clamp-2">{ticket.subject}</div>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className={`px-2 py-1 text-xs ${
            ticket.priority === 'urgent' ? 'bg-[#D03739]' :
            ticket.priority === 'high' ? 'bg-[#FFB701]' :
            'bg-[#404040]'
          } text-white`}>
            {ticket.priority}
          </Badge>
          <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1 text-xs truncate max-w-[100px]">
            {ticket.category}
          </Badge>
        </div>

        <div className="text-xs text-neutral-500">
          {new Date(ticket.created_at).toLocaleDateString()}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Stack gap="lg">
          <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
        <Spinner size="lg" />
        </Stack>
      </Container>
    )
  }

  const kanbanItems: KanbanItem[] = tickets.map((ticket) => ({
    ...ticket,
    columnId: ticket.status,
  }))

  return (
    <Container size="full">
      <Stack gap="lg">
        <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Support Board</h1>
        <p className="text-sm md:text-base text-neutral-400">{tickets.length} total tickets</p>
      </div>

      <Kanban
        columns={COLUMNS}
        items={kanbanItems}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
        renderItem={renderTicketCard}
      />
      </Stack>
    </Container>
  )
}

