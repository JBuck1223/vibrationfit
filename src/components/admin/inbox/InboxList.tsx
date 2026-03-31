'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Send,
} from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import type { InboxMessage, InboxChannel } from './types'
import { CHANNEL_ICON, timeAgo } from './constants'

interface InboxListProps {
  channel: InboxChannel
}

function getContactDisplay(item: InboxMessage, filter: string): string {
  const isSent = filter === 'sent'
  if (isSent) {
    if (item.contact_name) return `To: ${item.contact_name}`
    if (item.contact_email) return `To: ${item.contact_email}`
    if (item.contact_phone) return `To: ${item.contact_phone}`
    return 'To: Unknown'
  }
  if (item.contact_name) return item.contact_name
  if (item.contact_email) return item.contact_email
  if (item.contact_phone) return item.contact_phone
  return 'Unknown'
}

function getDetailPath(item: InboxMessage): string {
  return `/admin/inbox/${item.channel}/${item.id}`
}

export default function InboxList({ channel }: InboxListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || 'inbox'

  const [items, setItems] = useState<InboxMessage[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        channel,
        filter,
        page: String(page),
        limit: '50',
      })
      if (searchDebounced) params.set('search', searchDebounced)

      const res = await fetch(`/api/admin/inbox?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.messages || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false)
    }
  }, [channel, filter, page, searchDebounced])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    setPage(1)
  }, [channel, filter, searchDebounced])

  const filterLabel = filter === 'sent' ? 'Sent' : 'Inbox'
  const FilterLabelIcon = filter === 'sent' ? Send : Inbox
  const channelLabel = channel === 'all' ? '' : channel === 'email' ? 'Email ' : 'SMS '

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222]">
        <FilterLabelIcon className="w-4 h-4 text-neutral-400 shrink-0" />
        <h2 className="text-sm font-semibold text-neutral-200">
          {channelLabel}{filterLabel}
        </h2>
        <span className="text-xs text-neutral-600 tabular-nums ml-auto">
          {total} message{total !== 1 ? 's' : ''}
        </span>
        <button
          onClick={fetchMessages}
          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-[#1A1A1A]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-lg font-medium mb-1">No messages found</p>
            <p className="text-sm">
              {search ? 'Try a different search term' : 'Messages will appear here'}
            </p>
          </div>
        ) : (
          <div>
            {items.map((item) => {
              const channelConfig = CHANNEL_ICON[item.channel]
              const ChannelIcon = channelConfig?.icon
              const isInbound = item.direction === 'inbound'
              const DirectionIcon = isInbound ? ArrowDownLeft : ArrowUpRight

              return (
                <button
                  key={`${item.channel}-${item.id}`}
                  onClick={() => router.push(getDetailPath(item))}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b border-[#1A1A1A] hover:bg-[#111] transition-colors text-left group"
                >
                  {/* Channel + Direction */}
                  <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                    {ChannelIcon && (
                      <ChannelIcon className={`w-4 h-4 ${channelConfig.color}`} />
                    )}
                    <DirectionIcon
                      className={`w-3 h-3 ${
                        isInbound ? 'text-[#00FFFF]' : 'text-[#39FF14]'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-200 truncate">
                        {getContactDisplay(item, filter)}
                      </span>
                      <span className="text-[11px] text-neutral-600 shrink-0 tabular-nums">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    {item.subject && (
                      <p className="text-sm text-neutral-400 truncate mb-0.5">
                        {item.subject}
                      </p>
                    )}
                    {item.preview && (
                      <p className="text-xs text-neutral-600 truncate">
                        {item.preview}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  {item.status && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${
                        item.status === 'received' || item.status === 'delivered'
                          ? 'bg-[#39FF14]/10 text-[#39FF14]'
                          : item.status === 'failed' || item.status === 'bounced'
                            ? 'bg-[#FF0040]/10 text-[#FF0040]'
                            : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#222]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="!text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-neutral-500 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="!text-xs"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
