'use client'

import { useState } from 'react'
import { Send, X } from 'lucide-react'
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

const SMS_SEGMENT_LENGTH = 160

export default function ComposeSMS({
  onSend,
  onClose,
  defaultTo = '',
  replyContext,
}: ComposeSMSProps) {
  const [to, setTo] = useState(defaultTo)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const charCount = message.length
  const segments = Math.ceil(charCount / SMS_SEGMENT_LENGTH) || 1

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
          userId: replyContext?.userId,
          leadId: replyContext?.leadId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send SMS')
      }

      setTo('')
      setMessage('')
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
        {/* To */}
        <div>
          <label className="block text-xs text-neutral-500 mb-1">To</label>
          <input
            type="tel"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF]/50 transition-colors"
          />
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
