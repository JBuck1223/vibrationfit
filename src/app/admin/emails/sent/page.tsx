// /src/app/admin/emails/sent/page.tsx
// View log of all sent emails

'use client'

import { useEffect, useState } from 'react'
import { Container, Card, Badge, Button, Spinner, Stack, PageHero, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Send, Calendar, User, ArrowRight, ArrowDown, ArrowUp, ArrowLeft, RefreshCw, FileText, Code2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmailLog {
  id: string
  user_id: string | null
  from_email: string
  to_email: string
  subject: string
  body_text: string | null
  body_html: string | null
  direction: string
  status: string
  created_at: string
}

function SentEmailsContent() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingSMS, setSyncingSMS] = useState(false)
  const [filter, setFilter] = useState<'all' | 'outbound' | 'inbound'>('all')
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)
  const [detailView, setDetailView] = useState<'html' | 'text'>('html')

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

  async function syncSMSHistory() {
    if (!confirm('This will sync ALL historical SMS messages from Twilio. This may take a minute. Continue?')) {
      return
    }

    setSyncingSMS(true)
    try {
      const response = await fetch('/api/messaging/sync-sms-history', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync SMS history')
      
      const data = await response.json()
      console.log('✅ SMS sync complete:', data)
      alert(`SMS Sync Complete!\nSynced: ${data.synced}\nSkipped: ${data.skipped}\nErrors: ${data.errors}`)
    } catch (error) {
      console.error('❌ Error syncing SMS:', error)
      alert('Failed to sync SMS history. Check console for details.')
    } finally {
      setSyncingSMS(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-primary-500 text-black'
      case 'failed':
      case 'bounced':
        return 'bg-[#D03739] text-white'
      case 'opened':
        return 'bg-secondary-500 text-black'
      default:
        return 'bg-neutral-600 text-white'
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

  function openEmailDetail(email: EmailLog) {
    setDetailView(email.body_html?.trim() ? 'html' : 'text')
    setSelectedEmail(email)
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
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="EMAIL LOG"
          title="Email Log"
          subtitle="View all sent and received emails"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/emails')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Messaging Hub
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={syncEmails}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Emails'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={syncSMSHistory}
              disabled={syncingSMS}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncingSMS ? 'animate-spin' : ''}`} />
              {syncingSMS ? 'Syncing...' : 'Sync SMS History'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/emails/list')}
            >
              Templates
            </Button>
          </div>
        </PageHero>

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
                role="button"
                tabIndex={0}
                onClick={() => openEmailDetail(email)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openEmailDetail(email)
                  }
                }}
                className="p-4 hover:border-primary-500 transition-colors cursor-pointer text-left w-full"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getStatusColor(email.status)} px-2 py-1 text-xs`}>
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

        <Modal
          isOpen={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          title={selectedEmail?.subject || 'Email'}
          size="full"
        >
          {selectedEmail && (
            <div className="space-y-4 -m-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                <div className="flex items-center gap-2 min-w-0">
                  <Send className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate" title={selectedEmail.from_email}>
                    From: {selectedEmail.from_email}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 hidden sm:block" />
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate" title={selectedEmail.to_email}>
                    To: {selectedEmail.to_email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500 w-full sm:w-auto sm:ml-auto">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedEmail.created_at)}</span>
                </div>
              </div>

              {selectedEmail.body_html?.trim() && selectedEmail.body_text?.trim() && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={detailView === 'html' ? 'primary' : 'ghost'}
                    onClick={() => setDetailView('html')}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Code2 className="w-4 h-4" />
                    Formatted
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={detailView === 'text' ? 'primary' : 'ghost'}
                    onClick={() => setDetailView('text')}
                    className="inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Plain text
                  </Button>
                </div>
              )}

              <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] min-h-[320px] max-h-[min(70vh,720px)] overflow-hidden flex flex-col">
                {selectedEmail.body_html?.trim() && detailView === 'html' ? (
                  <iframe
                    title="Email body (HTML)"
                    className="w-full flex-1 min-h-[min(70vh,720px)] bg-white"
                    sandbox="allow-same-origin"
                    srcDoc={selectedEmail.body_html}
                  />
                ) : selectedEmail.body_text?.trim() ? (
                  <div className="p-4 overflow-y-auto text-sm text-neutral-200 whitespace-pre-wrap break-words">
                    {selectedEmail.body_text}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-neutral-500">
                    No body content was stored for this message.
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </Stack>
    </Container>
  )
}

export default function SentEmailsPage() {
  return (
    <AdminWrapper>
      <SentEmailsContent />
    </AdminWrapper>
  )
}
