// /src/app/terms-of-service/page.tsx
// Terms of Service page

'use client'

import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'

export default function TermsOfServicePage() {
  const lastUpdated = 'January 12, 2026'

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
              <p className="text-neutral-300 mb-6">
                Accounts are created and managed by adults. If users under the age of 18 use the platform, they do so under the supervision and responsibility of the account holder.
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
                VIVA-generated content is intended to support personal reflection and growth. It does not constitute medical, psychological, legal, or professional advice.
              </p>
              <p className="text-neutral-300">
                You remain responsible for how you interpret and apply any VIVA-generated content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">6. Subscriptions, Payments & Billing</h2>
              <p className="text-neutral-300 mb-4">
                Certain features of the Services may require a paid subscription.
              </p>
              <p className="text-neutral-300 mb-4">By subscribing, you agree to:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Pay all applicable fees</li>
                <li>Authorize recurring billing where applicable</li>
                <li>Keep payment information current</li>
              </ul>
              <p className="text-neutral-300">
                Subscription terms, pricing, and cancellation options are presented at the time of purchase and may change with notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">7. Cancellation & Account Termination</h2>
              <p className="text-neutral-300 mb-4">
                You may cancel your subscription or delete your account at any time through your account settings.
              </p>
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
              <p className="text-neutral-300">
                These Terms are governed by the laws of the jurisdiction in which Vibration Fit operates, without regard to conflict of law principles.
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
