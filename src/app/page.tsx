import type { Metadata } from 'next'
import { Indie_Flower } from 'next/font/google'
import { ArrowRight, Check, X } from 'lucide-react'
import { Container } from '@/lib/design-system'
import {
  Accent,
  Beats,
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
import { SocialProofSection } from '@/lib/design-system/components'
import { ReceiptsSection } from '@/components/marketing/home/ReceiptsSection'
import { ActivationHomeFaq } from '@/components/marketing/home/ActivationHomeFaq'
import { FoundersActualizations } from '@/components/marketing/home/FoundersActualizations'
import { LifeCategoryOrbit } from '@/components/marketing/home/LifeCategoryOrbit'
import { NoteCollage } from '@/components/marketing/home/NoteCollage'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    absolute: 'Vibration Fit | Thoughts Become Things. So Why Isn\'t It Working?',
  },
  description:
    'A personalized Activation you can read, hear, feel, and keep — free, in 10 to 15 minutes.',
}

/** Anchor-scroll CTA — the front door sells one click: start the Activation. */
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

const FOR_YOU = [
  'You already believe your thoughts, focus, and energy influence what you experience.',
  'You know manifestation works because you’ve experienced it—but you want to create more consistently.',
  "You don't know what you want.",
  'You know what you want, but keep getting pulled back into what is.',
  'You want a practical way to intentionally align with the life you choose.',
  'You want to enjoy your life now while creating more of what you want.',
]

const NOT_YET = [
  'You’re still deciding whether your thoughts, focus, and energy influence what you experience.',
  'You’re looking to be convinced that manifestation works rather than learning how to practice it consistently.',
  'The idea that you have a role in creating your experience feels impossible for you to entertain.',
  'You prefer to argue for your limitations rather than intentionally stepping into the version of you who can truly have it all.',
  'You’re already convinced this won’t work for you.',
]

export default function HomePage() {
  return (
    <div className={`${display.variable} -mx-4 -mt-6 overflow-x-clip sm:-mx-6 md:-mx-6 md:-my-12 md:overflow-x-visible lg:-mx-8 lg:-mt-8`} data-home="front-door">
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
              trackingId="home-hero-video"
            />
          </div>
          <StartCta className="mt-10" />
          <p className="mt-4 text-center text-sm text-neutral-500">
            No credit card required. Takes 10&ndash;15 minutes.
          </p>
        </Container>
      </header>

      {/* 2. How Vibration Fit Works */}
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

      {/* 3. Real People. Real Results. — videos, messages, then six receipts */}
      <Section>
        <div className="hp-proof-card min-w-0 max-w-full overflow-x-clip rounded-2xl bg-black/40 p-4 md:p-6 lg:p-8">
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
                label: 'Misty',
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
                label: 'Alicia',
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
          <ReceiptsSection showHeader={false} showMoreMisty={false} columns={3} />
        </div>
        <StartCta className="mt-10" />
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

      {/* 5. Start Creating Deliberately + 12-category orbit — homepage container */}
      <Section>
        <SectionMedia side="left" graphic={<LifeCategoryOrbit />} cta={<StartCta className="mt-8 lg:mt-10 lg:justify-start" />}>
          <Eyebrow tone="cyan" className="lg:text-left">The Life You Choose</Eyebrow>
          <Display className="lg:text-left">
            Start Creating
            <br />
            <Accent>Deliberately</Accent>
          </Display>
          <Body>
            <Hit>Imagine waking up knowing exactly what you&rsquo;re creating.</Hit>
            <p>
              You&rsquo;re crystal clear on{' '}
              <span className="font-semibold text-white">The Life You Choose.</span>
            </p>
            <p>
              You deeply appreciate where you are right now&mdash;and give yourself permission to
              unapologetically desire more. The journey gets to be part of the dream, and you get to
              enjoy every step along the way.
            </p>
            <p>
              The dream body and the dream partner and the dream work and the dream bank account.
            </p>
            <p>
              Not someday. And not at the expense of enjoying the life you have right now.
            </p>
            <p>
              If you already understand the law of attraction, you don&rsquo;t need another manifestation
              course to help you align with what you want.
            </p>
            <p className="font-semibold text-white">
              You need a vision. You need a way to align with it. And you need to practice living it.
            </p>
            <p>That&rsquo;s what Vibration Fit was built to help you do.</p>
            <p>You are not years away from the life of your dreams.</p>
            <p className="hp-display text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem]">
              You are one vision away.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      {/* 7. Meet VIVA */}
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

      {/* 8. Conscious Creation loop */}
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
              once, run it daily with VIVA at your side, stay connected in Vibe Tribe,
              show up to weekly Alignment Gym, and evolve it as your desires grow
              &mdash; every past version preserved so you can look back and see how
              much of what you once wrote is now your actual life.
            </p>
            <p>
              The download is yours either way. Vibration Fit is the living system
              for returning to the experience, creating new Activations, and evolving
              your chosen realities over time.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      {/* 9. Vibrational Fitness */}
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

      {/* 10. Note from Jordan & Vanessa + founders proof — homepage containers */}
      <Section>
        <SectionMedia graphic={<NoteCollage />} cta={<StartCta className="mt-8 lg:mt-10 lg:justify-start" />}>
          <Eyebrow tone="purple" className="lg:text-left">From Us</Eyebrow>
          <Display className="lg:text-left">
            A Note From
            <br />
            <Accent>Jordan &amp; Vanessa</Accent>
          </Display>
          <Body>
            <p>
              We&rsquo;ve been living this practice for over 15 years, with our Life I Choose at the
              center. Again and again, we&rsquo;ve pulled out an old version of our vision, read what we
              once wrote, looked at each other and realized:
            </p>
            <Punch>Holy shit. We&rsquo;re living it.</Punch>
            <p>
              The road wasn&rsquo;t always smooth. The path to our most beautiful destinations often
              looked more like a roller coaster than a slide. That&rsquo;s part of conscious creation too.
            </p>
            <p>
              This system has been a sacred gift to us. Straight from God, the Cosmos, Infinite
              Intelligence&mdash;whatever language feels true to you. It is the system through which we
              have become <span className="font-semibold text-white">free.</span>
            </p>
            <Beats
              items={[
                'Free to choose our soul mate.',
                'Free to choose abundance over bankruptcy.',
                'Free to live in the destinations of our dreams.',
                'Free to buy our dream home.',
                'Free to homeschool our kids as a team.',
                'Free to travel the world.',
                <>
                  Free to do what we love <span className="font-semibold text-white">AND get paid (a lot) to do it.</span>
                </>,
              ]}
            />
            <p>
              And if you&rsquo;re wondering whether we made our money teaching this stuff before we&rsquo;d
              actually lived it ourselves&hellip;
            </p>
            <Hit>The answer is no.</Hit>
            <p>
              We accomplished everything on that list before we ever gave ourselves permission to share
              this system with another human being. We wanted to walk our talk and know it wasn&rsquo;t a
              lucky break.
            </p>
            <Hit>This was how we lived. Now we know.</Hit>
            <p>
              We believe this system is for anyone who trusts Universal Law and is willing to
              practice it. Your life is yours to choose.
            </p>
            <p className="text-[1.65rem] font-extrabold leading-tight text-white md:text-[2rem]">
              Rock out, baby,
              <br />
              <Accent>Jordan &amp; Vanessa</Accent>
            </p>
          </Body>
        </SectionMedia>
        <div className="mt-16 border-t border-white/10 pt-16 md:mt-20 md:pt-20">
          <Display>
            We Used This Process
            <br />
            <Accent>On Ourselves First</Accent>
          </Display>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-[1.6] text-neutral-300">
            Before we ever invited members in, we used this exact system on ourselves. Here are some of
            our meaningful manifestations and their actualization stories.
          </p>
          <div className="hp-actualizations mt-10 min-w-0 max-w-full overflow-x-clip">
            <FoundersActualizations />
          </div>
        </div>
        <StartCta className="mt-10" />
      </Section>

      {/* 11. Who This Is For — homepage container */}
      <Section>
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Fit Check</Eyebrow>
          <Display>
            Who This
            <br />
            <Accent>Is For</Accent>
          </Display>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border-2 border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">
                This is for you if
              </p>
              <ul className="mt-6 space-y-4">
                {FOR_YOU.map((item) => (
                  <li key={item} className="flex gap-3 text-lg leading-snug text-neutral-200">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#39FF14]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border-2 border-[#FF0040]/30 bg-[#FF0040]/[0.04] p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF0040]">
                This probably isn&rsquo;t for you yet if
              </p>
              <ul className="mt-6 space-y-4">
                {NOT_YET.map((item) => (
                  <li key={item} className="flex gap-3 text-lg leading-snug text-neutral-200">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-[#FF0040]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <Hit>
              It&rsquo;s for the person who&rsquo;s ready to stop studying manifestation and start living it.
            </Hit>
          </div>
          <StartCta className="mt-10" />
        </div>
      </Section>

      {/* 12. FAQ — free Activation → $99/28-day membership */}
      <Section>
        <ActivationHomeFaq />
      </Section>

      {/* 13. Final CTA + email capture */}
      <Section>
        <div id="start" className="mx-auto max-w-3xl scroll-mt-24">
          <Display as="h2">
            Your vision is waiting to <Accent>take shape.</Accent>
          </Display>
          <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-[1.7] text-neutral-300">
            Start with what&rsquo;s true now. Let VIVA help you discover what&rsquo;s
            possible next.
          </p>
          <ActivationStartForm landingPage="/" />
        </div>
      </Section>
    </div>
  )
}
