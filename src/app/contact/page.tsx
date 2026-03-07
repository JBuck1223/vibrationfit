// /src/app/contact/page.tsx
// Public contact form with lead capture

'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Input, Textarea, Container, Stack, PageHero } from '@/lib/design-system/components'
import { formatPhoneDisplay, parsePhoneInput, phoneToDigits } from '@/lib/phone-format'
import { useTracking } from '@/components/TrackingProvider'
import { trackConversion } from '@/lib/tracking/pixels'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const { visitorId, sessionId } = useTracking()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  })

  // Prefill name, email, phone for logged-in users
  useEffect(() => {
    let mounted = true
    async function fillFromAccount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      const { data: account } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .maybeSingle()
      if (!mounted) return
      setFormData((prev) => ({
        ...prev,
        first_name: account?.first_name ?? prev.first_name,
        last_name: account?.last_name ?? prev.last_name,
        email: account?.email ?? user.email ?? prev.email,
        phone: account?.phone ? formatPhoneDisplay(phoneToDigits(account.phone)) : prev.phone,
      }))
    }
    fillFromAccount()
    return () => { mounted = false }
  }, [])

  function handleChange(field: string, value: string) {
    if (field === 'phone') {
      const digits = parsePhoneInput(value)
      setFormData((prev) => ({ ...prev, phone: formatPhoneDisplay(digits) }))
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          source: 'website_contact',
          ...formData,
          visitor_id: visitorId,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }

      const lead = await response.json()
      trackConversion('lead', { content_name: 'contact_form', event_id: lead?.lead?.id })
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      alert(error.message || 'Failed to submit form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Get In Touch"
            subtitle="Have a question? Want to learn more? We'd love to hear from you."
          />
          <Card className="text-center p-8 md:p-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary-500" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-500">Thank You!</h2>
            <p className="text-sm md:text-base text-neutral-300 mb-6">
              We've received your message and will get back to you within 24 hours.
            </p>
            <Button variant="primary" size="sm" onClick={() => (window.location.href = '/')}>
              Return Home
            </Button>
          </Card>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Get In Touch"
          subtitle="Have a question? Want to learn more? We'd love to hear from you."
        />

        <div className="max-w-2xl mx-auto w-full">
          <Card className="p-4 md:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Tell us what you're interested in..."
                  rows={6}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>

              <p className="text-xs md:text-sm text-neutral-500 text-center">
                We typically respond within 24 hours. By submitting, you agree to receive emails from Vibration Fit.
              </p>
            </form>
          </Card>
        </div>
      </Stack>
    </Container>
  )
}

