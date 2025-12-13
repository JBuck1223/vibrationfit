// /src/app/admin/emails/sent/page.tsx
// View log of all sent emails

'use client'

import { useEffect, useState } from 'react'
import { Container, Card, Badge, Button, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { Mail, Send, Calendar, User, ArrowRight, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmailLog {
  id: string
  user_id: string | null
  from_email: string
  to_email: string
  subject: string
  body_text: string
  direction: string
  status: string
  created_at: string
}

export default function SentEmailsPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'outbound' | 'inbound'>('all')

  useEffect(() => {
    fetchEmails()
  }, [])

  async function fetchEmails() {
    try {
      const response = await fetch('/api/admin/emails/log')
      if (!response.ok) throw new Error('Failed to fetch emails')

      const data = await response.json()
      setEmails(data.emails)
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncEmails() {
    setSyncing(true)
    try {
      const response = await fetch('/api/messaging/sync-emails', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync emails')
      
      const data = await response.json()
      console.log('✅ Email sync complete:', data)
      
      // Refresh the email list
      await fetchEmails()
    } catch (error) {
      console.error('❌ Error syncing emails:', error)
      alert('Failed to sync emails. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-primary-500'
      case 'failed':
      case 'bounced':
        return 'bg-[#D03739]'
      case 'opened':
        return 'bg-secondary-500'
      default:
        return 'bg-neutral-600'
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filteredEmails = filter === 'all' 
    ? emails 
    : emails.filter(e => e.direction === filter)

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
            title="Email Log"
            subtitle="View all sent and received emails"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={syncEmails}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Check for New Emails'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/emails/list')}
            >
              Email Templates
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">Filter:</span>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({emails.length})
              </Button>
              <Button
                variant={filter === 'outbound' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('outbound')}
              >
                Sent ({emails.filter(e => e.direction === 'outbound').length})
              </Button>
              <Button
                variant={filter === 'inbound' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('inbound')}
              >
                Received ({emails.filter(e => e.direction === 'inbound').length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <Card className="p-8 text-center">
            <Mail className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Emails Found</h3>
            <p className="text-neutral-400">
              {filter === 'all' 
                ? 'No emails have been sent yet.' 
                : `No ${filter} emails found.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEmails.map((email) => (
              <Card
                key={email.id}
                className="p-4 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getStatusColor(email.status)} text-white px-2 py-1 text-xs`}>
                        {email.status}
                      </Badge>
                      <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1 text-xs flex items-center gap-1">
                        {email.direction === 'inbound' ? (
                          <><ArrowDown className="w-3 h-3" /> Received</>
                        ) : (
                          <><ArrowUp className="w-3 h-3" /> Sent</>
                        )}
                      </Badge>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-1 truncate">
                      {email.subject}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Send className="w-3 h-3" />
                        <span className="truncate">{email.from_email}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span className="truncate">{email.to_email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="w-3 h-3" />
                      <span className="whitespace-nowrap">{formatDate(email.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-800">
                  <p className="text-sm text-neutral-400 line-clamp-2">
                    {email.body_text}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}

