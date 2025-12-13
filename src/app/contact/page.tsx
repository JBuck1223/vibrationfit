// /src/app/contact/page.tsx
// Public contact form with lead capture

'use client'

import { useState } from 'react'
import { Button, Card, Input, Textarea, Container, Stack, PageHero } from '@/lib/design-system/components'
import { useUTMTracking } from '@/hooks/useUTMTracking'
import { CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const utmData = useUTMTracking()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  })

  function handleChange(field: string, value: string) {
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
          ...utmData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }

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
                  <label className="block text-xs md:text-sm font-medium mb-2">First Name *</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-7 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(25,157,103,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs md:text-sm text-neutral-500 text-center">
                We'll respond within 24 hours. By submitting, you agree to receive emails from VibrationFit.
              </p>
            </form>
          </Card>
        </div>
      </Stack>
    </Container>
  )
}

