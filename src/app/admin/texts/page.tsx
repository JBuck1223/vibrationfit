'use client'

/**
 * SMS/Text Dashboard
 * 
 * Overview of SMS templates and messaging system
 */

import { useState, useEffect } from 'react'
import { Container, Card, Button, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { MessageSquare, Plus, Send, Clock, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SMSStats {
  totalTemplates: number
  activeTemplates: number
  scheduledMessages: number
  sentToday: number
}

export default function SMSDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<SMSStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch templates
        const templatesRes = await fetch('/api/admin/templates/sms')
        const templatesData = await templatesRes.json()
        
        const templates = templatesData.templates || []
        
        setStats({
          totalTemplates: templates.length,
          activeTemplates: templates.filter((t: { status: string }) => t.status === 'active').length,
          scheduledMessages: 0, // TODO: Fetch from scheduled_messages
          sentToday: 0, // TODO: Fetch from message_send_log
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          {/* Hero */}
          <PageHero
            eyebrow="ADMIN CRM"
            title="SMS / Text Messaging"
            subtitle="Manage SMS templates and scheduled messages"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/admin/texts/new')}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
              <Button
                onClick={() => router.push('/admin/texts/list')}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                All Templates
              </Button>
            </div>
          </PageHero>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.totalTemplates || 0}</p>
                    <p className="text-xs text-neutral-500">Total Templates</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.activeTemplates || 0}</p>
                    <p className="text-xs text-neutral-500">Active</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.scheduledMessages || 0}</p>
                    <p className="text-xs text-neutral-500">Scheduled</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.sentToday || 0}</p>
                    <p className="text-xs text-neutral-500">Sent Today</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="p-6 cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => router.push('/admin/texts/list')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">SMS Templates</h3>
                  <p className="text-sm text-neutral-400">View and manage all SMS templates</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-secondary-500 transition-colors"
              onClick={() => router.push('/admin/texts/scheduled')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Scheduled Messages</h3>
                  <p className="text-sm text-neutral-400">View pending and sent messages</p>
                </div>
              </div>
            </Card>
          </div>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}



