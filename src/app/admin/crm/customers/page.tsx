// /src/app/admin/crm/customers/page.tsx
// Customer list page

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner } from '@/lib/design-system/components'

interface Customer {
  user_id: string
  email: string
  full_name: string
  phone: string
  subscription_tier: string
  engagement_status: string
  health_status: string
  vision_count: number
  journal_entry_count: number
  last_login_at: string
  days_since_last_login: number
  mrr: number
  created_at: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchCustomers()
  }, [filter])

  async function fetchCustomers() {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('engagement_status', filter)
      }

      const response = await fetch(`/api/crm/customers?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()
      setCustomers(data.customers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    if (!status) return 'bg-[#666666]'
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'champion':
        return 'bg-primary-500'
      case 'healthy':
        return 'bg-secondary-500'
      case 'at_risk':
      case 'needs_attention':
        return 'bg-[#FFB701]'
      case 'inactive':
      case 'churned':
        return 'bg-[#D03739]'
      default:
        return 'bg-[#666666]'
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
      {/* Header */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Customers</h1>
          <p className="text-sm md:text-base text-neutral-400">
            {customers.length} total customers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => router.push('/admin/crm/customers/board')}
          >
            Kanban View
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'active', 'at_risk', 'champion', 'inactive'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Customer list */}
      {customers.length === 0 ? (
        <Card className="text-center p-8 md:p-12">
          <p className="text-sm md:text-base text-neutral-400">No customers yet</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Name</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Email</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Tier</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Visions</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Last Login</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">MRR</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.user_id}
                    className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/customers/${customer.user_id}`)}
                  >
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[150px]">
                        {customer.full_name || 'No name'}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm">
                      <div className="truncate max-w-[200px]">{customer.email}</div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      {customer.subscription_tier || 'Free'}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <Badge className={`${getStatusColor(customer.engagement_status)} text-white px-2 py-1 text-xs`}>
                        {customer.engagement_status || 'New'}
                      </Badge>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                      {customer.vision_count || 0}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                      {customer.days_since_last_login !== null
                        ? `${customer.days_since_last_login}d ago`
                        : 'Never'}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      ${customer.mrr?.toFixed(0) || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Container>
  )
}

