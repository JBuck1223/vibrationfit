// /src/app/demo/page.tsx
// Demo request form with lead capture

'use client'

import { useState } from 'react'
import { Button, Card, Input, Textarea, Container } from '@/lib/design-system/components'
import { useTracking } from '@/components/TrackingProvider'

export default function DemoPage() {
  const { visitorId, sessionId } = useTracking()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
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
          type: 'demo',
          source: 'demo_request',
          ...formData,
          visitor_id: visitorId,
          session_id: sessionId,
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
      <Container size="md">
        <Card className="text-center p-8 md:p-12">
          <div className="text-4xl md:text-5xl mb-4">🎉</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-500">Demo Requested!</h2>
          <p className="text-sm md:text-base text-neutral-300 mb-4 md:mb-6">
            We'll reach out shortly to schedule your personalized Vibration Fit demo.
          </p>
          <p className="text-xs md:text-sm text-neutral-400 mb-6 break-all">
            Check your email ({formData.email}) for confirmation.
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
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Request a Demo</h1>
        <p className="text-sm md:text-base lg:text-lg text-neutral-400">
          See Vibration Fit in action with a personalized demo tailored to your goals.
        </p>
      </div>

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
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              We'll use this to schedule your demo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company/Organization</label>
            <Input
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What are you hoping to achieve?
            </label>
            <Textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Tell us about your goals..."
              rows={4}
            />
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Request Demo'}
          </Button>

          <p className="text-xs md:text-sm text-neutral-500 text-center">
            By submitting, you agree to receive communications from Vibration Fit.
          </p>
        </form>
      </Card>

      <div className="mt-6 md:mt-8">
        <Card className="p-4 md:p-6 lg:p-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">What to Expect</h3>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start">
              <span className="text-primary-500 mr-3">✓</span>
              <span>30-minute personalized walkthrough of Vibration Fit</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-3">✓</span>
              <span>Learn how to create and refine your Life Vision</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-3">✓</span>
              <span>See AI-powered guidance and vision boards in action</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-3">✓</span>
              <span>Q&A tailored to your specific needs</span>
            </li>
          </ul>
        </Card>
      </div>
    </Container>
  )
}

