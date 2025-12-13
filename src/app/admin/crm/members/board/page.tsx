// /src/app/admin/crm/members/board/page.tsx
// Member Kanban board with flexible grouping

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner , Stack, PageHero } from '@/lib/design-system/components'
import { Kanban, KanbanColumn } from '@/components/crm/Kanban'

interface Member {
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

export default function MemberBoardPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupingMode>('engagement_status')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const response = await fetch('/api/crm/members')
      if (!response.ok) throw new Error('Failed to fetch members')

      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMove(memberId: string, newStatus: string) {
    // Store the old value in case we need to revert
    const oldMember = members.find(m => m.user_id === memberId)
    if (!oldMember) return
    
    const updateField = groupBy
    const oldValue = oldMember[updateField]

    // ✅ Optimistically update state immediately (prevents jump)
    setMembers((prev) =>
      prev.map((c) => 
        c.user_id === memberId 
          ? { ...c, [updateField]: newStatus }
          : c
      )
    )

    try {
      const response = await fetch(`/api/crm/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [updateField]: newStatus,
        }),
      })

      if (!response.ok) {
        // ❌ Revert the optimistic update
        setMembers((prev) =>
          prev.map((c) => 
            c.user_id === memberId 
              ? { ...c, [updateField]: oldValue }
              : c
          )
        )
        throw new Error('Failed to update member')
      }
      
      // ✅ API succeeded, optimistic update is now confirmed
    } catch (error: any) {
      console.error('Error moving member:', error)
      alert('Failed to update member')
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

  function getMemberStatus(member: Member): string {
    const value = member[groupBy]
    // Return the value if it exists, otherwise return a default status based on grouping
    if (value) return value
    
    // Default fallbacks
    switch (groupBy) {
      case 'engagement_status':
        return 'active'
      case 'health_status':
        return 'healthy'
      case 'subscription_tier':
        return member.subscription_tier || 'free'
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
      <Stack gap="lg">
        <PageHero 
          title="Member Board" 
          subtitle={`${members.length} members`}
        >
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/crm/members')}
            >
              List View
            </Button>
          </div>
        </PageHero>

      {/* Group By Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-sm md:text-base font-medium text-neutral-400">Group by:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={groupBy === 'engagement_status' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setGroupBy('engagement_status')}
          >
            Engagement Status
          </Button>
          <Button
            variant={groupBy === 'health_status' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setGroupBy('health_status')}
          >
            Health Status
          </Button>
          <Button
            variant={groupBy === 'subscription_tier' ? 'primary' : 'outline'}
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
        items={members.map(member => ({
          ...member,
          id: member.user_id,
          columnId: getMemberStatus(member)
        }))}
        onItemMove={async (itemId: string, newColumnId: string) => {
          await handleMove(itemId, newColumnId)
        }}
        onItemClick={(item) => {
          router.push(`/admin/crm/members/${item.user_id}`)
        }}
        renderItem={(member) => (
          <div
            className="p-3 md:p-4 bg-[#1F1F1F] border-2 border-[#333] rounded-xl hover:-translate-y-1 hover:border-primary-500 transition-all duration-300"
          >
            <div className="mb-2 md:mb-3">
              <div className="font-semibold text-sm md:text-base text-white truncate">
                {member.full_name || 'Unknown'}
              </div>
              <div className="text-xs md:text-sm text-neutral-500 truncate">{member.email}</div>
            </div>

            <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
              {member.subscription_tier && groupBy !== 'subscription_tier' && (
                <Badge className="bg-secondary-500 text-white px-2 py-0.5 text-xs">
                  {member.subscription_tier}
                </Badge>
              )}
              {member.engagement_status && groupBy !== 'engagement_status' && (
                <Badge className="bg-primary-500 text-white px-2 py-0.5 text-xs">
                  {member.engagement_status}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm text-neutral-500">
              <span>{member.vision_count || 0} visions</span>
              {member.days_since_last_login !== null && (
                <span
                  className={
                    member.days_since_last_login > 14
                      ? 'text-[#D03739]'
                      : member.days_since_last_login > 7
                      ? 'text-[#FFB701]'
                      : 'text-primary-500'
                  }
                >
                  {member.days_since_last_login}d ago
                </span>
              )}
            </div>

            {member.mrr > 0 && (
              <div className="mt-2 pt-2 border-t border-[#333] text-xs text-neutral-500">
                MRR: ${member.mrr.toFixed(0)}/mo
              </div>
            )}
          </div>
        )}
      />
      </Stack>
    </Container>
  )
}

