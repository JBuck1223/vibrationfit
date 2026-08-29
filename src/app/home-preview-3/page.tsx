import { Container } from '@/lib/design-system'
import { ProofWall, SocialProofSection } from '@/lib/design-system/components'
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
import { PricingBlock } from '@/components/marketing/home/PricingBlock'
import { ReceiptsSection } from '@/components/marketing/home/ReceiptsSection'
import { GuaranteesSection } from '@/components/marketing/home/GuaranteesSection'
import { FaqSection } from '@/components/marketing/home/FaqSection'
import {
  GreenLineMini,
  InstallRunEvolve,
  VivaPipeline,
} from '@/components/marketing/home/graphics'

export default function HomePreview3Page() {
  return (
    <div className="-mt-6 md:-my-12 lg:-mt-8" data-preview="v16-merged">
      {/* 1. Hero — Who it's for, What it is, The Outcome */}
      <header className="hp-hero-glow">
        <Container size="xl" className="px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
          <HeroLayout
            intro={
              <>
                <Eyebrow>The Life You Choose</Eyebrow>
                <Display as="h1">
                  Thoughts Become Things.
                  <br />
                  <Accent>So Why Isn&rsquo;t It Working?</Accent>
                </Display>
                <p className="mt-8 text-center text-xl text-neutral-200">
                  You already know the law. This is how you live it.
                </p>
              </>
            }
          >
            <Body>
              <p>
                This is for the person who has read the books, made the vision boards, felt it work&mdash;and
                still keeps getting pulled back into the reality in front of them.
              </p>
              <Hit>The problem is not belief. The problem is practice.</Hit>
              <p>
                Vibration Fit is a Conscious Creation System you install in 72 hours: your{' '}
                <span className="font-semibold text-white">Life I Choose</span>{' '}vision across 12 life
                categories, your Vision Audio, your Vision Board, your journal, and your MAP&mdash;your
                daily alignment practice&mdash;all guided by VIVA.
              </p>
              <Hit>
                You walk out knowing exactly what you&rsquo;re creating, with a daily practice that keeps
                you aligned with it.
              </Hit>
              <p className="hp-display text-[1.45rem] leading-snug text-[#39FF14] md:text-[1.75rem] lg:text-left">
                Even when everything in front of you says, &ldquo;Not yet.&rdquo;
              </p>
            </Body>
            <Cta className="lg:justify-start" />
            <p className="mt-4 text-center text-sm text-neutral-500 lg:text-left">
              $499 Solo &middot; $699 Household &middot; Backed by the 72-Hour Activation Guarantee
            </p>
          </HeroLayout>
        </Container>
      </header>

      {/* 2. You Know the Law. Now Live It. */}
      <Section>
        <SectionMedia side="left" graphic={<GreenLineMini />}>
          <Eyebrow tone="cyan" className="lg:text-left">The Practice</Eyebrow>
          <Display className="lg:text-left">
            You Know the Law.
            <br />
            <Accent>Now Live It.</Accent>
          </Display>
          <Body>
            <p>
              You do not need Manifestation 101. You&rsquo;ve felt this work&mdash;the money arrived, the
              right person called, the opportunity appeared.
            </p>
            <p>
              Then the moment passed, your attention returned to what was missing, and you went back to
              reacting to what is instead of creating from the life you choose.
            </p>
            <p>You may recognize yourself here:</p>
            <Beats
              items={[
                'You write a vision, then make decisions from your current reality.',
                'You practice in bursts, then lose connection when contrast appears.',
                'You collect another method because the last one never became part of your life.',
                'You wait for proof before allowing yourself to feel good.',
              ]}
            />
            <p>You haven&rsquo;t failed. And you&rsquo;re not missing more information.</p>
            <p>
              Someone can know everything about nutrition and still not be physically fit. You can know
              everything about manifestation and still not be{' '}
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

      {/* 3. Real People. Real Results. — member videos, screenshots, and receipts */}
      <Section>
        <div className="rounded-2xl border-2 border-[#39FF14]/20 bg-black/40 p-4 md:p-6 lg:p-8">
          <SocialProofSection
            eyebrow="Vibration Fit Member Results"
            title="Real People. Real Results."
            subtitle="Watch unedited stories and scroll through real screenshots from Vibration Fit members using universal law to create tangible wins in money, relationships, opportunities, and everyday life."
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
        <div className="mt-16">
          <ReceiptsSection />
        </div>
        <Cta />
      </Section>

      {/* 4. Meet VIVA */}
      <Section>
        <SectionMedia graphic={<VivaPipeline />}>
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
                    'Your Life I Choose vision',
                    'Your Vision Audio',
                    'Your Vision Board',
                    'Your journal',
                    'Your My Alignment Plan (MAP)',
                  ]}
                />
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
                  Update your vision as your life expands. Every past version is preserved, so you can
                  look back and see how much of what you once wrote is now your actual life.
                </p>
              </Body>
            </div>
          </div>
          <Cta className="lg:justify-start" />
        </SectionMedia>
      </Section>

      {/* 6. A Note From Jordan & Vanessa + founders proof */}
      <Section>
        <SectionMedia
          photos={[
            {
              src: '/home-preview/photos/founders-couch.png',
              alt: 'Jordan and Vanessa in Vibration Fit shirts, living the life they choose',
            },
            {
              src: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
              alt: 'Jordan and Vanessa at their dream home',
            },
          ]}
        >
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
        <div className="mt-16">
          <ProofWall
            heading="We Used This Process On Ourselves First"
            subtitle="Before we ever invited members into Vibration Fit, we used this exact system to go from overdrafted and in debt to six figures in the bank. Once it worked for us, we started helping others do the same."
            caption="Real screenshots from our accounts, before and after applying the Vibration Fit system."
            showHeadingOutside={false}
            showStoryHighlight={false}
            items={[
              {
                id: 'homepage-proof',
                beforeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg',
                afterImage: 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg',
                story: '',
              },
            ]}
          />
        </div>
        <Cta />
      </Section>

      {/* 7. Who This Is For */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Fit Check</Eyebrow>
          <Display>
            Who This
            <br />
            <Accent>Is For</Accent>
          </Display>
          <Body>
            <p>Vibration Fit is for you if:</p>
            <Beats
              items={[
                'You already believe your thoughts, focus, and energy influence what you experience.',
                <>
                  You know manifestation works because you&rsquo;ve experienced it&mdash;but you
                  haven&rsquo;t learned how to create consistently.
                </>,
                <>
                  You&rsquo;re not completely clear on what you want next&mdash;or you know what you want,
                  but keep getting pulled back into what is.
                </>,
                'You want a practical way to intentionally align with the life you choose.',
                'You want to enjoy your life now while creating more of what you want.',
              ]}
            />
            <Hit>It&rsquo;s for the person who&rsquo;s ready to stop studying manifestation and start living it.</Hit>
          </Body>
          <Cta />
        </div>
      </Section>

      {/* 8. Our Guarantees */}
      <Section>
        <GuaranteesSection />
      </Section>

      {/* 9. Pricing */}
      <Section>
        <h2 className="text-center text-[2.75rem] font-extrabold leading-[1.08] text-[#39FF14] md:text-[3.75rem]">
          Pricing
        </h2>
        <p className="mt-5 text-center text-[1.45rem] font-extrabold leading-tight text-white md:text-[1.85rem]">
          72-Hour Vision Activation + First 28 Days of Vision Pro
        </p>
        <div className="mt-10">
          <PricingBlock>
            <div className="mx-auto mt-12 max-w-3xl">
              <Body>
                <Hit>
                  You&rsquo;re not buying another manifestation course. You&rsquo;re installing your
                  Conscious Creation System.
                </Hit>
                <p>
                  Imagine looking up 90 days from now with a clear vision for your life, a system you
                  actually use, and months of evidence that you know how to return to the life you choose.
                </p>
                <Punch>That&rsquo;s Vibrational Fitness.</Punch>
              </Body>
            </div>
          </PricingBlock>
        </div>
      </Section>

      {/* 10. The Close */}
      <Section>
        <SectionMedia
          side="left"
          src="/home-preview/photos/family-lake-home.jpg"
          alt="Jordan and Vanessa with their first baby at their waterfront home"
        >
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

      {/* 11. Full FAQ */}
      <Section>
        <FaqSection />
      </Section>
    </div>
  )
}
