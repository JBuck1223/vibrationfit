// /src/app/support/page.tsx
// Public support form

'use client'

import { useState } from 'react'
import { Button, Card, Input, Textarea, Container } from '@/lib/design-system/components'

export default function SupportPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [formData, setFormData] = useState({
    guest_email: '',
    subject: '',
    description: '',
    category: 'other',
  })

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit ticket')
      }

      const { ticket } = await response.json()
      setTicketNumber(ticket.ticket_number)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      alert(error.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Container size="md">
        <Card className="text-center p-8 md:p-12">
          <div className="text-4xl md:text-5xl mb-4">✓</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-500">Ticket Created!</h2>
          <p className="text-sm md:text-base text-neutral-300 mb-2">
            Your support ticket has been created.
          </p>
          <p className="text-xl md:text-2xl font-semibold text-secondary-500 mb-4 md:mb-6">
            {ticketNumber}
          </p>
          <p className="text-xs md:text-sm text-neutral-400 mb-6 break-all">
            We've sent a confirmation email to {formData.guest_email}
          </p>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = '/')}>
            Return Home
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="md">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Get Support</h1>
        <p className="text-sm md:text-base lg:text-lg text-neutral-400">
          Need help? Submit a support ticket and we'll get back to you soon.
        </p>
      </div>

      <Card className="p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              value={formData.guest_email}
              onChange={(e) => handleChange('guest_email', e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              We'll send updates to this email
            </p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm md:text-base"
              required
            >
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing Question</option>
              <option value="account">Account Help</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Subject *</label>
            <Input
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={8}
              required
            />
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>

          <p className="text-xs md:text-sm text-neutral-500 text-center">
            We typically respond within 24 hours
          </p>
        </form>
      </Card>
    </Container>
  )
}
