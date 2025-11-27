// /src/app/admin/crm/customers/board/page.tsx
// Customer Kanban board with flexible grouping

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner } from '@/lib/design-system/components'
import { Kanban, KanbanColumn } from '@/components/crm/Kanban'

interface Customer {
  user_id: string
  email: string
  full_name: string
  phone: string
  subscription_tier: string
  engagement_status: string
  health_status: string
  vision_count: number
  last_login_at: string
  days_since_last_login: number
  mrr: number
  created_at: string
}

// Define columns for engagement status grouping
const ENGAGEMENT_COLUMNS: KanbanColumn[] = [
  { id: 'active', title: 'Active', color: 'bg-primary-500' },
  { id: 'champion', title: 'Champion', color: 'bg-secondary-500' },
  { id: 'at_risk', title: 'At Risk', color: 'bg-[#FFB701]' },
  { id: 'inactive', title: 'Inactive', color: 'bg-[#D03739]' },
]

// Define columns for health status grouping
const HEALTH_COLUMNS: KanbanColumn[] = [
  { id: 'healthy', title: 'Healthy', color: 'bg-primary-500' },
  { id: 'needs_attention', title: 'Needs Attention', color: 'bg-[#FFB701]' },
  { id: 'churned', title: 'Churned', color: 'bg-[#D03739]' },
]

// Define columns for subscription tier grouping
const TIER_COLUMNS: KanbanColumn[] = [
  { id: 'free', title: 'Free', color: 'bg-[#666666]' },
  { id: 'solo', title: 'Solo', color: 'bg-primary-500' },
  { id: 'household', title: 'Household', color: 'bg-secondary-500' },
  { id: 'intensive', title: 'Intensive', color: 'bg-[#8B5CF6]' },
]

type GroupingMode = 'engagement_status' | 'health_status' | 'subscription_tier'

export default function CustomerBoardPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupingMode>('engagement_status')

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      const response = await fetch('/api/crm/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()
      setCustomers(data.customers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMove(customerId: string, newStatus: string) {
    try {
      // Determine which field to update based on grouping mode
      const updateField = groupBy

      const response = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [updateField]: newStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update customer')

      // Update local state
      setCustomers(customers.map((c) => 
        c.user_id === customerId 
          ? { ...c, [updateField]: newStatus }
          : c
      ))
    } catch (error: any) {
      console.error('Error moving customer:', error)
      alert('Failed to update customer')
    }
  }

  function getColumns(): KanbanColumn[] {
    switch (groupBy) {
      case 'engagement_status':
        return ENGAGEMENT_COLUMNS
      case 'health_status':
        return HEALTH_COLUMNS
      case 'subscription_tier':
        return TIER_COLUMNS
      default:
        return ENGAGEMENT_COLUMNS
    }
  }

  function getCustomerStatus(customer: Customer): string {
    const value = customer[groupBy]
    // Return the value if it exists, otherwise return a default status based on grouping
    if (value) return value
    
    // Default fallbacks
    switch (groupBy) {
      case 'engagement_status':
        return 'active'
      case 'health_status':
        return 'healthy'
      case 'subscription_tier':
        return customer.subscription_tier || 'free'
      default:
        return ''
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Customer Board</h1>
          <p className="text-sm md:text-base text-neutral-400">
            {customers.length} customers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => router.push('/admin/crm/customers')}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Group By Selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-sm md:text-base font-medium text-neutral-400">Group by:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={groupBy === 'engagement_status' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('engagement_status')}
          >
            Engagement Status
          </Button>
          <Button
            variant={groupBy === 'health_status' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('health_status')}
          >
            Health Status
          </Button>
          <Button
            variant={groupBy === 'subscription_tier' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('subscription_tier')}
          >
            Subscription Tier
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <Kanban
        columns={getColumns()}
        items={customers.map(customer => ({
          ...customer,
          id: customer.user_id,
          columnId: getCustomerStatus(customer)
        }))}
        onItemMove={async (itemId: string, newColumnId: string) => {
          await handleMove(itemId, newColumnId)
        }}
        onItemClick={(item) => {
          router.push(`/admin/crm/customers/${item.user_id}`)
        }}
        renderItem={(customer) => (
          <div
            className="p-3 md:p-4 bg-[#1F1F1F] border-2 border-[#333] rounded-xl hover:-translate-y-1 hover:border-primary-500 transition-all duration-300"
          >
            <div className="mb-2 md:mb-3">
              <div className="font-semibold text-sm md:text-base text-white truncate">
                {customer.full_name || 'Unknown'}
              </div>
              <div className="text-xs md:text-sm text-neutral-500 truncate">{customer.email}</div>
            </div>

            <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
              {customer.subscription_tier && groupBy !== 'subscription_tier' && (
                <Badge className="bg-secondary-500 text-white px-2 py-0.5 text-xs">
                  {customer.subscription_tier}
                </Badge>
              )}
              {customer.engagement_status && groupBy !== 'engagement_status' && (
                <Badge className="bg-primary-500 text-white px-2 py-0.5 text-xs">
                  {customer.engagement_status}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm text-neutral-500">
              <span>{customer.vision_count || 0} visions</span>
              {customer.days_since_last_login !== null && (
                <span
                  className={
                    customer.days_since_last_login > 14
                      ? 'text-[#D03739]'
                      : customer.days_since_last_login > 7
                      ? 'text-[#FFB701]'
                      : 'text-primary-500'
                  }
                >
                  {customer.days_since_last_login}d ago
                </span>
              )}
            </div>

            {customer.mrr > 0 && (
              <div className="mt-2 pt-2 border-t border-[#333] text-xs text-neutral-500">
                MRR: ${customer.mrr.toFixed(0)}/mo
              </div>
            )}
          </div>
        )}
      />
    </Container>
  )
}

