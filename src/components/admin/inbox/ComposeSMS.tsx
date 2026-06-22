'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, X, User } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'

interface ComposeSMSProps {
  onSend?: () => void
  onClose?: () => void
  defaultTo?: string
  replyContext?: {
    userId?: string
    leadId?: string
  }
}

interface ContactResult {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
}

const SMS_SEGMENT_LENGTH = 160

export default function ComposeSMS({
  onSend,
  onClose,
  defaultTo = '',
  replyContext,
}: ComposeSMSProps) {
  const [to, setTo] = useState(defaultTo)
  const [toDisplay, setToDisplay] = useState(defaultTo)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ContactResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const charCount = message.length
  const segments = Math.ceil(charCount / SMS_SEGMENT_LENGTH) || 1

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchContacts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/admin/inbox/contact-search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.contacts || [])
        setShowDropdown(true)
      }
    } catch {
      // silently fail search
    } finally {
      setSearching(false)
    }
  }, [])

  const handleToChange = (value: string) => {
    setToDisplay(value)
    setSelectedContact(null)

    const isPhoneInput = /^[+\d\s()\-.]/.test(value)
    if (isPhoneInput) {
      setTo(value)
      setShowDropdown(false)
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchContacts(value), 300)
  }

  const selectContact = (contact: ContactResult) => {
    const name = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    setTo(contact.phone || '')
    setToDisplay(`${name} (${contact.phone})`)
    setSelectedContact(contact)
    setShowDropdown(false)
    setSearchResults([])
  }

  const handleSend = async () => {
    if (!to.trim() || !message.trim()) {
      setError('Phone number and message are required')
      return
    }

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/inbox/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          message: message.trim(),
          userId: selectedContact?.id || replyContext?.userId,
          leadId: replyContext?.leadId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send SMS')
      }

      setTo('')
      setToDisplay('')
      setMessage('')
      setSelectedContact(null)
      onSend?.()
    } catch (err: any) {
      setError(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <h3 className="text-sm font-semibold text-neutral-200">New SMS</h3>
        {onClose && (
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* To - with contact search */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs text-neutral-500 mb-1">To</label>
          <input
            ref={inputRef}
            type="text"
            value={toDisplay}
            onChange={(e) => handleToChange(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
            placeholder="Name or phone number..."
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF]/50 transition-colors"
          />
          {searching && (
            <div className="absolute right-3 top-[30px]">
              <Spinner size="sm" />
            </div>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {searchResults.map((contact) => {
                const name = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email
                return (
                  <button
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#252525] transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#252525] border border-[#444] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-200 truncate">{name}</p>
                      {contact.phone && (
                        <p className="text-xs text-neutral-500 truncate">{contact.phone}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {showDropdown && searchResults.length === 0 && !searching && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl px-3 py-2.5">
              <p className="text-xs text-neutral-500">No contacts found</p>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF]/50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-neutral-600">
              {charCount} character{charCount !== 1 ? 's' : ''}
              {segments > 1 && ` / ${segments} segment${segments !== 1 ? 's' : ''}`}
            </span>
            {charCount > SMS_SEGMENT_LENGTH && (
              <span className="text-[11px] text-[#FFFF00]">
                Multi-segment message
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#FF0040]">{error}</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[#333]">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={sending || !to.trim() || !message.trim()}
          className="w-full"
        >
          {sending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {sending ? 'Sending...' : 'Send SMS'}
        </Button>
      </div>
    </div>
  )
}
