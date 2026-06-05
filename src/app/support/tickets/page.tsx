// /src/app/support/tickets/page.tsx
// User's support tickets list — modern minimalist with inline expand

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Button, Spinner, Video } from '@/lib/design-system/components'
import { MessageSquare, Plus, ChevronDown, ExternalLink, Video as VideoIcon } from 'lucide-react'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  guest_email: string | null
  user_accounts: { full_name: string | null; email: string } | null
  support_ticket_replies: { attachments: string[] }[] | null
  created_at: string
  updated_at: string
}

interface Reply {
  id: string
  ticket_id: string
  admin_id: string | null
  reply: string
  is_internal: boolean
  attachments: string[]
  created_at: string
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'open': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
    case 'in_progress': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    case 'waiting_reply': return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
    case 'resolved': return 'text-[#39FF14] bg-[#39FF14]/20 border-[#39FF14]/30'
    case 'closed': return 'text-neutral-400 bg-neutral-800 border-neutral-700'
    default: return 'text-neutral-400 bg-neutral-800 border-neutral-700'
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function ticketHasVideo(ticket: Ticket): boolean {
  if (!ticket.support_ticket_replies) return false
  return ticket.support_ticket_replies.some(reply =>
    reply.attachments?.some(url =>
      url.match(/\.(mp4|webm|mov|avi)$/i) ||
      url.includes('/video-recordings/')
    )
  )
}

export default function MyTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    try {
      const response = await fetch('/api/support/tickets')
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleExpand(ticketId: string) {
    if (expandedId === ticketId) {
      setExpandedId(null)
      return
    }
    setExpandedId(ticketId)
    if (!replies[ticketId]) {
      setLoadingReplies(ticketId)
      try {
        const response = await fetch(`/api/support/tickets/${ticketId}/replies`)
        if (response.ok) {
          const data = await response.json()
          setReplies(prev => ({ ...prev, [ticketId]: data.replies || [] }))
        }
      } catch (error) {
        console.error('Error fetching replies:', error)
      } finally {
        setLoadingReplies(null)
      }
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function parseLifeAreas(description: string): { areas: string[]; body: string } {
    const match = description.match(/^Life area\(s\):\s*(.+?)(?:\n\n|\n|$)/)
    if (!match) return { areas: [], body: description }
    const areas = match[1].split(',').map(a => a.trim()).filter(Boolean)
    const body = description.slice(match[0].length).trim()
    return { areas, body }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h3>
            <p className="text-neutral-400 mb-6">
              Need help? Create a support ticket and we'll get back to you.
            </p>
            <Button variant="primary" onClick={() => router.push('/support')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {tickets.map((ticket) => {
              const isExpanded = expandedId === ticket.id
              const ticketReplies = replies[ticket.id] || []

              return (
                <div key={ticket.id}>
                  {/* Collapsed row */}
                  <div className="hover:bg-white/[0.03] transition-colors px-4 sm:px-5 py-4">
                    {/* Mobile: date on its own line */}
                    <p className="sm:hidden text-xs text-neutral-500 mb-2">
                      {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Date column — desktop only */}
                      <div className="hidden sm:block flex-shrink-0 w-14 text-center py-1">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-500 leading-none">
                          {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-bold text-white leading-tight">
                          {new Date(ticket.created_at).getDate()}
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-none">
                          {new Date(ticket.created_at).getFullYear()}
                        </p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta row: ticket #, category, status, and video indicator */}
                        <div className="flex items-center gap-2 text-[11px] mb-1">
                          <span className="text-neutral-500">{ticket.ticket_number}</span>
                          <span className="inline-flex px-1.5 py-0.5 rounded-full border border-neutral-600/50 text-neutral-300 bg-neutral-800/50">
                            {ticket.category}
                          </span>
                          <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${getStatusStyle(ticket.status)}`}>
                            {formatStatus(ticket.status)}
                          </span>
                          {ticketHasVideo(ticket) && (
                            <VideoIcon className="w-3.5 h-3.5 text-secondary-400" />
                          )}
                        </div>

                        {/* Title */}
                        <p className="text-sm sm:text-base font-medium text-white truncate mb-0.5">
                          {ticket.subject}
                        </p>
                      </div>

                      {/* Right side: expand only */}
                      <div className="flex items-center flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(ticket.id) }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-white/[0.04]">
                      <div className="sm:ml-14 space-y-4">
                        {/* Full description */}
                        <div className="pt-4">
                          {(() => {
                            const { areas, body } = parseLifeAreas(ticket.description)
                            return (
                              <>
                                {areas.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Life Areas</p>
                                    <div className="flex flex-wrap gap-2">
                                      {areas.map((area) => (
                                        <span
                                          key={area}
                                          className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#00FFFF]/30 bg-[#00FFFF]/10 text-[#00FFFF]"
                                        >
                                          {area}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Description</p>
                                <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                  {body || ticket.description}
                                </p>
                              </>
                            )
                          })()}
                        </div>

                        {/* Replies / conversation */}
                        {loadingReplies === ticket.id ? (
                          <div className="flex justify-center py-4">
                            <Spinner size="sm" />
                          </div>
                        ) : ticketReplies.length > 0 ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                              Conversation ({ticketReplies.filter(r => !r.is_internal).length})
                            </p>
                            <div className="space-y-3">
                              {ticketReplies.filter(r => !r.is_internal).map((reply) => (
                                <div
                                  key={reply.id}
                                  className={`rounded-xl p-3 border ${
                                    reply.admin_id
                                      ? 'border-primary-500/20 bg-primary-500/[0.03]'
                                      : 'border-white/[0.06] bg-black/20'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[11px] font-medium text-neutral-300">
                                      {reply.admin_id ? 'Support Team' : 'You'}
                                    </span>
                                    <span className="text-[10px] text-neutral-600">
                                      {formatDate(reply.created_at)} at {formatTime(reply.created_at)}
                                    </span>
                                  </div>
                                  {reply.reply && (
                                    <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                      {reply.reply}
                                    </p>
                                  )}
                                  {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {reply.attachments.map((url, idx) => {
                                        const kind = getSupportAttachmentKind(url)
                                        if (kind === 'video') {
                                          return (
                                            <div key={idx} className="rounded-lg overflow-hidden border border-white/[0.06] max-w-sm">
                                              <Video src={url} variant="card" preload="metadata" />
                                            </div>
                                          )
                                        }
                                        if (kind === 'audio') {
                                          return (
                                            <audio key={idx} src={url} controls className="w-full max-w-sm h-8" preload="metadata" />
                                          )
                                        }
                                        if (kind === 'image') {
                                          return (
                                            <img key={idx} src={url} alt="" className="rounded-lg max-w-xs border border-white/[0.06]" />
                                          )
                                        }
                                        return (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[12px] text-cyan-400 hover:underline"
                                          >
                                            <span className="truncate">{getSupportAttachmentDisplayName(url)}</span>
                                          </a>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Link to full page */}
                        <button
                          onClick={() => router.push(`/support/tickets/${ticket.id}`)}
                          className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open full view & reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}
