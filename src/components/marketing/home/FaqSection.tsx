import { Card, Heading, OfferStack, Stack, Text } from '@/lib/design-system'

export function FaqSection() {
  return (
    <div id="full-faq" className="scroll-mt-28">
      <Card variant="elevated" className="bg-[#0F1612]/80 border-[#39FF14]/20 p-4 md:p-6 lg:p-8 shadow-[0_24px_60px_rgba(57,255,20,0.12)]">
        <Stack gap="lg" className="md:gap-10">
          <div className="text-center space-y-2">
            <Heading level={2} className="text-white">
              Frequently Asked Questions
            </Heading>
            <Text size="lg" className="text-neutral-300">
              Everything you need to know
            </Text>
          </div>
          <OfferStack
            items={[
              {
                id: 'skeptical',
                title: 'What if I\'m skeptical?',
                description: 'Good. That\'s why we stack raw proof, a structured mechanism, and guarantees. See the member results and receipts above, the founders\' before-and-after bank screenshots, the Conscious Creation System: Creations → Activations → Connections → Sessions, and our 72‑Hour Activation + Membership Guarantees.'
              },
              {
                id: 'tried-loa',
                title: 'What if I\'ve tried LoA and failed?',
                description: 'Most people had belief without structure. We give you the mechanism (Creations → Activations → Connections → Sessions), a 72‑Hour Vision Activation to get your Life Vision fully online, and a 28‑Day MAP (My Alignment Plan) so you know exactly what to do each day, plus proof and guarantees if you\'re not satisfied.'
              },
              {
                id: 'dont-know',
                title: 'What if I don\'t know what I want?',
                description: 'VIVA turns contrast into clarity and drafts your 12‑category Life Vision with you. You\'ll have a concrete first draft to refine within 72 hours of starting—something that used to take Jordan and Vanessa months to do on their own without VIVA\'s help.'
              },
              {
                id: 'doesnt-work',
                title: 'What if it doesn\'t work for me?',
                description: 'You have two layers of protection: a 72‑Hour Activation Guarantee (complete all 14 guided Activation steps in 72 hours; if you\'re not satisfied, you get a full refund of your Activation fee) and a Membership Satisfaction Guarantee (16 weeks from your checkout date, no matter which plan you choose).'
              },
              {
                id: 'billing-start',
                title: 'When does billing start?',
                description: '$499 Solo or $699 Household today (or 2 payments of $275 / $399, 14 days apart) for the 72-Hour Vision Activation + first 28 days of Vision Pro included. Day 28 your membership continues automatically at $99 (Solo) or $149 (Household) every 28 days.'
              },
              {
                id: 'switch-cancel',
                title: 'Can I switch or cancel before billing starts?',
                description: 'Yes—1‑click cancel anytime before Day 28 in your account.'
              },
              {
                id: 'household-members',
                title: 'How do additional household members work?',
                description: 'Your Household plan includes 2 Vision Activations and 2 seats. Every person needs their own Vision Activation before using Vision Pro. Add another family member any time for a one-time $199 Family Activation (their own activation + first 28 days of access) plus $29 every 28 days added to your household plan. All billed together, and you can cancel their seat any time.'
              },
              {
                id: 'refunds',
                title: 'How do refunds work?',
                description: (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">What&rsquo;s covered</p>
                      <ul className="list-disc marker:text-[#39FF14] pl-5 space-y-1 text-sm text-neutral-300">
                        <li>
                          72&#8209;Hour Activation Guarantee: if you complete all 14 guided Activation steps in 72 hours and aren&rsquo;t satisfied, we refund your Activation fee in full.
                        </li>
                        <li>
                          Membership Satisfaction Guarantee: From your checkout date, you have 16 weeks, no matter which plan you choose (Monthly or Annual).
                          <br /><br />
                          If your next plan charge hasn&rsquo;t billed yet (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.
                          <br />
                          If a plan charge occurred within your 16&#8209;week window, we refund that charge in full and cancel all future renewals.
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">How to request</p>
                      <p className="text-sm text-neutral-300">
                        When logged in, go to the Support tab (left sidebar on desktop/ under &ldquo;More&rdquo; on mobile). If you are logged in, you can click here: <a href="/support" className="text-[#39FF14] underline underline-offset-4 hover:text-[#5EC49A] transition-colors">Support</a>. We reply within 1 business day.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">How it&rsquo;s paid</p>
                      <p className="text-sm text-neutral-300">
                        Refunds go back to the original payment method. Banks typically show the credit in 5&ndash;10 business days.
                      </p>
                    </div>
                  </div>
                )
              },
              {
                id: 'billing-cadence',
                title: 'Do you charge sales tax/VAT/GST?',
                description: (
                  <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                    <div>
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Today</p>
                      <p>We don&rsquo;t collect sales tax/VAT/GST at checkout right now. The price you see is the price you pay (plus any bank/FX fees your bank may add).</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">If this changes</p>
                      <p>If a law or your location requires tax in the future, we&rsquo;ll calculate it from your billing address, show it clearly at checkout before you pay, and itemize it on your receipt. We&rsquo;ll notify you ahead of any change.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">International buyers</p>
                      <p>Your bank may add currency conversion or cross-border fees&mdash;we don&rsquo;t control those.</p>
                    </div>
                  </div>
                )
              }
            ]}
            className="w-full max-w-5xl mx-auto"
          />
        </Stack>
      </Card>
    </div>
  )
}
