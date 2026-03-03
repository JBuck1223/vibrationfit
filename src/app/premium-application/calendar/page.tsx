'use client'

import React from 'react'
import { CalendarDays, Check, Clock, Video } from 'lucide-react'
import {
  Stack,
  Container,
  Card,
  Heading,
  Text,
} from '@/lib/design-system'
import { PageLayout } from '@/lib/design-system/components'

export default function PremiumCalendarPage() {
  return (
    <PageLayout>
      <Container size="md" className="py-12 md:py-20">
        <Stack gap="xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#BF00FF]/10 border border-[#BF00FF]/30 mb-6">
              <Check className="w-8 h-8 text-[#BF00FF]" />
            </div>
            <Heading level={1} className="text-white text-3xl md:text-5xl font-bold mb-4">
              Application Received
            </Heading>
            <Text size="xl" className="text-neutral-300 max-w-2xl mx-auto">
              Thank you for applying for Premium Activation. Book your Vision Activation Call below to take the next step.
            </Text>
          </div>

          <Card className="border-[#BF00FF]/30 bg-gradient-to-br from-[#BF00FF]/5 to-[#8B5CF6]/5">
            <Stack gap="md">
              <Heading level={3} className="text-white">Book Your Vision Activation Call</Heading>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#BF00FF] flex-shrink-0" />
                  <Text size="base" className="text-neutral-300">45 minutes</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-[#BF00FF] flex-shrink-0" />
                  <Text size="base" className="text-neutral-300">Video call (link sent after booking)</Text>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-[#BF00FF] flex-shrink-0" />
                  <Text size="base" className="text-neutral-300">Choose a time that works for you</Text>
                </div>
              </div>

              {/* Calendar embed placeholder -- replace with your scheduling tool (Calendly, Cal.com, etc.) */}
              <div className="w-full min-h-[500px] rounded-xl border-2 border-dashed border-[#BF00FF]/30 bg-neutral-900/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <CalendarDays className="w-12 h-12 text-[#BF00FF]/50 mx-auto mb-4" />
                  <Text size="lg" className="text-neutral-400 mb-2">Calendar Embed Placeholder</Text>
                  <Text size="sm" className="text-neutral-500 max-w-md">
                    Replace this with your Calendly, Cal.com, or other scheduling embed. 
                    Add the embed script or iframe in this space.
                  </Text>
                </div>
              </div>
            </Stack>
          </Card>

          <Card className="border-neutral-700">
            <Stack gap="sm">
              <Heading level={4} className="text-white">What to Expect</Heading>
              <div className="space-y-3">
                {[
                  'We\'ll discuss your current situation and desired vision in depth',
                  'You\'ll learn exactly how the 8-week Reality Recode works',
                  'We\'ll determine together if Premium Activation is the right fit',
                  'If aligned, we\'ll get you enrolled and started right away',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#BF00FF] flex-shrink-0 mt-0.5" />
                    <Text size="sm" className="text-neutral-300">{item}</Text>
                  </div>
                ))}
              </div>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </PageLayout>
  )
}
