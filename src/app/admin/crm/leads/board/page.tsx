// /src/app/admin/crm/leads/board/page.tsx
// Leads Kanban board view

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner , Stack, PageHero } from '@/lib/design-system/components'
import { Kanban, KanbanColumn, KanbanItem } from '@/components/crm/Kanban'

interface Lead {
  id: string
  type: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  utm_source: string
  created_at: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'new', title: 'New', color: 'bg-[#8B5CF6]' },
  { id: 'contacted', title: 'Contacted', color: 'bg-[#FFB701]' },
  { id: 'qualified', title: 'Qualified', color: 'bg-secondary-500' },
  { id: 'converted', title: 'Converted', color: 'bg-primary-500' },
  { id: 'lost', title: 'Lost', color: 'bg-[#666666]' },
]

export default function LeadsBoardPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const response = await fetch('/api/crm/leads')
      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.leads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleItemMove(itemId: string, newColumnId: string) {
    // Store the old status in case we need to revert
    const oldLead = leads.find(l => l.id === itemId)
    if (!oldLead) return
    
    const oldStatus = oldLead.status

    // ✅ Optimistically update state immediately (prevents jump)
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === itemId ? { ...lead, status: newColumnId } : lead
      )
    )

    try {
      const response = await fetch(`/api/crm/leads/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumnId }),
      })

      if (!response.ok) {
        // ❌ Revert the optimistic update
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === itemId ? { ...lead, status: oldStatus } : lead
          )
        )
        throw new Error('Failed to update lead')
      }
      
      // ✅ API succeeded, optimistic update is now confirmed
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead status')
    }
  }

  function handleItemClick(item: KanbanItem) {
    router.push(`/admin/crm/leads/${item.id}`)
  }

  function renderLeadCard(item: KanbanItem) {
    const lead = item as unknown as Lead

    return (
      <Card className="p-3 md:p-4 hover:border-primary-500 transition-colors">
        <div className="mb-2">
          <div className="font-semibold text-sm md:text-base truncate">
            {lead.first_name} {lead.last_name}
          </div>
          <div className="text-xs md:text-sm text-neutral-400 truncate">{lead.email}</div>
          {lead.phone && (
            <div className="text-xs md:text-sm text-neutral-400">{lead.phone}</div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className="bg-[#404040] text-white px-2 py-1 text-xs">
            {lead.type}
          </Badge>
          {lead.utm_source && (
            <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1 text-xs truncate max-w-[100px]">
              {lead.utm_source}
            </Badge>
          )}
        </div>

        <div className="text-xs text-neutral-500">
          {new Date(lead.created_at).toLocaleDateString()}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Convert leads to Kanban items
  const kanbanItems: KanbanItem[] = leads.map((lead) => ({
    ...lead,
    columnId: lead.status,
  }))

  return (
    <Container size="full">
      <Stack gap="lg">
        <PageHero 
          title="Leads Board" 
          subtitle={`${leads.length} total leads`}
        >
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/crm/leads')}>
              Table View
            </Button>
          </div>
        </PageHero>

      <Kanban
        columns={COLUMNS}
        items={kanbanItems}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
        renderItem={renderLeadCard}
      />
      </Stack>
    </Container>
  )
}

