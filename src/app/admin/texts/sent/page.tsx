'use client'

import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Badge, Button, Spinner, Stack, PageHero, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  MessageSquare, Send, Calendar, User, ArrowRight, ArrowDown, ArrowUp,
  ArrowLeft, RefreshCw, Search, Phone, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SMSMessage {
  id: string
  lead_id: string | null
  ticket_id: string | null
  user_id: string | null
  direction: 'inbound' | 'outbound'
  from_number: string
  to_number: string
  body: string
  media_urls: string[] | null
  status: string
  error_message: string | null
  twilio_sid: string | null
  created_at: string
}

type DirectionFilter = 'all' | 'outbound' | 'inbound'
type StatusFilter = 'all' | 'queued' | 'sent' | 'delivered' | 'failed' | 'received'

const PAGE_SIZE = 50

function SentSMSContent() {
  const router = useRouter()
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [direction, setDirection] = useState<DirectionFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (direction !== 'all') params.set('direction', direction)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(page * PAGE_SIZE))

      const response = await fetch(`/api/admin/sms/log?${params}`)
      if (!response.ok) throw new Error('Failed to fetch SMS log')

      const data = await response.json()
      setMessages(data.messages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching SMS log:', error)
    } finally {
      setLoading(false)
    }
  }, [direction, statusFilter, search, page])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  async function syncSMSHistory() {
    if (!confirm('This will sync ALL historical SMS messages from Twilio. This may take a minute. Continue?')) {
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/messaging/sync-sms-history', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync SMS history')

      const data = await response.json()
      alert(`SMS Sync Complete!\nSynced: ${data.synced}\nSkipped: ${data.skipped}\nErrors: ${data.errors}`)
      await fetchMessages()
    } catch (error) {
      console.error('Error syncing SMS:', error)
      alert('Failed to sync SMS history. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'sent':
        return 'bg-blue-500 text-white'
      case 'delivered':
        return 'bg-primary-500 text-black'
      case 'failed':
        return 'bg-[#D03739] text-white'
      case 'received':
        return 'bg-secondary-500 text-black'
      case 'queued':
        return 'bg-yellow-500 text-black'
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

  function formatPhone(phone: string) {
    if (!phone) return 'Unknown'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="SMS LOG"
          title="SMS Message Log"
          subtitle={`${total} total messages`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/texts')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              SMS Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={syncSMSHistory}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Twilio'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </PageHero>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by phone number or message body..."
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
                >
                  Clear
                </Button>
              )}
            </form>

            {/* Direction Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-400">Direction:</span>
              </div>
              <div className="flex gap-2">
                {(['all', 'outbound', 'inbound'] as DirectionFilter[]).map((d) => (
                  <Button
                    key={d}
                    variant={direction === d ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => { setDirection(d); setPage(0) }}
                  >
                    {d === 'all' ? 'All' : d === 'outbound' ? 'Sent' : 'Received'}
                  </Button>
                ))}
              </div>

              <span className="text-neutral-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'queued', 'sent', 'delivered', 'failed', 'received'] as StatusFilter[]).map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => { setStatusFilter(s); setPage(0) }}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Message List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No SMS Messages Found</h3>
            <p className="text-neutral-400">
              {search
                ? 'No messages match your search criteria.'
                : 'No SMS messages have been logged yet. Try syncing from Twilio.'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {messages.map((msg) => (
                <Card
                  key={msg.id}
                  className="p-4 hover:border-primary-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${getStatusColor(msg.status)} px-2 py-1 text-xs`}>
                          {msg.status}
                        </Badge>
                        <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1 text-xs flex items-center gap-1">
                          {msg.direction === 'inbound' ? (
                            <><ArrowDown className="w-3 h-3" /> Received</>
                          ) : (
                            <><ArrowUp className="w-3 h-3" /> Sent</>
                          )}
                        </Badge>
                        {msg.error_message && (
                          <Badge className="bg-[#D03739]/20 text-[#D03739] px-2 py-1 text-xs">
                            Error
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-neutral-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(msg.from_number)}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(msg.to_number)}</span>
                        </div>
                      </div>

                      {(msg.lead_id || msg.user_id) && (
                        <div className="flex items-center gap-3 mb-2">
                          {msg.user_id && (
                            <button
                              onClick={() => router.push(`/admin/users/${msg.user_id}`)}
                              className="text-xs text-secondary-500 hover:text-secondary-400 flex items-center gap-1"
                            >
                              <User className="w-3 h-3" />
                              User
                            </button>
                          )}
                          {msg.lead_id && (
                            <button
                              onClick={() => router.push(`/admin/crm/leads/${msg.lead_id}`)}
                              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              <User className="w-3 h-3" />
                              Lead
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">{formatDate(msg.created_at)}</span>
                      </div>
                      {msg.twilio_sid && (
                        <span className="text-[10px] text-neutral-600 font-mono truncate max-w-[140px]">
                          {msg.twilio_sid}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                      {msg.body}
                    </p>
                    {msg.error_message && (
                      <p className="text-xs text-[#D03739] mt-2">
                        Error: {msg.error_message}
                      </p>
                    )}
                    {msg.media_urls && msg.media_urls.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {msg.media_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary-500 hover:underline"
                          >
                            Media {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-neutral-400">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}

export default function SentSMSPage() {
  return (
    <AdminWrapper>
      <SentSMSContent />
    </AdminWrapper>
  )
}
