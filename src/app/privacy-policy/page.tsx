// /src/app/privacy-policy/page.tsx
// Privacy Policy page

'use client'

import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'

export default function PrivacyPolicyPage() {
  const lastUpdated = 'February 24, 2026'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Privacy Policy"
          subtitle="How we collect, use, and protect your information"
        />

        <Card className="p-6 md:p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-400 text-sm mb-8">
              Last Updated: {lastUpdated}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-neutral-300 mb-4">
                Welcome to Vibration Fit ("we," "our," or "us").
              </p>
              <p className="text-neutral-300 mb-4">
                Vibration Fit is a platform designed to support personal growth, reflection, creativity, and conscious creation—for individuals and families. Protecting your privacy is an essential part of that responsibility.
              </p>
              <p className="text-neutral-300 mb-4">
                This Privacy Policy explains how we collect, use, store, and protect information when you use our website, applications, and related services (collectively, the "Services").
              </p>
              <p className="text-neutral-300">
                By accessing or using the Services, you agree to this Privacy Policy. If you do not agree, please discontinue use of the Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">2.1 Information You Provide</h3>
              <p className="text-neutral-300 mb-4">We collect information you intentionally provide, including when you:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Create an account (name, email address, login credentials)</li>
                <li>Set up or update a profile</li>
                <li>Create Life Visions, journal entries, vision boards, reflections, or notes</li>
                <li>Record audio, affirmations, or voice-based content</li>
                <li>Participate in assessments, programs, or guided experiences</li>
                <li>Use child-specific features as part of a family account</li>
                <li>Contact us for support or inquiries</li>
                <li>Subscribe to communications or updates</li>
              </ul>
              <p className="text-neutral-300 mb-6">
                You retain ownership of the content you create.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">2.2 Information Collected Automatically</h3>
              <p className="text-neutral-300 mb-4">When you use the Services, we may automatically collect limited technical information, such as:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Device type, operating system, and browser</li>
                <li>IP address and general location data</li>
                <li>Usage data (features used, interactions, time spent)</li>
                <li>Log and diagnostic data</li>
                <li>Cookies and similar technologies</li>
              </ul>
              <p className="text-neutral-300 mb-6">
                This information helps us operate, secure, and improve the platform.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">2.3 Personal, Reflective, and Growth-Related Content</h3>
              <p className="text-neutral-300 mb-4">
                Vibration Fit may store deeply personal content, including reflections, journaling, creative expression, emotional check-ins, and vision-related material.
              </p>
              <p className="text-neutral-300 mb-2">This type of content:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Is not sold</li>
                <li>Is not shared for advertising purposes</li>
                <li>Is accessed only as needed to provide and improve the Services</li>
                <li>Is treated as private, user-generated content</li>
              </ul>
              <p className="text-neutral-300 mb-4">
                We do not use your personal reflective content (visions, journals, emotional check-ins) to train public, third-party AI models.
              </p>
              <p className="text-neutral-300">
                Limited, de-identified data may be used to improve Vibration Fit&apos;s own models and features; when we do so, we take steps to remove direct identifiers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">3. How We Use Information</h2>
              <p className="text-neutral-300 mb-4">We use information to:</p>
              <ul className="list-disc list-inside text-neutral-300 space-y-2">
                <li>Provide, operate, and maintain the Services</li>
                <li>Create and manage user accounts</li>
                <li>Support family and child-specific experiences</li>
                <li>Personalize content and features</li>
                <li>Generate VIVA-powered insights, reflections, or recommendations</li>
                <li>Process subscriptions and payments</li>
                <li>Send service-related communications (account updates, security notices)</li>
                <li>Send marketing communications where permitted and with consent</li>
                <li>Respond to support requests</li>
                <li>Analyze platform usage to improve functionality</li>
                <li>Protect the security and integrity of the Services</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">4. VIVA and AI-Assisted Features</h2>
              <p className="text-neutral-300 mb-4">
                Some processing and content generation in the Services is performed with the help of AI and third-party AI providers. VIVA is our AI-assisted feature that can generate insights, reflections, suggestions, and other content based on your inputs and patterns.
              </p>
              <p className="text-neutral-300 mb-4">
                VIVA-generated content is based on patterns and inputs and may not always be accurate or appropriate. You should review and use discretion before acting on any suggestions or content from VIVA.
              </p>
              <p className="text-neutral-300">
                VIVA is not a clinician, therapist, or professional advisor. It is a tool for reflection and growth, not a substitute for professional medical, psychological, legal, or financial advice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">5. Information Sharing</h2>
              <p className="text-neutral-300 mb-4 font-semibold">We do not sell personal information.</p>
              <p className="text-neutral-300 mb-4">We may share information only in the following situations:</p>
              
              <h3 className="text-lg font-semibold text-white mb-3">5.1 Service Providers</h3>
              <p className="text-neutral-300 mb-4">
                We work with third-party vendors to support platform operations (such as hosting, payments, analytics, and communications). These providers:
              </p>
              <ul className="list-disc list-inside text-neutral-300 mb-6 space-y-2">
                <li>Access only what is necessary to perform their services</li>
                <li>Are contractually required to protect your information</li>
                <li>May not use your data for their own purposes</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">5.2 Legal Requirements</h3>
              <p className="text-neutral-300 mb-6">
                We may disclose information if required by law, regulation, court order, or governmental request, or if necessary to protect the rights, safety, or security of Vibration Fit, our users, or others.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">5.3 Business Changes</h3>
              <p className="text-neutral-300">
                If Vibration Fit is involved in a merger, acquisition, restructuring, or sale of assets, user information may be transferred as part of that process. We will notify users of any material changes affecting their information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">6. Children, Families, and Child-Specific Features</h2>
              <p className="text-neutral-300 mb-4">
                Vibration Fit is directed primarily at adults. Child experiences are enabled and controlled by a parent or legal guardian.
              </p>
              <p className="text-neutral-300 mb-4">
                We do not knowingly allow children to create their own independent accounts. Accounts are created and managed by a parent or legal guardian. Any information related to a child is provided by the adult managing the account and is used solely to support the intended experience within the platform.
              </p>
              <p className="text-neutral-300 mb-4">
                When child-related data is collected, it is provided by and tied to the parent/guardian account and used only to deliver the requested experiences. We do not use child-related data for advertising or sell it.
              </p>
              <p className="text-neutral-300 mb-2">Information associated with child-specific features:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Is not used for advertising or marketing</li>
                <li>Is not sold or shared with third parties for commercial purposes</li>
                <li>Is used only to deliver and support the feature or experience</li>
              </ul>
              <p className="text-neutral-300 mb-4">
                If we determine that information has been collected or retained in a way that is inconsistent with this policy, we will take appropriate steps to remove it.
              </p>
              <p className="text-neutral-300">
                As child-specific features evolve, this Privacy Policy may be updated to reflect changes in functionality or data use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">7. Data Security</h2>
              <p className="text-neutral-300 mb-4">
                We use reasonable technical and organizational measures to protect information, including:
              </p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Ongoing monitoring and system updates</li>
                <li>Limited internal access based on role</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-neutral-300">
                No system can guarantee absolute security, but we are committed to maintaining and improving our safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">8. Data Retention</h2>
              <p className="text-neutral-300 mb-4">
                We retain information only for as long as necessary to provide the Services or meet legal and operational requirements.
              </p>
              <p className="text-neutral-300 mb-4">
                If your account remains inactive for an extended period (for example, 24 months or more), we may delete or anonymize your information in accordance with our data retention practices.
              </p>
              <p className="text-neutral-300">
                If an account is deleted, associated personal information is deleted or anonymized within a reasonable period, unless retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">9. Your Rights and Choices</h2>
              <p className="text-neutral-300 mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Access the information associated with your account</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of information</li>
                <li>Request a copy of your data</li>
                <li>Request a copy of your key content (e.g., visions, journal entries) where technically feasible</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent where applicable</li>
              </ul>
              <p className="text-neutral-300">
                Many of these options are available through your account settings. You may also reach us through our <a href="/contact" className="text-primary-500 hover:underline">contact page</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">10. Cookies and Tracking Technologies</h2>
              <p className="text-neutral-300 mb-4">
                We use cookies and similar technologies to support platform functionality, remember preferences, and understand usage.
              </p>
              <p className="text-neutral-300 mb-2">Cookies may include:</p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>Essential cookies (security and authentication)</li>
                <li>Functional cookies (preferences and settings)</li>
                <li>Analytics cookies (platform usage insights)</li>
              </ul>
              <p className="text-neutral-300">
                You can manage cookies through your browser settings. Disabling cookies may affect certain features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">11. Third-Party Services</h2>
              <p className="text-neutral-300">
                The Services may include links to or integrations with third-party platforms. We are not responsible for the privacy practices of those services and encourage you to review their policies before sharing information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">12. International Data Transfers</h2>
              <p className="text-neutral-300">
                Information may be processed or stored in countries outside your country of residence. When this occurs, we apply appropriate safeguards to protect your information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">13. California Privacy Rights</h2>
              <p className="text-neutral-300 mb-4">
                California residents may have additional rights under the California Consumer Privacy Act (CCPA), including:
              </p>
              <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
                <li>The right to know what personal information is collected and used</li>
                <li>The right to request deletion of personal information</li>
                <li>The right to opt out of the sale of personal information (we do not sell data)</li>
                <li>The right to non-discrimination for exercising privacy rights</li>
              </ul>
              <p className="text-neutral-300">
                Requests may be submitted via account settings or by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">14. Changes to This Policy</h2>
              <p className="text-neutral-300">
                We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last Updated" date and posting the revised policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">15. Contact Us</h2>
              <p className="text-neutral-300 mb-4">
                If you have questions about this Privacy Policy or how information is handled, please visit our contact page:
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
