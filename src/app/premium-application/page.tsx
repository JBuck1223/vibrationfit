'use client'

import React, { useState } from 'react'
import { ArrowRight, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Stack,
  Container,
  Card,
  Button,
  Heading,
  Text,
} from '@/lib/design-system'
import { Input, PageLayout } from '@/lib/design-system/components'

export default function PremiumApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentSituation: '',
    desiredVision: '',
    triedBefore: '',
    commitment: '',
    ableToInvest: '',
  })

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.currentSituation || !form.desiredVision || !form.triedBefore || !form.commitment || !form.ableToInvest) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/premium-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        window.location.href = '/premium-application/calendar'
      } else {
        toast.error('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    } catch {
      toast.error('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <Container size="md" className="py-12 md:py-20">
        <Stack gap="xl">
          <div className="text-center">
            <Heading level={1} className="text-white text-3xl md:text-5xl font-bold mb-4">
              Premium Activation Application
            </Heading>
            <Text size="xl" className="text-neutral-300 max-w-2xl mx-auto">
              The Premium Activation is a private 8-week &ldquo;Reality Recode&rdquo; with 10 private sessions, 
              a custom Vibration Protocol, and priority support. Apply below to see if it&rsquo;s the right fit.
            </Text>
          </div>

          <Card className="border-[#BF00FF]/30 bg-gradient-to-br from-[#BF00FF]/5 to-[#8B5CF6]/5">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#BF00FF]" />
                <h3 className="text-lg font-bold text-white">What&rsquo;s Included</h3>
              </div>
              <div className="space-y-2">
                {[
                  '10 private sessions over 8 weeks (2x/week weeks 1-2, 1x/week weeks 3-8)',
                  'Custom "Vibration Protocol" PDF',
                  'Priority DM / voice support (M-F, 8 weeks)',
                  'First 28 days of Vibration Fit membership included',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#BF00FF] flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-2xl font-bold text-white">$3,000</div>
            </div>
          </Card>

          <Card className="border-neutral-700">
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Heading level={3} className="text-white">Your Application</Heading>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">Full Name *</label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">Email *</label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-1.5">Phone *</label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="currentSituation" className="block text-sm font-medium text-neutral-300 mb-1.5">Current Situation *</label>
                  <textarea
                    id="currentSituation"
                    value={form.currentSituation}
                    onChange={(e) => update('currentSituation', e.target.value)}
                    placeholder="Describe where you are right now..."
                    rows={4}
                    required
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-[#BF00FF] focus:ring-1 focus:ring-[#BF00FF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="desiredVision" className="block text-sm font-medium text-neutral-300 mb-1.5">Desired Vision *</label>
                  <textarea
                    id="desiredVision"
                    value={form.desiredVision}
                    onChange={(e) => update('desiredVision', e.target.value)}
                    placeholder="Describe what you want your life to look like..."
                    rows={4}
                    required
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-[#BF00FF] focus:ring-1 focus:ring-[#BF00FF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="triedBefore" className="block text-sm font-medium text-neutral-300 mb-1.5">What have you tried before? *</label>
                  <textarea
                    id="triedBefore"
                    value={form.triedBefore}
                    onChange={(e) => update('triedBefore', e.target.value)}
                    placeholder="What approaches, programs, or methods have you already tried?"
                    rows={4}
                    required
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-[#BF00FF] focus:ring-1 focus:ring-[#BF00FF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="commitment" className="block text-sm font-medium text-neutral-300 mb-1.5">
                    How committed are you to making this shift right now? (1-10) *
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => update('commitment', String(num))}
                        className={`w-10 h-10 rounded-full font-semibold transition-all duration-200 ${
                          form.commitment === String(num)
                            ? 'bg-[#BF00FF] text-white shadow-lg shadow-[#BF00FF]/30'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Are you able to invest in mentorship at this level if it feels aligned? *
                  </label>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => update('ableToInvest', option.toLowerCase())}
                        className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                          form.ableToInvest === option.toLowerCase()
                            ? 'bg-[#BF00FF] text-white shadow-lg shadow-[#BF00FF]/30'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="accent"
                    size="xl"
                    className="w-full"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : (
                      <span className="flex items-center justify-center gap-2">
                        Submit Application
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                  <Text size="sm" className="text-neutral-500 text-center mt-3">
                    After submitting, you&rsquo;ll be able to book a Vision Activation Call.
                  </Text>
                </div>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Container>
    </PageLayout>
  )
}
