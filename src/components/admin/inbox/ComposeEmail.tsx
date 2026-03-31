'use client'

import { useState } from 'react'
import { Send, X, ChevronDown } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { CRM_SENDERS, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

interface ComposeEmailProps {
  onSend?: () => void
  onClose?: () => void
  defaultTo?: string
  defaultSubject?: string
  replyContext?: {
    userId?: string
  }
}

export default function ComposeEmail({
  onSend,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  replyContext,
}: ComposeEmailProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [senderId, setSenderId] = useState(DEFAULT_CRM_SENDER.id)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFromPicker, setShowFromPicker] = useState(false)

  const selectedSender = CRM_SENDERS.find(s => s.id === senderId) || DEFAULT_CRM_SENDER

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      setError('Recipient and subject are required')
      return
    }

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/inbox/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          textBody: body.trim(),
          senderId,
          userId: replyContext?.userId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send email')
      }

      setTo('')
      setSubject('')
      setBody('')
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
        <h3 className="text-sm font-semibold text-neutral-200">New Email</h3>
        {onClose && (
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* From */}
        <div className="relative">
          <label className="block text-xs text-neutral-500 mb-1">From</label>
          <button
            onClick={() => setShowFromPicker(!showFromPicker)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-300 hover:border-[#444] transition-colors"
          >
            <span>{selectedSender.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>
          {showFromPicker && (
            <div className="absolute z-10 mt-1 w-full bg-[#1F1F1F] border border-[#333] rounded-xl shadow-xl overflow-hidden">
              {CRM_SENDERS.map((sender) => (
                <button
                  key={sender.id}
                  onClick={() => {
                    setSenderId(sender.id)
                    setShowFromPicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    sender.id === senderId
                      ? 'bg-[#39FF14]/10 text-[#39FF14]'
                      : 'text-neutral-400 hover:bg-[#2A2A2A]'
                  }`}
                >
                  <div className="font-medium">{sender.label}</div>
                  <div className="text-xs text-neutral-600">{sender.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* To */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@email.com"
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF]/50 transition-colors"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF]/50 transition-colors"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            rows={8}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF]/50 transition-colors resize-none"
          />
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
          disabled={sending || !to.trim() || !subject.trim()}
          className="w-full"
        >
          {sending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </div>
  )
}
