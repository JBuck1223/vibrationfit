// /src/app/admin/crm/dashboard/page.tsx
// CRM Analytics Dashboard

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { RefreshCw } from 'lucide-react'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  atRiskMembers: number
  churnedMembers: number
  totalLeads: number
  convertedLeads: number
  openTickets: number
  totalMRR: number
}

export default function CRMDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    try {
      // Fetch members
      const membersRes = await fetch('/api/crm/members')
      const membersData = await membersRes.json()
      const members = membersData.members || []

      // Fetch leads
      const leadsRes = await fetch('/api/crm/leads')
      const leadsData = await leadsRes.json()
      const leads = leadsData.leads || []

      // Fetch tickets
      const ticketsRes = await fetch('/api/support/tickets')
      const ticketsData = await ticketsRes.json()
      const tickets = ticketsData.tickets || []

      // Calculate stats
      const stats: DashboardStats = {
        totalMembers: members.length,
        activeMembers: members.filter(
          (c: any) => c.engagement_status === 'active' || c.engagement_status === 'champion'
        ).length,
        atRiskMembers: members.filter((c: any) => c.engagement_status === 'at_risk').length,
        churnedMembers: members.filter((c: any) => c.health_status === 'churned').length,
        totalLeads: leads.length,
        convertedLeads: leads.filter((l: any) => l.status === 'converted').length,
        openTickets: tickets.filter(
          (t: any) => t.status === 'new' || t.status === 'in_progress'
        ).length,
        totalMRR: members.reduce((sum: number, c: any) => sum + (c.mrr || 0), 0),
      }

      setStats(stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateMetrics() {
    if (!confirm('Update all user activity metrics? This may take a few minutes.')) return

    setUpdating(true)
    try {
      const response = await fetch('/api/crm/metrics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Failed to update metrics')

      const result = await response.json()
      alert(`Successfully updated metrics for ${result.usersProcessed} users!`)
      fetchDashboardStats()
    } catch (error: any) {
      console.error('Error updating metrics:', error)
      alert('Failed to update metrics')
    } finally {
      setUpdating(false)
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
          title="CRM Dashboard"
          subtitle="Overview of your business metrics"
        >
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateMetrics}
              disabled={updating}
            >
              {updating ? (
                'Updating...'
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Metrics
                </>
              )}
            </Button>
          </div>
        </PageHero>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Button variant="primary" size="sm" onClick={() => router.push('/admin/crm/members')}>
          Members
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/crm/leads')}>
          Leads
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/crm/campaigns')}>
          Campaigns
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/crm/support/board')}>
          Support
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <>
          <h2 className="text-xl md:text-2xl font-semibold">Member Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-primary-500">
                {stats.totalMembers}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Total Members</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-secondary-500">
                {stats.activeMembers}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Active</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-[#FFB701]">
                {stats.atRiskMembers}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">At Risk</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-[#D03739]">
                {stats.churnedMembers}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Churned</div>
            </Card>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold">Revenue & Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-[#8B5CF6]">
                ${stats.totalMRR.toFixed(0)}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Total MRR</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-primary-500">
                {stats.totalLeads}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Total Leads</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-secondary-500">
                {stats.convertedLeads}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Converted</div>
            </Card>

            <Card className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-[#FFB701]">
                {stats.openTickets}
              </div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2">Open Tickets</div>
            </Card>
          </div>

          {/* Conversion Rate */}
          <Card className="p-4 md:p-6 lg:p-8">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Lead Conversion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-[#1F1F1F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    style={{
                      width: `${
                        stats.totalLeads > 0
                          ? (stats.convertedLeads / stats.totalLeads) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-primary-500">
                {stats.totalLeads > 0
                  ? Math.round((stats.convertedLeads / stats.totalLeads) * 100)
                  : 0}
                %
              </div>
            </div>
          </Card>
        </>
      )}
      </Stack>
    </Container>
  )
}









