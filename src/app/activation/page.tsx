import type { Metadata } from 'next'
import { Indie_Flower } from 'next/font/google'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/lib/design-system'
import { SocialProofSection } from '@/lib/design-system/components'
import {
  Accent,
  Body,
  Display,
  Eyebrow,
  Hit,
  Punch,
  Script,
  Section,
} from '@/components/marketing/home/primitives'
import { SectionMedia } from '@/components/marketing/home/SectionMedia'
import { HeroPreviewVideo } from '@/components/marketing/home/HeroPreviewVideo'
import { ACTIVATION_OFFER_VIDEO } from '@/lib/activation/offer-video'
import { PlatformScreens } from '@/components/marketing/home/PlatformScreens'
import { InstallRunEvolve, VibrationalFitness } from '@/components/marketing/home/graphics'
import { ActivationOfferCard } from '@/components/marketing/home/ActivationOfferCard'
import { ActivationStartForm } from '@/components/activation/ActivationStartForm'
import { ActivationIncludes } from '@/components/activation/ActivationIncludes'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Create Your Free Activation | Vibration Fit',
  description:
    'A personalized Activation you can read, hear, feel, and keep — free, in 10 to 15 minutes.',
}

/** Anchor-scroll CTA — the landing page sells one click: start the Activation. */
function StartCta({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <a
        href="#start"
        className="inline-flex w-full items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-4 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:w-auto md:whitespace-nowrap md:px-7"
      >
        Create My Free Activation
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  )
}

const LOOP_STAGES: Array<{ stage: string; description: string }> = [
  { stage: 'Current State', description: 'You tell the truth about where you are — no polishing required.' },
  { stage: 'Chosen Reality', description: 'You get clear on what you\u2019re choosing instead, in your own words.' },
  { stage: 'Personalized Activation', description: 'Your vision becomes tools you can read, hear, feel, and repeat.' },
  { stage: 'Aligned Action', description: 'From inside that reality, the next step feels inspired — not forced.' },
  { stage: 'New Current State', description: 'Life shifts. And the loop begins again from a better starting point.' },
]

export default function ActivationLandingPage() {
  return (
    <div className={`${display.variable} -mx-4 -mt-6 overflow-x-clip sm:-mx-6 md:-mx-6 md:-my-12 md:overflow-x-visible lg:-mx-8 lg:-mt-8`} data-home="activation">
      {/* 1. Hero */}
      <header className="hp-hero-glow" data-hero="activation-offer">
        <Container size="xl" className="px-4 py-12 md:px-10 md:pb-20 md:pt-14">
          <Display as="h1" className="hp-hero-headline">
            <span className="hp-hero-headline-line">Thoughts Become Things.</span>
            <br />
            <Accent>So Why Isn&rsquo;t It Working?</Accent>
          </Display>
          <div className="mx-auto mt-10 max-w-3xl">
            <HeroPreviewVideo
              src={ACTIVATION_OFFER_VIDEO.src}
              poster={ACTIVATION_OFFER_VIDEO.poster}
              trackingId="activation-landing-hero-video"
            />
          </div>
          <StartCta className="mt-10" />
          <p className="mt-4 text-center text-sm text-neutral-500">
            No credit card required. Takes 10&ndash;15 minutes.
          </p>
        </Container>
      </header>

      {/* 2. How Vibration Fit Works — what this actually is */}
      <Section>
        <SectionMedia graphic={<ActivationOfferCard />}>
          <Eyebrow className="lg:text-left">The Short Version</Eyebrow>
          <Display className="lg:text-left">How Vibration Fit Works</Display>
          <Body>
            <p>
              Vibration Fit is a self-guided software system that installs a
              custom-built <span className="font-semibold text-white">Conscious Creation System</span>{' '}
              in your reality.
            </p>
            <p>
              Infused with VIVA — your Vibrationally Intelligent Virtual Assistant —
              it walks you step by step through clearly defining the life you choose,
              then hands you the tools to consistently activate that version of you in
              your vibrational point of attraction.
            </p>
            <p>
              The result: unresisted alignment with your deepest desires, and real
              vibrational leverage in a vibrationally based universe.
            </p>
          </Body>
          <Punch>But rather than tell you, we want to show you.</Punch>
          <Body>
            <p>
              Your free Activation is a working sample of the whole system — built
              around you, in one area of your life, in the next 10 to 15 minutes.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      {/* 3. Real People. Real Results. */}
      <Section>
        <div className="rounded-2xl bg-black/40 p-4 md:p-6 lg:p-8" data-proof="after-how">
          <SocialProofSection
            eyebrow="Vibration Fit Member Results"
            title="Real People. Real Results."
            subtitle="This is what happens when the system is built around you."
            microcopy="All videos and messages are from real Vibration Fit members, shared with permission. Screenshots are unedited."
            videos={[
              {
                id: 'v1',
                src: 'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/intensive/testimonials/1773515176961-susxm5ps05e-intensive-c8f87e55-24af-4eed-8520-025cc3547a12-testimonial-recording-1773515176541.webm',
                poster: 'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/intensive/testimonials/1773515176961-susxm5ps05e-intensive-c8f87e55-24af-4eed-8520-025cc3547a12-testimonial-recording-1773515176541-thumb.jpg',
                label: 'Testimonial',
              },
              {
                id: 'v2',
                src: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-1080p.mp4',
                poster: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-thumb.0000000.jpg',
                label: 'Michele',
              },
              {
                id: 'v3',
                src: 'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/intensive/testimonials/1774242947302-jc0ui5mokj9-intensive-cae9652b-0556-4372-960c-431ea8b7eb3e-testimonial-recording-1774242946695.webm',
                poster: 'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/intensive/testimonials/1774242947302-jc0ui5mokj9-intensive-cae9652b-0556-4372-960c-431ea8b7eb3e-testimonial-recording-1774242946695-thumb.jpg',
                label: 'Activation',
              },
            ]}
            screenshots={[
              { id: 's1', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0002-4.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's2', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0003-5.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's3', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0004-7.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's4', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0005-8.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's5', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0006-9.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's6', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0007-13.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's7', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0008-jeanie.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's8', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0009-11.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's9', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0010-12.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's10', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0011-14.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's11', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0012-15.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's12', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0013-16.jpg', alt: 'Vibration Fit member testimonial' },
              { id: 's13', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0014-17.jpg', alt: 'Vibration Fit member testimonial' },
            ]}
          />
        </div>
      </Section>

      {/* 4. What they receive */}
      <Section>
        <div className="mx-auto max-w-4xl">
          <Eyebrow>What You Keep</Eyebrow>
          <Display as="h2">Your personalized Activation includes</Display>
          <div className="mt-10">
            <ActivationIncludes />
          </div>
          <Body>
            <p>
              You can read it, speak it, listen to it, and look at it.
              Everything is yours to download and keep.
            </p>
          </Body>
          <StartCta className="mt-8" />
        </div>
      </Section>

      {/* 5. Meet VIVA — clarity + the blacksmith */}
      <Section>
        <SectionMedia graphic={<PlatformScreens />} cta={<StartCta className="mt-8 lg:mt-10 lg:justify-start" />}>
          <Eyebrow className="lg:text-left">Meet VIVA</Eyebrow>
          <Display className="lg:text-left">
            What VIVA
            <br />
            <Accent>Does</Accent>
          </Display>
          <Body>
            <p>
              VIVA is your <span className="font-semibold text-white">Vibrationally Intelligent Virtual Assistant.</span>
            </p>
            <p>
              We know how daunting it feels sitting down with a blank page, trying to
              describe the life you want from scratch.
            </p>
            <Hit>With VIVA, you never stare at a blank page.</Hit>
            <p>
              You don&rsquo;t even need to know what you want before you begin. Tell
              VIVA what isn&rsquo;t working&mdash;what feels frustrating, what feels
              stuck, what you&rsquo;re longing for, what you&rsquo;d absolutely love
              to experience instead.
            </p>
            <Punch>She knows how to turn contrast into clarity.</Punch>
            <p>
              Your disappointment, frustration, and longing all contain information
              about what you&rsquo;re ready to experience. VIVA takes that information
              and writes your <span className="font-semibold text-white">Life I Choose</span>{' '}
              vision using vibrational grammar &mdash; in your language, from your words.
            </p>
            <p>
              And then VIVA becomes your <span className="font-semibold text-white">blacksmith.</span>
            </p>
            <p>
              Once your vision exists, she forges the tools you need to align with
              it: your Future-Self Story, your Incantation, your SparkQuery, your
              Vision Audio, your own original song, and the images for your vision
              board. Every tool hammered out of your own words.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      {/* 6. The Practice — You Know the Law. Now Live It. */}
      <Section>
        <SectionMedia align="center" graphic={<VibrationalFitness />} cta={<StartCta className="mt-8 lg:mt-10 lg:justify-start" />}>
          <Eyebrow className="lg:text-left">The Practice</Eyebrow>
          <Display className="lg:text-left">
            You Know the Law.
            <br />
            <Accent>Now Live It.</Accent>
          </Display>
          <Body>
            <p>
              Someone can know everything about nutrition and strength training and still not be
              physically fit. You can know everything about manifestation and still not be{' '}
              <span className="font-semibold text-white">Vibration Fit.</span>
            </p>
            <p>
              Vibrational Fitness is the practiced ability to intentionally align your thoughts, words,
              and actions with the life you choose.
            </p>
            <Hit>
              It doesn&rsquo;t mean feeling amazing every second. It means a shitty day doesn&rsquo;t take
              your vision down with it.
            </Hit>
          </Body>
        </SectionMedia>
      </Section>

      {/* 7. Your Conscious Creation System — the loop */}
      <Section>
        <SectionMedia side="left" graphic={<InstallRunEvolve />} cta={<StartCta className="mt-8 lg:mt-10 lg:justify-start" />}>
          <Eyebrow className="lg:text-left">Your Conscious Creation System</Eyebrow>
          <Display className="lg:text-left">
            Install It Once.
            <br />
            <Script>Run It Daily.</Script>
            <br />
            <Accent>Evolve As Life Changes.</Accent>
          </Display>
          <Body>
            <p>
              Conscious Creation isn&rsquo;t a course you finish. It&rsquo;s a loop
              you live:
            </p>
          </Body>

          <ol className="mt-8 space-y-5">
            {LOOP_STAGES.map((item, index) => (
              <li key={item.stage} className="flex gap-5">
                <span className="hp-display mt-0.5 shrink-0 text-[1.65rem] leading-none text-[#39FF14]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xl font-semibold leading-snug text-white">{item.stage}</p>
                  <p className="mt-1 text-lg leading-[1.65] text-neutral-400">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <Body>
            <Hit>Your free Activation is one complete rep of that loop.</Hit>
            <p>
              The membership is what makes it a way of life: install your full system
              once, run it daily with VIVA at your side, and evolve it as your
              desires grow &mdash; every past version preserved so you can look back
              and see how much of what you once wrote is now your actual life.
            </p>
            <p>
              The download is yours either way. Vibration Fit is the living system
              for returning to the experience, creating new Activations, and evolving
              your chosen realities over time.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      {/* 8. Final CTA + email capture */}
      <Section>
        <div id="start" className="mx-auto max-w-3xl scroll-mt-24">
          <Display as="h2">
            Your vision is waiting to <Accent>take shape.</Accent>
          </Display>
          <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-[1.7] text-neutral-300">
            Start with what&rsquo;s true now. Let VIVA help you discover what&rsquo;s
            possible next.
          </p>
          <ActivationStartForm />
        </div>
      </Section>
    </div>
  )
}
