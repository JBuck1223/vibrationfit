// /src/app/admin/crm/leads/page.tsx
// Lead management list page

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner , Stack, PageHero } from '@/lib/design-system/components'

interface Lead {
  id: string
  type: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  created_at: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchLeads()
  }, [filter])

  async function fetchLeads() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/crm/leads?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.leads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'converted':
        return 'bg-primary-500 text-black'
      case 'qualified':
        return 'bg-secondary-500 text-black'
      case 'contacted':
        return 'bg-[#FFB701] text-black'
      case 'new':
        return 'bg-[#8B5CF6] text-white'
      case 'lost':
        return 'bg-[#666666] text-white'
      default:
        return 'bg-[#666666] text-white'
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'contact':
        return 'Contact'
      case 'demo':
        return 'Demo'
      case 'intensive_intake':
        return 'Intensive'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Leads"
          subtitle={`${leads.length} total leads`}
        >
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/crm/leads/board')}
            >
              Kanban View
            </Button>
          </div>
        </PageHero>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
        {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Lead list */}
      {leads.length === 0 ? (
        <Card className="text-center p-8 md:p-12">
          <p className="text-sm md:text-base text-neutral-400">No leads yet</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Name</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Email</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Phone</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Type</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Source</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/leads/${lead.id}`)}
                  >
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[150px]">
                        {lead.first_name} {lead.last_name}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm">
                      <div className="truncate max-w-[200px]">{lead.email}</div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      {lead.phone || '—'}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <Badge className="bg-[#404040] text-white px-2 py-1 text-xs">
                        {getTypeLabel(lead.type)}
                      </Badge>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                      <div className="truncate max-w-[100px]">
                        {lead.utm_source || lead.utm_campaign || '—'}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <Badge className={`${getStatusColor(lead.status)} px-2 py-1 text-xs`}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </Stack>
    </Container>
  )
}
