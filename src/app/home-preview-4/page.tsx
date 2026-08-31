import { Check, X } from 'lucide-react'
import { Container } from '@/lib/design-system'
import { SocialProofSection } from '@/lib/design-system/components'
import {
  Accent,
  Beats,
  Body,
  Cta,
  Display,
  Eyebrow,
  Hit,
  Punch,
  Script,
  Section,
} from '@/components/marketing/home/primitives'
import { SectionMedia } from '@/components/marketing/home/SectionMedia'
import { HeroLayout } from '@/components/marketing/home/HeroLayout'
import { OfferBuyBox } from '@/components/marketing/home/OfferCard'
import { ReceiptsSection } from '@/components/marketing/home/ReceiptsSection'
import { FaqSection } from '@/components/marketing/home/FaqSection'
import { FoundersActualizations } from '@/components/marketing/home/FoundersActualizations'
import {
  InstallRunEvolve,
  VibrationalFitness,
} from '@/components/marketing/home/graphics'
import { LifeCategoryOrbit } from '@/components/marketing/home/LifeCategoryOrbit'
import { NoteCollage } from '@/components/marketing/home/NoteCollage'
import { PlatformScreens } from '@/components/marketing/home/PlatformScreens'

export default function HomePreview4Page() {
  return (
    <div className="-mx-4 -mt-6 overflow-x-clip sm:-mx-6 md:-mx-6 md:-my-12 md:overflow-x-visible lg:-mx-8 lg:-mt-8" data-preview="v17-layout">
      {/* 1. Hero — Who it's for, What it is, The Outcome */}
      <header className="hp-hero-glow">
        <Container size="xl" className="px-4 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10">
          <HeroLayout
            variant="stacked"
            intro={
              <Display as="h1">
                Thoughts Become Things.
                <br />
                <Accent>So Why Isn&rsquo;t It Working?</Accent>
              </Display>
            }
          />
        </Container>
      </header>

      <section id="offer" className="scroll-mt-28 border-t border-white/10">
        <span id="pricing" aria-hidden="true" />
        <Container size="xl" className="px-4 py-12 md:px-10 md:py-16">
          <div className="hp-offer-split">
            <div className="hp-offer-split-copy">
              <h2 className="text-[1.65rem] font-extrabold leading-[1.15] text-white md:text-[2.15rem]">
                How Vibration Fit Works
              </h2>
              <p className="hp-display mt-5 text-[1.45rem] leading-tight text-[#39FF14] md:text-[1.75rem]">
                You already know the law. This is how you live it.
              </p>
              <div className="hp-offer-copy mt-5 space-y-4 text-lg leading-[1.65] text-neutral-300">
                <p>
                  Vibration Fit is a self-guided software system that installs a custom-built Conscious
                  Creation System in your reality.
                </p>
                <p>
                  Our system, infused with V.I.V.A. (your Vibrationally Intelligent Virtual Assistant),
                  walks you step by step through clearly defining a vision for your life across 12 life
                  categories. It then empowers you with the tools you need to consistently activate this
                  version of you in your vibrational point of attraction.
                </p>
                <p>
                  The result? You consistently experience unresisted alignment with your deepest desires,
                  and finally experience true vibrational leverage in this vibrationally based universe.
                </p>
                <p>
                  This vibrational leverage is the path of least resistance to actually{' '}
                  <span className="font-semibold text-white">LIVING</span> the life of your dreams. If you
                  understand universal law, you already know this to be true. If you know, you know.
                </p>
                <p>This works in two parts:</p>
                <ol className="list-decimal space-y-0 pl-6 [text-align:left]">
                  <li>
                    <span className="font-semibold text-white">Vision Activation</span>
                    {' '}
                    is your initiation where we install your Conscious Creation System. (you pay $499
                    one-time)
                  </li>
                  <li>
                    <span className="font-semibold text-white">Vision Pro Membership</span>
                    {' '}
                    keeps your Conscious Creation System running &mdash; the daily practice, VIVA,
                    community, and studio tools that keep you living it and evolving it as life
                    changes. ($99/28 days).
                  </li>
                </ol>
                <p>That&rsquo;s it.</p>
              </div>
            </div>
            <div className="hp-offer-split-card">
              <OfferBuyBox />
            </div>
          </div>
        </Container>
      </section>

      {/* 2. The Receipts */}
      <Section>
        <ReceiptsSection />
        <Cta />
      </Section>

      {/* 3. You Know the Law. Now Live It. */}
      <Section>
        <SectionMedia side="left" graphic={<LifeCategoryOrbit />}>
          <Eyebrow tone="cyan" className="lg:text-left">The Practice</Eyebrow>
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
          <Cta className="lg:justify-start" />
        </SectionMedia>
      </Section>

      {/* 4. Meet VIVA */}
      <Section>
        <SectionMedia graphic={<PlatformScreens />}>
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
              We know how daunting it feels sitting down with a blank sheet of paper, trying to write a
              comprehensive life vision from scratch.
            </p>
            <div className="hp-display space-y-2 py-2 text-[1.45rem] leading-snug text-neutral-100 md:text-[1.85rem]">
              <p>&ldquo;Where do I start?&rdquo;</p>
              <p>&ldquo;What categories do I write about?&rdquo;</p>
              <p className="text-[#FFFF00]">&hellip;WTF.</p>
              <p>&ldquo;I think I&rsquo;ll take a nap instead.&rdquo;</p>
            </div>
            <Hit>This is why VIVA exists. You never stare at a blank page again.</Hit>
            <p>
              You don&rsquo;t even need to know what you want before you begin. Tell VIVA what
              isn&rsquo;t working&mdash;what frustrates you, what you&rsquo;re jealous of, what you&rsquo;d
              absolutely love to experience.
            </p>
            <Punch>She knows how to turn contrast into clarity.</Punch>
            <p>
              Your disappointment, frustration, and longing all contain information about what you&rsquo;re
              ready to experience. VIVA takes that information and writes your{' '}
              <span className="font-semibold text-white">Life I Choose</span> vision using vibrational
              grammar.
            </p>
            <Hit>
              Not a vague vision statement. A vivid, emotionally charged vision across 12 life categories
              that gives you a destination you can actually align with.
            </Hit>
          </Body>
          <Cta className="lg:justify-start" />
        </SectionMedia>
      </Section>

      {/* 5. The System — Install / Run / Evolve */}
      <Section>
        <SectionMedia side="left" graphic={<InstallRunEvolve />}>
          <Eyebrow tone="yellow" className="lg:text-left">Your Conscious Creation System</Eyebrow>
          <Display className="lg:text-left">
            Install It Once.
            <br />
            <Script>Run It Daily.</Script>
            <br />
            <Accent>Evolve As Life Changes.</Accent>
          </Display>
          <Body>
            <p>
              Conscious Creation is choosing what you want to include in your experience, then aligning
              your thoughts, words, and actions with that choice. The system makes that way of living
              repeatable.
            </p>
          </Body>

          <div className="mt-14 space-y-12">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">
                Phase 1 . Install
              </p>
              <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">The 72-Hour Vision Activation</h3>
              <Body>
                <p>Over 72 hours, you build your Conscious Creation System and leave with:</p>
                <Beats
                  items={[
                    'Your Profile',
                    'Your Life I Choose vision across 12 categories',
                    'Your Vision Audio, generated or recorded in your own voice, and mixed into immersion tracks',
                    'Your Vision Board',
                    'Your journal',
                    'Your My Alignment Plan (MAP)',
                    'Your first Vibe Tribe Connection and Alignment Gym tour',
                  ]}
                />
                <p>
                  VIVA writes your Life I Choose using vibrational grammar, even if you start without
                  complete clarity.
                </p>
                <p>You don&rsquo;t leave with more information.</p>
                <Hit>You leave with your personal system installed.</Hit>
              </Body>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#00FFFF]">
                Phase 2 . Run
              </p>
              <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">My Alignment Plan</h3>
              <Body>
                <p>Your MAP shows you exactly what to do each day through:</p>
                <Beats items={['Creations', 'Activations', 'Connections', 'Sessions']} />
                <Hit>Put in the reps, collect evidence of actualization, and enjoy the process.</Hit>
              </Body>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BF00FF]">
                Phase 3 . Evolve
              </p>
              <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">
                Update <Accent>&amp; Look Back</Accent>
              </h3>
              <Body>
                <p>Your desires will change as you grow. That&rsquo;s not inconsistency.</p>
                <Punch>That&rsquo;s evolution.</Punch>
                <p>
                  Update your profile, Life I Choose, Vision Audio, Vision Board, and MAP as your life
                  expands. Every past version is preserved, so you can look back and see how much of
                  what you once wrote is now your actual life.
                </p>
              </Body>
            </div>
          </div>
          <Cta className="lg:justify-start" />
        </SectionMedia>
      </Section>

      {/* 6. A Note From Jordan & Vanessa + founders proof */}
      <Section>
        <SectionMedia graphic={<NoteCollage />}>
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
              We believe this system is designed for anyone who trusts Universal Law and is willing to
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
            Before we ever invited members in, we used this exact system on ourselves. Here is what we
            put on our vision board, and what actually showed up.
          </p>
          <div className="hp-actualizations mt-10 min-w-0 max-w-full overflow-x-clip">
            <FoundersActualizations />
          </div>
        </div>
        <Cta />
      </Section>

      {/* 7. Who This Is For */}
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
                {[
                  'You already believe your thoughts, focus, and energy influence what you experience.',
                  'You know manifestation works because you’ve experienced it—but you want to create more consistently.',
                  'You don\'t know what you want.',
                  'You know what you want, but keep getting pulled back into what is.',
                  'You want a practical way to intentionally align with the life you choose.',
                  'You want to enjoy your life now while creating more of what you want.',
                ].map((item) => (
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
                {[
                  'You’re still deciding whether your thoughts, focus, and energy influence what you experience.',
                  'You’re looking to be convinced that manifestation works rather than learning how to practice it consistently.',
                  'The idea that you have a role in creating your experience feels impossible for you to entertain.',
                  'You prefer to argue for your limitations rather than intentionally stepping into the version of you who can truly have it all.',
                  'You’re already convinced this won’t work for you.',
                ].map((item) => (
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
          <Cta />
        </div>
      </Section>

      {/* 8. The Close */}
      <Section>
        <SectionMedia side="left" graphic={<VibrationalFitness />}>
          <Eyebrow className="lg:text-left">Now</Eyebrow>
          <Display className="lg:text-left">
            Start Creating
            <br />
            <Accent>Deliberately</Accent>
          </Display>
          <Body>
            <p>Imagine waking up knowing what you&rsquo;re creating.</p>
            <p>
              You&rsquo;re not checking your current circumstances to decide whether you&rsquo;re allowed
              to feel hopeful. You&rsquo;re not waiting for the money, the relationship, the work, or the
              body to arrive before you enjoy your life.
            </p>
            <Punch>You know the life you choose.</Punch>
            <p>
              And when life gets loud, you know how to reconnect with the reality you&rsquo;re creating.
              You can love what you have AND desire more. The journey gets to be part of the dream.
            </p>
            <p>
              The dream body <span className="font-semibold text-white">AND</span> the dream partner{' '}
              <span className="font-semibold text-white">AND</span> the dream work{' '}
              <span className="font-semibold text-white">AND</span> the dream bank account. Not someday.
              And not at the expense of enjoying the life you have right now.
            </p>
            <Hit>
              You need a vision. You need a way to align with it. And you need to practice living it.
            </Hit>
            <p>That&rsquo;s what Vibration Fit was built to help you do. You are not years away.</p>
          </Body>
          <Punch>You are one vision away.</Punch>
          <Body>
            <p>If you&rsquo;re ready to step into the Life You Choose&trade;, welcome home.</p>
            <p className="hp-display text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem]">
              We&rsquo;ll see you inside.
            </p>
          </Body>
          <Cta className="lg:justify-start" />
        </SectionMedia>
      </Section>

      {/* 9. Member results */}
      <Section>
        <div className="rounded-2xl bg-black/40 p-4 md:p-6 lg:p-8">
          <SocialProofSection
            eyebrow="Vibration Fit Member Results"
            title="Real People. Real Results."
            subtitle="Watch unedited stories and scroll through real screenshots from Vibration Fit members using universal law to create tangible wins across all 12 life categories."
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

      {/* 10. Full FAQ */}
      <Section>
        <FaqSection />
      </Section>
    </div>
  )
}
