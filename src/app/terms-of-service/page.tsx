// /src/app/terms-of-service/page.tsx
// Terms of Service page

'use client'

import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'

export default function TermsOfServicePage() {
  const lastUpdated = 'February 24, 2026'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Terms of Service"
          subtitle="The agreement between you and Vibration Fit"
        />

        <Card className="p-6 md:p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-400 text-sm mb-8">
              Last Updated: {lastUpdated}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">1. Agreement to These Terms</h2>
              <p className="text-neutral-300 mb-4">
                Welcome to Vibration Fit ("we," "our," or "us").
              </p>
              <p className="text-neutral-300 mb-4">
                These Terms of Service ("Terms") govern your access to and use of the Vibration Fit website, applications, and related services (collectively, the "Services").
              </p>
              <p className="text-neutral-300">
                By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, please discontinue use of the Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">2. The Vibration Fit Platform</h2>
              <p className="text-neutral-300 mb-4">
                Vibration Fit is a personal growth and conscious creation platform designed for individuals and families. The Services may include tools for vision creation, journaling, reflection, creative expression, audio experiences, and VIVA-assisted insights.
              </p>
              <p className="text-neutral-300">
                The Services are intended for personal, non-commercial use unless otherwise agreed in writing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">3. Accounts & Responsibility</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">3.1 Account Creation</h3>
              <p className="text-neutral-300 mb-4">
                To use certain features, you must create an account. You agree to provide accurate and current information and to keep your account information up to date.
              </p>
              <p className="text-neutral-300 mb-2">
                The account holder must be at least 18 years of age. Minors may access the platform only under that adult&apos;s account or as sub-accounts the adult controls. The adult accepts these Terms on behalf of any minors they allow to use the Services.
              </p>
              <p className="text-neutral-300 mb-6">
                The account holder is the legal customer for all purposes, including contracts, payments, and responsibility for use of the Services.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">3.2 Account Security</h3>
              <p className="text-neutral-300 mb-4">
                You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
              </p>
              <p className="text-neutral-300">
                If you believe your account has been compromised, please notify us promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">4. User Content</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">4.1 Ownership</h3>
              <p className="text-neutral-300 mb-6">
                You retain ownership of all content you create or upload to the Services, including text, audio, images, and reflections ("User Content").
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">4.2 License to Operate the Platform</h3>
              <p className="text-neutral-300 mb-4">
                By submitting User Content, you grant Vibration Fit a limited, non-exclusive, royalty-free license to host, store, process, and display your content solely for the purpose of operating and improving the Services.
              </p>
              <p className="text-neutral-300 mb-6">
                We do not sell your content and do not use it for advertising purposes.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">4.3 Responsibility for Content</h3>
              <p className="text-neutral-300 mb-4">You are responsible for the content you create and share. You agree not to submit content that:</p>
              <ul className="list-disc list-inside text-neutral-300 space-y-2">
                <li>Violates applicable laws</li>
                <li>Infringes on the rights of others</li>
                <li>Contains malicious code or attempts to disrupt the Services</li>
                <li>Is abusive, harmful, or unlawful</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">5. VIVA-Assisted Features</h2>
              <p className="text-neutral-300 mb-4">
                Some features of Vibration Fit use VIVA to generate insights, reflections, suggestions, or creative outputs.
              </p>
              <p className="text-neutral-300 mb-4">
                The Services, including VIVA-assisted features, are for general wellness, reflection, and personal development only. They are not a substitute for professional medical, psychological, legal, or financial advice.
              </p>
              <p className="text-neutral-300 mb-4">
                Do not use the Services for crisis situations or as a treatment for mental health conditions.
              </p>
              <p className="text-neutral-300">
                You remain responsible for how you interpret and apply any VIVA-generated content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">6. Subscriptions, Payments & Automatic Renewal</h2>
              <p className="text-neutral-300 mb-4">
                Some purchases include an initial fee for the Vision Activation Intensive plus an ongoing Vision Pro membership that renews every 28 days or annually until canceled.
              </p>
              <p className="text-neutral-300 mb-4">
                We will clearly display the initial charge, future renewal amount, and renewal date at checkout before you complete your purchase.
              </p>
              <p className="text-neutral-300 mb-4">
                By completing checkout, you authorize us to charge your payment method for the initial fee and for recurring membership charges until you cancel.
              </p>
              <p className="text-neutral-300 mb-4">In addition, by subscribing you agree to:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Pay all applicable fees</li>
                <li>Authorize recurring billing where applicable</li>
                <li>Keep payment information current</li>
              </ul>
              <p className="text-neutral-300 mb-4">
                If you have a billing question, please contact us first so we can resolve it. Initiating a chargeback without first contacting support may result in suspension of your account.
              </p>
              <p className="text-neutral-300">
                Subscription terms, pricing, and cancellation options are presented at the time of purchase and may change with notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">7. Cancellations, Refunds & Guarantees</h2>
              <p className="text-neutral-300 mb-4">
                You may cancel your subscription or delete your account at any time through your account settings or as described below.
              </p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li><strong className="text-white">72-Hour Activation Guarantee</strong> applies only to the Intensive fee and requires completion of the activation checklist as described on the checkout page.</li>
                <li><strong className="text-white">16-Week Membership Satisfaction Guarantee</strong> applies only to membership fees within 16 weeks of initial checkout.</li>
                <li>To request a refund or cancel renewal, contact us in-app or via the support channel listed on our website.</li>
                <li>We process approved refunds to the original payment method; processing times depend on your bank.</li>
              </ul>
              <p className="text-neutral-300 mb-4">
                We reserve the right to suspend or terminate accounts that violate these Terms or misuse the Services.
              </p>
              <p className="text-neutral-300">
                Upon termination, access to the Services may end, and associated data may be deleted in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">8. Acceptable Use</h2>
              <p className="text-neutral-300 mb-4">You agree not to misuse the Services, including by:</p>
              <ul className="list-disc list-inside text-neutral-300 space-y-2">
                <li>Attempting to access systems or data without authorization</li>
                <li>Interfering with platform functionality or security</li>
                <li>Using the Services for unlawful or harmful purposes</li>
                <li>Reverse engineering or scraping the platform without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">9. Intellectual Property</h2>
              <p className="text-neutral-300 mb-4">
                The Services, including software, design, branding, and content provided by Vibration Fit, are owned by or licensed to Vibration Fit and are protected by intellectual property laws.
              </p>
              <p className="text-neutral-300">
                You may not copy, modify, distribute, or exploit any part of the Services without written permission, except as permitted by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">10. Availability & Changes to the Services</h2>
              <p className="text-neutral-300 mb-4">
                We work to keep the Services available and reliable but do not guarantee uninterrupted access.
              </p>
              <p className="text-neutral-300">
                We may update, modify, or discontinue features at any time to improve the platform or adapt to changing needs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">11. Disclaimers</h2>
              <p className="text-neutral-300 mb-4">
                The Services are provided "as is" and "as available."
              </p>
              <p className="text-neutral-300 mb-4">
                Vibration Fit does not guarantee specific outcomes, results, or personal transformations. Individual experiences vary.
              </p>
              <p className="text-neutral-300">
                To the fullest extent permitted by law, we disclaim all warranties, express or implied.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">12. Limitation of Liability</h2>
              <p className="text-neutral-300 mb-4">
                To the extent permitted by law, Vibration Fit will not be liable for indirect, incidental, consequential, or special damages arising from your use of the Services.
              </p>
              <p className="text-neutral-300">
                Our total liability for any claim related to the Services will not exceed the amount you paid to us in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">13. Indemnification</h2>
              <p className="text-neutral-300">
                You agree to indemnify and hold harmless Vibration Fit from claims, damages, or expenses arising from your use of the Services or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">14. Governing Law</h2>
              <p className="text-neutral-300 mb-4">
                These Terms are governed by the laws of the jurisdiction in which Vibration Fit operates, without regard to conflict of law principles. Specific issues such as jurisdiction, mandatory arbitration, small-claims procedures, and class action waivers may apply as required by applicable law.
              </p>
              <p className="text-neutral-300 mb-4">
                Data and privacy practices are described in our Privacy Policy and are aligned with these Terms.
              </p>
              <p className="text-neutral-300 text-sm italic">
                If you have questions about how these Terms apply to your situation, including jurisdiction or dispute resolution, we recommend consulting your own legal advisor.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">15. Changes to These Terms</h2>
              <p className="text-neutral-300">
                We may update these Terms from time to time. Continued use of the Services after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">16. Contact Us</h2>
              <p className="text-neutral-300 mb-4">
                If you have questions about these Terms, please visit our contact page:
              </p>
              <a 
                href="/contact" 
                className="inline-block bg-neutral-900 px-4 py-3 rounded-xl text-white font-medium hover:bg-neutral-800 transition-colors"
              >
                Contact Us
              </a>
            </section>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
