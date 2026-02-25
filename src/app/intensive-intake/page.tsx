// /src/app/intensive-intake/page.tsx
// 72-Hour Activation Intensive intake form

'use client'

import { useState } from 'react'
import { Button, Card, Input, Textarea, Container } from '@/lib/design-system/components'
import { useTracking } from '@/components/TrackingProvider'

export default function IntensiveIntakePage() {
  const { visitorId, sessionId } = useTracking()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_situation: '',
    desired_outcome: '',
    commitment_level: '',
    timeline: '',
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
          type: 'intensive_intake',
          source: 'intensive_intake',
          ...formData,
          metadata: {
            current_situation: formData.current_situation,
            desired_outcome: formData.desired_outcome,
            commitment_level: formData.commitment_level,
            timeline: formData.timeline,
          },
          message: `Current: ${formData.current_situation}\n\nDesired: ${formData.desired_outcome}\n\nCommitment: ${formData.commitment_level}\n\nTimeline: ${formData.timeline}`,
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
          <div className="text-4xl md:text-5xl mb-4">🚀</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-500">Application Received!</h2>
          <p className="text-sm md:text-base text-neutral-300 mb-4 md:mb-6">
            Thank you for your interest in the 72-Hour Activation Intensive.
          </p>
          <p className="text-xs md:text-sm text-neutral-400 mb-6">
            We'll review your application and reach out within 24 hours to discuss next steps.
          </p>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = '/')}>
            Return Home
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">72-Hour Activation Intensive</h1>
        <p className="text-sm md:text-base lg:text-lg text-neutral-400 mb-4">
          An immersive, transformative experience for those ready to make significant shifts.
        </p>
        <div className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 px-4 md:px-6 py-2 rounded-full text-white font-semibold text-xs md:text-sm">
          Limited Availability
        </div>
      </div>

      <Card className="p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-semibold mb-4">What's Included</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">Deep vision clarity session</span>
          </div>
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">Custom action roadmap</span>
          </div>
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">1-on-1 breakthrough coaching</span>
          </div>
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">Personalized vision board</span>
          </div>
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">72-hour Voxer support</span>
          </div>
          <div className="flex items-start">
            <span className="text-primary-500 mr-3 text-lg md:text-xl">✓</span>
            <span className="text-sm md:text-base text-neutral-300">Follow-up integration call</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 lg:p-8">
        <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Application Form</h3>

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
              <label className="block text-xs md:text-sm font-medium mb-2">Last Name *</label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Phone *</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">
              Where are you currently in your life/business? *
            </label>
            <Textarea
              value={formData.current_situation}
              onChange={(e) => handleChange('current_situation', e.target.value)}
              placeholder="Describe your current situation, challenges, and what's working..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">
              What would you like to achieve in the next 90 days? *
            </label>
            <Textarea
              value={formData.desired_outcome}
              onChange={(e) => handleChange('desired_outcome', e.target.value)}
              placeholder="Be specific about your goals and desired outcomes..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">
              On a scale of 1-10, how committed are you to making real change? *
            </label>
            <select
              value={formData.commitment_level}
              onChange={(e) => handleChange('commitment_level', e.target.value)}
              className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm md:text-base"
              required
            >
              <option value="">Select commitment level</option>
              <option value="10">10 - All in, ready to transform</option>
              <option value="9">9 - Very committed</option>
              <option value="8">8 - Committed</option>
              <option value="7">7 - Mostly committed</option>
              <option value="6">6 - Somewhat committed</option>
              <option value="5">5 - Exploring options</option>
              <option value="1-4">1-4 - Just curious</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">
              When are you looking to start? *
            </label>
            <select
              value={formData.timeline}
              onChange={(e) => handleChange('timeline', e.target.value)}
              className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm md:text-base"
              required
            >
              <option value="">Select timeline</option>
              <option value="immediately">Immediately - This week</option>
              <option value="next-2-weeks">Next 2 weeks</option>
              <option value="next-month">Within the next month</option>
              <option value="next-3-months">Next 1-3 months</option>
              <option value="just-exploring">Just exploring for now</option>
            </select>
          </div>

          <div className="bg-[#1F1F1F] p-4 md:p-6 rounded-xl border border-[#333]">
            <p className="text-neutral-300 text-xs md:text-sm">
              This intensive is designed for committed individuals ready for deep transformation.
              By applying, you're taking the first step toward actualizing your vision.
            </p>
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={loading} className="w-full">
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </Button>

          <p className="text-xs md:text-sm text-neutral-500 text-center">
            We review each application individually and will respond within 24 hours.
          </p>
        </form>
      </Card>
    </Container>
  )
}
